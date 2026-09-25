import { Router } from 'express';
import { getProjects, createProject, updateProject, deleteProject } from '../controllers/project.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validate } from '../utils/validate';
import { createProjectSchema, updateProjectSchema } from '../utils/validation';

const router = Router();

router.use(requireAuth);

// All authenticated users can list projects (scoped in controller by role)
router.get('/', getProjects);

// Only ADMIN and PROJECT_MANAGER can create/update/delete projects
router.post('/', requireRole(['ADMIN', 'PROJECT_MANAGER']), validate(createProjectSchema), createProject);
router.put('/:id', requireRole(['ADMIN', 'PROJECT_MANAGER']), validate(updateProjectSchema), updateProject);
router.delete('/:id', requireRole(['ADMIN', 'PROJECT_MANAGER']), deleteProject);

export default router;
