import { z } from 'zod';

// ── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required').max(100),
    // Public registration is DEVELOPER only; ADMIN/PM creation is done by an admin
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

// ── Client ───────────────────────────────────────────────────────────────────

export const createClientSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    company: z.string().min(1, 'Company is required').max(100),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
});

export const updateClientSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    company: z.string().min(1).max(100).optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
});

// ── Project ──────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
    name: z.string().min(1, 'Name is required').max(150),
    description: z.string().max(500).optional(),
    clientId: z.string().uuid('Invalid client ID'),
    managerId: z.string().uuid('Invalid manager ID').optional(),
});

export const updateProjectSchema = z.object({
    name: z.string().min(1).max(150).optional(),
    description: z.string().max(500).optional(),
    managerId: z.string().uuid('Invalid manager ID').optional(),
});

// ── Task ─────────────────────────────────────────────────────────────────────

const taskStatusValues = ['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
const priorityValues = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(1000).optional(),
    priority: z.enum(priorityValues).optional(),
    dueDate: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
    projectId: z.string().uuid('Invalid project ID'),
    assigneeId: z.string().uuid('Invalid assignee ID').optional().nullable(),
});

export const updateTaskSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    status: z.enum(taskStatusValues).optional(),
    priority: z.enum(priorityValues).optional(),
    dueDate: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }).optional(),
    assigneeId: z.string().uuid('Invalid assignee ID').optional().nullable(),
});

// ── Admin user creation ───────────────────────────────────────────────────────

export const createUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required').max(100),
    role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']),
});
