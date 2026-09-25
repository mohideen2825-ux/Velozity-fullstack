import { Router } from 'express';
import { getDashboardStats, createUser, getUsers, deleteUser } from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validate } from '../utils/validate';
import { createUserSchema } from '../utils/validation';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['ADMIN']));

router.get('/stats', getDashboardStats);

// User management — only admins can create users with any role
router.get('/users', getUsers);
router.post('/users', validate(createUserSchema), createUser);
router.delete('/users/:id', deleteUser);

export default router;
