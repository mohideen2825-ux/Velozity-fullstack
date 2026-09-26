import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Render / Cloudflare reverse proxies (enables proper rate limiting & secure cookies)
app.set('trust proxy', 1);

// ── Request logging ───────────────────────────────────────────────────────────
app.use(morgan('dev'));

// ── Core middleware ───────────────────────────────────────────────────────────
const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : 'http://localhost:5173';
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, Postman, server-to-server)
        if (!origin) return callback(null, true);
        const originClean = origin.replace(/\/$/, '');
        if (originClean === clientUrl || originClean === 'http://localhost:5173' || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        return callback(new Error(`CORS error: Origin ${origin} not allowed`));
    },
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Stricter limit on auth endpoints (brute-force protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

// General API limit
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/client.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import activityRoutes from './routes/activity.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// ── /api/me — returns full user profile from DB ───────────────────────────────
import { requireAuth } from './middleware/auth.middleware';
import prisma from './config/prisma';

app.get('/api/me', requireAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
        });
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.json({ success: true, data: user });
    } catch {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── Socket.IO ─────────────────────────────────────────────────────────────────
import { createServer } from 'http';
import { initSocket } from './sockets';

const server = createServer(app);
initSocket(server);

// ── Background jobs ───────────────────────────────────────────────────────────
import { startOverdueJob } from './jobs/overdue.job';
startOverdueJob();

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});

export default app;
