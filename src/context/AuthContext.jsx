// // src/context/AuthContext.jsx
// import { createContext, useContext, useState, useEffect, useCallback } from 'react';
// import { setAccessToken, setRefreshHandler } from '../api';

// const AuthContext = createContext(null);
// const API_URL = import.meta.env.VITE_API_URL ?? '';

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Renueva el access token con la cookie httpOnly. Devuelve true si hay sesión.
//   const refresh = useCallback(async () => {
//     try {
//       const res = await fetch(`${API_URL}/api/auth/refresh`, {
//         method: 'POST',
//         credentials: 'include',
//       });
//       if (!res.ok) throw new Error('Sin sesión');

//       const data = await res.json();
//       setAccessToken(data.accessToken); // token para api.js
//       setUser(data.user);
//       return true;
//     } catch {
//       setAccessToken(null);
//       setUser(null);
//       return false;
//     }
//   }, []);

//   // Al montar: registra el refresh para api.js y recupera la sesión
//   useEffect(() => {
//     setRefreshHandler(refresh);
//     refresh().finally(() => setLoading(false));
//   }, [refresh]);

//   async function login(email, password) {
//     const res = await fetch(`${API_URL}/api/auth/login`, {
//       method: 'POST',
//       credentials: 'include',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email, password }),
//     });
//     const data = await res.json().catch(() => ({}));
//     if (!res.ok) throw new Error(data.error || 'Credenciales inválidas');

//     setAccessToken(data.accessToken);
//     setUser(data.user);
//   }

//   async function logout() {
//     await fetch(`${API_URL}/api/auth/logout`, {
//       method: 'POST',
//       credentials: 'include',
//     }).catch(() => {});
//     setAccessToken(null);
//     setUser(null);
//   }

//   return (
//     <AuthContext.Provider value={{ user, login, logout, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => useContext(AuthContext);
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setAccessToken, setRefreshHandler } from '../api';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL ?? '';

const leer = (k) => {
  try { return JSON.parse(localStorage.getItem(k)); } catch { return null; }
};

function guardarSesion(data) {
  setAccessToken(data.accessToken);
  localStorage.setItem('USER', JSON.stringify(data.user));
  localStorage.setItem('USER_ID', String(data.user.id));
  localStorage.setItem('PRIVILEGIOS', JSON.stringify(data.privilegios ?? []));
}

function limpiarSesion() {
  setAccessToken(null);
  ['USER', 'USER_ID', 'PRIVILEGIOS'].forEach((k) => localStorage.removeItem(k));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => leer('USER'));
  const [privilegios, setPrivilegios] = useState(() => leer('PRIVILEGIOS') ?? []);
  const [loading, setLoading] = useState(true);

  const aplicar = (data) => {
    guardarSesion(data);
    setUser(data.user);
    setPrivilegios(data.privilegios ?? []);
  };

  const vaciar = () => {
    limpiarSesion();
    setUser(null);
    setPrivilegios([]);
  };

  // Renueva el access token con la cookie httpOnly y refresca los privilegios
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Sin sesión');
      aplicar(await res.json());
      return true;
    } catch {
      vaciar();
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    aplicar(data);
  }

  async function logout() {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    vaciar();
  }

  const tienePrivilegio = (code) => privilegios.some((p) => p.code === code);

  return (
    <AuthContext.Provider value={{ user, privilegios, tienePrivilegio, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);