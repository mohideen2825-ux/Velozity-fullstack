import React, { useEffect, useState } from 'react';
import { getTasksApi, createTaskApi, updateTaskApi, deleteTaskApi } from '../api/tasks';
import { getProjectsApi } from '../api/projects';
import { Task, Project, TaskStatus, Priority } from '../types';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import { format, isPast } from 'date-fns';
import { getSocket } from '../hooks/useSocket';

const STATUSES: TaskStatus[] = ['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
  const [filterProject, setFilterProject] = useState('');

  const canManage = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  // Create form
  const [form, setForm] = useState({
    title: '', description: '', priority: 'MEDIUM' as Priority,
    dueDate: '', projectId: '', assigneeId: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await getTasksApi({
        ...(filterStatus && { status: filterStatus }),
        ...(filterPriority && { priority: filterPriority }),
        ...(filterProject && { projectId: filterProject }),
      });
      setTasks(res.data.data);
    } catch { toast.error('Failed to load tasks'); }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [tRes, pRes] = await Promise.all([
          getTasksApi(),
          getProjectsApi(),
        ]);
        setTasks(tRes.data.data);
        setProjects(pRes.data.data);
      } catch { toast.error('Failed to load data'); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    if (!loading) fetchTasks();
  }, [filterStatus, filterPriority, filterProject]);

  // Real-time: refresh tasks on activity events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => fetchTasks();
    socket.on('task_activity', handler);
    socket.on('task_overdue', handler);
    return () => {
      socket.off('task_activity', handler);
      socket.off('task_overdue', handler);
    };
  }, [loading]);

  // Join/leave project rooms
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    projects.forEach((p) => socket.emit('join_project', p.id));
    return () => projects.forEach((p) => socket.emit('leave_project', p.id));
  }, [projects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.dueDate || !form.projectId) return toast.error('Title, due date and project are required');
    setSaving(true);
    try {
      await createTaskApi({ ...form, assigneeId: form.assigneeId || undefined });
      toast.success('Task created!');
      setShowCreateModal(false);
      setForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', projectId: '', assigneeId: '' });
      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    try {
      await updateTaskApi(task.id, { status });
      toast.success('Status updated');
      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTaskApi(id);
      toast.success('Task deleted');
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Tasks</h1>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select className="form-input filter-select" value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TaskStatus | '')}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="form-input filter-select" value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as Priority | '')}>
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="form-input filter-select" value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(filterStatus || filterPriority || filterProject) && (
          <button className="btn btn-ghost btn-sm"
            onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterProject(''); }}>
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="center"><Spinner /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <p>No tasks found.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table" aria-label="Tasks table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Assignee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const overdue = task.isOverdue || (!task.isOverdue && isPast(new Date(task.dueDate)) && task.status !== 'DONE');
                return (
                  <tr key={task.id} className={overdue ? 'row-overdue' : ''}>
                    <td>
                      <div className="task-title">
                        {task.title}
                        {overdue && <span className="overdue-chip" title="Overdue">⚠️</span>}
                      </div>
                      {task.description && <div className="task-desc">{task.description}</div>}
                    </td>
                    <td className="text-sm">{task.project?.name}</td>
                    <td>
                      {user?.role === 'DEVELOPER' ? (
                        <select
                          className="form-input status-select"
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                          aria-label={`Status for ${task.title}`}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      ) : (
                        <select
                          className="form-input status-select"
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                          aria-label={`Status for ${task.title}`}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      )}
                    </td>
                    <td><PriorityBadge priority={task.priority} /></td>
                    <td className={`text-sm ${overdue ? 'text-danger' : ''}`}>
                      {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </td>
                    <td className="text-sm">{task.assignee?.name ?? <span className="text-muted">Unassigned</span>}</td>
                    <td>
                      {canManage && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(task.id)}
                          aria-label={`Delete task ${task.title}`}
                        >
                          🗑
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <Modal title="New Task" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreate} className="modal-form">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Task title" required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={2} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional details" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <input type="date" className="form-input" value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Project *</label>
              <select className="form-input" value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })} required>
                <option value="">Select a project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating…' : 'Create Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TasksPage;
