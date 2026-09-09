import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('wj_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // App boot session handshake: verify session cookie with backend
  useEffect(() => {
    let mounted = true;

    // Register global 401 handler for auto-logout
    setUnauthorizedHandler(() => {
      if (mounted) {
        setUser(null);
        localStorage.removeItem('wj_user');
      }
    });

    async function verifySession() {
      try {
        const data = await api.getMe();
        if (mounted && data?.user) {
          setUser(data.user);
          localStorage.setItem('wj_user', JSON.stringify(data.user));
        }
      } catch {
        // Session expired, revoked, or server restarted
        if (mounted) {
          setUser(null);
          localStorage.removeItem('wj_user');
        }
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    }

    verifySession();

    return () => {
      mounted = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      const u = data.user || { email };
      setUser(u);
      localStorage.setItem('wj_user', JSON.stringify(u));
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    try {
      const data = await api.register(name, email, password);
      const u = data.user || { name, email };
      setUser(u);
      localStorage.setItem('wj_user', JSON.stringify(u));
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setUser(null);
    localStorage.removeItem('wj_user');
  }, []);

  const value = { user, loading, initializing, login, register, logout, isAuthenticated: !!user };

  if (initializing) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page, #0d1117)',
        color: 'var(--text-secondary, #8b949e)',
        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        fontSize: '13px',
        letterSpacing: '0.05em'
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '2px solid var(--border, #30363d)',
          borderTopColor: 'var(--accent, #a3223f)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          marginRight: '12px'
        }} />
        <span>AUTHENTICATING…</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
