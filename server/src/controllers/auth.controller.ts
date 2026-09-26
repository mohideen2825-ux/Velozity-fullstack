import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { sendError, sendSuccess } from '../utils/response';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

// Public registration — always creates DEVELOPER role.
// ADMIN-managed user creation (any role) is handled by POST /api/admin/users.
export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body; // role intentionally NOT accepted here

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return sendError(res, 409, 'An account with this email already exists');

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'DEVELOPER', // hard-coded; only admins can create other roles
            },
            select: { id: true, email: true, name: true, role: true },
        });

        sendSuccess(res, 201, user, 'Account registered successfully');
    } catch (error) {
        sendError(res, 500, 'Internal server error');
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return sendError(res, 401, 'Invalid email or password');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return sendError(res, 401, 'Invalid email or password');

        const accessToken = generateAccessToken({ userId: user.id, role: user.role });
        const refreshToken = generateRefreshToken(user.id);

        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: sevenDaysFromNow,
            },
        });

        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
        };

        res.cookie('refreshToken', refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        const userData = { id: user.id, email: user.email, name: user.name, role: user.role };
        res.status(200).json({ success: true, accessToken, data: userData });
    } catch (error) {
        sendError(res, 500, 'Internal server error');
    }
};

export const refresh = async (req: Request, res: Response) => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
        };

        const { refreshToken } = req.cookies;
        if (!refreshToken) return sendError(res, 401, 'No refresh token provided');

        const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            if (storedToken) await prisma.refreshToken.delete({ where: { id: storedToken.id } });
            res.clearCookie('refreshToken', cookieOptions);
            return sendError(res, 401, 'Refresh token invalid or expired');
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch {
            await prisma.refreshToken.delete({ where: { id: storedToken.id } });
            res.clearCookie('refreshToken', cookieOptions);
            return sendError(res, 401, 'Refresh token invalid or expired');
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) return sendError(res, 404, 'User not found');

        const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });

        res.status(200).json({ success: true, accessToken: newAccessToken });
    } catch (error) {
        sendError(res, 500, 'Internal server error');
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
        };

        const { refreshToken } = req.cookies;
        if (refreshToken) {
            await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
        }
        res.clearCookie('refreshToken', cookieOptions);
        sendSuccess(res, 200, null, 'Logged out successfully');
    } catch (error) {
        sendError(res, 500, 'Internal server error');
    }
};
