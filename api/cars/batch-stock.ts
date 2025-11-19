
import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../middleware/withAuth.js';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    
    const userRole = req.user?.role;
    if (userRole !== 'executive' && userRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
    }

    try {
        const { carIds, stockInDate, stockLocation, stockNo } = req.body;

        if (!carIds || !Array.isArray(carIds) || carIds.length === 0) {
            return res.status(400).json({ message: 'No cars selected for stock update.' });
        }

        if (!stockInDate) {
             return res.status(400).json({ message: 'Stock In Date is required.' });
        }

        // Update cars to 'In Stock' status and set stock details
        const query = `
            UPDATE cars SET 
                status = 'In Stock',
                stock_in_date = $1, 
                stock_location = $2, 
                stock_no = $3, 
                updated_at = NOW()
            WHERE id = ANY($4)
            RETURNING *;
        `;
        
        const params = [
            stockInDate, 
            stockLocation, 
            stockNo || null, 
            carIds
        ];

        const { rows } = await sql(query, params);
        
        return res.status(200).json(rows);

    } catch (error) {
        console.error('Error updating batch stock:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export default withAuth(handler);
