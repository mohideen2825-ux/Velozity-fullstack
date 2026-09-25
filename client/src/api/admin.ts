import api from './axios';
import { DashboardStats, User, Role } from '../types';

export const getStatsApi = () =>
  api.get<{ success: boolean; data: DashboardStats }>('/admin/stats');

export const getUsersApi = () =>
  api.get<{ success: boolean; data: User[] }>('/admin/users');

export const createUserApi = (data: { name: string; email: string; password: string; role: Role }) =>
  api.post<{ success: boolean; data: User }>('/admin/users', data);

export const deleteUserApi = (id: string) =>
  api.delete(`/admin/users/${id}`);
