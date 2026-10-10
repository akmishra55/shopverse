
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // Restore the session on first load: access token → /me, else try refresh
  useEffect(() => {
    (async () => {
      try {
        if (localStorage.getItem('sv_access')) {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
        } else {
          const { data } = await api.post('/auth/refresh');
          localStorage.setItem('sv_access', data.accessToken);
          setUser(data.user);
        }
      } catch { /* not logged in — fine */ }
      setBooting(false);
    })();
  }, []);

  const saveAuth = (data) => {
    localStorage.setItem('sv_access', data.accessToken);
    setUser(data.user);
  };

  const login = async (email, password) => saveAuth((await api.post('/auth/login', { email, password })).data);
  const register = async (name, email, password) => saveAuth((await api.post('/auth/register', { name, email, password })).data);

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('sv_access');
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, booting, login, register, logout, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}
