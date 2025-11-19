
import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../middleware/withAuth.js';
import { Car, CarStatus } from '../../types.js';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
  const userRole = req.user?.role;

  // GET all cars
  if (req.method === 'GET') {
    try {
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

  // POST: Create Single Car OR Batch Import
  if (req.method === 'POST') {
    if (userRole !== 'executive' && userRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
    }
    
    try {
      // BATCH IMPORT (Array)
      if (Array.isArray(req.body)) {
          const carsToImport = req.body as Car[];
          if (carsToImport.length === 0) {
              return res.status(400).json({ message: 'No cars to import.' });
          }

          // We process imports sequentially or via Promise.all to reuse the same query structure
          // A robust solution would use a single transaction, but for simplicity/compatibility with this setup:
          const results = [];
          const errors = [];

          for (const car of carsToImport) {
              try {
                  const { 
                    dealerCode, dealerName, model, vin, frontMotorNo, rearMotorNo,
                    batteryNo, engineNo, color, carType, allocationDate, poType,
                    price, status 
                  } = car;
                  
                   const query = `
                    INSERT INTO cars (
                        dealer_code, dealer_name, model, vin, front_motor_no, rear_motor_no, 
                        battery_no, engine_no, color, car_type, allocation_date, po_type, 
                        price, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    RETURNING id;
                  `;
                  // Sanitize params
                  const params = [
                      dealerCode, dealerName, model, vin, 
                      frontMotorNo ?? null, rearMotorNo ?? null, batteryNo ?? null, engineNo ?? null, 
                      color, carType ?? null, allocationDate, poType ?? null,
                      price, status || 'รอขึ้นเทรลเลอร์'
                  ];
                  
                  await sql(query, params);
                  results.push(vin);
              } catch (err: any) {
                  console.error(`Failed to import VIN ${car.vin}:`, err);
                  errors.push({ vin: car.vin, error: err.message });
              }
          }

          return res.status(201).json({ 
              message: `Imported ${results.length} cars.`, 
              errors: errors.length > 0 ? errors : undefined 
          });
      }

      // SINGLE CREATE
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
          dealerCode, dealerName, model, vin, 
          frontMotorNo ?? null, rearMotorNo ?? null, batteryNo ?? null, engineNo ?? null, 
          color, carType ?? null, allocationDate, poType ?? null,
          price, status
      ];

      const { rows } = await sql(query, params);
      return res.status(201).json(rows[0]);

    } catch (error: any) {
        console.error('Error creating car:', error);
        if (error.code === '23505') {
            return res.status(409).json({ message: `A car with VIN ${req.body.vin || 'unknown'} already exists.` });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  // PUT: Batch Stock Update (when sending carIds)
  if (req.method === 'PUT') {
      if (userRole !== 'executive' && userRole !== 'admin') {
          return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
      }

      // Check if this is a batch request
      if (req.body.carIds && Array.isArray(req.body.carIds)) {
          try {
              const { carIds, stockInDate, stockLocation, stockNo } = req.body;
              
              if (!stockInDate) {
                   return res.status(400).json({ message: 'Stock In Date is required.' });
              }

              // Update multiple cars
              // Using = ANY($1) for array matching
              const query = `
                  UPDATE cars SET 
                      status = $1, 
                      stock_in_date = $2, 
                      stock_location = $3, 
                      stock_no = $4, 
                      updated_at = NOW()
                  WHERE id = ANY($5)
                  RETURNING id;
              `;
              
              const params = [
                  CarStatus.IN_STOCK, 
                  stockInDate, 
                  stockLocation ?? null, 
                  stockNo ?? null, 
                  carIds
              ];

              const { rowCount } = await sql(query, params);
              return res.status(200).json({ message: 'Cars updated successfully', count: rowCount });

          } catch (error) {
              console.error('Error in batch update:', error);
              return res.status(500).json({ message: 'Internal Server Error' });
          }
      }
      
      // If not batch, this endpoint does not handle single ID PUTs (that's handled by [id].ts)
      return res.status(400).json({ message: 'Invalid request format for bulk update.' });
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
};

export default withAuth(handler);
