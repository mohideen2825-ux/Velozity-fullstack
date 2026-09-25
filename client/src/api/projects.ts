import api from './axios';
import { Project } from '../types';

export const getProjectsApi = () =>
  api.get<{ success: boolean; data: Project[] }>('/projects');

export const createProjectApi = (data: {
  name: string;
  description?: string;
  clientId: string;
  managerId?: string;
}) => api.post<{ success: boolean; data: Project }>('/projects', data);

export const updateProjectApi = (id: string, data: Partial<{ name: string; description: string; managerId: string }>) =>
  api.put<{ success: boolean; data: Project }>(`/projects/${id}`, data);

export const deleteProjectApi = (id: string) =>
  api.delete(`/projects/${id}`);
