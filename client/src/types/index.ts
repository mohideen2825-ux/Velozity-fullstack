export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';
export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email?: string;
  createdAt: string;
  _count?: { projects: number };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  managerId: string;
  createdAt: string;
  client: Client;
  manager: { id: string; name: string; email: string };
  _count: { tasks: number };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  isOverdue: boolean;
  projectId: string;
  assigneeId?: string;
  createdAt: string;
  project: { name: string; managerId: string };
  assignee?: { id: string; name: string };
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  previousStatus?: TaskStatus;
  newStatus: TaskStatus;
  timestamp: string;
  task: { id: string; title: string; projectId: string };
  user: { id: string; name: string };
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  tasksByStatus: Record<TaskStatus, number>;
  overdueTasks: number;
  activeOnlineUsers: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
