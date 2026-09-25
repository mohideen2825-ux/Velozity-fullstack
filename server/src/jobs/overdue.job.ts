import cron from 'node-cron';
import prisma from '../config/prisma';
import { getIO } from '../sockets';

export const startOverdueJob = () => {
    // Every minute for demo/dev; switch to '0 * * * *' (hourly) for production
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();

            // Find tasks that just became overdue
            const overdueTasks = await prisma.task.findMany({
                where: {
                    dueDate: { lt: now },
                    status: { not: 'DONE' },
                    isOverdue: false,
                },
                select: {
                    id: true,
                    title: true,
                    assigneeId: true,
                    projectId: true,
                    project: { select: { managerId: true } },
                },
            });

            if (overdueTasks.length === 0) return;

            // Mark all as overdue in bulk
            await prisma.task.updateMany({
                where: { id: { in: overdueTasks.map((t) => t.id) } },
                data: { isOverdue: true },
            });

            console.log(`[Cron] Marked ${overdueTasks.length} task(s) as overdue.`);

            // Create notifications and emit real-time events
            const io = getIO();

            for (const task of overdueTasks) {
                const recipients = new Set<string>();
                if (task.assigneeId) recipients.add(task.assigneeId);
                if (task.project.managerId) recipients.add(task.project.managerId);

                for (const userId of recipients) {
                    await prisma.notification.create({
                        data: {
                            userId,
                            message: `Task "${task.title}" is overdue.`,
                            type: 'OVERDUE',
                        },
                    });

                    const unreadCount = await prisma.notification.count({
                        where: { userId, isRead: false },
                    });

                    io.to(`user_${userId}`).emit('notification_count', unreadCount);
                }

                // Notify the project room as well
                io.to(`project_${task.projectId}`).emit('task_overdue', {
                    taskId: task.id,
                    taskTitle: task.title,
                    projectId: task.projectId,
                });
            }
        } catch (error) {
            console.error('[Cron] Error updating overdue tasks:', error);
        }
    });

    console.log('[Cron] Overdue task job scheduled.');
};
