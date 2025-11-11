import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../lib/db.js';
import { signToken } from '../lib/auth.js';

export default async (req: VercelRequest, res: VercelResponse) => {
  // Explicitly check for environment variables at the start.
  // A missing variable here can cause a crash before the try/catch block is effective.
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
      console.error('[API Login] Server Configuration Error: Missing DATABASE_URL or JWT_SECRET.');
      return res.status(500).json({ message: 'Server configuration error. Please contact an administrator.' });
  }

  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    let user;
    try {
      const { rows } = await sql('SELECT id, password, role FROM users WHERE username = $1', [username]);
      if (rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      user = rows[0];
    } catch (dbError) {
      console.error('[API Login] Database Error:', dbError);
      return res.status(500).json({ message: 'An error occurred while querying the database.' });
    }

    const isPasswordValid = password === user.password;

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({ userId: user.id, role: user.role });

    return res.status(200).json({ 
      token, 
      user: {
        id: user.id,
        username: username,
        role: user.role
      } 
    });
  } catch (error) {
    console.error('[API Login Error]:', error);
    // Ensure a JSON error response is always sent, preventing the client from parsing HTML.
    return res.status(500).json({ message: 'A server error occurred during login. Please check server logs.' });
  }
};