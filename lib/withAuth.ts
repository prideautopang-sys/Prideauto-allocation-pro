import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from './auth.js';

type Role = 'executive' | 'admin' | 'user';

export type AuthenticatedRequest = VercelRequest & {
  user?: {
    userId: string;
    role: Role;
  };
};

type ApiHandler = (req: AuthenticatedRequest, res: VercelResponse) => Promise<any>;

export const withAuth = (handler: ApiHandler, requiredRoles: Role[] = []) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = user;
    
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    return handler(authenticatedReq, res);
  };
};
