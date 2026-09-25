import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendError, sendSuccess } from '../utils/response';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user!.userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: req.user!.userId, isRead: false },
        });

        sendSuccess(res, 200, { notifications, unreadCount }, 'Notifications fetched');
    } catch (error) {
        sendError(res, 500, 'Error fetching notifications');
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // scope to the requesting user so no one can mark another user's notifications
        const result = await prisma.notification.updateMany({
            where: { id, userId: req.user!.userId },
            data: { isRead: true },
        });

        if (result.count === 0) {
            return sendError(res, 404, 'Notification not found');
        }

        sendSuccess(res, 200, null, 'Notification marked as read');
    } catch (error) {
        sendError(res, 500, 'Error marking notification as read');
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user!.userId, isRead: false },
            data: { isRead: true },
        });
        sendSuccess(res, 200, null, 'All notifications marked as read');
    } catch (error) {
        sendError(res, 500, 'Error marking all notifications as read');
    }
};
