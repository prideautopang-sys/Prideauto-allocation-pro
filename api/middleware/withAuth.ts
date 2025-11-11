import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../lib/auth';

type Role = 'executive' | 'admin' | 'user';

export interface AuthenticatedRequest extends VercelRequest {
  user?: {
    userId: string;
    role: Role;
  };
}

// FIX: The ApiHandler type was too strict (Promise<void>). Changed to Promise<any> to accommodate handlers that return the VercelResponse object (e.g., `return res.json(...)`).
type ApiHandler = (req: AuthenticatedRequest, res: VercelResponse) => Promise<any>;

export const withAuth = (handler: ApiHandler, requiredRoles: Role[] = []) => {
  // FIX: The function returned by the middleware should accept a standard VercelRequest,
  // as that's what the Vercel runtime provides. The middleware then augments it.
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