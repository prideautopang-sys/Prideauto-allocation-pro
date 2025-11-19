
import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../middleware/withAuth.js';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
  if (req.method === 'PUT') {
    try {
      const { carIds, stockInDate, stockLocation, stockNo } = req.body;

      if (!carIds || !Array.isArray(carIds) || carIds.length === 0) {
        return res.status(400).json({ message: 'No car IDs provided' });
      }

      // Update multiple rows
      const query = `
        UPDATE cars
        SET
            status = 'In Stock',
            stock_in_date = $1,
            stock_location = $2,
            stock_no = $3,
            updated_at = NOW()
        WHERE id = ANY($4)
      `;
      
      // Ensure parameters are not undefined
      const params = [stockInDate, stockLocation, stockNo || null, carIds].map(val => val === undefined ? null : val);

      await sql(query, params);

      return res.status(200).json({ message: 'Batch update successful' });
    } catch (error) {
      console.error('Error in batch stock update:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
  return res.status(405).json({ message: 'Method Not Allowed' });
};

export default withAuth(handler);
