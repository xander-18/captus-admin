// src/crm/almacenLocal.js
//
// Mientras el backend no tenga las tablas nuevas (canales, intereses,
// oportunidades, actividades — ver análisis previo), estos datos se
// guardan en localStorage, en el navegador de cada usuario. Los campos
// que SÍ existen hoy en la API de clientes (nombre, documento, teléfono,
// correo, notas) siguen yendo por api.js sin cambios, para no tocar el
// backend ni romper nada.
//
// Cuando el backend incorpore estas tablas, solo hay que reemplazar las
// funciones de este archivo por llamadas a apiFetch — el resto del CRM
// (componentes) no debería necesitar cambios porque consume estas mismas
// funciones.

const LS_EXTRA = 'crm_clientes_extra_v1';       // { [clienteId]: {...} }
const LS_OPORTUNIDADES = 'crm_oportunidades_v1'; // [ {...} ]
const LS_ACTIVIDADES = 'crm_actividades_v1';     // [ {...} ]

function leer(key, porDefecto) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : porDefecto;
  } catch {
    return porDefecto;
  }
}

function escribir(key, valor) {
  try {
    localStorage.setItem(key, JSON.stringify(valor));
    return true;
  } catch {
    // localStorage lleno, bloqueado por el navegador, modo incógnito, etc.
    return false;
  }
}

function nuevoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function hoyISO() {
  return new Date().toISOString();
}

// ────────────────────────────────────────────────────────────
// Datos extendidos del cliente (tipo, whatsapp, canal, intereses, etc.)
// ────────────────────────────────────────────────────────────

export function obtenerExtra(clienteId) {
  const todo = leer(LS_EXTRA, {});
  return todo[clienteId] || {
    tipo: 'persona',
    whatsapp: '',
    canalContacto: '',      // por qué medio escribió
    canalOrigen: '',        // cómo conoció CAPTUSTEC (puede ser distinto)
    intereses: [],
    descripcionConsulta: '',
    fechaPrimerContacto: '',
    responsable: '',
    observaciones: '',
  };
}

export function guardarExtra(clienteId, datosParciales) {
  const todo = leer(LS_EXTRA, {});
  const actual = todo[clienteId] || {};
  todo[clienteId] = { ...actual, ...datosParciales };
  escribir(LS_EXTRA, todo);
  return todo[clienteId];
}

export function eliminarExtra(clienteId) {
  const todo = leer(LS_EXTRA, {});
  delete todo[clienteId];
  escribir(LS_EXTRA, todo);
}

export function obtenerTodosLosExtra() {
  return leer(LS_EXTRA, {});
}

// ────────────────────────────────────────────────────────────
// Oportunidades (un cliente puede tener varias, independientes)
// ────────────────────────────────────────────────────────────

export function listarOportunidades(clienteId) {
  const todas = leer(LS_OPORTUNIDADES, []);
  const filtradas = clienteId ? todas.filter(o => o.clienteId === clienteId) : todas;
  return [...filtradas].sort((a, b) => new Date(b.actualizadoEn) - new Date(a.actualizadoEn));
}

export function crearOportunidad(datos) {
  const todas = leer(LS_OPORTUNIDADES, []);
  const nueva = {
    id: nuevoId(),
    clienteId: datos.clienteId,
    estado: datos.estado || 'nuevo',
    intereses: datos.intereses || [],
    responsable: datos.responsable || '',
    observaciones: datos.observaciones || '',
    motivoNoConcretado: '',
    proximoSeguimiento: datos.proximoSeguimiento || '',
    creadoEn: hoyISO(),
    actualizadoEn: hoyISO(),
  };
  escribir(LS_OPORTUNIDADES, [...todas, nueva]);
  return nueva;
}

export function actualizarOportunidad(id, cambios) {
  const todas = leer(LS_OPORTUNIDADES, []);
  let actualizada = null;
  const nuevas = todas.map(o => {
    if (o.id !== id) return o;
    actualizada = { ...o, ...cambios, actualizadoEn: hoyISO() };
    return actualizada;
  });
  escribir(LS_OPORTUNIDADES, nuevas);
  return actualizada;
}

export function eliminarOportunidadesDeCliente(clienteId) {
  const todas = leer(LS_OPORTUNIDADES, []);
  escribir(LS_OPORTUNIDADES, todas.filter(o => o.clienteId !== clienteId));
}

// ────────────────────────────────────────────────────────────
// Actividades (historial cronológico: llamadas, mensajes, cambios, etc.)
// ────────────────────────────────────────────────────────────

export function listarActividades(clienteId) {
  const todas = leer(LS_ACTIVIDADES, []);
  const filtradas = clienteId ? todas.filter(a => a.clienteId === clienteId) : todas;
  return [...filtradas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

export function crearActividad(datos) {
  const todas = leer(LS_ACTIVIDADES, []);
  const nueva = {
    id: nuevoId(),
    clienteId: datos.clienteId,
    oportunidadId: datos.oportunidadId || null,
    tipo: datos.tipo || 'nota',
    descripcion: datos.descripcion || '',
    fecha: datos.fecha || hoyISO(),
    responsable: datos.responsable || '',
    creadoEn: hoyISO(),
  };
  escribir(LS_ACTIVIDADES, [...todas, nueva]);
  return nueva;
}

export function eliminarActividadesDeCliente(clienteId) {
  const todas = leer(LS_ACTIVIDADES, []);
  escribir(LS_ACTIVIDADES, todas.filter(a => a.clienteId !== clienteId));
}

// ────────────────────────────────────────────────────────────
// Limpieza total al eliminar un cliente (para no dejar basura huérfana)
// ────────────────────────────────────────────────────────────

export function limpiarDatosDeCliente(clienteId) {
  eliminarExtra(clienteId);
  eliminarOportunidadesDeCliente(clienteId);
  eliminarActividadesDeCliente(clienteId);
}

// ────────────────────────────────────────────────────────────
// Compatibilidad con la API actual: el backend todavía espera un
// `estado` de cliente de 4 valores (Prospecto/Negociación/Cliente/
// Inactivo). Lo derivamos de las oportunidades para no romper ese
// contrato ni obligar a migrar el backend ahora.
// ────────────────────────────────────────────────────────────

export function derivarEstadoLegacy(oportunidadesDelCliente) {
  if (!oportunidadesDelCliente || !oportunidadesDelCliente.length) return 'Prospecto';
  if (oportunidadesDelCliente.some(o => o.estado === 'ganada')) return 'Cliente';
  const activas = oportunidadesDelCliente.filter(o => o.estado !== 'perdida');
  if (!activas.length) return 'Inactivo';
  if (activas.some(o => ['cotizacion_solicitada', 'cotizacion_enviada', 'seguimiento'].includes(o.estado))) {
    return 'Negociación';
  }
  return 'Prospecto';
}