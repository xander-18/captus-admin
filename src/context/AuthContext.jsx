// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setAccessToken, setRefreshHandler } from '../api';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL ?? '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Renueva el access token con la cookie httpOnly. Devuelve true si hay sesión.
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Sin sesión');

      const data = await res.json();
      setAccessToken(data.accessToken); // token para api.js
      setUser(data.user);
      return true;
    } catch {
      setAccessToken(null);
      setUser(null);
      return false;
    }
  }, []);

  // Al montar: registra el refresh para api.js y recupera la sesión
  useEffect(() => {
    setRefreshHandler(refresh);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  async function login(email, password) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Credenciales inválidas');

    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function logout() {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);