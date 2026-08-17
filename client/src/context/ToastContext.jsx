import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', title = '', duration = 4000) => {
    const toastId = ++id;
    const defaults = {
      success: { title: 'Success', icon: '✓' },
      error:   { title: 'Error',   icon: '✕' },
      warning: { title: 'Warning', icon: '⚠' },
      info:    { title: 'Info',    icon: 'ℹ' },
    };
    setToasts(prev => [...prev, {
      id: toastId,
      message,
      type,
      title: title || defaults[type]?.title || '',
      icon: defaults[type]?.icon || 'ℹ',
      duration,
      exiting: false,
    }]);
    setTimeout(() => dismiss(toastId), duration);
  }, []);

  const dismiss = useCallback((toastId) => {
    setToasts(prev => prev.map(t => t.id === toastId ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 220);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastList toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastList({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}${t.exiting ? ' exiting' : ''}`}>
          <span className="toast-icon">{t.icon}</span>
          <div className="toast-body">
            {t.title && <div className="toast-title">{t.title}</div>}
            <div className="toast-message">{t.message}</div>
          </div>
          <button className="toast-close" onClick={() => onDismiss(t.id)}>×</button>
          <div className="toast-progress" style={{ animationDuration: `${t.duration}ms` }} />
        </div>
      ))}
    </div>
  );
}

export const useToast = () => useContext(ToastContext);
