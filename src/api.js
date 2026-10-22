// src/api.js
const API_URL = import.meta.env.VITE_API_URL || '??';

// Token de acceso en memoria, lo gestiona AuthContext
let accessToken = null;
// Función que renueva la sesión (la define AuthContext)
let refreshHandler = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function setRefreshHandler(fn) {
  refreshHandler = fn;
}

export async function apiFetch(path, opts = {}, retry = true) {
  const headers = {
    ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...opts.headers,
  };

  const res = await fetch(API_URL + path, {
    ...opts,
    headers,
    credentials: 'include',
  });

  // Access token vencido: renovar una vez y repetir la petición
  if (res.status === 401 && retry && refreshHandler) {
    const ok = await refreshHandler();
    if (ok) return apiFetch(path, opts, false);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error ' + res.status }));
    const error = new Error(err.error || 'Error');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

// Ventas
export const getVentas     = (desde, hasta) => apiFetch(`/api/ventas?desde=${desde}&hasta=${hasta}`);
export const postVenta     = (data)         => apiFetch('/api/ventas', { method: 'POST', body: JSON.stringify(data) });
export const putVenta      = (id, data)     => apiFetch(`/api/ventas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteVenta   = (id)           => apiFetch(`/api/ventas/${id}`, { method: 'DELETE' });
export const getMeta       = ()             => apiFetch('/api/meta');
export const putMeta       = (meta)         => apiFetch('/api/meta', { method: 'PUT', body: JSON.stringify({ meta }) });

// Clientes
export const getClientes   = ()         => apiFetch('/api/clientes');
export const postCliente   = (data)     => apiFetch('/api/clientes', { method: 'POST', body: JSON.stringify(data) });
export const putCliente    = (id, data) => apiFetch(`/api/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCliente = (id)       => apiFetch(`/api/clientes/${id}`, { method: 'DELETE' });

// Egresos
export const getEgresosResumen = (desde, hasta, proyecto) => {
  const q = proyecto && proyecto !== '__todos__' ? `&proyecto=${encodeURIComponent(proyecto)}` : '';
  return apiFetch(`/api/egresos/resumen?desde=${desde}&hasta=${hasta}${q}`);
};
export const getEgresos   = (desde, hasta, proyecto) => {
  const q = proyecto && proyecto !== '__todos__' ? `&proyecto=${encodeURIComponent(proyecto)}` : '';
  return apiFetch(`/api/egresos?desde=${desde}&hasta=${hasta}${q}`);
};
export const getBalance   = (desde, hasta) => apiFetch(`/api/balance?desde=${desde}&hasta=${hasta}`);
export const postEgreso   = (data)         => apiFetch('/api/egresos', { method: 'POST', body: JSON.stringify(data) });
export const putEgreso    = (id, data)     => apiFetch(`/api/egresos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEgreso = (id)           => apiFetch(`/api/egresos/${id}`, { method: 'DELETE' });

// Resumen por proyecto
export const getResumenProyectos = (desde, hasta) =>
  apiFetch(`/api/resumen/proyectos?desde=${desde}&hasta=${hasta}`);

// Proyectos
export const getProyectos   = ()       => apiFetch('/api/proyectos');
export const postProyecto   = (nombre) => apiFetch('/api/proyectos', { method: 'POST', body: JSON.stringify({ nombre }) });
export const deleteProyecto = (id)     => apiFetch(`/api/proyectos/${id}`, { method: 'DELETE' });

// Productos / Inventario
export const getProductos   = ()         => apiFetch('/api/productos');
export const postProducto   = (data)     => apiFetch('/api/productos', { method: 'POST', body: JSON.stringify(data) });
export const putProducto    = (id, data) => apiFetch(`/api/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProducto = (id)       => apiFetch(`/api/productos/${id}`, { method: 'DELETE' });

export const getMovimientos   = (desde, hasta) => apiFetch(`/api/movimientos?desde=${desde}&hasta=${hasta}`);
export const postMovimiento   = (data)         => apiFetch('/api/movimientos', { method: 'POST', body: JSON.stringify(data) });
export const deleteMovimiento = (id)           => apiFetch(`/api/movimientos/${id}`, { method: 'DELETE' });

// Cotizaciones
export const getCotizaciones = ()  => apiFetch('/api/cotizaciones');
export const putCotizacion   = (q) => apiFetch(`/api/cotizaciones/${q.id}`, { method: 'PUT', body: JSON.stringify(q) });