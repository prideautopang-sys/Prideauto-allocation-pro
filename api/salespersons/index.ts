import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../middleware/withAuth.js';
import { Salesperson } from '../../types.js';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
  // GET salespersons
  if (req.method === 'GET') {
    const { status } = req.query;
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
     const userRole = req.user?.role;
     if (userRole !== 'executive') {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
     }
     try {
        const { name } = req.body as Salesperson;
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }
        // New salespersons are active by default from the DB schema.
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

  return res.status(405).json({ message: 'Method Not Allowed' });
};

// All authenticated users can GET, but only executive can POST.
export default withAuth(handler);