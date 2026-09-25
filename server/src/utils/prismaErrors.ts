import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { sendError } from './response';

/**
 * Handles known Prisma errors and sends appropriate HTTP responses.
 * Returns true if the error was handled, false otherwise.
 */
export const handlePrismaError = (error: unknown, res: Response, entityName = 'Record'): boolean => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2025': // Record not found
                sendError(res, 404, `${entityName} not found`);
                return true;
            case 'P2002': // Unique constraint violation
                sendError(res, 409, `A ${entityName.toLowerCase()} with this value already exists`);
                return true;
            case 'P2003': // Foreign key constraint violation
                sendError(res, 400, 'Invalid reference: related record does not exist');
                return true;
            default:
                return false;
        }
    }
    return false;
};
