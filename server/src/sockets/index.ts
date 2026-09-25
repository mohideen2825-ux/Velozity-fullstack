import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../utils/jwt';

let io: SocketIOServer;
const activeUserIds = new Set<string>();

export const initSocket = (server: HttpServer) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true,
        },
    });

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                return next(new Error('Authentication error'));
            }
            const decoded = verifyAccessToken(token);
            socket.data.user = decoded; // { userId, role }
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.data.user.userId;
        console.log(`User connected: ${userId} (Role: ${socket.data.user.role})`);

        activeUserIds.add(userId);

        // Automatically join personal room for private notifications
        socket.join(`user_${userId}`);

        // Join a project room to listen for activities in a specific project
        socket.on('join_project', (projectId: string) => {
            socket.join(`project_${projectId}`);
        });

        socket.on('leave_project', (projectId: string) => {
            socket.leave(`project_${projectId}`);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${userId}`);
            activeUserIds.delete(userId);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

export const getOnlineUserCount = () => {
    return activeUserIds.size;
};
