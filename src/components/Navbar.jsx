import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { 
  Wrench, 
  ShoppingCart, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  Package, 
  Layers,
  FileText
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totals } = useOrder();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(9, 13, 22, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid var(--accent-amber)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '3px',
              boxShadow: '0 0 15px rgba(245, 158, 11, 0.25)',
            }}
          >
            <img src="/logo.jpg" alt="H.A. Overseas" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em', fontFamily: 'var(--font-heading)' }}>
                H.A. OVERSEAS
              </span>
              <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>EXPORT</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', letterSpacing: '0.02em' }}>
              Hand Tools & Grease Guns Manufacturer
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link
            to="/catalog"
            className="btn btn-secondary btn-sm"
            style={{
              borderColor: isActive('/catalog') ? 'var(--accent-amber)' : 'transparent',
              color: isActive('/catalog') ? '#FFFFFF' : 'var(--text-secondary)',
            }}
          >
            <Layers size={16} />
            <span>Tools Catalog</span>
          </Link>

          <Link
            to="/order-creator"
            className="btn btn-secondary btn-sm"
            style={{
              borderColor: isActive('/order-creator') ? 'var(--accent-amber)' : 'var(--border-subtle)',
              background: isActive('/order-creator') ? 'rgba(245, 158, 11, 0.15)' : '#1E293B',
              color: '#FFFFFF',
              position: 'relative',
            }}
          >
            <ShoppingCart size={16} color="#F59E0B" />
            <span>Order Creator</span>
            {totals.totalQuantity > 0 && (
              <span
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#090D16',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  padding: '1px 6px',
                  marginLeft: '4px',
                }}
              >
                {totals.totalQuantity} pcs
              </span>
            )}
          </Link>

          {isAuthenticated && (
            <Link
              to="/my-orders"
              className="btn btn-secondary btn-sm"
              style={{
                borderColor: isActive('/my-orders') ? 'var(--accent-amber)' : 'transparent',
                color: isActive('/my-orders') ? '#FFFFFF' : 'var(--text-secondary)',
              }}
            >
              <Package size={16} />
              <span>My Orders</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className="btn btn-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#F87171',
                border: '1px solid rgba(239, 68, 68, 0.4)',
              }}
            >
              <ShieldCheck size={16} />
              <span>Admin Hub</span>
            </Link>
          )}
        </nav>

        {/* User Account Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF' }}>
                  {user.customerName || user.username}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {user.businessName || user.country}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="btn btn-secondary btn-sm"
                title="Log out"
                style={{ padding: '0.4rem 0.6rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
