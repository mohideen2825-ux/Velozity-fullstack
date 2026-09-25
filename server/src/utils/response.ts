import { Response } from 'express';

export const sendError = (res: Response, statusCode: number, message: string) => {
    return res.status(statusCode).json({
        success: false,
        message,
    });
};

export const sendSuccess = (res: Response, statusCode: number, data: any, message?: string) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};
