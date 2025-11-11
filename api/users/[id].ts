import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../middleware/withAuth.js';
import { AppUser } from '../../types.js';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
    const { id } = req.query;
    const currentUserId = req.user?.userId;

    if (typeof id !== 'string') {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    // PUT (Update) a user
    if (req.method === 'PUT') {
        try {
            const { role, password } = req.body as AppUser;

            if (!role) {
                return res.status(400).json({ message: "Role is required for an update." });
            }

            // Build the query dynamically based on whether a new password is provided.
            let query;
            let params;

            if (password && password.trim() !== '') {
                // If a new password is provided, update both role and password.
                query = `
                    UPDATE users SET 
                        role = $1, password = $2, updated_at = NOW()
                    WHERE id = $3
                    RETURNING id, username, role, created_at as "createdAt";
                `;
                params = [role, password, id];
            } else {
                // If password is not provided, update only the role.
                query = `
                    UPDATE users SET 
                        role = $1, updated_at = NOW()
                    WHERE id = $2
                    RETURNING id, username, role, created_at as "createdAt";
                `;
                params = [role, id];
            }
            
            const { rows } = await sql(query, params);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.status(200).json(rows[0]);

        } catch (error: any) {
            console.error('Error updating user:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    // DELETE a user
    if (req.method === 'DELETE') {
        if (id === currentUserId) {
            return res.status(403).json({ message: 'Forbidden: You cannot delete your own account.' });
        }

        try {
            const { rowCount } = await sql('DELETE FROM users WHERE id = $1', [id]);
            if (rowCount === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.status(204).end(); // No Content
        } catch (error) {
            console.error('Error deleting user:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
};

// Protect endpoint, only allow 'executive' role
export default withAuth(handler, ['executive']);