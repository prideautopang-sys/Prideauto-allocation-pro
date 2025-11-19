
import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../../lib/withAuth.js';
import { Match } from '../../types.js';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
  const userRole = req.user?.role;
  const { id } = req.query;

  // GET all matches
  if (req.method === 'GET') {
    try {
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
    if (userRole !== 'executive' && userRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
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

  // PUT (Update) a match
  if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ message: 'Match ID required' });
      if (userRole !== 'executive' && userRole !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
      }

      try {
          const { 
              carId, customerName, salesperson, saleDate,
              status, licensePlate, notes 
          } = req.body as Match;

          const query = `
              UPDATE matches SET 
                  car_id = $1, customer_name = $2, salesperson = $3, sale_date = $4, 
                  status = $5, license_plate = $6, notes = $7, updated_at = NOW()
              WHERE id = $8
              RETURNING *;
          `;
          const params = [carId, customerName, salesperson, saleDate || null, status, licensePlate, notes, id];

          const { rows } = await sql(query, params);
          if (rows.length === 0) {
              return res.status(404).json({ message: 'Match not found' });
          }
          return res.status(200).json(rows[0]);
      } catch (error) {
          console.error('Error updating match:', error);
          return res.status(500).json({ message: 'Internal Server Error' });
      }
  }

  // DELETE a match
  if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ message: 'Match ID required' });
      if (userRole !== 'executive' && userRole !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
      }

      try {
          const { rowCount } = await sql('DELETE FROM matches WHERE id = $1', [id]);
          if (rowCount === 0) {
              return res.status(404).json({ message: 'Match not found' });
          }
          return res.status(204).end();
      } catch (error) {
          console.error('Error deleting match:', error);
          return res.status(500).json({ message: 'Internal Server Error' });
      }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
};

export default withAuth(handler);
