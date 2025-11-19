
import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../../lib/withAuth.js';
import { Salesperson } from '../../types.js';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
  const { id, status } = req.query;
  const userRole = req.user?.role;

  // GET salespersons
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
  
  // POST a new salesperson
  if (req.method === 'POST') {
     if (userRole !== 'executive') {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
     }
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
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ message: `A salesperson with the name '${req.body.name}' already exists.` });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
     }
  }

  // PUT (Update) a salesperson
  if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ message: 'Salesperson ID required' });
      if (userRole !== 'executive') {
          return res.status(403).json({ message: 'Forbidden' });
      }

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
          const params = [name, status, id];
          
          const { rows } = await sql(query, params);
          if (rows.length === 0) {
              return res.status(404).json({ message: 'Salesperson not found' });
          }
          return res.status(200).json(rows[0]);

      } catch (error: any) {
          console.error('Error updating salesperson:', error);
          if (error.code === '23505') { // Unique constraint violation
                return res.status(409).json({ message: `A salesperson with the name '${req.body.name}' already exists.` });
          }
          return res.status(500).json({ message: 'Internal Server Error' });
      }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
};

export default withAuth(handler);
