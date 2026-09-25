import { Router } from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/task.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validate } from '../utils/validate';
import { createTaskSchema, updateTaskSchema } from '../utils/validation';

const router = Router();

router.use(requireAuth);

// Everyone authenticated can GET and PUT tasks (scoping handled in controller)
router.get('/', getTasks);
router.put('/:id', validate(updateTaskSchema), updateTask);

// Only ADMIN and PM can create or delete tasks
router.post('/', requireRole(['ADMIN', 'PROJECT_MANAGER']), validate(createTaskSchema), createTask);
router.delete('/:id', requireRole(['ADMIN', 'PROJECT_MANAGER']), deleteTask);

export default router;
