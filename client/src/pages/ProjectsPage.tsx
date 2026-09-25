import React, { useEffect, useState } from 'react';
import { getProjectsApi, createProjectApi, deleteProjectApi } from '../api/projects';
import { getClientsApi } from '../api/clients';
import { Project, Client } from '../types';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({ name: '', description: '', clientId: '' });
  const [saving, setSaving] = useState(false);

  const canManage = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        getProjectsApi(),
        user?.role === 'ADMIN' ? getClientsApi() : Promise.resolve(null),
      ]);
      setProjects(pRes.data.data);
      if (cRes) setClients(cRes.data.data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.clientId) return toast.error('Name and client are required');
    setSaving(true);
    try {
      await createProjectApi(form);
      toast.success('Project created!');
      setShowModal(false);
      setForm({ name: '', description: '', clientId: '' });
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this project? All tasks will also be deleted.')) return;
    setDeleting(id);
    try {
      await deleteProjectApi(id);
      toast.success('Project deleted');
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="center"><Spinner /></div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <p>No projects yet.</p>
          {canManage && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create your first project</button>
          )}
        </div>
      ) : (
        <div className="card-grid">
          {projects.map((p) => (
            <div key={p.id} className="card">
              <div className="card-header">
                <h3 className="card-title">{p.name}</h3>
                {canManage && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                    aria-label={`Delete project ${p.name}`}
                  >
                    {deleting === p.id ? '…' : '🗑'}
                  </button>
                )}
              </div>
              {p.description && <p className="card-desc">{p.description}</p>}
              <div className="card-meta">
                <span>🏢 {p.client?.name}</span>
                <span>👤 {p.manager?.name}</span>
                <span>✅ {p._count?.tasks} task{p._count?.tasks !== 1 ? 's' : ''}</span>
              </div>
              <div className="card-footer">
                <span className="text-muted text-sm">Created {format(new Date(p.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="New Project" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="modal-form">
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Website Redesign"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Optional description"
              />
            </div>
            {user?.role === 'ADMIN' && (
              <div className="form-group">
                <label className="form-label">Client *</label>
                <select
                  className="form-input"
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} – {c.company}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating…' : 'Create Project'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ProjectsPage;
