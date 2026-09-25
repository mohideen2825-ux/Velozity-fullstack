import React, { useEffect, useState } from 'react';
import { getClientsApi, createClientApi, deleteClientApi } from '../api/clients';
import { Client } from '../types';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await getClientsApi();
      setClients(res.data.data);
    } catch { toast.error('Failed to load clients'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.company) return toast.error('Name and company are required');
    setSaving(true);
    try {
      await createClientApi(form);
      toast.success('Client created!');
      setShowModal(false);
      setForm({ name: '', company: '', email: '' });
      fetchClients();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create client');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this client? All their projects and tasks will also be deleted.')) return;
    setDeleting(id);
    try {
      await deleteClientApi(id);
      toast.success('Client deleted');
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete client');
    } finally { setDeleting(null); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Client</button>
      </div>

      {loading ? (
        <div className="center"><Spinner /></div>
      ) : clients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <p>No clients yet.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add first client</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table" aria-label="Clients table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Projects</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.company}</td>
                  <td>{c.email || <span className="text-muted">—</span>}</td>
                  <td>{c._count?.projects ?? 0}</td>
                  <td className="text-sm">{format(new Date(c.createdAt), 'MMM d, yyyy')}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(c.id)}
                      disabled={deleting === c.id}
                      aria-label={`Delete client ${c.name}`}
                    >
                      {deleting === c.id ? '…' : '🗑'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="New Client" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="modal-form">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Client name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Company *</label>
              <input className="form-input" value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Company name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@company.com" />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating…' : 'Create Client'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ClientsPage;
