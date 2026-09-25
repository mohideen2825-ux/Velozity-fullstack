import jwt from 'jsonwebtoken';

export interface TokenPayload {
    userId: string;
    role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '15m' });
};

export const generateRefreshToken = (userId: string): string => {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as { userId: string };
};
