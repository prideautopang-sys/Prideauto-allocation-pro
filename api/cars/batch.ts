
import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../middleware/withAuth.js';
import { Car } from '../../types.js';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
  if (req.method === 'POST') {
    const userRole = req.user?.role;
    if (userRole !== 'executive' && userRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    try {
      const cars = req.body as Car[];
      if (!Array.isArray(cars) || cars.length === 0) {
        return res.status(400).json({ message: 'Invalid data' });
      }

      // Insert cars one by one (safe for small batches)
      // In a high-volume production scenario, constructing a single multi-value INSERT is better,
      // but using Promise.all with individual inserts ensures safety with existing helper.
      const promises = cars.map(car => {
         const query = `
            INSERT INTO cars (
                dealer_code, dealer_name, model, vin, front_motor_no, rear_motor_no,
                battery_no, engine_no, color, car_type, allocation_date, po_type,
                price, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (vin) DO NOTHING;
        `;
        const params = [
            car.dealerCode, car.dealerName, car.model, car.vin, car.frontMotorNo, car.rearMotorNo,
            car.batteryNo, car.engineNo, car.color, car.carType, car.allocationDate, car.poType,
            car.price, car.status
        ].map(val => val === undefined ? null : val);

        return sql(query, params);
      });

      await Promise.all(promises);

      return res.status(201).json({ message: 'Batch import successful' });
    } catch (error) {
      console.error('Error in batch import:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
  return res.status(405).json({ message: 'Method Not Allowed' });
};

export default withAuth(handler);
