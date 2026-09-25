import api from './axios';
import { Client } from '../types';

export const getClientsApi = () =>
  api.get<{ success: boolean; data: Client[] }>('/clients');

export const createClientApi = (data: { name: string; company: string; email?: string }) =>
  api.post<{ success: boolean; data: Client }>('/clients', data);

export const deleteClientApi = (id: string) =>
  api.delete(`/clients/${id}`);
