import { Router } from 'express';
import { login, register, refresh, logout } from '../controllers/auth.controller';
import { validate } from '../utils/validate';
import { registerSchema, loginSchema } from '../utils/validation';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
