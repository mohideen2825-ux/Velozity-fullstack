import React, { useEffect, useState } from 'react';
import { getUsersApi, createUserApi, deleteUserApi } from '../api/admin';
import { User, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ROLES: Role[] = ['DEVELOPER', 'PROJECT_MANAGER', 'ADMIN'];

const UsersPage: React.FC = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'DEVELOPER' as Role });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsersApi();
      setUsers(res.data.data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('All fields are required');
    setSaving(true);
    try {
      await createUserApi(form);
      toast.success('User created!');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'DEVELOPER' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this user?')) return;
    setDeleting(id);
    try {
      await deleteUserApi(id);
      toast.success('User deleted');
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally { setDeleting(null); }
  };

  const roleBadgeClass: Record<Role, string> = {
    ADMIN: 'badge-red',
    PROJECT_MANAGER: 'badge-blue',
    DEVELOPER: 'badge-green',
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New User</button>
      </div>

      {loading ? (
        <div className="center"><Spinner /></div>
      ) : (
        <div className="table-wrapper">
          <table className="table" aria-label="Users table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={u.id === me?.id ? 'row-highlight' : ''}>
                  <td className="font-medium">
                    {u.name} {u.id === me?.id && <span className="text-muted text-sm">(you)</span>}
                  </td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${roleBadgeClass[u.role]}`}>{u.role.replace('_', ' ')}</span></td>
                  <td className="text-sm">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                  <td>
                    {u.id !== me?.id && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(u.id)}
                        disabled={deleting === u.id}
                        aria-label={`Delete user ${u.name}`}
                      >
                        {deleting === u.id ? '…' : '🗑'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="New User" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="modal-form">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Doe" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="password" className="form-input" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 characters" required />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-input" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UsersPage;
