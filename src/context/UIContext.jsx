import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [activeThemeAccent, setActiveThemeAccent] = useState('amber'); // 'amber' | 'blue' | 'emerald'

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = Date.now() + Math.random().toString(36).substr(2, 4);
      const newToast = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const formatMoney = useCallback((amount, currency = 'USD') => {
    const num = Number(amount) || 0;
    const symbols = {
      CAD: '$',
      USD: '$',
      INR: '₹',
      EUR: '€',
      GBP: '£',
      AUD: '$',
    };
    const sym = symbols[currency] || '$';
    return `${sym}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  }, []);

  return (
    <UIContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        activeThemeAccent,
        setActiveThemeAccent,
        formatMoney,
      }}
    >
      {children}
      {/* Global Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 9999,
          pointerEvents: 'none',
          maxWidth: '420px',
        }}
      >
        {toasts.map((toast) => {
          const typeStyles = {
            success: {
              bg: 'rgba(16, 185, 129, 0.18)',
              border: 'rgba(16, 185, 129, 0.45)',
              text: 'var(--accent-emerald)',
              icon: <CheckCircle2 size={18} />,
            },
            error: {
              bg: 'rgba(244, 63, 94, 0.18)',
              border: 'rgba(244, 63, 94, 0.45)',
              text: 'var(--accent-rose)',
              icon: <AlertCircle size={18} />,
            },
            warning: {
              bg: 'rgba(245, 158, 11, 0.18)',
              border: 'rgba(245, 158, 11, 0.45)',
              text: 'var(--accent-amber)',
              icon: <AlertTriangle size={18} />,
            },
            info: {
              bg: 'rgba(56, 189, 248, 0.18)',
              border: 'rgba(56, 189, 248, 0.45)',
              text: 'var(--accent-blue)',
              icon: <Info size={18} />,
            },
          };
          const style = typeStyles[toast.type] || typeStyles.info;

          return (
            <div
              key={toast.id}
              className="glass-card"
              style={{
                pointerEvents: 'auto',
                padding: '0.85rem 1.15rem',
                backgroundColor: '#0F172A',
                border: `1px solid ${style.border}`,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0,0,0,0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                animation: 'slideInToast 200ms ease-out',
                color: '#FFFFFF',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ color: style.text, display: 'flex', alignItems: 'center' }}>{style.icon}</div>
              <div style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
