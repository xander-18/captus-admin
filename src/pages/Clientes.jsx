import { useState, useEffect, useMemo, useCallback } from 'react';
import { getClientes, postCliente, putCliente, deleteCliente, getUsuarios } from '../api';
import { useToast } from '../components/Toast';
import {
  getCanales, addCanal, getIntereses, addInteres,
  ESTADOS_OPORTUNIDAD, TIPOS_ACTIVIDAD, getEstadoOportunidad, getTipoActividad,
} from '../crm/catalogos';
import {
  obtenerExtra, guardarExtra, obtenerTodosLosExtra,
  listarOportunidades, crearOportunidad, actualizarOportunidad,
  listarActividades, crearActividad,
  limpiarDatosDeCliente, derivarEstadoLegacy,
} from '../crm/almacenLocal';

/* ============================================================================
   CRM de Clientes y Oportunidades — CAPTUSTEC
   ============================================================================
   Qué persiste dónde (ver análisis previo a la implementación):

   - Nombre, documento, teléfono, correo y notas  → API real (/api/clientes),
     SIN cambios en el backend. `notas` guarda la descripción de la consulta.
   - `estado` del cliente (Prospecto/Negociación/Cliente/Inactivo) se sigue
     enviando a la API por compatibilidad, pero ya no se edita a mano: se
     calcula solo a partir de las oportunidades (derivarEstadoLegacy).
   - Tipo, WhatsApp, canal, intereses, responsable, observaciones,
     oportunidades y el historial de actividades → localStorage del
     navegador (src/crm/almacenLocal.js), porque todavía no existen esas
     tablas en el backend. Cuando se creen, solo hay que reemplazar ese
     archivo por llamadas a la API; los componentes no deberían cambiar.
   ============================================================================ */

const FORM_NUEVO_INICIAL = {
  nombre: '', tipo: 'persona', telefono: '', canal: '', intereses: [],
  responsable: '', descripcion: '',
};

const PANEL_INFO_INICIAL = {
  nombre: '', documento: '', telefono: '', correo: '', tipo: 'persona',
  whatsapp: '', canalContacto: '', canalOrigen: '', intereses: [],
  descripcionConsulta: '', fechaPrimerContacto: '', responsable: '', observaciones: '',
};

const NUEVA_OPORTUNIDAD_INICIAL = {
  estado: 'nuevo', intereses: [], responsable: '', observaciones: '', proximoSeguimiento: '',
};

const NUEVA_ACTIVIDAD_INICIAL = {
  tipo: 'nota', descripcion: '', fecha: '',
};

const hoyISODate = () => new Date().toISOString().slice(0, 10);
const formatearFecha = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
};

function nombreDeUsuario(u) {
  return u?.nombre || u?.nombre_completo || u?.nombreCompleto || u?.username
    || u?.correo || u?.email || (u?.id != null ? `Usuario #${u.id}` : null);
}

// ── Selector de chips reutilizable (canal / intereses), con opción de
// agregar valores nuevos al catálogo sin tocar código. ──
function SelectorChips({ opciones, seleccion, multiple, onCambiar, onAgregarOpcion, placeholderNuevo }) {
  const [nuevo, setNuevo] = useState('');

  const estaSeleccionado = (key) => (multiple ? seleccion.includes(key) : seleccion === key);

  function alHacerClic(key) {
    if (multiple) {
      onCambiar(seleccion.includes(key) ? seleccion.filter(k => k !== key) : [...seleccion, key]);
    } else {
      onCambiar(seleccion === key ? '' : key);
    }
  }

  function agregar() {
    if (!nuevo.trim()) return;
    const key = onAgregarOpcion(nuevo);
    if (key) {
      setNuevo('');
      if (multiple) onCambiar([...seleccion, key]);
      else onCambiar(key);
    }
  }

  return (
    <div className="crm-chip-group">
      {opciones.map(o => (
        <button type="button" key={o.key}
          className={`crm-chip${estaSeleccionado(o.key) ? ' active' : ''}`}
          onClick={() => alHacerClic(o.key)}>
          {o.icon ? <i className={`ti ${o.icon}`}></i> : null} {o.label}
        </button>
      ))}
      {onAgregarOpcion && (
        <span className="crm-chip-add">
          <input type="text" value={nuevo} placeholder={placeholderNuevo || 'Agregar...'}
            onChange={e => setNuevo(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } }} />
          <button type="button" onClick={agregar} title="Agregar al catálogo"><i className="ti ti-plus"></i></button>
        </span>
      )}
    </div>
  );
}

function InsigniaEstado({ estadoKey }) {
  const e = getEstadoOportunidad(estadoKey);
  return (
    <span className="pill" style={{ background: e.bg, color: e.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.color, display: 'inline-block', flexShrink: 0 }}></span>
      {e.label}
    </span>
  );
}

function ChipsIntereses({ keys, intereses, max = 3 }) {
  if (!keys || !keys.length) return <span style={{ color: '#d1d5db' }}>—</span>;
  const visibles = keys.slice(0, max);
  const resto = keys.length - visibles.length;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {visibles.map(k => {
        const i = intereses.find(x => x.key === k);
        return <span key={k} className="crm-badge-chip">{i ? i.label : k}</span>;
      })}
      {resto > 0 && <span className="crm-badge-chip" style={{ background: '#f3f4f6', color: '#6b7280' }}>+{resto}</span>}
    </div>
  );
}

