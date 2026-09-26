import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { LogoIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon, ShieldCheckIcon } from '../components/ui/Icons';

const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/projects" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/projects');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Decorative ambient background glows */}
      <div className="auth-ambient auth-ambient-1" />
      <div className="auth-ambient auth-ambient-2" />

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand-badge">
            <LogoIcon size={38} />
          </div>
          <h1 className="auth-title">Velozity</h1>
          <p className="auth-subtitle">Enterprise Project & Team Intelligence</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Work Email</label>
            <div className="input-wrapper">
              <span className="input-icon"><MailIcon size={17} /></span>
              <input
                id="email"
                type="email"
                className="form-input with-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoFocus
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><LockIcon size={17} /></span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input with-icon with-action"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
              </button>
            </div>
          </div>

          <div className="auth-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="checkbox-input"
              />
              <span>Remember this device</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? (
              <span className="btn-loading-content">
                <span className="spinner spinner-sm" />
                <span>Authenticating…</span>
              </span>
            ) : (
              'Sign In to Workspace'
            )}
          </button>
        </form>

        <div className="auth-security-footer">
          <ShieldCheckIcon size={15} />
          <span>256-Bit SSL Encrypted Enterprise Session</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
