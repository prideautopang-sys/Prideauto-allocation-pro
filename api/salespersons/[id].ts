import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../middleware/withAuth.js';
import { Salesperson } from '../../types.js';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
    const { id } = req.query;

    if (typeof id !== 'string') {
        return res.status(400).json({ message: 'Invalid salesperson ID' });
    }

    // PUT (Update) a salesperson
    if (req.method === 'PUT') {
        try {
            const { name, status } = req.body as Salesperson;

            if (!name || !status) {
                return res.status(400).json({ message: "Name and status are required." });
            }

            const query = `
                UPDATE salespersons SET 
                    name = $1, status = $2, updated_at = NOW()
                WHERE id = $3
                RETURNING id, name, status;
            `;
            const params = [name, status, id];
            
            const { rows } = await sql(query, params);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Salesperson not found' });
            }
            return res.status(200).json(rows[0]);

        } catch (error: any) {
            console.error('Error updating salesperson:', error);
            if (error.code === '23505') { // Unique constraint violation
                 return res.status(409).json({ message: `A salesperson with the name '${req.body.name}' already exists.` });
            }
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
};

// Protect endpoint, only allow 'executive' role
export default withAuth(handler, ['executive']);