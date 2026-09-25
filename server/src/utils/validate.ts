import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from './response';

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * On failure, responds with 400 and lists all validation errors.
 */
export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = (result.error as ZodError).errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            res.status(400).json({ success: false, message: 'Validation failed', errors });
            return;
        }
        req.body = result.data; // use the coerced/cleaned data
        next();
    };
};
