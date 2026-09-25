import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendError, sendSuccess } from '../utils/response';
import { handlePrismaError } from '../utils/prismaErrors';

export const getProjects = async (req: Request, res: Response) => {
    try {
        const userRole = req.user!.role;
        const userId = req.user!.userId;

        let whereClause = {};
        if (userRole === 'PROJECT_MANAGER') {
            whereClause = { managerId: userId };
        } else if (userRole === 'DEVELOPER') {
            // Developers can see projects where they have at least one assigned task
            whereClause = { tasks: { some: { assigneeId: userId } } };
        }
        // ADMIN sees all

        const projects = await prisma.project.findMany({
            where: whereClause,
            include: {
                client: true,
                manager: { select: { id: true, name: true, email: true } },
                _count: { select: { tasks: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        sendSuccess(res, 200, projects, 'Projects fetched successfully');
    } catch (error) {
        sendError(res, 500, 'Error fetching projects');
    }
};

export const createProject = async (req: Request, res: Response) => {
    try {
        const { name, description, clientId, managerId } = req.body;

        // PMs are always set as manager of their own created projects
        const assignedManagerId =
            req.user!.role === 'PROJECT_MANAGER' ? req.user!.userId : managerId;

        if (!assignedManagerId) {
            return sendError(res, 400, 'managerId is required');
        }

        const project = await prisma.project.create({
            data: { name, description, clientId, managerId: assignedManagerId },
        });
        sendSuccess(res, 201, project, 'Project created successfully');
    } catch (error) {
        if (handlePrismaError(error, res, 'Project')) return;
        sendError(res, 500, 'Error creating project');
    }
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, managerId } = req.body;

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return sendError(res, 404, 'Project not found');

        if (req.user!.role === 'PROJECT_MANAGER' && project.managerId !== req.user!.userId) {
            return sendError(res, 403, 'Not authorized to edit this project');
        }

        const updatedProject = await prisma.project.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(managerId !== undefined && req.user!.role === 'ADMIN' && { managerId }),
            },
        });

        sendSuccess(res, 200, updatedProject, 'Project updated successfully');
    } catch (error) {
        if (handlePrismaError(error, res, 'Project')) return;
        sendError(res, 500, 'Error updating project');
    }
};

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return sendError(res, 404, 'Project not found');

        if (req.user!.role === 'PROJECT_MANAGER' && project.managerId !== req.user!.userId) {
            return sendError(res, 403, 'Not authorized to delete this project');
        }

        await prisma.project.delete({ where: { id } });
        sendSuccess(res, 200, null, 'Project deleted successfully');
    } catch (error) {
        if (handlePrismaError(error, res, 'Project')) return;
        sendError(res, 500, 'Error deleting project');
    }
};
