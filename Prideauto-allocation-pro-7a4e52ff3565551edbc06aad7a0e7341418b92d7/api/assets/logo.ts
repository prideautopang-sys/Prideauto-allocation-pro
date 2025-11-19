import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { verifyToken } from '../../lib/auth.js';

const LOGO_KEY = 'app_logo';

export default async (req: VercelRequest, res: VercelResponse) => {
  // GET is public and does not require authentication
  if (req.method === 'GET') {
    try {
      const { rows } = await sql('SELECT value FROM assets WHERE key = $1', [LOGO_KEY]);
      const logo = rows.length > 0 ? rows[0].value : null;
      return res.status(200).json({ logo });
    } catch (error) {
      console.error('Error fetching logo:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  // POST requires executive authentication
  if (req.method === 'POST') {
    // Manual Authentication Check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    if (user.role !== 'executive') {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
    }

    // Authentication passed, proceed with POST logic
    try {
      const { logo } = req.body;
      if (typeof logo !== 'string' || !logo.startsWith('data:image/')) {
        return res.status(400).json({ message: 'Invalid logo data provided. Must be a Base64 image string.' });
      }

      // Use UPSERT to insert or update the logo
      const query = `
        INSERT INTO assets (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, updated_at = NOW();
      `;

      await sql(query, [LOGO_KEY, logo]);
      return res.status(200).json({ message: 'Logo updated successfully.' });
    } catch (error) {
      console.error('Error updating logo:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  // Handle other methods
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: 'Method Not Allowed' });
};