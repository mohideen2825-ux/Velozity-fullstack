import { Router } from 'express';
import { getClients, createClient, updateClient, deleteClient } from '../controllers/client.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validate } from '../utils/validate';
import { createClientSchema, updateClientSchema } from '../utils/validation';

const router = Router();

// All client routes are ADMIN-only
router.use(requireAuth);
router.use(requireRole(['ADMIN']));

router.get('/', getClients);
router.post('/', validate(createClientSchema), createClient);
router.put('/:id', validate(updateClientSchema), updateClient);
router.delete('/:id', deleteClient);

export default router;
