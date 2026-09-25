import api from './axios';
import { TaskActivity } from '../types';

export const getActivityApi = () =>
  api.get<{ success: boolean; data: TaskActivity[] }>('/activity');
