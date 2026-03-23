
import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../middleware/withAuth.js';
import { Car } from '../../types.js';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
    const { id } = req.query;
    const userRole = req.user?.role;

    if (typeof id !== 'string') {
        return res.status(400).json({ message: 'Invalid car ID' });
    }

    // PUT (Update) a car
    if (req.method === 'PUT') {
        if (userRole !== 'executive' && userRole !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions to update a car.' });
        }

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
            
            // Convert undefined to null for optional fields to avoid DB errors
            const params = [
                dealerCode, 
                dealerName, 
                model, 
                vin, 
                frontMotorNo ?? null, 
                rearMotorNo ?? null,
                batteryNo ?? null, 
                engineNo ?? null, 
                color, 
                carType ?? null, 
                allocationDate, 
                poType ?? null,
                price, 
                status, 
                stockInDate ?? null, 
                stockLocation ?? null, 
                stockNo ?? null, 
                id
            ];
            
            const { rows } = await sql(query, params);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Car not found' });
            }
            return res.status(200).json(rows[0]);

        } catch (error: any) {
            console.error('Error updating car:', error);
             if (error.code === '23505') { // Unique constraint violation
                return res.status(409).json({ message: `A car with VIN ${req.body.vin} already exists.` });
            }
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    // DELETE a car
    if (req.method === 'DELETE') {
        if (userRole !== 'executive') {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to delete cars.' });
        }

        try {
            // Check if car is part of a match
            const { rows: matchRows } = await sql('SELECT id FROM matches WHERE car_id = $1', [id]);
            if (matchRows.length > 0) {
                return res.status(400).json({ message: 'Cannot delete car: It is associated with a match. Please remove the match first.' });
            }
            
            const { rowCount } = await sql('DELETE FROM cars WHERE id = $1', [id]);
            if (rowCount === 0) {
                return res.status(404).json({ message: 'Car not found' });
            }
            return res.status(204).end(); // No Content
        } catch (error) {
            console.error('Error deleting car:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
};

export default withAuth(handler);
