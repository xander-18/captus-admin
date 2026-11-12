import { useState } from 'react';
import { Check, Trash2, X } from 'lucide-react';
/* ── Constantes y utilidades compartidas con pages/operaciones/Asignaciones.jsx ── */

/* ESTADOS: cada estado tiene su propio color.
   color = punto / borde · bg = fondo suave · fg = texto sobre ese fondo */
export const ESTADOS = [
  { id: 'pendiente',   label: 'Pendiente',   color: '#6b7280', bg: '#f3f4f6', fg: '#4b5563' },
  { id: 'en_proceso',  label: 'En proceso',  color: '#1a56db', bg: '#dbeafe', fg: '#1e40af' },
  { id: 'en_revision', label: 'En revisión', color: '#d97706', bg: '#fef3c7', fg: '#92400e' },
  { id: 'completada',  label: 'Completada',  color: '#059669', bg: '#d1fae5', fg: '#065f46' },
];

export const estadoDe = (id) => ESTADOS.find((s) => s.id === id) || ESTADOS[0];

/* Colores por persona: la misma persona siempre tiene el mismo color,
   en el modal, en las tarjetas y en la lista. */
const PALETA_PERSONAS = [
  { bg: '#dbeafe', fg: '#1e40af' }, // azul
  { bg: '#fce7f3', fg: '#9d174d' }, // rosa
  { bg: '#d1fae5', fg: '#065f46' }, // verde
  { bg: '#fef3c7', fg: '#92400e' }, // ámbar
  { bg: '#ede9fe', fg: '#5b21b6' }, // violeta
  { bg: '#cffafe', fg: '#155e75' }, // cian
  { bg: '#ffedd5', fg: '#9a3412' }, // naranja
  { bg: '#ecfccb', fg: '#3f6212' }, // lima
];

export const colorPersona = (id) => {
  const s = String(id ?? '');
  const n = Number(s);
  const h = Number.isInteger(n)
    ? Math.abs(n)
    : [...s].reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
  return PALETA_PERSONAS[Math.abs(h) % PALETA_PERSONAS.length];
};

// El usuario puede tener el nombre en distintos campos según tu tabla
export const nombreDe = (u) => u?.nombre || u?.name || u?.username || u?.email || (u ? `Usuario ${u.id}` : '');

export const iniciales = (nombre = '') =>
  nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

/* Avatar con el color de la persona. Úsalo en modal, tarjetas y lista.
   <Avatar usuario={u} />  ·  <Avatar usuario={u} small /> */
export function Avatar({ usuario, small = false }) {
  const c = colorPersona(usuario?.id);
  return (
    <span
      className={`tk-avatar${small ? ' sm' : ''}`}
      style={{ background: c.bg, color: c.fg }}
      title={nombreDe(usuario)}
    >
      {iniciales(nombreDe(usuario))}
    </span>
  );
}

/* Etiqueta de estado con su color. <EstadoBadge estado={a.estado} /> */
export function EstadoBadge({ estado }) {
  const e = estadoDe(estado);
  return (
    <span className="tk-estado-badge" style={{ background: e.bg, color: e.fg }}>
      <span className="tk-dot" style={{ background: e.color }} />
      {e.label}
    </span>
  );
}

/* ── Fechas (AAAA-MM-DD, hora local) ──
   fecha_fin vacía = servicio de un solo día (termina el mismo día que empieza). */
