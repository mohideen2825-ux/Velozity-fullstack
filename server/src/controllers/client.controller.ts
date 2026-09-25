import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendError, sendSuccess } from '../utils/response';
import { handlePrismaError } from '../utils/prismaErrors';

export const getClients = async (req: Request, res: Response) => {
    try {
        const clients = await prisma.client.findMany({
            include: {
                _count: { select: { projects: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        sendSuccess(res, 200, clients, 'Clients fetched successfully');
    } catch (error) {
        sendError(res, 500, 'Error fetching clients');
    }
};

export const createClient = async (req: Request, res: Response) => {
    try {
        const { name, company, email } = req.body; // validated by Zod middleware

        const client = await prisma.client.create({
            data: { name, company, email: email || null },
        });
        sendSuccess(res, 201, client, 'Client created successfully');
    } catch (error) {
        if (handlePrismaError(error, res, 'Client')) return;
        sendError(res, 500, 'Error creating client');
    }
};

export const updateClient = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, company, email } = req.body;

        const client = await prisma.client.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(company !== undefined && { company }),
                ...(email !== undefined && { email: email || null }),
            },
        });
        sendSuccess(res, 200, client, 'Client updated successfully');
    } catch (error) {
        if (handlePrismaError(error, res, 'Client')) return;
        sendError(res, 500, 'Error updating client');
    }
};

export const deleteClient = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check existence before delete so we can return 404 cleanly
        const existing = await prisma.client.findUnique({ where: { id } });
        if (!existing) return sendError(res, 404, 'Client not found');

        await prisma.client.delete({ where: { id } });
        sendSuccess(res, 200, null, 'Client deleted successfully');
    } catch (error) {
        if (handlePrismaError(error, res, 'Client')) return;
        sendError(res, 500, 'Error deleting client');
    }
};
