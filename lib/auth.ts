import jwt from 'jsonwebtoken';

interface UserPayload {
  userId: string;
  role: 'executive' | 'admin' | 'user';
}

export function signToken(payload: UserPayload): string {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    throw new Error('JWT_SECRET environment variable is not set on the server.');
  }
  return jwt.sign(payload, secretKey, { expiresIn: '1d' });
}

export function verifyToken(token: string): UserPayload | null {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    console.error('JWT_SECRET environment variable is not set on the server. Cannot verify token.');
    return null;
  }
  try {
    const decoded = jwt.verify(token, secretKey) as UserPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}
