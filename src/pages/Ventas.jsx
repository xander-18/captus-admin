import { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { getVentas, postVenta, putVenta, deleteVenta, getMeta, putMeta, getBalance } from '../api';
import { useFechas, fechaIso, fechaDisplay } from '../hooks/useFechas';
import { useToast } from '../components/Toast';
import FiltroFecha from '../components/FiltroFecha';

Chart.register(...registerables);

const SERVICIOS = [
  { key: 'Mantto. CCTV',         icon: 'ti-tool' },
  { key: 'GPS',                   icon: 'ti-map-pin' },
  { key: 'Mantto. PC',           icon: 'ti-device-desktop' },
  { key: 'Antivirus',             icon: 'ti-virus-off' },
  { key: 'Licencias Software',   icon: 'ti-license' },
  { key: 'Alarmas',               icon: 'ti-bell-ringing' },
  { key: 'Servicios Eléctricos', icon: 'ti-plug' },
  { key: 'Cerco Eléctrico',      icon: 'ti-bolt' },
  { key: 'CACI',                  icon: 'ti-door' },
  { key: 'Cámaras CCTV',         icon: 'ti-camera' },
  { key: '__otros__',             icon: 'ti-dots-circle-horizontal', label: 'Otros' },
];

const COLORES = {
  'Mantto. CCTV': '#3b82f6', 'GPS': '#10b981', 'Mantto. PC': '#8b5cf6',
  'Antivirus': '#ef4444', 'Licencias Software': '#f59e0b', 'Alarmas': '#f97316',
  'Servicios Eléctricos': '#eab308', 'Cerco Eléctrico': '#06b6d4',
  'CACI': '#6366f1', 'Cámaras CCTV': '#1a56db',
};
const getColor = s => COLORES[s] || '#9ca3af';
const getBg    = s => getColor(s) + '18';

export default function Ventas() {
  const toast = useToast();
  const { periodo, setPeriodo, rangoDesde, setRangoDesde, rangoHasta, setRangoHasta, calcRango, labelPeriodo } = useFechas();

  const [meta, setMeta]         = useState(600);
  const [metaInput, setMetaInput] = useState(600);
  const [ventas, setVentas]     = useState([]);
  const [offline, setOffline]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [balance, setBalance]   = useState({ ingresos: 0, egresos: 0, neto: 0 });

  // Form (agregar)
  const [selServ, setSelServ]   = useState('');
  const [otrosVal, setOtrosVal] = useState('');
  const [cliente, setCliente]   = useState('');
  const [monto, setMonto]       = useState('');
  const [fecha, setFecha]       = useState(fechaIso());
  const [formErr, setFormErr]   = useState('');

  // Modal edición
  const [editVenta, setEditVenta]   = useState(null); // venta original o null
  const [eSelServ, setESelServ]     = useState('');
  const [eOtrosVal, setEOtrosVal]   = useState('');
  const [eCliente, setECliente]     = useState('');
  const [eMonto, setEMonto]         = useState('');
  const [eFecha, setEFecha]         = useState('');
  const [eErr, setEErr]             = useState('');
  const [eLoading, setELoading]     = useState(false);

  // Charts
  const donutRef = useRef(null);
  const lineRef  = useRef(null);
  const chartDonut = useRef(null);
  const chartLine  = useRef(null);

  const cargar = useCallback(async () => {
    const rango = calcRango();
    if (!rango.desde || !rango.hasta) return;
    try {
      const [dataVentas, dataBalance] = await Promise.all([
        getVentas(rango.desde, rango.hasta),
        getBalance(rango.desde, rango.hasta),
      ]);
      setVentas(dataVentas);
      setBalance(dataBalance);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, [calcRango]);

  useEffect(() => {
    getMeta().then(d => { setMeta(d.meta); setMetaInput(d.meta); }).catch(() => {});
  }, []);

  useEffect(() => { cargar(); }, [periodo, rangoDesde, rangoHasta]);
  useEffect(() => { const t = setInterval(cargar, 60000); return () => clearInterval(t); }, [cargar]);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    if (!editVenta) return;
    const onKey = e => { if (e.key === 'Escape') cerrarEdicion(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editVenta]);

  // Charts
  useEffect(() => {
    if (!donutRef.current || !lineRef.current) return;
    const byS = {};
    ventas.forEach(v => { byS[v.servicio] = (byS[v.servicio] || 0) + v.monto; });
    const labels = Object.keys(byS);
    const dataD  = labels.map(l => parseFloat(byS[l].toFixed(2)));
    const cols   = labels.map(l => getColor(l));

    if (chartDonut.current) { chartDonut.current.destroy(); chartDonut.current = null; }
    if (chartLine.current)  { chartLine.current.destroy();  chartLine.current  = null; }

    const ctx1 = donutRef.current.getContext('2d');
    if (labels.length) {
      chartDonut.current = new Chart(ctx1, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: dataD, backgroundColor: cols, borderColor: '#fff', borderWidth: 3, hoverOffset: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' S/ ' + c.parsed.toFixed(2) } } } }
      });
    }

    const rango = calcRango();
    const dias  = rango.desde && rango.hasta
      ? Math.round((new Date(rango.hasta + 'T00:00:00') - new Date(rango.desde + 'T00:00:00')) / 86400000) + 1
      : 1;
    const metaPeriodo = meta * dias;
    const sorted = [...ventas].sort((a, b) => a.id - b.id);
    let acum = 0;
    const lineData   = sorted.map(v => { acum += v.monto; return parseFloat(acum.toFixed(2)); });
    const lineLabels = sorted.map((_, i) => '#' + (i + 1));

    const ctx2 = lineRef.current.getContext('2d');
    if (lineData.length) {
      chartLine.current = new Chart(ctx2, {
        type: 'line',
        data: {
          labels: lineLabels,
          datasets: [
            { label: 'Vendido', data: lineData, borderColor: '#1a56db', backgroundColor: 'rgba(26,86,219,.08)', borderWidth: 2, pointBackgroundColor: '#1a56db', pointRadius: 4, fill: true, tension: .35 },
            { label: 'Meta', data: lineData.map(() => metaPeriodo), borderColor: '#f59e0b', borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, fill: false }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#6b7280', font: { size: 11, family: 'Inter' } } } },
          scales: {
            x: { ticks: { color: '#9ca3af', font: { size: 11 } }, grid: { color: '#f3f4f6' } },
            y: { ticks: { color: '#9ca3af', font: { size: 11 }, callback: v => 'S/' + v }, grid: { color: '#f3f4f6' }, beginAtZero: true }
          }
        }
      });
    }

    return () => {
      if (chartDonut.current) { chartDonut.current.destroy(); chartDonut.current = null; }
      if (chartLine.current)  { chartLine.current.destroy();  chartLine.current  = null; }
    };
  }, [ventas, meta]);

  async function aplicarMeta() {
    const v = parseFloat(metaInput);
    if (!v || v <= 0) { toast('Ingresa un valor válido', 'warn'); return; }
    try {
      const d = await putMeta(v);
      setMeta(d.meta);
      cargar();
      toast('Meta actualizada a S/ ' + d.meta.toLocaleString('es-PE'), 'success');
    } catch { toast('Error al guardar meta', 'err'); }
  }

  async function agregar() {
    setFormErr('');
    const servicioFinal = selServ === '__otros__' ? otrosVal.trim() : selServ;
    if (!selServ)                          { setFormErr('Elige el tipo de servicio.'); return; }
    if (selServ === '__otros__' && !servicioFinal) { setFormErr('Escribe el nombre del servicio.'); return; }
    if (!cliente.trim())                   { setFormErr('Escribe el nombre del cliente o empresa.'); return; }
    if (!monto || parseFloat(monto) <= 0)  { setFormErr('Ingresa un monto válido mayor a 0.'); return; }

    setLoading(true);
    try {
      await postVenta({ fecha, cliente: cliente.trim(), servicio: servicioFinal, monto: parseFloat(monto) });
      setCliente(''); setMonto(''); setOtrosVal(''); setSelServ('');
      await cargar();
      toast('Venta registrada — S/ ' + parseFloat(monto).toFixed(2), 'success');
    } catch (e) { toast('Error al guardar: ' + (e.message || 'intenta de nuevo'), 'err'); }
    finally { setLoading(false); }
  }

  async function eliminar(id) {
    try {
      await deleteVenta(id);
      if (editVenta?.id === id) cerrarEdicion();
      await cargar();
      toast('Venta eliminada', '');
    }
    catch { toast('Error al eliminar', 'err'); }
  }

  // ── Modal edición ──
  function abrirEdicion(v) {
    const esConocido = SERVICIOS.some(s => s.key === v.servicio);
    setESelServ(esConocido ? v.servicio : '__otros__');
    setEOtrosVal(esConocido ? '' : v.servicio);
    setECliente(v.cliente);
    setEMonto(String(v.monto));
    setEFecha(v.fecha);
    setEErr('');
    setEditVenta(v);
  }

  function cerrarEdicion() {
    setEditVenta(null);
  }

  async function guardarEdicion() {
    setEErr('');
    const servicioFinal = eSelServ === '__otros__' ? eOtrosVal.trim() : eSelServ;
    if (!eSelServ)                           { setEErr('Elige el tipo de servicio.'); return; }
    if (eSelServ === '__otros__' && !servicioFinal) { setEErr('Escribe el nombre del servicio.'); return; }
    if (!eCliente.trim())                    { setEErr('Escribe el nombre del cliente o empresa.'); return; }
    if (!eMonto || parseFloat(eMonto) <= 0)  { setEErr('Ingresa un monto válido mayor a 0.'); return; }

    setELoading(true);
    try {
      await putVenta(editVenta.id, {
        fecha: eFecha,
        cliente: eCliente.trim(),
        servicio: servicioFinal,
        monto: parseFloat(eMonto),
      });
      toast('Venta actualizada — S/ ' + parseFloat(eMonto).toFixed(2), 'success');
      cerrarEdicion();
      await cargar();
    } catch (e) { setEErr('Error al guardar: ' + (e.message || 'intenta de nuevo')); }
    finally { setELoading(false); }
  }

  function exportCSV() {
    if (!ventas.length) { toast('No hay datos para exportar', 'warn'); return; }
    const rows = [['Fecha', 'Cliente', 'Servicio', 'Monto (S/)'], ...ventas.map(v => [v.fecha, v.cliente, v.servicio, v.monto])];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `ventas_${labelPeriodo().replace(/\s/g, '_')}_${fechaIso()}.csv`;
    a.click();
    toast('CSV exportado', 'success');
  }

  // KPI calculations
  const rango = calcRango();
  const dias  = rango.desde && rango.hasta
    ? Math.round((new Date(rango.hasta + 'T00:00:00') - new Date(rango.desde + 'T00:00:00')) / 86400000) + 1
    : 1;
  const total       = ventas.reduce((s, v) => s + v.monto, 0);
  const count       = ventas.length;
  const ticket      = count > 0 ? total / count : 0;
  const metaPeriodo = meta * dias;
  const falta       = Math.max(metaPeriodo - total, 0);
  const pct         = metaPeriodo > 0 ? Math.min((total / metaPeriodo) * 100, 100) : 0;
  const progColor   = pct >= 100 ? '#059669' : pct >= 70 ? '#d97706' : '#1a56db';
  const estado      = pct >= 100 ? '✅ ¡Meta cumplida!' : pct >= 70 ? 'Buen avance, sigue así' : count > 0 ? 'En progreso' : 'Sin ventas aún';

  const byS = {};
  ventas.forEach(v => { byS[v.servicio] = (byS[v.servicio] || 0) + v.monto; });

  return (
    <div className="page">
      {/* HEADER */}
      <div className="header">
        <div className="brand">
          <div className="brand-icon"><i className="ti ti-cash"></i></div>
          <div>
            <h1>Control de ventas</h1>
            <p>Seguridad · Tecnología · Mantenimiento</p>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-export" onClick={exportCSV}>
            <i className="ti ti-download" style={{ fontSize: 14 }}></i> Exportar CSV
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

      {/* META + BALANCE INGRESOS VS EGRESOS */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <div className="meta-row" style={{ flex: '1 1 340px' }}>
          <i className="ti ti-target" style={{ fontSize: 16, color: '#d97706' }}></i>
          <label>Meta diaria (S/):</label>
          <input type="number" value={metaInput} min="1" onChange={e => setMetaInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && aplicarMeta()} />
          <button className="btn-set" onClick={aplicarMeta}>
            <i className="ti ti-check" style={{ fontSize: 13 }}></i> Aplicar
          </button>
        </div>

        <div className="kpi" style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
          {(() => {
            const ing = balance.ingresos || 0;
            const egr = balance.egresos || 0;
            const neto = balance.neto ?? (ing - egr);
            const maxVal = Math.max(ing, egr, 1);
            const pctIng = Math.min((ing / maxVal) * 100, 100);
            const pctEgr = Math.min((egr / maxVal) * 100, 100);
            const netoColor = neto >= 0 ? '#059669' : '#dc2626';
            return (
              <>
                <div className="kpi-label">
                  <i className="ti ti-arrows-left-right" style={{ fontSize: 13, color: '#7c3aed' }}></i> Ingresos vs Egresos
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 3 }}>
                    <span>Ingresos</span>
                    <span style={{ color: '#059669', fontWeight: 600 }}>S/ {ing.toFixed(2)}</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: '#f3f4f6', borderRadius: 999 }}>
                    <div style={{ width: pctIng + '%', height: '100%', background: '#10b981', borderRadius: 999, transition: 'width .3s' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 3 }}>
                    <span>Egresos</span>
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>S/ {egr.toFixed(2)}</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: '#f3f4f6', borderRadius: 999 }}>
                    <div style={{ width: pctEgr + '%', height: '100%', background: '#ef4444', borderRadius: 999, transition: 'width .3s' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2, paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Balance neto</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: netoColor }}>
                    {neto >= 0 ? '+' : ''}S/ {neto.toFixed(2)}
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* FILTRO FECHA */}
      <FiltroFecha
        periodo={periodo} setPeriodo={setPeriodo}
        rangoDesde={rangoDesde} setRangoDesde={setRangoDesde}
        rangoHasta={rangoHasta} setRangoHasta={setRangoHasta}
        calcRango={calcRango} labelPeriodo={labelPeriodo}
        onAplicar={cargar} toast={toast}
      />

      {/* KPIs */}
      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-target" style={{ fontSize: 13, color: '#d97706' }}></i> Meta del período</div>
          <div className="kpi-value blue">S/ {metaPeriodo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
          <div className="kpi-sub">{dias === 1 ? 'objetivo diario' : `objetivo (${dias} días × S/${meta})`}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-cash" style={{ fontSize: 13, color: '#059669' }}></i> Total vendido</div>
          <div className="kpi-value green">S/ {total.toFixed(2)}</div>
          <div className="kpi-sub">{count} venta{count !== 1 ? 's' : ''} registrada{count !== 1 ? 's' : ''}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-arrow-up-right" style={{ fontSize: 13, color: '#d97706' }}></i> Falta para meta</div>
          <div className="kpi-value amber">S/ {falta.toFixed(2)}</div>
          <div className="kpi-sub" style={{ color: progColor }}>{estado}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-receipt" style={{ fontSize: 13, color: '#7c3aed' }}></i> Ticket promedio</div>
          <div className="kpi-value">S/ {ticket.toFixed(2)}</div>
          <div className="kpi-sub">por venta</div>
        </div>
      </div>

      {/* PROGRESS */}
      <div className="progress-strip">
        <div className="progress-header">
          <div className="progress-title">{pct >= 100 ? '¡Meta superada!' : 'Progreso hacia la meta'}</div>
          <div className="progress-pct" style={{ color: progColor }}>{Math.round(pct)}%</div>
        </div>
        <div className="progress-bg">
          <div className="progress-fill" style={{ width: pct + '%', background: progColor }}></div>
        </div>
        <div className="progress-labels">
          <span>S/ 0</span>
          <span>S/ {(metaPeriodo / 2).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
          <span>Meta S/ {metaPeriodo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* FORM (agregar) */}
      <div className="form-card">
        <div className="form-card-title"><i className="ti ti-plus-circle"></i> Registrar nueva venta</div>
        <div className="serv-label">Tipo de servicio vendido</div>
        <div className="serv-grid">
          {SERVICIOS.map(s => (
            <button
              key={s.key}
              className={`serv-btn${selServ === s.key ? ' active' : ''}`}
              onClick={() => {
                setSelServ(s.key);
                if (s.key !== '__otros__') setOtrosVal('');
                setFormErr('');
              }}
            >
              <i className={`ti ${s.icon}`}></i>
              <span>{s.label || s.key}</span>
            </button>
          ))}
        </div>

        {selServ === '__otros__' && (
          <div className="otros-row visible">
            <i className="ti ti-pencil" style={{ fontSize: 16, color: '#9ca3af', flexShrink: 0 }}></i>
            <input type="text" placeholder="Describe el servicio..." value={otrosVal}
              onChange={e => setOtrosVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregar()} />
          </div>
        )}

        <div className="fields-row">
          <div className="field">
            <label>Cliente o empresa</label>
            <input type="text" placeholder="Ej: Empresa ABC S.A.C." value={cliente}
              onChange={e => setCliente(e.target.value)}
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
          <button className="btn-add" onClick={agregar} disabled={loading}>
            {loading ? <span className="spinner"></span> : <><i className="ti ti-plus" style={{ fontSize: 15 }}></i> Agregar</>}
          </button>
        </div>
        {formErr && <div className="form-error show">{formErr}</div>}
      </div>

      {/* TABLE */}
      <div className="table-card">
        <div className="table-head">
          <div className="table-title">
            <i className="ti ti-list"></i> Ventas
            <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 12, marginLeft: 4 }}>· {labelPeriodo()}</span>
          </div>
          <div className="table-actions">
            <span className="badge">{count} venta{count !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div>
          {!ventas.length ? (
            <div className="empty">
              <i className="ti ti-clipboard-x"></i>
              <p>No hay ventas en este período</p>
              <small>Prueba con otro rango de fechas o registra nuevas ventas</small>
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>#</th><th>Cliente</th><th>Servicio</th><th>Monto</th><th>Fecha</th><th></th></tr>
              </thead>
              <tbody>
                {[...ventas].reverse().map((v, i) => (
                  <tr key={v.id} className="row-in">
                    <td style={{ color: '#9ca3af', fontSize: 12 }}>{ventas.length - i}</td>
                    <td className="td-cliente">{v.cliente}</td>
                    <td>
                      <span className="pill" style={{ background: getBg(v.servicio), color: getColor(v.servicio) }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: getColor(v.servicio), display: 'inline-block', flexShrink: 0 }}></span>
                        {v.servicio}
                      </span>
                    </td>
                    <td className="td-monto">S/ {parseFloat(v.monto).toFixed(2)}</td>
                    <td style={{ color: '#9ca3af', fontSize: 12 }}>{fechaDisplay(v.fecha)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-del" style={{ color: '#1a56db' }} onClick={() => abrirEdicion(v)} title="Editar">
                          <i className="ti ti-pencil"></i>
                        </button>
                        <button className="btn-del" onClick={() => eliminar(v.id)} title="Eliminar">
                          <i className="ti ti-trash"></i>
                        </button>
                      </div>
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
          <div className="chart-title"><i className="ti ti-chart-donut"></i> Por tipo de servicio</div>
          <div className="chart-wrap"><canvas ref={donutRef}></canvas></div>
          <div className="legend">
            {Object.entries(byS).map(([l, v]) => (
              <div key={l} className="legend-item">
                <div className="legend-dot" style={{ background: getColor(l) }}></div>
                {l} — S/ {v.toFixed(2)}
              </div>
            ))}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title"><i className="ti ti-trending-up"></i> Acumulado vs meta</div>
          <div className="chart-wrap"><canvas ref={lineRef}></canvas></div>
        </div>
      </div>

      {/* MODAL EDICIÓN */}
      {editVenta && (
        <div
          onClick={cerrarEdicion}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(17,24,39,.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="form-card"
            style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', margin: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="form-card-title" style={{ margin: 0 }}>
                <i className="ti ti-pencil"></i> Editar venta
              </div>
              <button className="btn-del" onClick={cerrarEdicion} title="Cerrar">
                <i className="ti ti-x"></i>
              </button>
            </div>

            <div className="serv-label" style={{ marginTop: 14 }}>Tipo de servicio vendido</div>
            <div className="serv-grid">
              {SERVICIOS.map(s => (
                <button
                  key={s.key}
                  className={`serv-btn${eSelServ === s.key ? ' active' : ''}`}
                  onClick={() => {
                    setESelServ(s.key);
                    if (s.key !== '__otros__') setEOtrosVal('');
                    setEErr('');
                  }}
                >
                  <i className={`ti ${s.icon}`}></i>
                  <span>{s.label || s.key}</span>
                </button>
              ))}
            </div>

            {eSelServ === '__otros__' && (
              <div className="otros-row visible">
                <i className="ti ti-pencil" style={{ fontSize: 16, color: '#9ca3af', flexShrink: 0 }}></i>
                <input type="text" placeholder="Describe el servicio..." value={eOtrosVal}
                  onChange={e => setEOtrosVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && guardarEdicion()} />
              </div>
            )}

            <div className="field" style={{ marginTop: 12 }}>
              <label>Cliente o empresa</label>
              <input type="text" placeholder="Ej: Empresa ABC S.A.C." value={eCliente}
                onChange={e => setECliente(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && guardarEdicion()} />
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>Monto (S/)</label>
              <input type="number" placeholder="0.00" min="0" step="0.01" value={eMonto}
                onChange={e => setEMonto(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && guardarEdicion()} />
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>Fecha</label>
              <input type="date" value={eFecha} onChange={e => setEFecha(e.target.value)} />
            </div>

            {eErr && <div className="form-error show">{eErr}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn-add" style={{ flex: 1 }} onClick={guardarEdicion} disabled={eLoading}>
                {eLoading ? <span className="spinner"></span> : <><i className="ti ti-check" style={{ fontSize: 15 }}></i> Guardar cambios</>}
              </button>
              <button className="btn-set" style={{ background: '#6b7280' }} onClick={cerrarEdicion} disabled={eLoading}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}