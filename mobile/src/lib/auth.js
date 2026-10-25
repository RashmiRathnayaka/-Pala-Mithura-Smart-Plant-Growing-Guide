import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken, setUnauthorizedHandler } from './api';
import { secure } from './storage';
import { useI18n } from './i18n';

const TOKEN_KEY = 'pm_token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { setLang } = useI18n();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const clear = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await secure.remove(TOKEN_KEY);
  }, []);

  // Restore session on start.
  useEffect(() => {
    setUnauthorizedHandler(() => clear());
    (async () => {
      try {
        const token = await secure.get(TOKEN_KEY);
        if (token) {
          setAuthToken(token);
          const res = await api.get('/auth/me');
          setUser(res.user);
          if (res.user.language) setLang(res.user.language);
        }
      } catch {
        await clear();
      } finally {
        setReady(true);
      }
    })();
  }, [clear, setLang]);

  const applySession = useCallback(
    async ({ token, user: u }) => {
      setAuthToken(token);
      await secure.set(TOKEN_KEY, token);
      setUser(u);
      if (u.language) setLang(u.language);
      return u;
    },
    [setLang],
  );

  const login = useCallback(async (email, password) => applySession(await api.post('/auth/login', { email, password })), [applySession]);
  const register = useCallback(async (data) => applySession(await api.post('/auth/register', data)), [applySession]);
  const logout = useCallback(() => clear(), [clear]);

  const updateProfile = useCallback(async (patch) => {
    const res = await api.patch('/auth/me', patch);
    setUser(res.user);
    return res.user;
  }, []);

  const changePassword = useCallback(
    async (currentPassword, newPassword) => applySession(await api.patch('/auth/me/password', { currentPassword, newPassword })),
    [applySession],
  );

  const value = useMemo(
    () => ({ user, ready, login, register, logout, updateProfile, changePassword, setUser }),
    [user, ready, login, register, logout, updateProfile, changePassword],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export const homeForRole = (role) => (role === 'admin' ? '/admin' : role === 'instructor' ? '/instructor' : '/home');
