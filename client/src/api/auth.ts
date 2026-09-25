import api from './axios';
import { User } from '../types';

export const loginApi = (email: string, password: string) =>
  api.post<{ success: boolean; accessToken: string; data: User }>('/auth/login', { email, password });

export const registerApi = (name: string, email: string, password: string) =>
  api.post('/auth/register', { name, email, password });

export const logoutApi = () => api.post('/auth/logout');

export const getMeApi = () => api.get<{ success: boolean; data: User }>('/me');
