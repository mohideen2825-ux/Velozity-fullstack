import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendError, sendSuccess } from '../utils/response';
import { TaskStatus, Priority, Prisma } from '@prisma/client';
import { getIO } from '../sockets';
import { handlePrismaError } from '../utils/prismaErrors';

export const getTasks = async (req: Request, res: Response) => {
    try {
        const userRole = req.user!.role;
        const userId = req.user!.userId;

        const { status, priority, projectId } = req.query;

        const whereClause: Prisma.TaskWhereInput = {};
        if (status) whereClause.status = status as TaskStatus;
        if (priority) whereClause.priority = priority as Priority;
        if (projectId) whereClause.projectId = projectId as string;

        if (userRole === 'DEVELOPER') {
            whereClause.assigneeId = userId;
        } else if (userRole === 'PROJECT_MANAGER') {
            whereClause.project = { managerId: userId };
        }
        // ADMIN sees all

        const tasks = await prisma.task.findMany({
            where: whereClause,
            include: {
                project: { select: { name: true, managerId: true } },
                assignee: { select: { id: true, name: true } },
            },
            orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        });

        sendSuccess(res, 200, tasks, 'Tasks fetched successfully');
    } catch (error) {
        sendError(res, 500, 'Error fetching tasks');
    }
};

export const createTask = async (req: Request, res: Response) => {
    try {
        const { title, description, priority, dueDate, projectId, assigneeId } = req.body;

        // PM can only create tasks in their own projects
        if (req.user!.role === 'PROJECT_MANAGER') {
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (!project || project.managerId !== req.user!.userId) {
                return sendError(res, 403, 'Not authorized to create tasks in this project');
            }
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority,
                dueDate: new Date(dueDate),
                projectId,
                assigneeId: assigneeId || null,
            },
        });

        sendSuccess(res, 201, task, 'Task created successfully');
    } catch (error) {
        if (handlePrismaError(error, res, 'Task')) return;
        sendError(res, 500, 'Error creating task');
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority, dueDate, assigneeId } = req.body;

        const task = await prisma.task.findUnique({
            where: { id },
            include: { project: true },
        });

        if (!task) return sendError(res, 404, 'Task not found');

        // ── DEVELOPER: can only update status on their own assigned tasks ────────
        if (req.user!.role === 'DEVELOPER') {
            if (task.assigneeId !== req.user!.userId) {
                return sendError(res, 403, 'Not authorized. Task not assigned to you.');
            }
            if (!status || status === task.status) {
                return sendSuccess(res, 200, task, 'No status changes made');
            }

            // Run all DB writes inside a transaction; emit AFTER commit
            let activityRecord: any;
            let managerId: string;

            const updatedTask = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                const uTask = await tx.task.update({ where: { id }, data: { status } });

                activityRecord = await tx.taskActivity.create({
                    data: {
                        taskId: id,
                        userId: req.user!.userId,
                        previousStatus: task.status,
                        newStatus: status,
                    },
                    include: { user: { select: { name: true } } },
                });

                // Create notification for PM when developer marks IN_REVIEW
                if (status === 'IN_REVIEW') {
                    await tx.notification.create({
                        data: {
                            userId: task.project.managerId,
                            message: `Task "${task.title}" is ready for review.`,
                            type: 'REVIEW',
                        },
                    });
                }

                managerId = task.project.managerId;
                return uTask;
            });

            // ── Emit AFTER transaction committed ──────────────────────────────
            const io = getIO();
            io.to(`project_${task.projectId}`).emit('task_activity', {
                taskId: updatedTask.id,
                projectId: task.projectId,
                activity: activityRecord,
                taskTitle: task.title,
            });

            if (status === 'IN_REVIEW') {
                const unreadCount = await prisma.notification.count({
                    where: { userId: managerId!, isRead: false },
                });
                io.to(`user_${managerId!}`).emit('notification_count', unreadCount);
            }

            return sendSuccess(res, 200, updatedTask, 'Task status updated');
        }

        // ── PROJECT_MANAGER: full update on their projects' tasks ─────────────
        if (req.user!.role === 'PROJECT_MANAGER') {
            if (task.project.managerId !== req.user!.userId) {
                return sendError(res, 403, 'Not authorized to update tasks in this project');
            }
        }
        // ADMIN: no extra ownership check

        const dataToUpdate: Prisma.TaskUpdateInput = {};
        if (title !== undefined) dataToUpdate.title = title;
        if (description !== undefined) dataToUpdate.description = description;
        if (status !== undefined) dataToUpdate.status = status;
        if (priority !== undefined) dataToUpdate.priority = priority;
        if (dueDate !== undefined) dataToUpdate.dueDate = new Date(dueDate);
        if (assigneeId !== undefined) dataToUpdate.assignee = assigneeId
            ? { connect: { id: assigneeId } }
            : { disconnect: true };

        const statusChanged = status !== undefined && status !== task.status;
        const assigneeChanged = assigneeId !== undefined && assigneeId !== task.assigneeId;

        let activityRecord: any;
        const updatedTask = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const uTask = await tx.task.update({ where: { id }, data: dataToUpdate });

            if (statusChanged) {
                activityRecord = await tx.taskActivity.create({
                    data: {
                        taskId: id,
                        userId: req.user!.userId,
                        previousStatus: task.status,
                        newStatus: status,
                    },
                    include: { user: { select: { name: true } } },
                });
            }

            if (assigneeChanged && assigneeId) {
                await tx.notification.create({
                    data: {
                        userId: assigneeId,
                        message: `You have been assigned to task: "${title ?? task.title}".`,
                        type: 'ASSIGNMENT',
                    },
                });
            }

            return uTask;
        });

        // ── Emit AFTER transaction committed ──────────────────────────────────
        const io = getIO();

        if (statusChanged && activityRecord) {
            io.to(`project_${task.projectId}`).emit('task_activity', {
                taskId: updatedTask.id,
                projectId: task.projectId,
                activity: activityRecord,
                taskTitle: task.title,
            });
        }

        if (assigneeChanged && assigneeId) {
            const unreadCount = await prisma.notification.count({
                where: { userId: assigneeId, isRead: false },
            });
            io.to(`user_${assigneeId}`).emit('notification_count', unreadCount);
        }

        sendSuccess(res, 200, updatedTask, 'Task updated successfully');
    } catch (error) {
        if (handlePrismaError(error, res, 'Task')) return;
        sendError(res, 500, 'Error updating task');
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const task = await prisma.task.findUnique({
            where: { id },
            include: { project: true },
        });

        if (!task) return sendError(res, 404, 'Task not found');

        if (req.user!.role === 'PROJECT_MANAGER') {
            if (task.project.managerId !== req.user!.userId) {
                return sendError(res, 403, 'Not authorized to delete tasks in this project');
            }
        }

        await prisma.task.delete({ where: { id } });
        sendSuccess(res, 200, null, 'Task deleted successfully');
    } catch (error) {
        if (handlePrismaError(error, res, 'Task')) return;
        sendError(res, 500, 'Error deleting task');
    }
};
