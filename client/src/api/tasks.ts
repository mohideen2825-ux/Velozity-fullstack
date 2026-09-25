import api from './axios';
import { Task, TaskStatus, Priority } from '../types';

export const getTasksApi = (filters?: { status?: TaskStatus; priority?: Priority; projectId?: string }) =>
  api.get<{ success: boolean; data: Task[] }>('/tasks', { params: filters });

export const createTaskApi = (data: {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate: string;
  projectId: string;
  assigneeId?: string;
}) => api.post<{ success: boolean; data: Task }>('/tasks', data);

export const updateTaskApi = (id: string, data: Partial<{
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  assigneeId: string | null;
}>) => api.put<{ success: boolean; data: Task }>(`/tasks/${id}`, data);

export const deleteTaskApi = (id: string) =>
  api.delete(`/tasks/${id}`);
