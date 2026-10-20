import { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import {
  getEgresosResumen, getEgresos, getBalance,
  postEgreso, putEgreso, deleteEgreso,
  getProyectos, postProyecto, deleteProyecto
} from '../api';
import { useFechas, fechaIso, fechaDisplay } from '../hooks/useFechas';
import { useToast } from '../components/Toast';
import FiltroFecha from '../components/FiltroFecha';
import ProyectoCombobox from '../components/ProyectoCombobox';

Chart.register(...registerables);

const CATEGORIAS = [
  { key: 'Peaje',        icon: 'ti-road' },
  { key: 'Combustible',  icon: 'ti-gas-station' },
  { key: 'Productos',    icon: 'ti-package' },
  { key: 'Mantto. Auto', icon: 'ti-car' },
  { key: 'Alimentos',    icon: 'ti-tools-kitchen-2' },
  { key: 'Compartir',    icon: 'ti-users' },
  { key: 'Indumentaria', icon: 'ti-shirt' },
  { key: '__otros__',    icon: 'ti-dots-circle-horizontal', label: 'Otro' },
];

const COLORES_CAT = {
  'Peaje': '#6366f1', 'Combustible': '#f97316', 'Productos': '#0ea5e9',
  'Mantto. Auto': '#8b5cf6', 'Alimentos': '#10b981', 'Compartir': '#f59e0b',
  'Indumentaria': '#ec4899',
};
const COLORES_PROY = ['#dc2626','#1a56db','#059669','#d97706','#8b5cf6','#f97316','#06b6d4','#ec4899'];
const getColorCat  = c => COLORES_CAT[c] || '#9ca3af';
const getBgCat     = c => getColorCat(c) + '18';
const getColorProy = i => COLORES_PROY[i % COLORES_PROY.length];
const CAT_KEYS     = CATEGORIAS.filter(c => c.key !== '__otros__').map(c => c.key);

export default function Egresos() {
  const toast = useToast();
  const { periodo, setPeriodo, rangoDesde, setRangoDesde, rangoHasta, setRangoHasta, calcRango, labelPeriodo } = useFechas();

  const [proyectos, setProyectos]     = useState([]);
  const [filtroActivo, setFiltroActivo] = useState('__todos__');
  const [nuevoProyecto, setNuevoProyecto] = useState('');
  const [egresos, setEgresos]         = useState([]);
  const [resumen, setResumen]         = useState({ total: 0, count: 0, porCategoria: {}, porProyecto: {} });
  const [balance, setBalance]         = useState({ ingresos: 0, neto: 0 });
  const [offline, setOffline]         = useState(false);

  // Form
  const [selCat, setSelCat]           = useState('');
  const [otrosVal, setOtrosVal]       = useState('');
  const [detalle, setDetalle]         = useState('');
  const [monto, setMonto]             = useState('');
  const [fecha, setFecha]             = useState(fechaIso());
  const [proyecto, setProyecto]       = useState('General');
  const [formErr, setFormErr]         = useState('');
  const [loadingAdd, setLoadingAdd]   = useState(false);

  // Modal
  const [modal, setModal]             = useState(null); // { egreso }
  const [mCat, setMCat]               = useState('');
  const [mOtros, setMOtros]           = useState('');
  const [mDetalle, setMDetalle]       = useState('');
  const [mMonto, setMMonto]           = useState('');
  const [mFecha, setMFecha]           = useState('');
  const [mProyecto, setMProyecto]     = useState('General');
  const [loadingSave, setLoadingSave] = useState(false);

  // Charts
  const donutRef = useRef(null);
  const proyRef  = useRef(null);
  const chartDonut = useRef(null);
  const chartProy  = useRef(null);

  // ── Proyectos ──
  async function cargarProyectos() {
    try { const p = await getProyectos(); setProyectos(p); }
    catch {}
  }
  useEffect(() => { cargarProyectos(); }, []);

  async function agregarProyecto() {
    if (!nuevoProyecto.trim()) return;
    try {
      await postProyecto(nuevoProyecto.trim());
      setNuevoProyecto('');
      await cargarProyectos();
      toast(`Proyecto "${nuevoProyecto.trim()}" creado`, 'success');
    } catch (e) { toast(e.message || 'Error al crear proyecto', 'err'); }
  }

  async function eliminarProyecto(id, nombre) {
    try {
      await deleteProyecto(id);
      if (filtroActivo === nombre) setFiltroActivo('__todos__');
      await cargarProyectos();
      await cargar();
      toast('Proyecto eliminado (egresos reasignados a General)', 'warn');
    } catch (e) { toast(e.message || 'Error al eliminar', 'err'); }
  }

  // ── Datos ──
  const cargar = useCallback(async () => {
    const rango = calcRango();
    if (!rango.desde || !rango.hasta) return;
    try {
      const [res, bal] = await Promise.all([
        getEgresosResumen(rango.desde, rango.hasta, filtroActivo !== '__todos__' ? filtroActivo : null),
        getBalance(rango.desde, rango.hasta)
      ]);
      setResumen(res);
      setEgresos(res.egresos || []);
      setBalance(bal);
      setOffline(false);
    } catch { setOffline(true); }
  }, [calcRango, filtroActivo]);

  useEffect(() => { cargar(); }, [periodo, rangoDesde, rangoHasta, filtroActivo]);
  useEffect(() => { const t = setInterval(cargar, 60000); return () => clearInterval(t); }, [cargar]);

  // ── Charts ──
  useEffect(() => {
    if (!donutRef.current || !proyRef.current) return;

    if (chartDonut.current) { chartDonut.current.destroy(); chartDonut.current = null; }
    if (chartProy.current)  { chartProy.current.destroy();  chartProy.current  = null; }

    const { porCategoria = {}, porProyecto = {} } = resumen;
    const catLabels = Object.keys(porCategoria);
    const catData   = catLabels.map(l => parseFloat((porCategoria[l]).toFixed(2)));
    const catCols   = catLabels.map(l => getColorCat(l));

    if (catLabels.length) {
      chartDonut.current = new Chart(donutRef.current.getContext('2d'), {
        type: 'doughnut',
        data: { labels: catLabels, datasets: [{ data: catData, backgroundColor: catCols, borderColor: '#fff', borderWidth: 3, hoverOffset: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' S/ ' + c.parsed.toFixed(2) } } } }
      });
    }

    const proyLabels = Object.keys(porProyecto);
    const proyData   = proyLabels.map(l => parseFloat((porProyecto[l]).toFixed(2)));
    const proyCols   = proyLabels.map((_, i) => getColorProy(i));

    if (proyLabels.length) {
      chartProy.current = new Chart(proyRef.current.getContext('2d'), {
        type: 'bar',
        data: { labels: proyLabels, datasets: [{ data: proyData, backgroundColor: proyCols, borderRadius: 6, borderSkipped: false }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' S/ ' + c.parsed.y.toFixed(2) } } },
          scales: {
            x: { ticks: { color: '#9ca3af', font: { size: 11 } }, grid: { display: false } },
            y: { ticks: { color: '#9ca3af', font: { size: 11 }, callback: v => 'S/' + v }, grid: { color: '#f3f4f6' }, beginAtZero: true }
          }
        }
      });
    }

    return () => {
      if (chartDonut.current) { chartDonut.current.destroy(); chartDonut.current = null; }
      if (chartProy.current)  { chartProy.current.destroy();  chartProy.current  = null; }
    };
  }, [resumen]);

  // ── Agregar ──
  async function agregar() {
    setFormErr('');
    const catFinal = selCat === '__otros__' ? otrosVal.trim() : selCat;
    if (!selCat)                             { setFormErr('Elige la categoría del gasto.'); return; }
    if (selCat === '__otros__' && !catFinal) { setFormErr('Escribe el nombre del gasto.'); return; }
    if (!monto || parseFloat(monto) <= 0)    { setFormErr('Ingresa un monto válido mayor a 0.'); return; }

    setLoadingAdd(true);
    try {
      await postEgreso({ fecha, categoria: catFinal, detalle: detalle.trim(), monto: parseFloat(monto), proyecto });
      setDetalle(''); setMonto(''); setOtrosVal(''); setSelCat('');
      await cargar();
      toast(`Egreso registrado — S/ ${parseFloat(monto).toFixed(2)} · ${proyecto}`, 'success');
    } catch (e) { toast('Error al guardar: ' + (e.message || 'intenta de nuevo'), 'err'); }
    finally { setLoadingAdd(false); }
  }

  async function eliminarEgreso(id) {
    try { await deleteEgreso(id); await cargar(); toast('Egreso eliminado', ''); }
    catch { toast('Error al eliminar', 'err'); }
  }

  // ── Modal ──
  function abrirModal(e) {
    const esOtro = !CAT_KEYS.includes(e.categoria);
    setMCat(esOtro ? '__otros__' : e.categoria);
    setMOtros(esOtro ? e.categoria : '');
    setMDetalle(e.detalle || '');
    setMMonto(e.monto);
    setMFecha(e.fecha);
    setMProyecto(e.proyecto || 'General');
    setModal(e);
  }

  async function guardarEdicion() {
    const catFinal = mCat === '__otros__' ? mOtros.trim() : mCat;
    if (!catFinal)                        { toast('Elige una categoría', 'warn'); return; }
    if (!mMonto || parseFloat(mMonto) <= 0) { toast('Ingresa un monto válido', 'warn'); return; }

    setLoadingSave(true);
    try {
      await putEgreso(modal.id, { fecha: mFecha, categoria: catFinal, detalle: mDetalle.trim(), monto: parseFloat(mMonto), proyecto: mProyecto || 'General' });
      setModal(null);
      await cargar();
      toast('Egreso actualizado', 'success');
    } catch (e) { toast('Error al guardar: ' + (e.message || 'intenta de nuevo'), 'err'); }
    finally { setLoadingSave(false); }
  }

  // ── Export ──
  async function exportCSV() {
    try {
      const rango = calcRango();
      const data  = await getEgresos(rango.desde, rango.hasta, filtroActivo !== '__todos__' ? filtroActivo : null);
      if (!data.length) { toast('No hay datos para exportar', 'warn'); return; }
      const rows = [['Fecha','Proyecto','Categoría','Detalle','Monto (S/)'], ...data.map(e => [e.fecha, e.proyecto || 'General', e.categoria, e.detalle, e.monto])];
      const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
      a.download = `egresos_${labelPeriodo().replace(/\s/g, '_')}_${fechaIso()}.csv`;
      a.click();
      toast('CSV exportado', 'success');
    } catch { toast('Error al exportar', 'err'); }
  }

  const neto = balance.neto;
  const { porCategoria = {}, porProyecto = {} } = resumen;

  return (
    <div className="page">
      {/* HEADER */}
      <div className="header">
        <div className="brand">
          <div className="brand-icon red"><i className="ti ti-trending-down"></i></div>
          <div>
            <h1>Egresos del día</h1>
            <p>Gastos operativos · Captus</p>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-export" onClick={exportCSV}>
            <i className="ti ti-download" style={{ fontSize: 13 }}></i> CSV
          </button>
        </div>
      </div>

      {/* OFFLINE */}
      {offline && (
        <div className="banner show">
          <i className="ti ti-wifi-off" style={{ fontSize: 15 }}></i>
          No se puede conectar al servidor.
        </div>
      )}

      {/* FILTRO FECHA */}
      <FiltroFecha
        periodo={periodo} setPeriodo={setPeriodo}
        rangoDesde={rangoDesde} setRangoDesde={setRangoDesde}
        rangoHasta={rangoHasta} setRangoHasta={setRangoHasta}
        calcRango={calcRango} labelPeriodo={labelPeriodo}
        onAplicar={cargar} toast={toast}
      />

      {/* KPIs */}
      <div className="kpi-row tres">
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-trending-down" style={{ fontSize: 13, color: '#dc2626' }}></i> Total egresos</div>
          <div className="kpi-value red">S/ {resumen.total?.toFixed(2) || '0.00'}</div>
          <div className="kpi-sub">{resumen.count || 0} registro{resumen.count !== 1 ? 's' : ''}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-cash" style={{ fontSize: 13, color: '#059669' }}></i> Ingresos del día</div>
          <div className="kpi-value green">S/ {balance.ingresos?.toFixed(2) || '0.00'}</div>
          <div className="kpi-sub">ventas registradas</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-scale" style={{ fontSize: 13, color: '#6366f1' }}></i> Balance neto</div>
          <div className="kpi-value" style={{ color: neto >= 0 ? '#059669' : '#dc2626' }}>S/ {neto?.toFixed(2) || '0.00'}</div>
          <div className="kpi-sub">{neto >= 0 ? 'Ganancia neta' : 'En déficit'}</div>
        </div>
      </div>

      {/* GESTIÓN PROYECTOS */}
      <div className="proy-card">
        <div className="proy-header">
          <div className="proy-title"><i className="ti ti-folder"></i> Proyectos</div>
        </div>
        <div className="proy-add-row">
          <input
            type="text" placeholder="Nuevo proyecto (ej: Obra Norte, Cliente XYZ…)"
            maxLength={60} value={nuevoProyecto}
            onChange={e => setNuevoProyecto(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && agregarProyecto()}
          />
          <button className="btn-proy-add" onClick={agregarProyecto}>
            <i className="ti ti-plus" style={{ fontSize: 13 }}></i> Agregar
          </button>
        </div>
        <div className="proy-chips">
          {proyectos.map(p => (
            <span key={p.id} className={`proy-chip${p.nombre === 'General' ? ' general' : ''}`}>
              <i className="ti ti-folder" style={{ fontSize: 11 }}></i>
              {p.nombre}
              {p.nombre !== 'General' && (
                <button className="btn-proy-del" onClick={() => eliminarProyecto(p.id, p.nombre)} title="Eliminar">
                  <i className="ti ti-x"></i>
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* FILTRO POR PROYECTO */}
      <div className="filtro-row">
        <span className="filtro-label"><i className="ti ti-filter" style={{ fontSize: 13 }}></i> Ver:</span>
        <div className="filtro-chips">
          <button className={`filtro-chip${filtroActivo === '__todos__' ? ' active' : ''}`} onClick={() => setFiltroActivo('__todos__')}>Todos</button>
          {proyectos.map(p => (
            <button key={p.id} className={`filtro-chip${filtroActivo === p.nombre ? ' active' : ''}`} onClick={() => setFiltroActivo(p.nombre)}>
              {p.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* FORM */}
      <div className="form-card">
        <div className="form-card-title"><i className="ti ti-receipt-2"></i> Registrar egreso</div>

        {/* Proyecto con combobox */}
        <div className="field-proyecto">
          <label>Proyecto</label>
          <ProyectoCombobox proyectos={proyectos} value={proyecto} onChange={setProyecto} />
        </div>

        <div className="cat-label">Categoría del gasto</div>
        <div className="cat-grid">
          {CATEGORIAS.map(c => (
            <button
              key={c.key}
              className={`cat-btn${selCat === c.key ? ' active' : ''}`}
              onClick={() => { setSelCat(c.key); if (c.key !== '__otros__') setOtrosVal(''); setFormErr(''); }}
            >
              <i className={`ti ${c.icon}`}></i>
              <span>{c.label || c.key}</span>
            </button>
          ))}
        </div>

        {selCat === '__otros__' && (
          <div className="otros-row visible">
            <i className="ti ti-pencil" style={{ fontSize: 16, color: '#9ca3af', flexShrink: 0 }}></i>
            <input type="text" placeholder="Describe el gasto..." value={otrosVal}
              onChange={e => setOtrosVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregar()} />
          </div>
        )}

        <div className="fields-row">
          <div className="field">
            <label>Detalle (opcional)</label>
            <input type="text" placeholder="Ej: Grifo Repsol, Km 45" value={detalle}
              onChange={e => setDetalle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregar()} />
          </div>
          <div className="field">
            <label>Monto (S/)</label>
            <input type="number" placeholder="0.00" min="0" step="0.01" value={monto}
              onChange={e => setMonto(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregar()} />
          </div>
          <div className="field">
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <button className="btn-add" onClick={agregar} disabled={loadingAdd}>
            {loadingAdd ? <span className="spinner"></span> : <><i className="ti ti-plus" style={{ fontSize: 15 }}></i> Agregar</>}
          </button>
        </div>
        {formErr && <div className="form-error show">{formErr}</div>}
      </div>

      {/* TABLE */}
      <div className="table-card">
        <div className="table-head">
          <div className="table-title">
            <i className="ti ti-list"></i> Egresos
            {filtroActivo !== '__todos__' && <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 12, marginLeft: 4 }}>· {filtroActivo}</span>}
          </div>
          <div className="table-actions">
            <span className="badge">{resumen.count || 0} registro{resumen.count !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div>
          {!egresos.length ? (
            <div className="empty">
              <i className="ti ti-receipt-off"></i>
              <p>Sin egresos registrados{filtroActivo !== '__todos__' ? ' para este proyecto' : ' hoy'}</p>
              <small>Agrega el primer gasto con el formulario de arriba</small>
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>#</th><th>Categoría</th><th>Detalle</th><th>Proyecto</th><th>Monto</th><th>Fecha</th><th></th></tr>
              </thead>
              <tbody>
                {[...egresos].reverse().map((e, i) => (
                  <tr key={e.id} className="row-in">
                    <td style={{ color: '#9ca3af', fontSize: 12 }}>{egresos.length - i}</td>
                    <td>
                      <span className="pill" style={{ background: getBgCat(e.categoria), color: getColorCat(e.categoria) }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: getColorCat(e.categoria), display: 'inline-block', flexShrink: 0 }}></span>
                        {e.categoria}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500, color: '#111827' }}>{e.detalle || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                    <td>
                      <span className="pill-proy">
                        <i className="ti ti-folder" style={{ fontSize: 10 }}></i>
                        {e.proyecto || 'General'}
                      </span>
                    </td>
                    <td className="td-monto-red">S/ {parseFloat(e.monto).toFixed(2)}</td>
                    <td style={{ color: '#9ca3af', fontSize: 12 }}>{fechaDisplay(e.fecha)}</td>
                    <td style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button className="btn-edit" onClick={() => abrirModal(e)} title="Editar">
                        <i className="ti ti-pencil"></i>
                      </button>
                      <button className="btn-del" onClick={() => eliminarEgreso(e.id)} title="Eliminar">
                        <i className="ti ti-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CHARTS */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title"><i className="ti ti-chart-donut"></i> Por categoría</div>
          <div className="chart-wrap"><canvas ref={donutRef}></canvas></div>
          <div className="legend">
            {Object.entries(porCategoria).map(([l, v]) => (
              <div key={l} className="legend-item">
                <div className="legend-dot" style={{ background: getColorCat(l) }}></div>
                {l} — S/ {v.toFixed(2)}
              </div>
            ))}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title"><i className="ti ti-folder"></i> Por proyecto</div>
          <div className="chart-wrap"><canvas ref={proyRef}></canvas></div>
          <div className="legend">
            {Object.entries(porProyecto).map(([l, v], i) => (
              <div key={l} className="legend-item">
                <div className="legend-dot" style={{ background: getColorProy(i) }}></div>
                {l} — S/ {v.toFixed(2)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL EDITAR */}
      {modal && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal">
            <div className="modal-title"><i className="ti ti-pencil"></i> Editar egreso</div>

            {/* Proyecto con combobox */}
            <div style={{ marginBottom: 14 }}>
              <div className="field-proyecto">
                <label>Proyecto</label>
                <ProyectoCombobox proyectos={proyectos} value={mProyecto} onChange={setMProyecto} />
              </div>
            </div>

            {/* Categoría */}
            <div style={{ marginBottom: 10 }}>
              <div className="cat-label">Categoría</div>
              <div className="modal-cat-grid">
                {CATEGORIAS.map(c => (
                  <button
                    key={c.key}
                    className={`cat-btn${mCat === c.key ? ' active' : ''}`}
                    style={{ padding: '8px 4px' }}
                    onClick={() => { setMCat(c.key); if (c.key !== '__otros__') setMOtros(''); }}
                  >
                    <i className={`ti ${c.icon}`}></i>
                    <span>{c.label || c.key}</span>
                  </button>
                ))}
              </div>
            </div>

            {mCat === '__otros__' && (
              <div className="modal-otros visible">
                <input type="text" placeholder="Describe el gasto..." value={mOtros} onChange={e => setMOtros(e.target.value)} />
              </div>
            )}

            <div className="modal-fields">
              <div className="modal-field" style={{ gridColumn: '1/-1' }}>
                <label>Detalle (opcional)</label>
                <input type="text" placeholder="Ej: Grifo Repsol, Km 45" value={mDetalle} onChange={e => setMDetalle(e.target.value)} />
              </div>
              <div className="modal-field">
                <label>Monto (S/)</label>
                <input type="number" placeholder="0.00" min="0" step="0.01" value={mMonto} onChange={e => setMMonto(e.target.value)} />
              </div>
              <div className="modal-field">
                <label>Fecha</label>
                <input type="date" value={mFecha} onChange={e => setMFecha(e.target.value)} />
              </div>
            </div>

            <div className="modal-btns">
              <button className="btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-save" onClick={guardarEdicion} disabled={loadingSave}>
                {loadingSave ? <span className="spinner"></span> : <><i className="ti ti-check" style={{ fontSize: 14 }}></i> Guardar cambios</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
