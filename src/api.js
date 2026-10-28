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

// Usuarios
export const getUsuarios   = ()         => apiFetch('/api/usuarios');
export const postUsuario   = (data)     => apiFetch('/api/usuarios', { method: 'POST', body: JSON.stringify(data) });
export const putUsuario    = (id, data) => apiFetch(`/api/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteUsuario = (id)       => apiFetch(`/api/usuarios/${id}`, { method: 'DELETE' });

// Módulos
export const getModulos   = ()         => apiFetch('/api/modulos');
export const postModulo   = (data)     => apiFetch('/api/modulos', { method: 'POST', body: JSON.stringify(data) });
export const putModulo    = (id, data) => apiFetch(`/api/modulos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteModulo = (id)       => apiFetch(`/api/modulos/${id}`, { method: 'DELETE' });

// Roles
export const getRoles   = ()         => apiFetch('/api/roles');
export const postRol    = (data)     => apiFetch('/api/roles', { method: 'POST', body: JSON.stringify(data) });
export const putRol     = (id, data) => apiFetch(`/api/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRol  = (id)       => apiFetch(`/api/roles/${id}`, { method: 'DELETE' });

// Privilegios
export const getPrivilegios   = ()         => apiFetch('/api/privilegios');
export const postPrivilegio   = (data)     => apiFetch('/api/privilegios', { method: 'POST', body: JSON.stringify(data) });
export const putPrivilegio    = (id, data) => apiFetch(`/api/privilegios/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePrivilegio = (id)       => apiFetch(`/api/privilegios/${id}`, { method: 'DELETE' });

// Asignaciones (devuelven y reciben un array de ids)
export const getRolPrivilegios = (rolId)      => apiFetch(`/api/roles/${rolId}/privilegios`);
export const setRolPrivilegios = (rolId, ids) => apiFetch(`/api/roles/${rolId}/privilegios`, { method: 'PUT', body: JSON.stringify({ ids }) });
export const getUsuarioRoles   = (userId)      => apiFetch(`/api/usuarios/${userId}/roles`);
export const setUsuarioRoles   = (userId, ids) => apiFetch(`/api/usuarios/${userId}/roles`, { method: 'PUT', body: JSON.stringify({ ids }) });

// Agrega esto a tu api.js (usa el mismo helper/base URL que ya usan
// getUsuarios, postUsuario, etc. Si ya tienes getUsuario(id), omite esa).

export const getUsuario = (id) => request(`/usuarios/${id}`);


// export const getUsuarioRoles = (userId) => request(`/usuarios/${userId}/roles`);

export const asignarRol = (userId, rolId) =>
  request(`/usuarios/${userId}/roles`, {
    method: 'POST',
    body: JSON.stringify({ rol_id: rolId }),
  });

export const quitarRol = (userId, rolId) =>
  request(`/usuarios/${userId}/roles/${rolId}`, { method: 'DELETE' });