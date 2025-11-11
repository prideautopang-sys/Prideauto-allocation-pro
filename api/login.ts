import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db';
import { signToken } from '../../lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Corrected query to select 'password' column instead of 'password_hash'
    const { rows } = await sql('SELECT id, password, role FROM users WHERE username = $1', [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    
    // Plain text password comparison
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
