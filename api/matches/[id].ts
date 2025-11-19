
import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../../lib/withAuth.js';
import { Match } from '../../types.js';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
    const { id } = req.query;
    const userRole = req.user?.role;

    if (typeof id !== 'string') {
        return res.status(400).json({ message: 'Invalid match ID' });
    }

    if (userRole !== 'executive' && userRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions to manage matches.' });
    }

    // PUT (Update) a match
    if (req.method === 'PUT') {
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
        try {
            const { rowCount } = await sql('DELETE FROM matches WHERE id = $1', [id]);
            if (rowCount === 0) {
                return res.status(404).json({ message: 'Match not found' });
            }
            return res.status(204).end(); // No Content
        } catch (error) {
            console.error('Error deleting match:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
};

export default withAuth(handler);
