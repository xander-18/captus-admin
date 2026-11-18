// src/crm/catalogos.js
//
// Catálogos configurables del CRM (canales de procedencia, intereses
// comerciales y estados de oportunidad). Los catálogos de canal e interés
// se guardan en localStorage para poder agregar valores nuevos SIN tocar
// código, tal como pide el punto 3 y 4 del brief. Los estados de
// oportunidad sí son fijos (son el embudo comercial del punto 5), pero
// viven acá para no repetirlos en varios componentes.

const LS_CANALES = 'crm_canales_v1';
const LS_INTERESES = 'crm_intereses_v1';

// ── Catálogo base (semilla). El usuario puede agregar más desde la UI,
// esos se guardan en localStorage y se funden con esta lista. ──
const CANALES_BASE = [
  { key: 'facebook_marketplace', label: 'Facebook Marketplace', icon: 'ti-brand-facebook' },
  { key: 'facebook_messenger', label: 'Facebook Messenger', icon: 'ti-message-circle' },
  { key: 'facebook_publicacion', label: 'Facebook (publicación)', icon: 'ti-brand-facebook' },
  { key: 'instagram', label: 'Instagram', icon: 'ti-brand-instagram' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'ti-brand-whatsapp' },
  { key: 'tiktok', label: 'TikTok', icon: 'ti-brand-tiktok' },
  { key: 'llamada', label: 'Llamada telefónica', icon: 'ti-phone' },
  { key: 'recomendacion', label: 'Recomendación', icon: 'ti-thumb-up' },
  { key: 'presencial', label: 'Atención presencial', icon: 'ti-building-store' },
  { key: 'otro', label: 'Otros', icon: 'ti-dots' },
  { key: 'desconocido', label: 'Desconocido', icon: 'ti-help-circle' },
];

const INTERESES_BASE = [
  { key: 'camaras_seguridad', label: 'Cámaras de seguridad', icon: 'ti-camera' },
  { key: 'alarmas', label: 'Alarmas de seguridad', icon: 'ti-bell' },
  { key: 'camaras_solares', label: 'Cámaras solares', icon: 'ti-sun' },
  { key: 'control_acceso', label: 'Control de acceso', icon: 'ti-fingerprint' },
  { key: 'redes_cableado', label: 'Redes y cableado', icon: 'ti-router' },
  { key: 'soporte_tecnico', label: 'Soporte técnico', icon: 'ti-headset' },
  { key: 'instalaciones', label: 'Instalaciones', icon: 'ti-tools' },
  { key: 'mantenimiento', label: 'Mantenimiento', icon: 'ti-settings' },
  { key: 'otro', label: 'Otros', icon: 'ti-dots' },
];

// Embudo comercial de la oportunidad (punto 5 del brief).
export const ESTADOS_OPORTUNIDAD = [
  { key: 'nuevo', label: 'Nuevo contacto', color: '#64748b', bg: '#64748b18' },
  { key: 'interesado', label: 'Interesado', color: '#0ea5e9', bg: '#0ea5e918' },
  { key: 'cotizacion_solicitada', label: 'Cotización solicitada', color: '#8b5cf6', bg: '#8b5cf618' },
  { key: 'cotizacion_enviada', label: 'Cotización enviada', color: '#f59e0b', bg: '#f59e0b18' },
  { key: 'seguimiento', label: 'En seguimiento', color: '#ec4899', bg: '#ec489918' },
  { key: 'ganada', label: 'Venta realizada', color: '#10b981', bg: '#10b98118' },
  { key: 'perdida', label: 'No concretado', color: '#dc2626', bg: '#dc262618' },
];

export const TIPOS_ACTIVIDAD = [
  { key: 'nota', label: 'Nota', icon: 'ti-note' },
  { key: 'llamada', label: 'Llamada', icon: 'ti-phone' },
  { key: 'mensaje', label: 'Mensaje', icon: 'ti-message-2' },
  { key: 'reunion', label: 'Reunión', icon: 'ti-users' },
  { key: 'cotizacion_enviada', label: 'Cotización enviada', icon: 'ti-file-invoice' },
  { key: 'cambio_estado', label: 'Cambio de estado', icon: 'ti-arrow-right-circle' },
];

function slugify(texto) {
  return (texto || '')
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || `item_${Date.now()}`;
}

function cargarExtra(lsKey) {
  try {
    const raw = localStorage.getItem(lsKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function guardarExtra(lsKey, lista) {
  try { localStorage.setItem(lsKey, JSON.stringify(lista)); } catch { /* localStorage no disponible */ }
}

function fusionar(base, extra) {
  const porKey = new Map(base.map(i => [i.key, i]));
  extra.forEach(i => { if (!porKey.has(i.key)) porKey.set(i.key, i); });
  return Array.from(porKey.values());
}

export function getCanales() {
  return fusionar(CANALES_BASE, cargarExtra(LS_CANALES));
}

export function addCanal(label) {
  const label2 = (label || '').trim();
  if (!label2) return null;
  const key = slugify(label2);
  const existentes = cargarExtra(LS_CANALES);
  if (getCanales().some(c => c.key === key)) return key; // ya existe, no duplicar
  const nuevo = { key, label: label2, icon: 'ti-point', personalizado: true };
  guardarExtra(LS_CANALES, [...existentes, nuevo]);
  return key;
}

export function getIntereses() {
  return fusionar(INTERESES_BASE, cargarExtra(LS_INTERESES));
}

export function addInteres(label) {
  const label2 = (label || '').trim();
  if (!label2) return null;
  const key = slugify(label2);
  const existentes = cargarExtra(LS_INTERESES);
  if (getIntereses().some(i => i.key === key)) return key;
  const nuevo = { key, label: label2, icon: 'ti-point', personalizado: true };
  guardarExtra(LS_INTERESES, [...existentes, nuevo]);
  return key;
}

export function getEstadoOportunidad(key) {
  return ESTADOS_OPORTUNIDAD.find(e => e.key === key) || ESTADOS_OPORTUNIDAD[0];
}

export function getTipoActividad(key) {
  return TIPOS_ACTIVIDAD.find(t => t.key === key) || TIPOS_ACTIVIDAD[0];
}