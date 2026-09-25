import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { sendError, sendSuccess } from '../utils/response';
import { getOnlineUserCount } from '../sockets';
import { handlePrismaError } from '../utils/prismaErrors';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalProjects = await prisma.project.count();

        const tasksByStatus = await prisma.task.groupBy({
            by: ['status'],
            _count: { status: true },
        });

        const overdueCount = await prisma.task.count({
            where: { isOverdue: true, status: { not: 'DONE' } },
        });

        const activeUsers = getOnlineUserCount();

        const formattedTasks = {
            TO_DO: 0,
            IN_PROGRESS: 0,
            IN_REVIEW: 0,
            DONE: 0,
        };

        tasksByStatus.forEach((t) => {
            formattedTasks[t.status] = t._count.status;
        });

        sendSuccess(
            res,
            200,
            { totalProjects, tasksByStatus: formattedTasks, overdueTasks: overdueCount, activeOnlineUsers: activeUsers },
            'Dashboard stats fetched successfully'
        );
    } catch (error) {
        sendError(res, 500, 'Error fetching dashboard stats');
    }
};

// Admin-only: create a user with any role (DEVELOPER, PROJECT_MANAGER, ADMIN)
export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, password, name, role } = req.body; // validated by Zod

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return sendError(res, 409, 'An account with this email already exists');

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name, role },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
        });

        sendSuccess(res, 201, user, 'User created successfully');
    } catch (error) {
        if (handlePrismaError(error, res, 'User')) return;
        sendError(res, 500, 'Error creating user');
    }
};

// Admin-only: list all users
export const getUsers = async (_req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, role: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
        sendSuccess(res, 200, users, 'Users fetched successfully');
    } catch (error) {
        sendError(res, 500, 'Error fetching users');
    }
};

// Admin-only: delete a user
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (id === req.user!.userId) {
            return sendError(res, 400, 'You cannot delete your own account');
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return sendError(res, 404, 'User not found');

        await prisma.user.delete({ where: { id } });
        sendSuccess(res, 200, null, 'User deleted successfully');
    } catch (error) {
        if (handlePrismaError(error, res, 'User')) return;
        sendError(res, 500, 'Error deleting user');
    }
};
