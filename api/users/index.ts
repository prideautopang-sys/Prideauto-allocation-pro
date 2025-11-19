
import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../../lib/withAuth.js';
import { AppUser } from '../../types.js';

// Only executives can manage users
const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
  const { id } = req.query;
  const currentUserId = req.user?.userId;

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

  // PUT (Update) a user
  if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ message: 'User ID required' });
      try {
          const { role, password } = req.body as AppUser;

          if (!role) {
              return res.status(400).json({ message: "Role is required for an update." });
          }

          let query;
          let params;

          if (password && password.trim() !== '') {
              query = `
                  UPDATE users SET 
                      role = $1, password = $2, updated_at = NOW()
                  WHERE id = $3
                  RETURNING id, username, role, created_at as "createdAt";
              `;
              params = [role, password, id];
          } else {
              query = `
                  UPDATE users SET 
                      role = $1, updated_at = NOW()
                  WHERE id = $2
                  RETURNING id, username, role, created_at as "createdAt";
              `;
              params = [role, id];
          }
          
          const { rows } = await sql(query, params);
          if (rows.length === 0) {
              return res.status(404).json({ message: 'User not found' });
          }
          return res.status(200).json(rows[0]);

      } catch (error: any) {
          console.error('Error updating user:', error);
          return res.status(500).json({ message: 'Internal Server Error' });
      }
  }

  // DELETE a user
  if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ message: 'User ID required' });
      if (id === currentUserId) {
          return res.status(403).json({ message: 'Forbidden: You cannot delete your own account.' });
      }

      try {
          const { rowCount } = await sql('DELETE FROM users WHERE id = $1', [id]);
          if (rowCount === 0) {
              return res.status(404).json({ message: 'User not found' });
          }
          return res.status(204).end();
      } catch (error) {
          console.error('Error deleting user:', error);
          return res.status(500).json({ message: 'Internal Server Error' });
      }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
};

// Protect endpoint, only allow 'executive' role
export default withAuth(handler, ['executive']);
