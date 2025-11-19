
import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../../lib/withAuth.js';
import { AppUser } from '../../types.js';

// Only executives can manage users
const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
  
  // GET all users
  if (req.method === 'GET') {
    try {
      const { rows } = await sql(`
        SELECT id, username, role, created_at as "createdAt"
        FROM users ORDER BY created_at DESC
      `);
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  // POST a new user
  if (req.method === 'POST') {
    try {
      const { username, password, role } = req.body as AppUser;

      if (!username || !password || !role) {
          return res.status(400).json({ message: 'Username, password, and role are required' });
      }

      const query = `
        INSERT INTO users (username, password, role)
        VALUES ($1, $2, $3)
        RETURNING id, username, role, created_at as "createdAt";
      `;
      const params = [username, password, role];

      const { rows } = await sql(query, params);
      return res.status(201).json(rows[0]);
    } catch (error: any) {
        console.error('Error creating user:', error);
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ message: `Username '${req.body.username}' already exists.` });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
};

// Protect endpoint, only allow 'executive' role
export default withAuth(handler, ['executive']);
