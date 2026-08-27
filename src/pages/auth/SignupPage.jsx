import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Wrench, 
  Building2, 
  Globe, 
  Phone, 
  MapPin, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 
  'Netherlands', 'Australia', 'New Zealand', 'India', 'United Arab Emirates', 'Saudi Arabia', 
  'Qatar', 'Kuwait', 'South Africa', 'Nigeria', 'Kenya', 'Egypt', 'Brazil', 'Mexico', 
  'Argentina', 'Chile', 'Singapore', 'Malaysia', 'Indonesia', 'Thailand', 'Vietnam', 
  'Japan', 'South Korea', 'Turkey', 'Poland', 'Sweden', 'Norway', 'Denmark'
];

export const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customerName: '',
    businessName: '',
    country: 'United States',
    phoneNumber: '',
    address: '',
    username: '',
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = () => {
    const p = formData.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score += 25;
    if (p.length >= 10) score += 25;
    if (/[A-Z]/.test(p)) score += 25;
    if (/[0-9!@#$%^&*]/.test(p)) score += 25;
    return score;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await signup(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/order-creator');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div
      style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem',
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              backgroundColor: '#1E293B',
              border: '1px solid var(--accent-amber)',
              borderRadius: 'var(--radius-lg)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
              marginBottom: '0.75rem',
            }}
          >
            <Wrench size={26} color="#F59E0B" />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#FFFFFF', marginBottom: '0.25rem' }}>
            Register Importer / Business Account
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Connect directly with H.A. Overseas factory export desk & access custom order configurators
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#F87171',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.85rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34D399',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.9rem',
            }}
          >
            <CheckCircle2 size={20} />
            <span>Account created successfully! Redirecting to Order Creator...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Business & Contact Information */}
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--accent-amber)',
              letterSpacing: '0.05em',
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.4rem',
            }}
          >
            1. Business & Contact Information
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Customer / Contact Person Name *</label>
              <input
                type="text"
                name="customerName"
                required
                className="form-control"
                placeholder="e.g. Johnathan Smith"
                value={formData.customerName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business / Firm / Company Name *</label>
              <input
                type="text"
                name="businessName"
                required
                className="form-control"
                placeholder="e.g. Apex Industrial Supplies LLC"
                value={formData.businessName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Country / Export Destination *</label>
              <select
                name="country"
                required
                className="form-control form-select"
                value={formData.country}
                onChange={handleChange}
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c} style={{ background: '#131B2A' }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phone / WhatsApp Number *</label>
              <input
                type="tel"
                name="phoneNumber"
                required
                className="form-control"
                placeholder="e.g. +1 (555) 349-2910"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Complete Business / Factory / Delivery Address *</label>
            <textarea
              name="address"
              required
              rows={2}
              className="form-control"
              placeholder="e.g. Suite 400, Industrial Parkway, Houston, TX 77001, USA"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          {/* Section 2: Account Security */}
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--accent-amber)',
              letterSpacing: '0.05em',
              marginTop: '1.5rem',
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.4rem',
            }}
          >
            2. Portal Login Credentials
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Desired Username *</label>
              <input
                type="text"
                name="username"
                required
                minLength={3}
                className="form-control"
                placeholder="e.g. apex_tools"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Official Email Address *</label>
              <input
                type="email"
                name="email"
                required
                className="form-control"
                placeholder="buyer@company.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Create Password *</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                minLength={6}
                className="form-control"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password strength bar */}
            {formData.password && (
              <div style={{ marginTop: '0.5rem' }}>
                <div
                  style={{
                    height: '4px',
                    width: '100%',
                    backgroundColor: '#1E293B',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${strength}%`,
                      backgroundColor:
                        strength <= 25 ? '#EF4444' : strength <= 50 ? '#F59E0B' : strength <= 75 ? '#38BDF8' : '#10B981',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '3px' }}>
                  Strength: {strength <= 25 ? 'Weak' : strength <= 50 ? 'Medium' : strength <= 75 ? 'Good' : 'Strong & Secure'}
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? 'Creating Business Account...' : 'Complete Registration & Open Order Creator'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
