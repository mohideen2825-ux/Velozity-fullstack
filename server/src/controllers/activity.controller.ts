                                                                import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendError, sendSuccess } from '../utils/response';

export const getRecentActivity = async (req: Request, res: Response) => {
    try {
        const userRole = req.user!.role;
        const userId = req.user!.userId;

        const whereClause: any = {};
        if (userRole === 'DEVELOPER') {
            whereClause.task = { assigneeId: userId };
        } else if (userRole === 'PROJECT_MANAGER') {
            whereClause.task = { project: { managerId: userId } };
        }
        // ADMIN gets all

        const activities = await prisma.taskActivity.findMany({
            where: whereClause,
            take: 20,
            orderBy: { timestamp: 'desc' },
            include: {
                task: { select: { id: true, title: true, projectId: true } },
                user: { select: { id: true, name: true } },
            },
        });

        sendSuccess(res, 200, activities, 'Recent activities fetched');
    } catch (error) {
        sendError(res, 500, 'Error fetching recent activity');
    }
};