export default function ClientesCRM() {
  const toast = useToast();

  // ── Datos desde la API (sin cambios de contrato) ──
  const [clientes, setClientes] = useState([]);
  const [offline, setOffline] = useState(false);
  const [usuarios, setUsuarios] = useState([]);

  // ── Datos locales del CRM (localStorage) ──
  const [extras, setExtras] = useState({});
  const [oportunidades, setOportunidades] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [canales, setCanalesState] = useState(getCanales());
  const [intereses, setInteresesState] = useState(getIntereses());

  const recargarDatosLocales = useCallback(() => {
    setExtras(obtenerTodosLosExtra());
    setOportunidades(listarOportunidades());
    setActividades(listarActividades());
  }, []);

  const recargarCanales = useCallback(() => setCanalesState(getCanales()), []);
  const recargarIntereses = useCallback(() => setInteresesState(getIntereses()), []);

  function manejarAgregarCanal(label) {
    const key = addCanal(label);
    recargarCanales();
    return key;
  }
  function manejarAgregarInteres(label) {
    const key = addInteres(label);
    recargarIntereses();
    return key;
  }

  const cargar = useCallback(async () => {
    try {
      const data = await getClientes();
      setClientes(data || []);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);

  useEffect(() => {
    cargar();
    recargarDatosLocales();
    // Responsables: reutiliza el endpoint de usuarios ya existente. Si falla
    // (permisos, endpoint distinto, etc.) el CRM sigue funcionando con texto libre.
    getUsuarios().then(lista => setUsuarios(lista || [])).catch(() => setUsuarios([]));
  }, [cargar, recargarDatosLocales]);

  const nombresUsuarios = useMemo(
    () => Array.from(new Set(usuarios.map(nombreDeUsuario).filter(Boolean))),
    [usuarios]
  );

  const clientesPorId = useMemo(
    () => Object.fromEntries(clientes.map(c => [c.id, c])),
    [clientes]
  );

  function oportunidadesDe(clienteId) {
    return oportunidades.filter(o => o.clienteId === clienteId);
  }
  function actividadesDe(clienteId) {
    return actividades.filter(a => a.clienteId === clienteId);
  }
  function ultimaOportunidad(clienteId) {
    const lista = oportunidadesDe(clienteId);
    return lista.length ? lista[0] : null; // listarOportunidades ya devuelve ordenado desc
  }
  function ultimaActividad(clienteId) {
    const lista = actividadesDe(clienteId);
    return lista.length ? lista[0] : null;
  }

  // ── Vista activa: lista | kanban | dashboard ──
  const [vista, setVista] = useState('lista');

  // ── Búsqueda y filtros (compartidos entre Lista y Dashboard) ──
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState({ canal: '', interes: '', estado: '', responsable: '', desde: '', hasta: '' });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const filtrosActivos = Object.values(filtros).some(Boolean);

  function clienteCoincideFiltros(c) {
    const extra = extras[c.id] || {};
    const oc = oportunidadesDe(c.id);
    if (busqueda) {
      const q = busqueda.toLowerCase();
      const coincide = (c.nombre || '').toLowerCase().includes(q)
        || (c.documento || '').includes(busqueda)
        || (extra.whatsapp || '').includes(busqueda)
        || (c.telefono || '').includes(busqueda);
      if (!coincide) return false;
    }
    if (filtros.canal && extra.canalContacto !== filtros.canal && extra.canalOrigen !== filtros.canal) return false;
    if (filtros.interes && !(extra.intereses || []).includes(filtros.interes)) return false;
    if (filtros.estado && !oc.some(o => o.estado === filtros.estado)) return false;
    if (filtros.responsable && extra.responsable !== filtros.responsable && !oc.some(o => o.responsable === filtros.responsable)) return false;
    if (filtros.desde && (!extra.fechaPrimerContacto || extra.fechaPrimerContacto < filtros.desde)) return false;
    if (filtros.hasta && (!extra.fechaPrimerContacto || extra.fechaPrimerContacto > filtros.hasta)) return false;
    return true;
  }
  const clientesFiltrados = clientes.filter(clienteCoincideFiltros);

  // ── KPIs rápidos de la barra superior (vista Lista) ──
  const kpiOportunidadesActivas = oportunidades.filter(o => !['ganada', 'perdida'].includes(o.estado)).length;
  const kpiCotizacionesPendientes = oportunidades.filter(o => ['cotizacion_solicitada', 'cotizacion_enviada'].includes(o.estado)).length;
  const kpiVentas = oportunidades.filter(o => o.estado === 'ganada').length;

  // ── Modal: registro rápido de nuevo contacto ──
  const [modalNuevo, setModalNuevo] = useState(false);
  const [formNuevo, setFormNuevo] = useState(FORM_NUEVO_INICIAL);
  const [formErr, setFormErr] = useState('');
  const [loadingAdd, setLoadingAdd] = useState(false);

  async function handleCrearContacto() {
    setFormErr('');
    if (!formNuevo.nombre.trim()) { setFormErr('El nombre o razón social es obligatorio.'); return; }

    setLoadingAdd(true);
    const idsAntes = new Set(clientes.map(c => c.id));
    try {
      await postCliente({
        nombre: formNuevo.nombre.trim(),
        documento: '',
        telefono: formNuevo.telefono.trim(),
        correo: '',
        estado: 'Prospecto',
        notas: formNuevo.descripcion.trim(),
      });

      const listaActualizada = await getClientes();
      setClientes(listaActualizada || []);
      setOffline(false);
      const nuevoCliente = (listaActualizada || []).find(c => !idsAntes.has(c.id));

      if (nuevoCliente) {
        const canalElegido = formNuevo.canal || 'desconocido';
        guardarExtra(nuevoCliente.id, {
          tipo: formNuevo.tipo,
          whatsapp: formNuevo.telefono.trim(),
          canalContacto: canalElegido,
          canalOrigen: canalElegido,
          intereses: formNuevo.intereses,
          descripcionConsulta: formNuevo.descripcion.trim(),
          fechaPrimerContacto: hoyISODate(),
          responsable: formNuevo.responsable || '',
          observaciones: '',
        });
        crearOportunidad({
          clienteId: nuevoCliente.id,
          estado: 'nuevo',
          intereses: formNuevo.intereses,
          responsable: formNuevo.responsable || '',
        });
        crearActividad({
          clienteId: nuevoCliente.id,
          tipo: 'nota',
          descripcion: 'Registro inicial del contacto.',
          responsable: formNuevo.responsable || '',
        });
        recargarDatosLocales();
      } else {
        toast('El contacto se guardó, pero no se pudo vincular el canal/intereses. Complétalo desde su ficha.', 'warn');
      }

      setModalNuevo(false);
      setFormNuevo(FORM_NUEVO_INICIAL);
      toast(`Registrado: ${formNuevo.nombre.trim()}`, 'success');
    } catch (e) {
      toast('Error al guardar: ' + (e.message || 'intenta de nuevo'), 'err');
    } finally {
      setLoadingAdd(false);
    }
  }

  // ── Eliminar cliente (también limpia sus datos locales) ──
  async function eliminar(id, nombreCli) {
    if (!window.confirm(`¿Seguro que deseas eliminar a ${nombreCli}? Se perderá también su historial del CRM.`)) return;
    try {
      await deleteCliente(id);
      limpiarDatosDeCliente(id);
      if (panelClienteId === id) setPanelClienteId(null);
      await cargar();
      recargarDatosLocales();
      toast('Registro eliminado', '');
    } catch {
      toast('Error al eliminar', 'err');
    }
  }

  // ── Panel lateral (ficha de cliente) ──
  const [panelClienteId, setPanelClienteId] = useState(null);
  const [panelTab, setPanelTab] = useState('info');
  const [panelInfo, setPanelInfo] = useState(PANEL_INFO_INICIAL);
  const [loadingPanel, setLoadingPanel] = useState(false);

  function abrirPanel(cliente, tab = 'info') {
    const extra = obtenerExtra(cliente.id);
    setPanelInfo({
      nombre: cliente.nombre || '',
      documento: cliente.documento || '',
      telefono: cliente.telefono || '',
      correo: cliente.correo || '',
      tipo: extra.tipo || 'persona',
      whatsapp: extra.whatsapp || '',
      canalContacto: extra.canalContacto || '',
      canalOrigen: extra.canalOrigen || '',
      intereses: extra.intereses || [],
      descripcionConsulta: extra.descripcionConsulta || cliente.notas || '',
      fechaPrimerContacto: extra.fechaPrimerContacto || '',
      responsable: extra.responsable || '',
      observaciones: extra.observaciones || '',
    });
    setPanelClienteId(cliente.id);
    setPanelTab(tab);
    setNuevaOportunidad(NUEVA_OPORTUNIDAD_INICIAL);
    setNuevaActividad(NUEVA_ACTIVIDAD_INICIAL);
  }
  function cerrarPanel() { setPanelClienteId(null); }

  async function handleGuardarInfo() {
    if (!panelInfo.nombre.trim()) { toast('El nombre es obligatorio', 'warn'); return; }
    setLoadingPanel(true);
    try {
      const estadoLegacy = derivarEstadoLegacy(oportunidadesDe(panelClienteId));
      await putCliente(panelClienteId, {
        nombre: panelInfo.nombre.trim(),
        documento: panelInfo.documento.trim(),
        telefono: panelInfo.telefono.trim(),
        correo: panelInfo.correo.trim(),
        estado: estadoLegacy,
        notas: panelInfo.descripcionConsulta.trim(),
      });
      guardarExtra(panelClienteId, {
        tipo: panelInfo.tipo,
        whatsapp: panelInfo.whatsapp.trim(),
        canalContacto: panelInfo.canalContacto,
        canalOrigen: panelInfo.canalOrigen,
        intereses: panelInfo.intereses,
        descripcionConsulta: panelInfo.descripcionConsulta.trim(),
        fechaPrimerContacto: panelInfo.fechaPrimerContacto,
        responsable: panelInfo.responsable,
        observaciones: panelInfo.observaciones.trim(),
      });
      await cargar();
      recargarDatosLocales();
      toast('Ficha actualizada', 'success');
    } catch (e) {
      toast('Error al guardar: ' + (e.message || ''), 'err');
    } finally {
      setLoadingPanel(false);
    }
  }

  // ── Oportunidades dentro del panel ──
  const [nuevaOportunidad, setNuevaOportunidad] = useState(NUEVA_OPORTUNIDAD_INICIAL);
  const [loadingNuevaOportunidad, setLoadingNuevaOportunidad] = useState(false);

  async function handleCrearOportunidad() {
    setLoadingNuevaOportunidad(true);
    try {
      crearOportunidad({ clienteId: panelClienteId, ...nuevaOportunidad });
      crearActividad({
        clienteId: panelClienteId,
        tipo: 'nota',
        descripcion: 'Nueva oportunidad registrada.',
        responsable: nuevaOportunidad.responsable,
      });
      recargarDatosLocales();
      setNuevaOportunidad(NUEVA_OPORTUNIDAD_INICIAL);
      toast('Oportunidad creada', 'success');
    } finally {
      setLoadingNuevaOportunidad(false);
    }
  }

  function cambiarEstadoOportunidad(oportunidad, nuevoEstado) {
    if (nuevoEstado === oportunidad.estado) return;
    let motivo = '';
    if (nuevoEstado === 'perdida') {
      motivo = window.prompt('¿Cuál fue el motivo por el que no se concretó?') || '';
    }
    actualizarOportunidad(oportunidad.id, { estado: nuevoEstado, motivoNoConcretado: motivo || oportunidad.motivoNoConcretado });
    crearActividad({
      clienteId: oportunidad.clienteId,
      oportunidadId: oportunidad.id,
      tipo: 'cambio_estado',
      descripcion: `Cambio de estado: ${getEstadoOportunidad(oportunidad.estado).label} → ${getEstadoOportunidad(nuevoEstado).label}${motivo ? ` (Motivo: ${motivo})` : ''}`,
    });
    recargarDatosLocales();
  }

  // ── Historial / actividades dentro del panel ──
  const [nuevaActividad, setNuevaActividad] = useState(NUEVA_ACTIVIDAD_INICIAL);
  const [loadingNuevaActividad, setLoadingNuevaActividad] = useState(false);

  async function handleCrearActividad() {
    if (!nuevaActividad.descripcion.trim()) { toast('Escribe una breve descripción', 'warn'); return; }
    setLoadingNuevaActividad(true);
    try {
      crearActividad({
        clienteId: panelClienteId,
        tipo: nuevaActividad.tipo,
        descripcion: nuevaActividad.descripcion.trim(),
        fecha: nuevaActividad.fecha ? new Date(nuevaActividad.fecha).toISOString() : undefined,
      });
      recargarDatosLocales();
      setNuevaActividad(NUEVA_ACTIVIDAD_INICIAL);
    } finally {
      setLoadingNuevaActividad(false);
    }
  }

  const clientePanel = panelClienteId ? clientesPorId[panelClienteId] : null;

  // ── Kanban: arrastrar y soltar tarjetas entre columnas ──
  function alSoltarEnColumna(e, estadoDestino) {
    e.preventDefault();
    const oportunidadId = e.dataTransfer.getData('text/oportunidad-id');
    const oportunidad = oportunidades.find(o => o.id === oportunidadId);
    if (oportunidad) cambiarEstadoOportunidad(oportunidad, estadoDestino);
  }

  const oportunidadesKanban = oportunidades.filter(o => {
    const cliente = clientesPorId[o.clienteId];
    return cliente && clienteCoincideFiltros(cliente);
  });

  // ── Dashboard ──
  const totalClientes = clientes.length;
  const nuevosEnPeriodo = clientes.filter(c => {
    const f = extras[c.id]?.fechaPrimerContacto;
    if (!f) return false;
    if (filtros.desde && f < filtros.desde) return false;
    if (filtros.hasta && f > filtros.hasta) return false;
    return true;
  }).length;
  const seguimientosVencidos = oportunidades.filter(o =>
    o.proximoSeguimiento && o.proximoSeguimiento < hoyISODate() && !['ganada', 'perdida'].includes(o.estado)
  ).length;
  const ventasEnPeriodo = oportunidades.filter(o => {
    if (o.estado !== 'ganada') return false;
    const f = o.actualizadoEn?.slice(0, 10);
    if (filtros.desde && f < filtros.desde) return false;
    if (filtros.hasta && f > filtros.hasta) return false;
    return true;
  }).length;
  const cerradasEnPeriodo = oportunidades.filter(o => {
    if (!['ganada', 'perdida'].includes(o.estado)) return false;
    const f = o.actualizadoEn?.slice(0, 10);
    if (filtros.desde && f < filtros.desde) return false;
    if (filtros.hasta && f > filtros.hasta) return false;
    return true;
  }).length;
  const conversionPct = cerradasEnPeriodo ? Math.round((ventasEnPeriodo / cerradasEnPeriodo) * 100) : 0;

  const clientesPorCanal = useMemo(() => {
    const conteo = {};
    clientes.forEach(c => {
      const key = extras[c.id]?.canalOrigen || 'desconocido';
      conteo[key] = (conteo[key] || 0) + 1;
    });
    return Object.entries(conteo)
      .map(([key, total]) => ({ key, total, label: canales.find(c => c.key === key)?.label || key }))
      .sort((a, b) => b.total - a.total);
  }, [clientes, extras, canales]);

  const interesesMasConsultados = useMemo(() => {
    const conteo = {};
    Object.values(extras).forEach(extra => {
      (extra.intereses || []).forEach(k => { conteo[k] = (conteo[k] || 0) + 1; });
    });
    return Object.entries(conteo)
      .map(([key, total]) => ({ key, total, label: intereses.find(i => i.key === key)?.label || key }))
      .sort((a, b) => b.total - a.total);
  }, [extras, intereses]);

  const maxCanal = Math.max(1, ...clientesPorCanal.map(c => c.total));
  const maxInteres = Math.max(1, ...interesesMasConsultados.map(i => i.total));

  // ── Render ──
  return (
    <div className="page">
      <style>{ESTILOS_CRM}</style>

      {/* HEADER */}
      <div className="header">
        <div className="brand">
          <div className="brand-icon" style={{ background: '#3b82f618', color: '#3b82f6' }}>
            <i className="ti ti-address-book"></i>
          </div>
          <div>
            <h1>CRM Clientes</h1>
            <p>Clientes y oportunidades comerciales · CAPTUSTEC</p>
          </div>
        </div>
        <button className="btn-add" onClick={() => setModalNuevo(true)}>
          <i className="ti ti-user-plus" style={{ fontSize: 15 }}></i> Nuevo contacto
        </button>
      </div>

      {offline && (
        <div className="banner show">
          <i className="ti ti-wifi-off" style={{ fontSize: 15 }}></i>
          No se puede conectar al servidor.
        </div>
      )}

      {/* TABS DE VISTA */}
      <div className="crm-tabs">
        <button className={`crm-tab${vista === 'lista' ? ' active' : ''}`} onClick={() => setVista('lista')}>
          <i className="ti ti-list"></i> Lista
        </button>
        <button className={`crm-tab${vista === 'kanban' ? ' active' : ''}`} onClick={() => setVista('kanban')}>
          <i className="ti ti-layout-kanban"></i> Oportunidades
        </button>
        <button className={`crm-tab${vista === 'dashboard' ? ' active' : ''}`} onClick={() => setVista('dashboard')}>
          <i className="ti ti-chart-bar"></i> Panel
        </button>
      </div>

      {/* KPIs rápidos (siempre visibles salvo en Panel, que ya trae los suyos) */}
      {vista !== 'dashboard' && (
        <div className="kpi-row tres">
          <div className="kpi">
            <div className="kpi-label"><i className="ti ti-users" style={{ fontSize: 13, color: '#6b7280' }}></i> Base Total</div>
            <div className="kpi-value">{totalClientes}</div>
            <div className="kpi-sub">Contactos registrados</div>
          </div>
          <div className="kpi">
            <div className="kpi-label"><i className="ti ti-layout-kanban" style={{ fontSize: 13, color: '#0ea5e9' }}></i> Oportunidades activas</div>
            <div className="kpi-value" style={{ color: '#0ea5e9' }}>{kpiOportunidadesActivas}</div>
            <div className="kpi-sub">{kpiCotizacionesPendientes} con cotización pendiente</div>
          </div>
          <div className="kpi">
            <div className="kpi-label"><i className="ti ti-briefcase" style={{ fontSize: 13, color: '#10b981' }}></i> Ventas realizadas</div>
            <div className="kpi-value" style={{ color: '#10b981' }}>{kpiVentas}</div>
            <div className="kpi-sub">Oportunidades ganadas</div>
          </div>
        </div>
      )}

      {/* BÚSQUEDA Y FILTROS */}
      {vista !== 'dashboard' && (
        <div className="form-card" style={{ padding: '12px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="filtro-row" style={{ padding: 0, margin: 0, border: 'none', flex: 1, minWidth: 220 }}>
              <i className="ti ti-search" style={{ fontSize: 16, color: '#9ca3af', marginLeft: 5 }}></i>
              <input type="text" placeholder="Buscar por nombre, documento o WhatsApp..." value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: '8px' }} />
            </div>
            <button className="btn-edit" style={{ width: 'auto', padding: '0 12px', gap: 6, display: 'flex', alignItems: 'center' }}
              onClick={() => setMostrarFiltros(m => !m)}>
              <i className="ti ti-filter"></i> Filtros{filtrosActivos ? ' ●' : ''}
            </button>
          </div>

          {mostrarFiltros && (
            <div className="crm-filtros">
              <div className="crm-filtro-field">
                <label>Canal</label>
                <select value={filtros.canal} onChange={e => setFiltros(f => ({ ...f, canal: e.target.value }))}>
                  <option value="">Todos</option>
                  {canales.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div className="crm-filtro-field">
                <label>Interés</label>
                <select value={filtros.interes} onChange={e => setFiltros(f => ({ ...f, interes: e.target.value }))}>
                  <option value="">Todos</option>
                  {intereses.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
                </select>
              </div>
              <div className="crm-filtro-field">
                <label>Estado</label>
                <select value={filtros.estado} onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))}>
                  <option value="">Todos</option>
                  {ESTADOS_OPORTUNIDAD.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                </select>
              </div>
              <div className="crm-filtro-field">
                <label>Responsable</label>
                <input type="text" list="crm-lista-usuarios" value={filtros.responsable}
                  onChange={e => setFiltros(f => ({ ...f, responsable: e.target.value }))} placeholder="Nombre" />
              </div>
              <div className="crm-filtro-field">
                <label>Desde</label>
                <input type="date" value={filtros.desde} onChange={e => setFiltros(f => ({ ...f, desde: e.target.value }))} />
              </div>
              <div className="crm-filtro-field">
                <label>Hasta</label>
                <input type="date" value={filtros.hasta} onChange={e => setFiltros(f => ({ ...f, hasta: e.target.value }))} />
              </div>
              {filtrosActivos && (
                <button className="btn-del" style={{ width: 'auto', padding: '0 12px', alignSelf: 'flex-end' }}
                  onClick={() => setFiltros({ canal: '', interes: '', estado: '', responsable: '', desde: '', hasta: '' })}>
                  Limpiar
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── VISTA: LISTA ── */}
      {vista === 'lista' && (
        <div className="table-card">
          <div className="table-head">
            <div className="table-title"><i className="ti ti-list-details"></i> Fichas de Clientes</div>
            <div className="table-actions"><span className="badge">{clientesFiltrados.length} registro(s)</span></div>
          </div>
          {!clientesFiltrados.length ? (
            <div className="empty"><i className="ti ti-address-book"></i><p>Sin contactos registrados</p></div>
          ) : (
            <table>
              <thead>
                <tr><th>Cliente</th><th>Contacto</th><th>Canal</th><th>Intereses</th><th>Última oportunidad</th><th>Últ. interacción</th><th></th></tr>
              </thead>
              <tbody>
                {[...clientesFiltrados].reverse().map(c => {
                  const extra = extras[c.id] || {};
                  const ult = ultimaOportunidad(c.id);
                  const ultAct = ultimaActividad(c.id);
                  const canal = canales.find(ca => ca.key === extra.canalContacto);
                  return (
                    <tr key={c.id} className="row-in">
                      <td style={{ fontWeight: 500, color: '#111827', cursor: 'pointer' }} onClick={() => abrirPanel(c)}>
                        {c.nombre}
                        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginTop: 2 }}>
                          {extra.tipo === 'empresa' ? 'Empresa' : 'Persona'}{c.documento ? ` · ${c.documento}` : ''}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 13 }}>
                          {c.telefono ? <span><i className="ti ti-phone" style={{ color: '#9ca3af', width: 14 }}></i> {c.telefono}</span> : null}
                          {extra.whatsapp && extra.whatsapp !== c.telefono ? <span><i className="ti ti-brand-whatsapp" style={{ color: '#9ca3af', width: 14 }}></i> {extra.whatsapp}</span> : null}
                          {c.correo ? <span><i className="ti ti-mail" style={{ color: '#9ca3af', width: 14 }}></i> {c.correo}</span> : null}
                          {!c.telefono && !extra.whatsapp && !c.correo && <span style={{ color: '#d1d5db' }}>—</span>}
                        </div>
                      </td>
                      <td>{canal ? <span className="crm-badge-chip"><i className={`ti ${canal.icon}`}></i> {canal.label}</span> : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td><ChipsIntereses keys={extra.intereses} intereses={intereses} /></td>
                      <td>{ult ? <InsigniaEstado estadoKey={ult.estado} /> : <span style={{ color: '#d1d5db' }}>Sin oportunidades</span>}</td>
                      <td style={{ fontSize: 12, color: '#6b7280' }}>{ultAct ? formatearFecha(ultAct.fecha) : '—'}</td>
                      <td style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'flex-end' }}>
                        <button className="btn-edit" onClick={() => abrirPanel(c)} title="Ver ficha"><i className="ti ti-eye"></i></button>
                        <button className="btn-del" onClick={() => eliminar(c.id, c.nombre)} title="Eliminar"><i className="ti ti-trash"></i></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── VISTA: KANBAN ── */}
      {vista === 'kanban' && (
        <div className="crm-kanban">
          {ESTADOS_OPORTUNIDAD.map(estado => {
            const tarjetas = oportunidadesKanban.filter(o => o.estado === estado.key);
            return (
              <div key={estado.key} className="crm-kanban-col"
                onDragOver={e => e.preventDefault()} onDrop={e => alSoltarEnColumna(e, estado.key)}>
                <div className="crm-kanban-col-head" style={{ color: estado.color }}>
                  <span>{estado.label}</span>
                  <span className="badge">{tarjetas.length}</span>
                </div>
                {!tarjetas.length && <div className="crm-empty-mini">Sin oportunidades</div>}
                {tarjetas.map(o => {
                  const cliente = clientesPorId[o.clienteId];
                  if (!cliente) return null;
                  return (
                    <div key={o.id} className="crm-kanban-card" draggable
                      onDragStart={e => e.dataTransfer.setData('text/oportunidad-id', o.id)}
                      onClick={() => abrirPanel(cliente, 'oportunidades')}>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{cliente.nombre}</div>
                      <ChipsIntereses keys={o.intereses} intereses={intereses} max={2} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#9ca3af' }}>
                        <span>{o.responsable || 'Sin responsable'}</span>
                        <span>{formatearFecha(o.actualizadoEn)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── VISTA: DASHBOARD ── */}
      {vista === 'dashboard' && (
        <div>
          <div className="form-card" style={{ padding: '12px 20px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="crm-filtro-field">
              <label>Desde</label>
              <input type="date" value={filtros.desde} onChange={e => setFiltros(f => ({ ...f, desde: e.target.value }))} />
            </div>
            <div className="crm-filtro-field">
              <label>Hasta</label>
              <input type="date" value={filtros.hasta} onChange={e => setFiltros(f => ({ ...f, hasta: e.target.value }))} />
            </div>
            {(filtros.desde || filtros.hasta) && (
              <button className="btn-del" style={{ width: 'auto', padding: '0 12px' }}
                onClick={() => setFiltros(f => ({ ...f, desde: '', hasta: '' }))}>Ver todo el periodo</button>
            )}
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Afecta "Nuevos interesados", "Ventas" y "Conversión"</span>
          </div>

          <div className="kpi-row tres">
            <div className="kpi"><div className="kpi-label"><i className="ti ti-users"></i> Total de clientes</div><div className="kpi-value">{totalClientes}</div></div>
            <div className="kpi"><div className="kpi-label"><i className="ti ti-user-plus"></i> Nuevos interesados</div><div className="kpi-value" style={{ color: '#0ea5e9' }}>{nuevosEnPeriodo}</div></div>
            <div className="kpi"><div className="kpi-label"><i className="ti ti-layout-kanban"></i> Oportunidades activas</div><div className="kpi-value" style={{ color: '#0ea5e9' }}>{kpiOportunidadesActivas}</div></div>
            <div className="kpi"><div className="kpi-label"><i className="ti ti-file-invoice"></i> Cotizaciones pendientes</div><div className="kpi-value" style={{ color: '#f59e0b' }}>{kpiCotizacionesPendientes}</div></div>
            <div className="kpi"><div className="kpi-label"><i className="ti ti-briefcase"></i> Ventas concretadas</div><div className="kpi-value" style={{ color: '#10b981' }}>{ventasEnPeriodo}</div></div>
            <div className="kpi"><div className="kpi-label"><i className="ti ti-alarm"></i> Seguimientos vencidos</div><div className="kpi-value" style={{ color: '#dc2626' }}>{seguimientosVencidos}</div></div>
            <div className="kpi"><div className="kpi-label"><i className="ti ti-percentage"></i> Conversión a venta</div><div className="kpi-value">{conversionPct}%</div><div className="kpi-sub">Sobre oportunidades cerradas en el periodo</div></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            <div className="table-card">
              <div className="table-head"><div className="table-title"><i className="ti ti-share"></i> Clientes por canal</div></div>
              <div style={{ padding: 16 }}>
                {!clientesPorCanal.length && <div className="crm-empty-mini">Sin datos todavía</div>}
                {clientesPorCanal.map(c => (
                  <div key={c.key} className="crm-bar-row">
                    <span className="crm-bar-label">{c.label}</span>
                    <div className="crm-bar-track"><div className="crm-bar-fill" style={{ width: `${(c.total / maxCanal) * 100}%` }}></div></div>
                    <span className="crm-bar-total">{c.total}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="table-card">
              <div className="table-head"><div className="table-title"><i className="ti ti-star"></i> Productos/servicios más consultados</div></div>
              <div style={{ padding: 16 }}>
                {!interesesMasConsultados.length && <div className="crm-empty-mini">Sin datos todavía</div>}
                {interesesMasConsultados.map(i => (
                  <div key={i.key} className="crm-bar-row">
                    <span className="crm-bar-label">{i.label}</span>
                    <div className="crm-bar-track"><div className="crm-bar-fill" style={{ width: `${(i.total / maxInteres) * 100}%`, background: '#10b981' }}></div></div>
                    <span className="crm-bar-total">{i.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRO RÁPIDO */}
      {modalNuevo && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setModalNuevo(false); }}>
          <div className="modal">
            <div className="modal-title"><i className="ti ti-user-plus"></i> Registrar nuevo contacto</div>

            <div className="modal-fields">
              <div className="modal-field" style={{ gridColumn: '1/-1' }}>
                <label>Nombre o Razón Social *</label>
                <input type="text" placeholder="Ej: Empresa ABC S.A.C. / Juan Pérez" value={formNuevo.nombre}
                  onChange={e => setFormNuevo(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label>Tipo</label>
                <select value={formNuevo.tipo} onChange={e => setFormNuevo(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="persona">Persona</option>
                  <option value="empresa">Empresa</option>
                </select>
              </div>
              <div className="modal-field">
                <label>Teléfono / WhatsApp</label>
                <input type="text" placeholder="999 999 999" value={formNuevo.telefono}
                  onChange={e => setFormNuevo(f => ({ ...f, telefono: e.target.value }))} />
              </div>
              <div className="modal-field" style={{ gridColumn: '1/-1' }}>
                <label>¿Por qué canal se comunicó?</label>
                <SelectorChips opciones={canales} seleccion={formNuevo.canal} multiple={false}
                  onCambiar={v => setFormNuevo(f => ({ ...f, canal: v }))}
                  onAgregarOpcion={manejarAgregarCanal} placeholderNuevo="Otro canal..." />
              </div>
              <div className="modal-field" style={{ gridColumn: '1/-1' }}>
                <label>¿Qué le interesa?</label>
                <SelectorChips opciones={intereses} seleccion={formNuevo.intereses} multiple
                  onCambiar={v => setFormNuevo(f => ({ ...f, intereses: v }))}
                  onAgregarOpcion={manejarAgregarInteres} placeholderNuevo="Otro interés..." />
              </div>
              <div className="modal-field" style={{ gridColumn: '1/-1' }}>
                <label>Descripción breve de su consulta</label>
                <input type="text" placeholder="Ej: Pregunta por cámaras para su tienda" value={formNuevo.descripcion}
                  onChange={e => setFormNuevo(f => ({ ...f, descripcion: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleCrearContacto()} />
              </div>
              <div className="modal-field" style={{ gridColumn: '1/-1' }}>
                <label>Responsable de la atención</label>
                <input type="text" list="crm-lista-usuarios" placeholder="Nombre de quien atiende" value={formNuevo.responsable}
                  onChange={e => setFormNuevo(f => ({ ...f, responsable: e.target.value }))} />
              </div>
            </div>

            {formErr && <div className="form-error show">{formErr}</div>}

            <div className="modal-btns">
              <button className="btn-cancel" onClick={() => setModalNuevo(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleCrearContacto} disabled={loadingAdd}>
                {loadingAdd ? <span className="spinner"></span> : <><i className="ti ti-device-floppy" style={{ fontSize: 14 }}></i> Guardar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PANEL LATERAL: FICHA DE CLIENTE */}
      {clientePanel && (
        <div className="crm-side-overlay" onClick={e => { if (e.target === e.currentTarget) cerrarPanel(); }}>
          <div className="crm-side-panel">
            <div className="crm-side-header">
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{clientePanel.nombre}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Última interacción: {ultimaActividad(panelClienteId) ? formatearFecha(ultimaActividad(panelClienteId).fecha) : '—'}</div>
              </div>
              <button className="btn-cancel" style={{ width: 32, padding: 0 }} onClick={cerrarPanel}><i className="ti ti-x"></i></button>
            </div>

            <div className="crm-side-tabs">
              <button className={`crm-side-tab${panelTab === 'info' ? ' active' : ''}`} onClick={() => setPanelTab('info')}>Info general</button>
              <button className={`crm-side-tab${panelTab === 'oportunidades' ? ' active' : ''}`} onClick={() => setPanelTab('oportunidades')}>
                Oportunidades {oportunidadesDe(panelClienteId).length ? `(${oportunidadesDe(panelClienteId).length})` : ''}
              </button>
              <button className={`crm-side-tab${panelTab === 'historial' ? ' active' : ''}`} onClick={() => setPanelTab('historial')}>Historial</button>
            </div>

            <div className="crm-side-body">
              {panelTab === 'info' && (
                <div className="modal-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="modal-field" style={{ gridColumn: '1/-1' }}>
                    <label>Nombre o Razón Social</label>
                    <input type="text" value={panelInfo.nombre} onChange={e => setPanelInfo(p => ({ ...p, nombre: e.target.value }))} />
                  </div>
                  <div className="modal-field">
                    <label>Tipo</label>
                    <select value={panelInfo.tipo} onChange={e => setPanelInfo(p => ({ ...p, tipo: e.target.value }))}>
                      <option value="persona">Persona</option>
                      <option value="empresa">Empresa</option>
                    </select>
                  </div>
                  <div className="modal-field">
                    <label>DNI / RUC</label>
                    <input type="text" value={panelInfo.documento} onChange={e => setPanelInfo(p => ({ ...p, documento: e.target.value }))} />
                  </div>
                  <div className="modal-field">
                    <label>Teléfono</label>
                    <input type="text" value={panelInfo.telefono} onChange={e => setPanelInfo(p => ({ ...p, telefono: e.target.value }))} />
                  </div>
                  <div className="modal-field">
                    <label>WhatsApp</label>
                    <input type="text" value={panelInfo.whatsapp} onChange={e => setPanelInfo(p => ({ ...p, whatsapp: e.target.value }))} />
                  </div>
                  <div className="modal-field" style={{ gridColumn: '1/-1' }}>
                    <label>Correo electrónico</label>
                    <input type="email" value={panelInfo.correo} onChange={e => setPanelInfo(p => ({ ...p, correo: e.target.value }))} />
                  </div>
                  <div className="modal-field" style={{ gridColumn: '1/-1' }}>
                    <label>Canal por el que se comunicó</label>
                    <SelectorChips opciones={canales} seleccion={panelInfo.canalContacto} multiple={false}
                      onCambiar={v => setPanelInfo(p => ({ ...p, canalContacto: v }))}
                      onAgregarOpcion={manejarAgregarCanal} placeholderNuevo="Otro canal..." />
                  </div>
                  <div className="modal-field" style={{ gridColumn: '1/-1' }}>
                    <label>Cómo conoció CAPTUSTEC (si es distinto)</label>
                    <SelectorChips opciones={canales} seleccion={panelInfo.canalOrigen} multiple={false}
                      onCambiar={v => setPanelInfo(p => ({ ...p, canalOrigen: v }))}
                      onAgregarOpcion={manejarAgregarCanal} placeholderNuevo="Otro canal..." />
                  </div>
                  <div className="modal-field" style={{ gridColumn: '1/-1' }}>
                    <label>Productos o servicios de interés</label>
                    <SelectorChips opciones={intereses} seleccion={panelInfo.intereses} multiple
                      onCambiar={v => setPanelInfo(p => ({ ...p, intereses: v }))}
                      onAgregarOpcion={manejarAgregarInteres} placeholderNuevo="Otro interés..." />
                  </div>
                  <div className="modal-field" style={{ gridColumn: '1/-1' }}>
                    <label>Descripción de su consulta o necesidad</label>
                    <input type="text" value={panelInfo.descripcionConsulta} onChange={e => setPanelInfo(p => ({ ...p, descripcionConsulta: e.target.value }))} />
                  </div>
                  <div className="modal-field">
                    <label>Fecha del primer contacto</label>
                    <input type="date" value={panelInfo.fechaPrimerContacto} onChange={e => setPanelInfo(p => ({ ...p, fechaPrimerContacto: e.target.value }))} />
                  </div>
                  <div className="modal-field">
                    <label>Responsable</label>
                    <input type="text" list="crm-lista-usuarios" value={panelInfo.responsable} onChange={e => setPanelInfo(p => ({ ...p, responsable: e.target.value }))} />
                  </div>
                  <div className="modal-field" style={{ gridColumn: '1/-1' }}>
                    <label>Observaciones adicionales</label>
                    <input type="text" value={panelInfo.observaciones} onChange={e => setPanelInfo(p => ({ ...p, observaciones: e.target.value }))} />
                  </div>

                  <div style={{ gridColumn: '1/-1' }}>
                    <button className="btn-save" style={{ width: '100%' }} onClick={handleGuardarInfo} disabled={loadingPanel}>
                      {loadingPanel ? <span className="spinner"></span> : <><i className="ti ti-check" style={{ fontSize: 14 }}></i> Guardar ficha</>}
                    </button>
                  </div>
                </div>
              )}

              {panelTab === 'oportunidades' && (
                <div>
                  {oportunidadesDe(panelClienteId).map(o => (
                    <div key={o.id} className="crm-opp-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <select value={o.estado} onChange={e => cambiarEstadoOportunidad(o, e.target.value)}>
                          {ESTADOS_OPORTUNIDAD.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                        </select>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatearFecha(o.actualizadoEn)}</span>
                      </div>
                      <ChipsIntereses keys={o.intereses} intereses={intereses} />
                      {o.responsable && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}><i className="ti ti-user" style={{ marginRight: 4 }}></i>{o.responsable}</div>}
                      {o.observaciones && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{o.observaciones}</div>}
                      {o.estado === 'perdida' && o.motivoNoConcretado && (
                        <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}><i className="ti ti-alert-circle" style={{ marginRight: 4 }}></i>{o.motivoNoConcretado}</div>
                      )}
                    </div>
                  ))}
                  {!oportunidadesDe(panelClienteId).length && <div className="crm-empty-mini">Todavía no tiene oportunidades</div>}

                  <div className="crm-inline-form">
                    <div className="form-card-title" style={{ fontSize: 13 }}><i className="ti ti-plus"></i> Nueva oportunidad</div>
                    <select value={nuevaOportunidad.estado} onChange={e => setNuevaOportunidad(n => ({ ...n, estado: e.target.value }))} style={{ marginBottom: 8 }}>
                      {ESTADOS_OPORTUNIDAD.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                    </select>
                    <SelectorChips opciones={intereses} seleccion={nuevaOportunidad.intereses} multiple
                      onCambiar={v => setNuevaOportunidad(n => ({ ...n, intereses: v }))}
                      onAgregarOpcion={manejarAgregarInteres} placeholderNuevo="Otro interés..." />
                    <input type="text" list="crm-lista-usuarios" placeholder="Responsable" value={nuevaOportunidad.responsable}
                      onChange={e => setNuevaOportunidad(n => ({ ...n, responsable: e.target.value }))} style={{ marginTop: 8 }} />
                    <input type="date" placeholder="Próximo seguimiento" value={nuevaOportunidad.proximoSeguimiento}
                      onChange={e => setNuevaOportunidad(n => ({ ...n, proximoSeguimiento: e.target.value }))} style={{ marginTop: 8 }} />
                    <input type="text" placeholder="Observaciones" value={nuevaOportunidad.observaciones}
                      onChange={e => setNuevaOportunidad(n => ({ ...n, observaciones: e.target.value }))} style={{ marginTop: 8 }} />
                    <button className="btn-add" style={{ marginTop: 8, width: '100%' }} onClick={handleCrearOportunidad} disabled={loadingNuevaOportunidad}>
                      {loadingNuevaOportunidad ? <span className="spinner"></span> : 'Crear oportunidad'}
                    </button>
                  </div>
                </div>
              )}

              {panelTab === 'historial' && (
                <div>
                  <div className="crm-timeline">
                    {actividadesDe(panelClienteId).map(a => {
                      const t = getTipoActividad(a.tipo);
                      return (
                        <div key={a.id} className="crm-timeline-item">
                          <div className="crm-timeline-dot"><i className={`ti ${t.icon}`}></i></div>
                          <div>
                            <div style={{ fontSize: 13, color: '#111827' }}>{a.descripcion}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{t.label} · {formatearFecha(a.fecha)}{a.responsable ? ` · ${a.responsable}` : ''}</div>
                          </div>
                        </div>
                      );
                    })}
                    {!actividadesDe(panelClienteId).length && <div className="crm-empty-mini">Sin actividad registrada todavía</div>}
                  </div>

                  <div className="crm-inline-form">
                    <div className="form-card-title" style={{ fontSize: 13 }}><i className="ti ti-plus"></i> Registrar actividad</div>
                    <select value={nuevaActividad.tipo} onChange={e => setNuevaActividad(n => ({ ...n, tipo: e.target.value }))}>
                      {TIPOS_ACTIVIDAD.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                    <input type="date" value={nuevaActividad.fecha} onChange={e => setNuevaActividad(n => ({ ...n, fecha: e.target.value }))} style={{ marginTop: 8 }} />
                    <input type="text" placeholder="Descripción" value={nuevaActividad.descripcion}
                      onChange={e => setNuevaActividad(n => ({ ...n, descripcion: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleCrearActividad()} style={{ marginTop: 8 }} />
                    <button className="btn-add" style={{ marginTop: 8, width: '100%' }} onClick={handleCrearActividad} disabled={loadingNuevaActividad}>
                      {loadingNuevaActividad ? <span className="spinner"></span> : 'Agregar al historial'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <datalist id="crm-lista-usuarios">
        {nombresUsuarios.map(n => <option key={n} value={n} />)}
      </datalist>
    </div>
  );
}

// ── Estilos propios del CRM (se suman a los estilos globales existentes,
// sin reemplazarlos; prefijo crm- para no chocar con clases ya usadas) ──
const ESTILOS_CRM = `
.crm-tabs { display: flex; gap: 4px; margin-bottom: 16px; background: #f3f4f6; padding: 4px; border-radius: 10px; width: fit-content; }
.crm-tab { display: flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; background: transparent; border-radius: 8px; font-size: 13px; font-weight: 500; color: #6b7280; cursor: pointer; }
.crm-tab.active { background: #fff; color: #111827; box-shadow: 0 1px 2px rgba(0,0,0,.08); }

.crm-filtros { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f3f4f6; }
.crm-filtro-field { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
.crm-filtro-field label { font-size: 11px; color: #9ca3af; font-weight: 500; }
.crm-filtro-field select, .crm-filtro-field input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 7px 10px; font-size: 13px; outline: none; }

.crm-chip-group { display: flex; flex-wrap: wrap; gap: 6px; }
.crm-chip { display: flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 20px; border: 1px solid #e5e7eb; background: #fff; font-size: 12px; color: #4b5563; cursor: pointer; }
.crm-chip.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
.crm-chip-add { display: flex; align-items: center; gap: 4px; border: 1px dashed #d1d5db; border-radius: 20px; padding: 2px 4px 2px 10px; }
.crm-chip-add input { border: none; outline: none; font-size: 12px; width: 110px; }
.crm-chip-add button { border: none; background: #f3f4f6; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #4b5563; }

.crm-badge-chip { display: inline-flex; align-items: center; gap: 4px; background: #eff6ff; color: #3b82f6; font-size: 11px; padding: 3px 8px; border-radius: 6px; white-space: nowrap; }

.crm-kanban { display: grid; grid-auto-flow: column; grid-auto-columns: 260px; gap: 14px; overflow-x: auto; padding-bottom: 10px; }
.crm-kanban-col { background: #f9fafb; border-radius: 12px; padding: 10px; min-height: 200px; }
.crm-kanban-col-head { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 600; margin-bottom: 10px; padding: 0 2px; }
.crm-kanban-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; margin-bottom: 8px; cursor: grab; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
.crm-kanban-card:active { cursor: grabbing; }
.crm-empty-mini { font-size: 12px; color: #9ca3af; text-align: center; padding: 14px 6px; }

.crm-side-overlay { position: fixed; inset: 0; background: rgba(17,24,39,.35); display: flex; justify-content: flex-end; z-index: 60; }
.crm-side-panel { width: 440px; max-width: 94vw; background: #fff; height: 100%; display: flex; flex-direction: column; box-shadow: -8px 0 24px rgba(0,0,0,.12); animation: crm-slide-in .18s ease-out; }
@keyframes crm-slide-in { from { transform: translateX(16px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.crm-side-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 18px 20px; border-bottom: 1px solid #f3f4f6; }
.crm-side-tabs { display: flex; gap: 4px; padding: 10px 20px 0; border-bottom: 1px solid #f3f4f6; }
.crm-side-tab { border: none; background: transparent; padding: 8px 10px; font-size: 12.5px; color: #6b7280; cursor: pointer; border-bottom: 2px solid transparent; }
.crm-side-tab.active { color: #3b82f6; border-bottom-color: #3b82f6; font-weight: 600; }
.crm-side-body { padding: 18px 20px; overflow-y: auto; flex: 1; }

.crm-opp-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; margin-bottom: 10px; }
.crm-opp-card select { border: 1px solid #e5e7eb; border-radius: 6px; padding: 4px 8px; font-size: 12px; }

.crm-inline-form { margin-top: 16px; padding: 14px; background: #f9fafb; border-radius: 10px; display: flex; flex-direction: column; gap: 0; }
.crm-inline-form select, .crm-inline-form input { width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; padding: 7px 10px; font-size: 13px; outline: none; }

.crm-timeline { display: flex; flex-direction: column; gap: 14px; }
.crm-timeline-item { display: flex; gap: 10px; align-items: flex-start; }
.crm-timeline-dot { width: 26px; height: 26px; border-radius: 50%; background: #eff6ff; color: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }

.crm-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.crm-bar-label { font-size: 12px; color: #4b5563; width: 150px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.crm-bar-track { flex: 1; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
.crm-bar-fill { height: 100%; background: #3b82f6; border-radius: 4px; }
.crm-bar-total { font-size: 12px; color: #9ca3af; width: 24px; text-align: right; flex-shrink: 0; }

@media (max-width: 720px) {
  .crm-side-panel { width: 100vw; }
}
`;