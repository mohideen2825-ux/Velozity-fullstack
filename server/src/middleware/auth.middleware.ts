import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { verifyAccessToken } from '../utils/jwt';
import { Role } from '../types/models';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, 401, 'Access denied. No token provided.');
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);

        req.user = {
            userId: decoded.userId,
            role: decoded.role as Role,
        };

        next();
    } catch (error) {
        return sendError(res, 401, 'Invalid or expired access token.');
    }
};

export const requireRole = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return sendError(res, 403, 'You are not authorized to perform this action.');
        }
        next();
    };
};
