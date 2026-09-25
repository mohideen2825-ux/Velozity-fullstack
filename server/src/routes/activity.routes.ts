import { Router } from 'express';
import { getRecentActivity } from '../controllers/activity.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', getRecentActivity);

export default router;
