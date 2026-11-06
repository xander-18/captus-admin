import { useState } from 'react';
import { Check, Trash2, X } from 'lucide-react';
/* ── Constantes y utilidades compartidas con pages/operaciones/Asignaciones.jsx ── */
export const ESTADOS = [
  { id: 'pendiente',   label: 'Pendiente',   color: '#9ca3af' },
  { id: 'en_proceso',  label: 'En proceso',  color: '#1a56db' },
  { id: 'en_revision', label: 'En revisión', color: '#d97706' },
  { id: 'completada',  label: 'Completada',  color: '#059669' },
];

// El usuario puede tener el nombre en distintos campos según tu tabla
export const nombreDe = (u) => u?.nombre || u?.name || u?.username || u?.email || (u ? `Usuario ${u.id}` : '');

export const iniciales = (nombre = '') =>
  nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

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
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className={`tk-person${activo ? ' tk-person-on' : ''}`}
                      onClick={() => toggleUsuario(u.id)}
                      aria-pressed={activo}
                    >
                      <span className="tk-avatar">{iniciales(nombreDe(u))}</span>
                      <span className="tk-person-nombre">{nombreDe(u)}</span>
                      <span className="tk-check">{activo && <Check size={13} strokeWidth={3} />}</span>
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
            <select value={f.estado} onChange={(e) => set('estado', e.target.value)}>
              {ESTADOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
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