export const iso = (d) => d.toLocaleDateString('en-CA');
export const hoyISO = () => iso(new Date());
export const enDias = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const aFecha = (f) => new Date(`${f}T00:00:00`);
export const diasEntre = (a, b) => Math.round((aFecha(b) - aFecha(a)) / 864e5);
export const fmtDia = (f) => aFecha(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
const plural = (n, s) => `${n} ${s}${n === 1 ? '' : 's'}`;

export const finDe = (a) => a.fecha_fin || a.fecha_inicio;

// "19 sep" · "19 sep → 22 sep"
export const rangoTexto = (a) => {
  const f = finDe(a);
  return a.fecha_inicio === f ? fmtDia(a.fecha_inicio) : `${fmtDia(a.fecha_inicio)} → ${fmtDia(f)}`;
};

// En qué punto está la asignación respecto a hoy
export const estadoPlan = (a, hoy) => {
  if (a.estado === 'completada') return { tipo: 'done', texto: 'Completada' };
  const i = a.fecha_inicio;
  const f = finDe(a);
  if (f < hoy) return { tipo: 'late', texto: `Atrasada ${plural(diasEntre(f, hoy), 'día')}` };
  if (i > hoy) {
    const n = diasEntre(hoy, i);
    return { tipo: 'soon', texto: n === 1 ? 'Mañana' : `En ${n} días` };
  }
  if (i === f) return { tipo: 'today', texto: 'Hoy' };
  return { tipo: 'active', texto: `En curso · día ${diasEntre(i, hoy) + 1} de ${diasEntre(i, f) + 1}` };
};

// Normaliza user_ids a partir de la asignación, con compatibilidad hacia atrás
// por si algún registro aún trae user_id (singular) de antes de la migración.
const idsIniciales = (a) => {
  if (Array.isArray(a.user_ids)) return a.user_ids.map(String);
  if (a.user_id != null) return [String(a.user_id)];
  return [];
};

export default function AsignacionModal({ asignacion, usuarios = [], onSave, onDelete, onClose }) {
  const esNueva = !asignacion.id;
  const [f, setF] = useState({
    nombre: asignacion.nombre ?? '',
    descripcion: asignacion.descripcion ?? '',
    fecha_inicio: asignacion.fecha_inicio ?? hoyISO(),
    fecha_fin: asignacion.fecha_fin ?? '',
    estado: asignacion.estado ?? 'pendiente',
    user_ids: idsIniciales(asignacion),
    comentarios: asignacion.comentarios ?? '',
  });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const toggleUsuario = (id) => {
    const sid = String(id);
    setF((p) => ({
      ...p,
      user_ids: p.user_ids.includes(sid)
        ? p.user_ids.filter((x) => x !== sid)
        : [...p.user_ids, sid],
    }));
  };

  const guardar = async () => {
    if (!f.nombre.trim()) return setError('El nombre es obligatorio.');
    if (!f.user_ids.length) return setError('Elige al menos una persona.');
    if (!f.fecha_inicio) return setError('Indica la fecha de inicio.');
    if (f.fecha_fin && f.fecha_fin < f.fecha_inicio) return setError('La fecha de fin no puede ser anterior al inicio.');

    setError('');
    setGuardando(true);
    try {
      await onSave({ ...f, nombre: f.nombre.trim(), fecha_fin: f.fecha_fin || null });
    } catch (e) {
      setError(e.message || 'No se pudo guardar.');
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal tk-modal" role="dialog" aria-modal="true">
        <div className="modal-title">
          {esNueva ? 'Nueva asignación' : 'Editar asignación'}
          <button className="tk-x" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>

        <div className="modal-fields">
          <div className="modal-field tk-full">
            <label>Servicio o proyecto</label>
            <input value={f.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej: Instalar cámaras en Los Olivos" autoFocus />
          </div>

          <div className="modal-field tk-full">
            <label>Descripción</label>
            <textarea rows={3} value={f.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Dirección, materiales, detalles… (opcional)" />
          </div>

          <div className="modal-field tk-full">
            <label>
              Personas asignadas
              {f.user_ids.length > 0 && (
                <span className="tk-count">
                  {' '}· {f.user_ids.length} seleccionada{f.user_ids.length === 1 ? '' : 's'}
                </span>
              )}
            </label>
            {usuarios.length === 0 ? (
              <small className="modal-hint">No hay personas disponibles.</small>
            ) : (
              <div className="tk-people-list">
                {usuarios.map((u) => {
                  const sid = String(u.id);
                  const activo = f.user_ids.includes(sid);
                  const c = colorPersona(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className={`tk-person${activo ? ' tk-person-on' : ''}`}
                      style={activo ? { background: c.bg, borderColor: c.fg } : undefined}
                      onClick={() => toggleUsuario(u.id)}
                      aria-pressed={activo}
                    >
                      <Avatar usuario={u} />
                      <span className="tk-person-nombre">{nombreDe(u)}</span>
                      <span
                        className="tk-check"
                        style={activo ? { background: c.fg, borderColor: c.fg } : undefined}
                      >
                        {activo && <Check size={13} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="modal-field tk-full">
            <label>Fechas</label>
            <div className="tk-dates">
              <div><small>Empieza</small><input type="date" value={f.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)} /></div>
              <div><small>Termina (opcional)</small><input type="date" min={f.fecha_inicio || undefined} value={f.fecha_fin} onChange={(e) => set('fecha_fin', e.target.value)} /></div>
            </div>
            <span className="modal-hint">Si es de un solo día, deja "Termina" vacío.</span>
          </div>

          <div className="modal-field tk-full">
            <label>Estado</label>
            <div className="tk-estado-chips">
              {ESTADOS.map((s) => {
                const activo = f.estado === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`tk-estado-chip${activo ? ' active' : ''}`}
                    style={activo ? { background: s.bg, color: s.fg, borderColor: s.color } : undefined}
                    onClick={() => set('estado', s.id)}
                    aria-pressed={activo}
                  >
                    <span className="tk-dot" style={{ background: s.color }} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="modal-field tk-full">
            <label>Comentarios</label>
            <textarea rows={3} value={f.comentarios} onChange={(e) => set('comentarios', e.target.value)} placeholder="Notas o seguimiento (opcional)" />
          </div>
        </div>

        {error && <div className="form-error show">{error}</div>}

        <div className="modal-btns">
          {!esNueva && (
            <button className="btn-cancel tk-danger" onClick={() => onDelete(asignacion.id)}><Trash2 size={14} /> Eliminar</button>
          )}
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}