import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db';
import { withAuth, AuthenticatedRequest } from '../middleware/withAuth';
import { Match } from '../../types';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
  // GET all matches
  if (req.method === 'GET') {
    try {
      // Map snake_case to camelCase
      const { rows } = await sql(`
        SELECT
          id, car_id as "carId", customer_name as "customerName", salesperson,
          sale_date as "saleDate", status, license_plate as "licensePlate", notes
        FROM matches ORDER BY created_at DESC
      `);
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching matches:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  // POST a new match
  if (req.method === 'POST') {
    const userRole = req.user?.role;
    if (userRole !== 'executive' && userRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions to create a match.' });
    }
    try {
      const { 
          carId, customerName, salesperson, saleDate,
          status, licensePlate, notes 
      } = req.body as Match;

      if (!carId || !customerName || !salesperson) {
          return res.status(400).json({ message: 'Missing required fields' });
      }

      const query = `
        INSERT INTO matches (car_id, customer_name, salesperson, sale_date, status, license_plate, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      const params = [carId, customerName, salesperson, saleDate || null, status, licensePlate, notes];
      
      const { rows } = await sql(query, params);
      return res.status(201).json(rows[0]);

    } catch (error) {
        console.error('Error creating match:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
};

export default withAuth(handler);