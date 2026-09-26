import { Role } from './models';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: Role;
            };
        }
    }
}
