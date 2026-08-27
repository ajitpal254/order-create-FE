import React, { useState } from 'react';
import { Modal } from '../../components/Modal';
import { authApi } from '../../api/client';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.message);
      if (res.debugResetToken) {
        setResetToken(res.debugResetToken);
      }
    } catch (err) {
      setError(err.message || 'Failed to request reset instructions.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await authApi.resetPassword({
        token: resetToken,
        newPassword,
      });
      setResetSuccess(true);
      setMessage(res.message);
    } catch (err) {
      setError(err.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Password — H.A. Overseas">
      {!resetToken ? (
        <form onSubmit={handleRequest}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Enter your registered business email. We'll generate security credentials to reset your access.
          </p>

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#F87171',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Registered Business Email</label>
            <div className="password-input-wrapper">
              <input
                type="email"
                required
                className="form-control"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? 'Verifying...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      ) : resetSuccess ? (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 1rem' }} />
          <h4 style={{ color: '#FFFFFF', marginBottom: '0.5rem' }}>Password Updated!</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Your password has been successfully reset. You may now sign in.
          </p>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Proceed to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleReset}>
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34D399',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              fontSize: '0.85rem',
            }}
          >
            Verification token authorized for <b>{email}</b>. Enter your new password below:
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#F87171',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.85rem',
              }}
            >
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">New Password (Min 6 chars)</label>
            <input
              type="password"
              required
              minLength={6}
              className="form-control"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
