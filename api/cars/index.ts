
import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../../lib/withAuth.js';
import { Car } from '../../types.js';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
  const userRole = req.user?.role;
  const { id } = req.query;

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

  // POST a new car OR Batch Import
  if (req.method === 'POST') {
    if (userRole !== 'executive' && userRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
    }

    if (Array.isArray(req.body)) {
        try {
          const cars = req.body as Car[];
          if (cars.length === 0) {
             return res.status(400).json({ message: 'Invalid data: Empty array' });
          }

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
          return res.status(500).json({ message: 'Internal Server Error during batch import' });
        }
    }
    
    try {
      const { 
          dealerCode, dealerName, model, vin, frontMotorNo, rearMotorNo,
          batteryNo, engineNo, color, carType, allocationDate, poType,
          price, status 
      } = req.body as Car;

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

  // PUT: Update Car (Single or Batch)
  if (req.method === 'PUT') {
      if (userRole !== 'executive' && userRole !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
      }

      // Single Update via ID
      if (id) {
        try {
            const { 
                dealerCode, dealerName, model, vin, frontMotorNo, rearMotorNo,
                batteryNo, engineNo, color, carType, allocationDate, poType,
                price, status, stockInDate, stockLocation, stockNo
            } = req.body as Car;

            const query = `
                UPDATE cars SET 
                    dealer_code = $1, dealer_name = $2, model = $3, vin = $4, front_motor_no = $5, 
                    rear_motor_no = $6, battery_no = $7, engine_no = $8, color = $9, car_type = $10, 
                    allocation_date = $11, po_type = $12, price = $13, status = $14, 
                    stock_in_date = $15, stock_location = $16, stock_no = $17, updated_at = NOW()
                WHERE id = $18
                RETURNING *;
            `;
            
            const params = [
                dealerCode, dealerName, model, vin, frontMotorNo, rearMotorNo,
                batteryNo, engineNo, color, carType, allocationDate, poType,
                price, status, stockInDate, stockLocation, stockNo, id
            ].map(val => val === undefined ? null : val);
            
            const { rows } = await sql(query, params);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Car not found' });
            }
            return res.status(200).json(rows[0]);

        } catch (error: any) {
            console.error('Error updating car:', error);
            if (error.code === '23505') {
                return res.status(409).json({ message: `A car with VIN ${req.body.vin} already exists.` });
            }
            return res.status(500).json({ message: 'Internal Server Error' });
        }
      }

      // Batch Stock Update
      const { carIds, stockInDate, stockLocation, stockNo } = req.body;
      if (carIds && Array.isArray(carIds)) {
          try {
             if (carIds.length === 0) {
                return res.status(400).json({ message: 'No car IDs provided' });
             }

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
              
              const params = [stockInDate, stockLocation, stockNo || null, carIds].map(val => val === undefined ? null : val);
              await sql(query, params);

              return res.status(200).json({ message: 'Batch stock update successful' });
          } catch (error) {
              console.error('Error in batch stock update:', error);
              return res.status(500).json({ message: 'Internal Server Error' });
          }
      }
      return res.status(400).json({ message: 'Invalid request format' });
  }

  // DELETE a car
  if (req.method === 'DELETE') {
    if (!id) {
        return res.status(400).json({ message: 'Car ID is required for deletion' });
    }
    if (userRole !== 'executive') {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to delete cars.' });
    }

    try {
        const { rows: matchRows } = await sql('SELECT id FROM matches WHERE car_id = $1', [id]);
        if (matchRows.length > 0) {
            return res.status(400).json({ message: 'Cannot delete car: It is associated with a match. Please remove the match first.' });
        }
        
        const { rowCount } = await sql('DELETE FROM cars WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ message: 'Car not found' });
        }
        return res.status(204).end();
    } catch (error) {
        console.error('Error deleting car:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
};

export default withAuth(handler);
