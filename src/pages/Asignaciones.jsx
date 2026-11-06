import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, List, Plus } from 'lucide-react';
import {
  getAsignaciones, postAsignacion, putAsignacion, patchAsignacionEstado, deleteAsignacion, getUsuarios,
} from '../api';
import AsignacionModal, {
  ESTADOS, hoyISO, enDias, finDe, rangoTexto, estadoPlan, nombreDe, iniciales,
} from '../components/AsignacionModal';

export default function Asignaciones() {
  const [items, setItems] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filtros, setFiltros] = useState({ user: '', estado: '', fecha: '' });
  const [modal, setModal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getAsignaciones(), getUsuarios()])
      .then(([a, u]) => {
        setItems(a);
        setUsuarios(Array.isArray(u) ? u : []);
      })
      .catch((e) => setError(e.message || 'No se pudieron cargar las asignaciones.'))
      .finally(() => setCargando(false));
  }, []);

  const hoy = hoyISO();
  const finSemana = enDias(7);
  const atrasada = (a) => finDe(a) < hoy && a.estado !== 'completada';
  const idsDe = (a) => (a.user_ids || []).map(String);
  const personasDe = (a) => idsDe(a)
    .map((id) => usuarios.find((u) => String(u.id) === id))
    .filter(Boolean);
  const setF = (k, v) => setFiltros((p) => ({ ...p, [k]: v }));

  const visibles = useMemo(() => {
    const { user, estado, fecha } = filtros;
    return items
      .filter((a) => !user || idsDe(a).includes(user))
      .filter((a) => !estado || a.estado === estado)
      .filter((a) => {
        if (!fecha) return true;
        if (fecha === 'atrasadas') return atrasada(a);
        if (fecha === 'hoy') return a.fecha_inicio <= hoy && finDe(a) >= hoy;
        if (fecha === 'semana') return a.fecha_inicio <= finSemana && finDe(a) >= hoy;
        return true;
      })
      .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio) || a.id - b.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, filtros, hoy]);

  const kpi = {
    pendientes: items.filter((a) => a.estado !== 'completada').length,
    atrasadas: items.filter(atrasada).length,
    completadas: items.filter((a) => a.estado === 'completada').length,
  };

  const guardar = async (data) => {
    const editando = !!modal.id;
    const guardada = editando ? await putAsignacion(modal.id, data) : await postAsignacion(data);
    setItems((prev) => (editando ? prev.map((x) => (x.id === guardada.id ? guardada : x)) : [...prev, guardada]));
    setModal(null);
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta asignación?')) return;
    try {
      await deleteAsignacion(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      setModal(null);
    } catch (e) {
      setError(e.message || 'No se pudo eliminar.');
    }
  };

  const cambiarEstado = async (a, estado) => {
    try {
      const actualizada = await patchAsignacionEstado(a.id, estado);
      setItems((prev) => prev.map((x) => (x.id === a.id ? actualizada : x)));
    } catch (e) {
      setError(e.message || 'No se pudo cambiar el estado.');
    }
  };

  return (
    <div className="page">
      <div className="header">
        <div className="brand">
          <div className="brand-icon"><ClipboardList /></div>
          <div><h1>Asignaciones</h1><p>Servicios y proyectos asignados a los operarios</p></div>
        </div>
        <div className="header-right">
          <button className="btn-add" onClick={() => setModal({})}><Plus size={16} /> Nueva asignación</button>
        </div>
      </div>

      <div className="kpi-row tres">
        <div className="kpi"><div className="kpi-label"><ClipboardList size={14} /> Pendientes</div><div className="kpi-value blue">{kpi.pendientes}</div></div>
        <div className="kpi"><div className="kpi-label"><AlertTriangle size={14} /> Atrasadas</div><div className="kpi-value red">{kpi.atrasadas}</div></div>
        <div className="kpi"><div className="kpi-label"><CheckCircle2 size={14} /> Completadas</div><div className="kpi-value green">{kpi.completadas}</div></div>
      </div>

      <div className="tk-toolbar">
        <div className="tk-filters">
          <select className="tk-select" value={filtros.user} onChange={(e) => setF('user', e.target.value)}>
            <option value="">Todas las personas</option>
            {usuarios.map((u) => <option key={u.id} value={String(u.id)}>{nombreDe(u)}</option>)}
          </select>
          <select className="tk-select" value={filtros.estado} onChange={(e) => setF('estado', e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select className="tk-select" value={filtros.fecha} onChange={(e) => setF('fecha', e.target.value)}>
            <option value="">Cualquier fecha</option>
            <option value="atrasadas">Atrasadas</option>
            <option value="hoy">Activas hoy</option>
            <option value="semana">Próximos 7 días</option>
          </select>
        </div>
      </div>

      {error && <div className="form-error show">{error}</div>}

      <div className="table-card">
        <div className="table-head">
          <div className="table-title"><List size={15} /> Todas las asignaciones</div>
          <span className="badge">{visibles.length}</span>
        </div>
        <div>
          {cargando ? (
            <div className="empty"><p>Cargando…</p></div>
          ) : visibles.length === 0 ? (
            <div className="empty"><p>No hay asignaciones</p><small>Crea una nueva o cambia los filtros</small></div>
          ) : (
            <table>
              <thead>
                <tr><th>Servicio / proyecto</th><th>Personas asignadas</th><th>Estado</th><th>Fechas</th></tr>
              </thead>
              <tbody>
                {visibles.map((a) => {
                  const plan = estadoPlan(a, hoy);
                  const personas = personasDe(a);
                  return (
                    <tr key={a.id} className="tk-row" onClick={() => setModal(a)}>
                      <td className="td-cliente">{a.nombre}</td>
                      <td>
                        <span className="tk-avatars">
                          {personas.map((u) => (
                            <span key={u.id} className="tk-avatar" title={nombreDe(u)}>{iniciales(nombreDe(u))}</span>
                          ))}
                        </span>{' '}
                        {personas.length
                          ? personas.map((u) => nombreDe(u)).join(', ')
                          : <small className="tk-when-txt">Sin asignar</small>}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select className="tk-select" value={a.estado} onChange={(e) => cambiarEstado(a, e.target.value)}>
                          {ESTADOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </td>
                      <td>
                        <div className="tk-sched">{rangoTexto(a)}</div>
                        <small className={`tk-when-txt ${plan.tipo}`}>{plan.texto}</small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <AsignacionModal asignacion={modal} usuarios={usuarios} onSave={guardar} onDelete={eliminar} onClose={() => setModal(null)} />
      )}
    </div>
  );
}