
import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../../lib/withAuth.js';
import { AppUser, Salesperson } from '../../types.js';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
  const { id, resource, status } = req.query;
  const currentUserId = req.user?.userId;
  const userRole = req.user?.role;

  // --- SALESPERSONS RESOURCE ---
  if (resource === 'salespersons') {
    // GET Salespersons (Allowed for all authenticated users)
    if (req.method === 'GET') {
      try {
        let query = 'SELECT id, name, status FROM salespersons ORDER BY name ASC';
        const params = [];
        
        if (status === 'active') {
          query = 'SELECT id, name, status FROM salespersons WHERE status = $1 ORDER BY name ASC';
          params.push('active');
        }
        
        const { rows } = await sql(query, params);
        return res.status(200).json(rows);
      } catch (error) {
        console.error('Error fetching salespersons:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    }

    // For POST/PUT, strictly enforce EXECUTIVE role
    if (userRole !== 'executive') {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
    }

    // POST Salesperson
    if (req.method === 'POST') {
        try {
            const { name } = req.body as Salesperson;
            if (!name) {
                return res.status(400).json({ message: 'Name is required' });
            }
            const { rows } = await sql(
                'INSERT INTO salespersons (name) VALUES ($1) RETURNING id, name, status',
                [name]
            );
            return res.status(201).json(rows[0]);
        } catch (error: any) {
            console.error('Error creating salesperson:', error);
            if (error.code === '23505') {
                return res.status(409).json({ message: `A salesperson with the name '${req.body.name}' already exists.` });
            }
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    // PUT Salesperson
    if (req.method === 'PUT') {
        if (!id) return res.status(400).json({ message: 'Salesperson ID required' });
        try {
            const { name, status } = req.body as Salesperson;
            if (!name || !status) {
                return res.status(400).json({ message: "Name and status are required." });
            }
            const query = `
                UPDATE salespersons SET 
                    name = $1, status = $2, updated_at = NOW()
                WHERE id = $3
                RETURNING id, name, status;
            `;
            const { rows } = await sql(query, [name, status, id]);
            if (rows.length === 0) return res.status(404).json({ message: 'Salesperson not found' });
            return res.status(200).json(rows[0]);
        } catch (error: any) {
            console.error('Error updating salesperson:', error);
            if (error.code === '23505') {
                return res.status(409).json({ message: `A salesperson with the name '${req.body.name}' already exists.` });
            }
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }
    
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // --- USERS RESOURCE (Default) ---
  
  // Strictly enforce EXECUTIVE role for all User management
  if (userRole !== 'executive') {
     return res.status(403).json({ message: 'Forbidden: You do not have permission to manage users.' });
  }

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
        if (error.code === '23505') { 
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

// Default auth wrapper (checks if logged in), specific roles checked inside handler
export default withAuth(handler);
