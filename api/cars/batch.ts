
import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../middleware/withAuth.js';
import { Car } from '../../types.js';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    
    const userRole = req.user?.role;
    if (userRole !== 'executive' && userRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
    }

    try {
        const cars = req.body as Car[];
        if (!Array.isArray(cars) || cars.length === 0) {
             return res.status(400).json({ message: 'No cars provided for import.' });
        }
        
        const results = [];
        // Inserting sequentially for simplicity and error tracking per item if needed.
        for (const car of cars) {
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
            
            // Ensure undefined values are converted to null
            const params = [
                dealerCode, dealerName, model, vin, frontMotorNo, rearMotorNo,
                batteryNo, engineNo, color, carType, allocationDate, poType,
                price, status
            ].map(p => p === undefined ? null : p);
            
            try {
                const { rows } = await sql(query, params);
                results.push(rows[0]);
            } catch (e) {
                console.error(`Failed to import car VIN ${vin}:`, e);
                throw e; // Trigger 500 or catch block below
            }
        }

        return res.status(201).json({ message: 'Import successful', count: results.length });

    } catch (error: any) {
        console.error('Error during batch import:', error);
        if (error.code === '23505') {
             return res.status(409).json({ message: 'Duplicate VIN detected during import.' });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export default withAuth(handler);
