
import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../middleware/withAuth.js';
import { Car } from '../../types.js';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
  // GET all cars
  if (req.method === 'GET') {
    try {
      // The snake_case columns from DB need to be mapped to camelCase for the frontend
      const { rows } = await sql(`
        SELECT 
          id, dealer_code as "dealerCode", dealer_name as "dealerName", model, vin, 
          front_motor_no as "frontMotorNo", rear_motor_no as "rearMotorNo", 
          battery_no as "batteryNo", engine_no as "engineNo", color, car_type as "carType", 
          allocation_date as "allocationDate", po_type as "poType", price, status, 
          stock_in_date as "stockInDate", stock_location as "stockLocation",
          stock_no as "stockNo"
        FROM cars ORDER BY allocation_date DESC
      `);
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching cars:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  // POST a new car
  if (req.method === 'POST') {
    // Role-based access control inside the handler
    const userRole = req.user?.role;
    if (userRole !== 'executive' && userRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions to create a car.' });
    }
    
    try {
      const { 
          dealerCode, dealerName, model, vin, frontMotorNo, rearMotorNo,
          batteryNo, engineNo, color, carType, allocationDate, poType,
          price, status 
      } = req.body as Car;

      // Basic validation
      if (!model || !vin || !price) {
          return res.status(400).json({ message: 'Missing required fields' });
      }

      const query = `
        INSERT INTO cars (
            dealer_code, dealer_name, model, vin, front_motor_no, rear_motor_no, 
            battery_no, engine_no, color, car_type, allocation_date, po_type, 
            price, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *;
      `;
      
      // Ensure undefined values are converted to null
      const params = [
          dealerCode, dealerName, model, vin, frontMotorNo, rearMotorNo,
          batteryNo, engineNo, color, carType, allocationDate, poType,
          price, status
      ].map(val => val === undefined ? null : val);

      const { rows } = await sql(query, params);
      return res.status(201).json(rows[0]);
    } catch (error: any) {
        console.error('Error creating car:', error);
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ message: `A car with VIN ${req.body.vin} already exists.` });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
};

// Protect endpoint for all authenticated users; role checks are done inside the handler.
export default withAuth(handler);
