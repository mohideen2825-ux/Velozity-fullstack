import React from 'react';
import { TaskStatus, Priority } from '../../types';

const statusColors: Record<TaskStatus, string> = {
  TO_DO: 'badge-neutral',
  IN_PROGRESS: 'badge-blue',
  IN_REVIEW: 'badge-yellow',
  DONE: 'badge-green',
};

const priorityColors: Record<Priority, string> = {
  LOW: 'badge-green',
  MEDIUM: 'badge-yellow',
  HIGH: 'badge-orange',
  CRITICAL: 'badge-red',
};

const statusLabels: Record<TaskStatus, string> = {
  TO_DO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

export const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => (
  <span className={`badge ${statusColors[status]}`}>{statusLabels[status]}</span>
);

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => (
  <span className={`badge ${priorityColors[priority]}`}>{priority}</span>
);
