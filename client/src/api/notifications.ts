import api from './axios';
import { Notification } from '../types';

export const getNotificationsApi = () =>
  api.get<{ success: boolean; data: { notifications: Notification[]; unreadCount: number } }>('/notifications');

export const markAsReadApi = (id: string) =>
  api.put(`/notifications/${id}/read`);

export const markAllAsReadApi = () =>
  api.put('/notifications/mark-all-read');
