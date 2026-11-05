// import { useState, useEffect, useRef, useCallback } from 'react';
// import { Chart, registerables } from 'chart.js';
// import { getVentas, postVenta, putVenta, deleteVenta, getMeta, putMeta, getBalance } from '../api';
// import { useFechas, fechaIso, fechaDisplay } from '../hooks/useFechas';
// import { useToast } from '../components/Toast';
// import FiltroFecha from '../components/FiltroFecha';

// Chart.register(...registerables);

// const SERVICIOS = [
//   { key: 'Mantto. CCTV',         icon: 'ti-tool' },
//   { key: 'GPS',                   icon: 'ti-map-pin' },
//   { key: 'Mantto. PC',           icon: 'ti-device-desktop' },
//   { key: 'Antivirus',             icon: 'ti-virus-off' },
//   { key: 'Licencias Software',   icon: 'ti-license' },
//   { key: 'Alarmas',               icon: 'ti-bell-ringing' },
//   { key: 'Servicios Eléctricos', icon: 'ti-plug' },
//   { key: 'Cerco Eléctrico',      icon: 'ti-bolt' },
//   { key: 'CACI',                  icon: 'ti-door' },
//   { key: 'Cámaras CCTV',         icon: 'ti-camera' },
//   { key: '__otros__',             icon: 'ti-dots-circle-horizontal', label: 'Otros' },
// ];

// const COLORES = {
//   'Mantto. CCTV': '#3b82f6', 'GPS': '#10b981', 'Mantto. PC': '#8b5cf6',
//   'Antivirus': '#ef4444', 'Licencias Software': '#f59e0b', 'Alarmas': '#f97316',
//   'Servicios Eléctricos': '#eab308', 'Cerco Eléctrico': '#06b6d4',
//   'CACI': '#6366f1', 'Cámaras CCTV': '#1a56db',
// };
// const getColor = s => COLORES[s] || '#9ca3af';
// const getBg    = s => getColor(s) + '18';

// export default function Ventas() {
//   const toast = useToast();
//   const { periodo, setPeriodo, rangoDesde, setRangoDesde, rangoHasta, setRangoHasta, calcRango, labelPeriodo } = useFechas();

//   const [meta, setMeta]         = useState(600);
//   const [metaInput, setMetaInput] = useState(600);
//   const [ventas, setVentas]     = useState([]);
//   const [offline, setOffline]   = useState(false);
//   const [loading, setLoading]   = useState(false);
//   const [balance, setBalance]   = useState({ ingresos: 0, egresos: 0, neto: 0 });

//   // Form (agregar)
//   const [selServ, setSelServ]   = useState('');
//   const [otrosVal, setOtrosVal] = useState('');
//   const [cliente, setCliente]   = useState('');
//   const [monto, setMonto]       = useState('');
//   const [fecha, setFecha]       = useState(fechaIso());
//   const [formErr, setFormErr]   = useState('');

//   // Modal edición
//   const [editVenta, setEditVenta]   = useState(null); // venta original o null
//   const [eSelServ, setESelServ]     = useState('');
//   const [eOtrosVal, setEOtrosVal]   = useState('');
//   const [eCliente, setECliente]     = useState('');
//   const [eMonto, setEMonto]         = useState('');
//   const [eFecha, setEFecha]         = useState('');
//   const [eErr, setEErr]             = useState('');
//   const [eLoading, setELoading]     = useState(false);

//   // Charts
//   const donutRef = useRef(null);
//   const lineRef  = useRef(null);
//   const chartDonut = useRef(null);
//   const chartLine  = useRef(null);

//   const cargar = useCallback(async () => {
//     const rango = calcRango();
//     if (!rango.desde || !rango.hasta) return;
//     try {
//       const [dataVentas, dataBalance] = await Promise.all([
//         getVentas(rango.desde, rango.hasta),
//         getBalance(rango.desde, rango.hasta),
//       ]);
//       setVentas(dataVentas);
//       setBalance(dataBalance);
//       setOffline(false);
//     } catch {
//       setOffline(true);
//     }
//   }, [calcRango]);

//   useEffect(() => {
//     getMeta().then(d => { setMeta(d.meta); setMetaInput(d.meta); }).catch(() => {});
//   }, []);

//   useEffect(() => { cargar(); }, [periodo, rangoDesde, rangoHasta]);
//   useEffect(() => { const t = setInterval(cargar, 60000); return () => clearInterval(t); }, [cargar]);

//   // Cerrar modal con tecla Escape
//   useEffect(() => {
//     if (!editVenta) return;
//     const onKey = e => { if (e.key === 'Escape') cerrarEdicion(); };
//     window.addEventListener('keydown', onKey);
//     return () => window.removeEventListener('keydown', onKey);
//   }, [editVenta]);

//   // Charts
//   useEffect(() => {
//     if (!donutRef.current || !lineRef.current) return;
//     const byS = {};
//     ventas.forEach(v => { byS[v.servicio] = (byS[v.servicio] || 0) + v.monto; });
//     const labels = Object.keys(byS);
//     const dataD  = labels.map(l => parseFloat(byS[l].toFixed(2)));
//     const cols   = labels.map(l => getColor(l));

//     if (chartDonut.current) { chartDonut.current.destroy(); chartDonut.current = null; }
//     if (chartLine.current)  { chartLine.current.destroy();  chartLine.current  = null; }

//     const ctx1 = donutRef.current.getContext('2d');
//     if (labels.length) {
//       chartDonut.current = new Chart(ctx1, {
//         type: 'doughnut',
//         data: { labels, datasets: [{ data: dataD, backgroundColor: cols, borderColor: '#fff', borderWidth: 3, hoverOffset: 5 }] },
//         options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' S/ ' + c.parsed.toFixed(2) } } } }
//       });
//     }

//     const rango = calcRango();
//     const dias  = rango.desde && rango.hasta
//       ? Math.round((new Date(rango.hasta + 'T00:00:00') - new Date(rango.desde + 'T00:00:00')) / 86400000) + 1
//       : 1;
//     const metaPeriodo = meta * dias;
//     const sorted = [...ventas].sort((a, b) => a.id - b.id);
//     let acum = 0;
//     const lineData   = sorted.map(v => { acum += v.monto; return parseFloat(acum.toFixed(2)); });
//     const lineLabels = sorted.map((_, i) => '#' + (i + 1));

//     const ctx2 = lineRef.current.getContext('2d');
//     if (lineData.length) {
//       chartLine.current = new Chart(ctx2, {
//         type: 'line',
//         data: {
//           labels: lineLabels,
//           datasets: [
//             { label: 'Vendido', data: lineData, borderColor: '#1a56db', backgroundColor: 'rgba(26,86,219,.08)', borderWidth: 2, pointBackgroundColor: '#1a56db', pointRadius: 4, fill: true, tension: .35 },
//             { label: 'Meta', data: lineData.map(() => metaPeriodo), borderColor: '#f59e0b', borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, fill: false }
//           ]
//         },
//         options: {
//           responsive: true, maintainAspectRatio: false,
//           plugins: { legend: { labels: { color: '#6b7280', font: { size: 11, family: 'Inter' } } } },
//           scales: {
//             x: { ticks: { color: '#9ca3af', font: { size: 11 } }, grid: { color: '#f3f4f6' } },
//             y: { ticks: { color: '#9ca3af', font: { size: 11 }, callback: v => 'S/' + v }, grid: { color: '#f3f4f6' }, beginAtZero: true }
//           }
//         }
//       });
//     }

//     return () => {
//       if (chartDonut.current) { chartDonut.current.destroy(); chartDonut.current = null; }
//       if (chartLine.current)  { chartLine.current.destroy();  chartLine.current  = null; }
//     };
//   }, [ventas, meta]);

//   async function aplicarMeta() {
//     const v = parseFloat(metaInput);
//     if (!v || v <= 0) { toast('Ingresa un valor válido', 'warn'); return; }
//     try {
//       const d = await putMeta(v);
//       setMeta(d.meta);
//       cargar();
//       toast('Meta actualizada a S/ ' + d.meta.toLocaleString('es-PE'), 'success');
//     } catch { toast('Error al guardar meta', 'err'); }
//   }

//   async function agregar() {
//     setFormErr('');
//     const servicioFinal = selServ === '__otros__' ? otrosVal.trim() : selServ;
//     if (!selServ)                          { setFormErr('Elige el tipo de servicio.'); return; }
//     if (selServ === '__otros__' && !servicioFinal) { setFormErr('Escribe el nombre del servicio.'); return; }
//     if (!cliente.trim())                   { setFormErr('Escribe el nombre del cliente o empresa.'); return; }
//     if (!monto || parseFloat(monto) <= 0)  { setFormErr('Ingresa un monto válido mayor a 0.'); return; }

//     setLoading(true);
//     try {
//       await postVenta({ fecha, cliente: cliente.trim(), servicio: servicioFinal, monto: parseFloat(monto) });
//       setCliente(''); setMonto(''); setOtrosVal(''); setSelServ('');
//       await cargar();
//       toast('Venta registrada — S/ ' + parseFloat(monto).toFixed(2), 'success');
//     } catch (e) { toast('Error al guardar: ' + (e.message || 'intenta de nuevo'), 'err'); }
//     finally { setLoading(false); }
//   }

//   async function eliminar(id) {
//     try {
//       await deleteVenta(id);
//       if (editVenta?.id === id) cerrarEdicion();
//       await cargar();
//       toast('Venta eliminada', '');
//     }
//     catch { toast('Error al eliminar', 'err'); }
//   }

//   // ── Modal edición ──
//   function abrirEdicion(v) {
//     const esConocido = SERVICIOS.some(s => s.key === v.servicio);
//     setESelServ(esConocido ? v.servicio : '__otros__');
//     setEOtrosVal(esConocido ? '' : v.servicio);
//     setECliente(v.cliente);
//     setEMonto(String(v.monto));
//     setEFecha(v.fecha);
//     setEErr('');
//     setEditVenta(v);
//   }

//   function cerrarEdicion() {
//     setEditVenta(null);
//   }

//   async function guardarEdicion() {
//     setEErr('');
//     const servicioFinal = eSelServ === '__otros__' ? eOtrosVal.trim() : eSelServ;
//     if (!eSelServ)                           { setEErr('Elige el tipo de servicio.'); return; }
//     if (eSelServ === '__otros__' && !servicioFinal) { setEErr('Escribe el nombre del servicio.'); return; }
//     if (!eCliente.trim())                    { setEErr('Escribe el nombre del cliente o empresa.'); return; }
//     if (!eMonto || parseFloat(eMonto) <= 0)  { setEErr('Ingresa un monto válido mayor a 0.'); return; }

//     setELoading(true);
//     try {
//       await putVenta(editVenta.id, {
//         fecha: eFecha,
//         cliente: eCliente.trim(),
//         servicio: servicioFinal,
//         monto: parseFloat(eMonto),
//       });
//       toast('Venta actualizada — S/ ' + parseFloat(eMonto).toFixed(2), 'success');
//       cerrarEdicion();
//       await cargar();
//     } catch (e) { setEErr('Error al guardar: ' + (e.message || 'intenta de nuevo')); }
//     finally { setELoading(false); }
//   }

//   function exportCSV() {
//     if (!ventas.length) { toast('No hay datos para exportar', 'warn'); return; }
//     const rows = [['Fecha', 'Cliente', 'Servicio', 'Monto (S/)'], ...ventas.map(v => [v.fecha, v.cliente, v.servicio, v.monto])];
//     const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
//     const a    = document.createElement('a');
//     a.href     = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
//     a.download = `ventas_${labelPeriodo().replace(/\s/g, '_')}_${fechaIso()}.csv`;
//     a.click();
//     toast('CSV exportado', 'success');
//   }

//   // KPI calculations
//   const rango = calcRango();
//   const dias  = rango.desde && rango.hasta
//     ? Math.round((new Date(rango.hasta + 'T00:00:00') - new Date(rango.desde + 'T00:00:00')) / 86400000) + 1
//     : 1;
//   const total       = ventas.reduce((s, v) => s + v.monto, 0);
//   const count       = ventas.length;
//   const ticket      = count > 0 ? total / count : 0;
//   const metaPeriodo = meta * dias;
//   const falta       = Math.max(metaPeriodo - total, 0);
//   const pct         = metaPeriodo > 0 ? Math.min((total / metaPeriodo) * 100, 100) : 0;
//   const progColor   = pct >= 100 ? '#059669' : pct >= 70 ? '#d97706' : '#1a56db';
//   const estado      = pct >= 100 ? '✅ ¡Meta cumplida!' : pct >= 70 ? 'Buen avance, sigue así' : count > 0 ? 'En progreso' : 'Sin ventas aún';

//   const byS = {};
//   ventas.forEach(v => { byS[v.servicio] = (byS[v.servicio] || 0) + v.monto; });

//   return (
//     <div className="page">
//       {/* HEADER */}
//       <div className="header">
//         <div className="brand">
//           <div className="brand-icon"><i className="ti ti-cash"></i></div>
//           <div>
//             <h1>Control de ventas</h1>
//             <p>Seguridad · Tecnología · Mantenimiento</p>
//           </div>
//         </div>
//         <div className="header-right">
//           <button className="btn-export" onClick={exportCSV}>
//             <i className="ti ti-download" style={{ fontSize: 14 }}></i> Exportar CSV
//           </button>
//         </div>
//       </div>

//       {/* OFFLINE */}
//       {offline && (
//         <div className="banner show">
//           <i className="ti ti-wifi-off" style={{ fontSize: 15 }}></i>
//           No se puede conectar al servidor.
//         </div>
//       )}

//       {/* META + BALANCE INGRESOS VS EGRESOS */}
//       <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>
//         <div className="meta-row" style={{ flex: '1 1 340px' }}>
//           <i className="ti ti-target" style={{ fontSize: 16, color: '#d97706' }}></i>
//           <label>Meta diaria (S/):</label>
//           <input type="number" value={metaInput} min="1" onChange={e => setMetaInput(e.target.value)}
//             onKeyDown={e => e.key === 'Enter' && aplicarMeta()} />
//           <button className="btn-set" onClick={aplicarMeta}>
//             <i className="ti ti-check" style={{ fontSize: 13 }}></i> Aplicar
//           </button>
//         </div>

//         <div className="kpi" style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
//           {(() => {
//             const ing = balance.ingresos || 0;
//             const egr = balance.egresos || 0;
//             const neto = balance.neto ?? (ing - egr);
//             const maxVal = Math.max(ing, egr, 1);
//             const pctIng = Math.min((ing / maxVal) * 100, 100);
//             const pctEgr = Math.min((egr / maxVal) * 100, 100);
//             const netoColor = neto >= 0 ? '#059669' : '#dc2626';
//             return (
//               <>
//                 <div className="kpi-label">
//                   <i className="ti ti-arrows-left-right" style={{ fontSize: 13, color: '#7c3aed' }}></i> Ingresos vs Egresos
//                 </div>

//                 <div>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 3 }}>
//                     <span>Ingresos</span>
//                     <span style={{ color: '#059669', fontWeight: 600 }}>S/ {ing.toFixed(2)}</span>
//                   </div>
//                   <div style={{ width: '100%', height: 8, background: '#f3f4f6', borderRadius: 999 }}>
//                     <div style={{ width: pctIng + '%', height: '100%', background: '#10b981', borderRadius: 999, transition: 'width .3s' }}></div>
//                   </div>
//                 </div>

//                 <div>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 3 }}>
//                     <span>Egresos</span>
//                     <span style={{ color: '#dc2626', fontWeight: 600 }}>S/ {egr.toFixed(2)}</span>
//                   </div>
//                   <div style={{ width: '100%', height: 8, background: '#f3f4f6', borderRadius: 999 }}>
//                     <div style={{ width: pctEgr + '%', height: '100%', background: '#ef4444', borderRadius: 999, transition: 'width .3s' }}></div>
//                   </div>
//                 </div>

//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2, paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
//                   <span style={{ fontSize: 12, color: '#6b7280' }}>Balance neto</span>
//                   <span style={{ fontSize: 15, fontWeight: 700, color: netoColor }}>
//                     {neto >= 0 ? '+' : ''}S/ {neto.toFixed(2)}
//                   </span>
//                 </div>
//               </>
//             );
//           })()}
//         </div>
//       </div>

//       {/* FILTRO FECHA */}
//       <FiltroFecha
//         periodo={periodo} setPeriodo={setPeriodo}
//         rangoDesde={rangoDesde} setRangoDesde={setRangoDesde}
//         rangoHasta={rangoHasta} setRangoHasta={setRangoHasta}
//         calcRango={calcRango} labelPeriodo={labelPeriodo}
//         onAplicar={cargar} toast={toast}
//       />

//       {/* KPIs */}
//       <div className="kpi-row">
//         <div className="kpi">
//           <div className="kpi-label"><i className="ti ti-target" style={{ fontSize: 13, color: '#d97706' }}></i> Meta del período</div>
//           <div className="kpi-value blue">S/ {metaPeriodo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
//           <div className="kpi-sub">{dias === 1 ? 'objetivo diario' : `objetivo (${dias} días × S/${meta})`}</div>
//         </div>
//         <div className="kpi">
//           <div className="kpi-label"><i className="ti ti-cash" style={{ fontSize: 13, color: '#059669' }}></i> Total vendido</div>
//           <div className="kpi-value green">S/ {total.toFixed(2)}</div>
//           <div className="kpi-sub">{count} venta{count !== 1 ? 's' : ''} registrada{count !== 1 ? 's' : ''}</div>
//         </div>
//         <div className="kpi">
//           <div className="kpi-label"><i className="ti ti-arrow-up-right" style={{ fontSize: 13, color: '#d97706' }}></i> Falta para meta</div>
//           <div className="kpi-value amber">S/ {falta.toFixed(2)}</div>
//           <div className="kpi-sub" style={{ color: progColor }}>{estado}</div>
//         </div>
//         <div className="kpi">
//           <div className="kpi-label"><i className="ti ti-receipt" style={{ fontSize: 13, color: '#7c3aed' }}></i> Ticket promedio</div>
//           <div className="kpi-value">S/ {ticket.toFixed(2)}</div>
//           <div className="kpi-sub">por venta</div>
//         </div>
//       </div>

//       {/* PROGRESS */}
//       <div className="progress-strip">
//         <div className="progress-header">
//           <div className="progress-title">{pct >= 100 ? '¡Meta superada!' : 'Progreso hacia la meta'}</div>
//           <div className="progress-pct" style={{ color: progColor }}>{Math.round(pct)}%</div>
//         </div>
//         <div className="progress-bg">
//           <div className="progress-fill" style={{ width: pct + '%', background: progColor }}></div>
//         </div>
//         <div className="progress-labels">
//           <span>S/ 0</span>
//           <span>S/ {(metaPeriodo / 2).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
//           <span>Meta S/ {metaPeriodo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
//         </div>
//       </div>

//       {/* FORM (agregar) */}
//       <div className="form-card">
//         <div className="form-card-title"><i className="ti ti-plus-circle"></i> Registrar nueva venta</div>
//         <div className="serv-label">Tipo de servicio vendido</div>
//         <div className="serv-grid">
//           {SERVICIOS.map(s => (
//             <button
//               key={s.key}
//               className={`serv-btn${selServ === s.key ? ' active' : ''}`}
//               onClick={() => {
//                 setSelServ(s.key);
//                 if (s.key !== '__otros__') setOtrosVal('');
//                 setFormErr('');
//               }}
//             >
//               <i className={`ti ${s.icon}`}></i>
//               <span>{s.label || s.key}</span>
//             </button>
//           ))}
//         </div>

//         {selServ === '__otros__' && (
//           <div className="otros-row visible">
//             <i className="ti ti-pencil" style={{ fontSize: 16, color: '#9ca3af', flexShrink: 0 }}></i>
//             <input type="text" placeholder="Describe el servicio..." value={otrosVal}
//               onChange={e => setOtrosVal(e.target.value)}
//               onKeyDown={e => e.key === 'Enter' && agregar()} />
//           </div>
//         )}

//         <div className="fields-row">
//           <div className="field">
//             <label>Cliente o empresa</label>
//             <input type="text" placeholder="Ej: Empresa ABC S.A.C." value={cliente}
//               onChange={e => setCliente(e.target.value)}
//               onKeyDown={e => e.key === 'Enter' && agregar()} />
//           </div>
//           <div className="field">
//             <label>Monto (S/)</label>
//             <input type="number" placeholder="0.00" min="0" step="0.01" value={monto}
//               onChange={e => setMonto(e.target.value)}
//               onKeyDown={e => e.key === 'Enter' && agregar()} />
//           </div>
//           <div className="field">
//             <label>Fecha</label>
//             <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
//           </div>
//           <button className="btn-add" onClick={agregar} disabled={loading}>
//             {loading ? <span className="spinner"></span> : <><i className="ti ti-plus" style={{ fontSize: 15 }}></i> Agregar</>}
//           </button>
//         </div>
//         {formErr && <div className="form-error show">{formErr}</div>}
//       </div>

//       {/* TABLE */}
//       <div className="table-card">
//         <div className="table-head">
//           <div className="table-title">
//             <i className="ti ti-list"></i> Ventas
//             <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 12, marginLeft: 4 }}>· {labelPeriodo()}</span>
//           </div>
//           <div className="table-actions">
//             <span className="badge">{count} venta{count !== 1 ? 's' : ''}</span>
//           </div>
//         </div>
//         <div>
//           {!ventas.length ? (
//             <div className="empty">
//               <i className="ti ti-clipboard-x"></i>
//               <p>No hay ventas en este período</p>
//               <small>Prueba con otro rango de fechas o registra nuevas ventas</small>
//             </div>
//           ) : (
//             <table>
//               <thead>
//                 <tr><th>#</th><th>Cliente</th><th>Servicio</th><th>Monto</th><th>Fecha</th><th></th></tr>
//               </thead>
//               <tbody>
//                 {[...ventas].reverse().map((v, i) => (
//                   <tr key={v.id} className="row-in">
//                     <td style={{ color: '#9ca3af', fontSize: 12 }}>{ventas.length - i}</td>
//                     <td className="td-cliente">{v.cliente}</td>
//                     <td>
//                       <span className="pill" style={{ background: getBg(v.servicio), color: getColor(v.servicio) }}>
//                         <span style={{ width: 6, height: 6, borderRadius: '50%', background: getColor(v.servicio), display: 'inline-block', flexShrink: 0 }}></span>
//                         {v.servicio}
//                       </span>
//                     </td>
//                     <td className="td-monto">S/ {parseFloat(v.monto).toFixed(2)}</td>
//                     <td style={{ color: '#9ca3af', fontSize: 12 }}>{fechaDisplay(v.fecha)}</td>
//                     <td>
//                       <div style={{ display: 'flex', gap: 6 }}>
//                         <button className="btn-del" style={{ color: '#1a56db' }} onClick={() => abrirEdicion(v)} title="Editar">
//                           <i className="ti ti-pencil"></i>
//                         </button>
//                         <button className="btn-del" onClick={() => eliminar(v.id)} title="Eliminar">
//                           <i className="ti ti-trash"></i>
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>

//       {/* CHARTS */}
//       <div className="charts-row">
//         <div className="chart-card">
//           <div className="chart-title"><i className="ti ti-chart-donut"></i> Por tipo de servicio</div>
//           <div className="chart-wrap"><canvas ref={donutRef}></canvas></div>
//           <div className="legend">
//             {Object.entries(byS).map(([l, v]) => (
//               <div key={l} className="legend-item">
//                 <div className="legend-dot" style={{ background: getColor(l) }}></div>
//                 {l} — S/ {v.toFixed(2)}
//               </div>
//             ))}
//           </div>
//         </div>
//         <div className="chart-card">
//           <div className="chart-title"><i className="ti ti-trending-up"></i> Acumulado vs meta</div>
//           <div className="chart-wrap"><canvas ref={lineRef}></canvas></div>
//         </div>
//       </div>

//       {/* MODAL EDICIÓN */}
//       {editVenta && (
//         <div
//           onClick={cerrarEdicion}
//           style={{
//             position: 'fixed', inset: 0, background: 'rgba(17,24,39,.55)',
//             display: 'flex', alignItems: 'center', justifyContent: 'center',
//             zIndex: 1000, padding: 16,
//           }}
//         >
//           <div
//             onClick={e => e.stopPropagation()}
//             className="form-card"
//             style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', margin: 0 }}
//           >
//             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//               <div className="form-card-title" style={{ margin: 0 }}>
//                 <i className="ti ti-pencil"></i> Editar venta
//               </div>
//               <button className="btn-del" onClick={cerrarEdicion} title="Cerrar">
//                 <i className="ti ti-x"></i>
//               </button>
//             </div>

//             <div className="serv-label" style={{ marginTop: 14 }}>Tipo de servicio vendido</div>
//             <div className="serv-grid">
//               {SERVICIOS.map(s => (
//                 <button
//                   key={s.key}
//                   className={`serv-btn${eSelServ === s.key ? ' active' : ''}`}
//                   onClick={() => {
//                     setESelServ(s.key);
//                     if (s.key !== '__otros__') setEOtrosVal('');
//                     setEErr('');
//                   }}
//                 >
//                   <i className={`ti ${s.icon}`}></i>
//                   <span>{s.label || s.key}</span>
//                 </button>
//               ))}
//             </div>

//             {eSelServ === '__otros__' && (
//               <div className="otros-row visible">
//                 <i className="ti ti-pencil" style={{ fontSize: 16, color: '#9ca3af', flexShrink: 0 }}></i>
//                 <input type="text" placeholder="Describe el servicio..." value={eOtrosVal}
//                   onChange={e => setEOtrosVal(e.target.value)}
//                   onKeyDown={e => e.key === 'Enter' && guardarEdicion()} />
//               </div>
//             )}

//             <div className="field" style={{ marginTop: 12 }}>
//               <label>Cliente o empresa</label>
//               <input type="text" placeholder="Ej: Empresa ABC S.A.C." value={eCliente}
//                 onChange={e => setECliente(e.target.value)}
//                 onKeyDown={e => e.key === 'Enter' && guardarEdicion()} />
//             </div>
//             <div className="field" style={{ marginTop: 12 }}>
//               <label>Monto (S/)</label>
//               <input type="number" placeholder="0.00" min="0" step="0.01" value={eMonto}
//                 onChange={e => setEMonto(e.target.value)}
//                 onKeyDown={e => e.key === 'Enter' && guardarEdicion()} />
//             </div>
//             <div className="field" style={{ marginTop: 12 }}>
//               <label>Fecha</label>
//               <input type="date" value={eFecha} onChange={e => setEFecha(e.target.value)} />
//             </div>

//             {eErr && <div className="form-error show">{eErr}</div>}

//             <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
//               <button className="btn-add" style={{ flex: 1 }} onClick={guardarEdicion} disabled={eLoading}>
//                 {eLoading ? <span className="spinner"></span> : <><i className="ti ti-check" style={{ fontSize: 15 }}></i> Guardar cambios</>}
//               </button>
//               <button className="btn-set" style={{ background: '#6b7280' }} onClick={cerrarEdicion} disabled={eLoading}>
//                 Cancelar
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
import { useState, useEffect, useCallback } from 'react';
import {
  getVentasCobros, getVentasCobrosResumen, getComisionesVentas, getCotizacionesUsadas,
  getVentaCobro, postVentaCobro, putVentaCobro, anularVentaCobro, postCobro, deleteCobro,
  getProyectos, getUsuarios, getCotizaciones,
} from '../api';
import { useFechas, fechaIso, fechaDisplay } from '../hooks/useFechas';
import { useToast } from '../components/Toast';
import FiltroFecha from '../components/FiltroFecha';
// Única fuente del total de una cotización (requiere `export` en Cotizaciones.jsx)
import { calcularResumen } from './Cotizaciones';

const ESTADOS = {
  pendiente: { label: 'Pendiente', color: '#d97706' },
  parcial:   { label: 'Parcial',   color: '#1a56db' },
  pagada:    { label: 'Pagada',    color: '#059669' },
  anulada:   { label: 'Anulada',   color: '#9ca3af' },
};
const TIPOS   = { producto: 'Producto', servicio: 'Servicio', otro: 'Otro' };
const METODOS = ['Efectivo', 'Transferencia', 'Yape', 'Plin', 'Tarjeta', 'Cheque', 'Otro'];

const fmt = n => 'S/ ' + (Number(n) || 0).toFixed(2);
const nombreUsuario = u => u.name || u.email || `Usuario ${u.id}`;

const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb',
  borderRadius: 8, fontSize: 14, boxSizing: 'border-box', background: '#fff',
};

function EstadoPill({ estado }) {
  const e = ESTADOS[estado] || ESTADOS.pendiente;
  return (
    <span className="pill" style={{ background: e.color + '18', color: e.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.color, display: 'inline-block', flexShrink: 0 }}></span>
      {e.label}
    </span>
  );
}

/* ═════════════════════════ PÁGINA ═════════════════════════ */
export default function VentasCobros() {
  const toast = useToast();
  const { periodo, setPeriodo, rangoDesde, setRangoDesde, rangoHasta, setRangoHasta, calcRango, labelPeriodo } = useFechas();

  const [tab, setTab]                       = useState('ventas');
  const [proyectos, setProyectos]           = useState([]);
  const [usuarios, setUsuarios]             = useState([]);
  const [filtroProyecto, setFiltroProyecto] = useState('');
  const [filtroEstado, setFiltroEstado]     = useState('');
  const [ventas, setVentas]                 = useState([]);
  const [resumen, setResumen]               = useState({ vendido: 0, cobrado: 0, pendiente: 0, comisiones: 0, count: 0, comision_pct: 5 });
  const [comisiones, setComisiones]         = useState([]);
  const [offline, setOffline]               = useState(false);
  const [form, setForm]                     = useState(null);      // null | { venta: null | obj }
  const [detalleId, setDetalleId]           = useState(null);

  useEffect(() => {
    getProyectos().then(setProyectos).catch(() => {});
    getUsuarios().then(setUsuarios).catch(() => {});
  }, []);

  const cargar = useCallback(async () => {
    const rango = calcRango();
    if (!rango.desde || !rango.hasta) return;
    const f = { desde: rango.desde, hasta: rango.hasta, proyecto_id: filtroProyecto, estado: filtroEstado };
    try {
      const [lista, res, com] = await Promise.all([
        getVentasCobros(f), getVentasCobrosResumen(f), getComisionesVentas(f),
      ]);
      setVentas(lista);
      setResumen(res);
      setComisiones(com);
      setOffline(false);
    } catch { setOffline(true); }
  }, [calcRango, filtroProyecto, filtroEstado]);

  useEffect(() => { cargar(); }, [periodo, rangoDesde, rangoHasta, filtroProyecto, filtroEstado]);

  // Comisiones agrupadas por persona
  const porPersona = Object.values(comisiones.reduce((acc, c) => {
    const p = (acc[c.usuario_id] ||= { persona: c.persona, total: 0, n: 0 });
    p.total += Number(c.monto); p.n += 1;
    return acc;
  }, {}));

  return (
    <div className="page page-egresos">
      {/* HEADER */}
      <div className="header">
        <div className="brand">
          <div className="brand-icon" style={{ background: '#dcfce7', color: '#059669' }}><i className="ti ti-cash"></i></div>
          <div>
            <h1>Ventas y Cobros</h1>
            <p>Ventas, pagos recibidos y comisiones · Captus</p>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-export" onClick={() => setForm({ venta: null })}>
            <i className="ti ti-plus" style={{ fontSize: 13 }}></i> Nueva venta
          </button>
        </div>
      </div>

      {offline && (
        <div className="banner show">
          <i className="ti ti-wifi-off" style={{ fontSize: 15 }}></i>
          No se puede conectar al servidor.
        </div>
      )}

      {/* FILTRO FECHA */}
      <div className="egr-filtro-fecha">
        <FiltroFecha
          periodo={periodo} setPeriodo={setPeriodo}
          rangoDesde={rangoDesde} setRangoDesde={setRangoDesde}
          rangoHasta={rangoHasta} setRangoHasta={setRangoHasta}
          calcRango={calcRango} labelPeriodo={labelPeriodo}
          onAplicar={cargar} toast={toast}
        />
      </div>

      {/* KPIs */}
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-receipt-2" style={{ fontSize: 13, color: '#6366f1' }}></i> Total vendido</div>
          <div className="kpi-value">{fmt(resumen.vendido)}</div>
          <div className="kpi-sub">{resumen.count} venta{resumen.count !== 1 ? 's' : ''}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-cash" style={{ fontSize: 13, color: '#059669' }}></i> Total cobrado</div>
          <div className="kpi-value green">{fmt(resumen.cobrado)}</div>
          <div className="kpi-sub">dinero recibido</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-clock" style={{ fontSize: 13, color: '#d97706' }}></i> Pendiente de cobro</div>
          <div className="kpi-value" style={{ color: '#d97706' }}>{fmt(resumen.pendiente)}</div>
          <div className="kpi-sub">saldo por cobrar</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-users" style={{ fontSize: 13, color: '#8b5cf6' }}></i> Comisiones</div>
          <div className="kpi-value" style={{ color: '#8b5cf6' }}>{fmt(resumen.comisiones)}</div>
          <div className="kpi-sub">generadas ({resumen.comision_pct}%)</div>
        </div>
      </div>

      {/* FILTROS: estado + proyecto */}
      <div className="filtro-row">
        <span className="filtro-label"><i className="ti ti-filter" style={{ fontSize: 13 }}></i> Estado:</span>
        <div className="filtro-chips">
          <button className={`filtro-chip${filtroEstado === '' ? ' active' : ''}`} onClick={() => setFiltroEstado('')}>Todos</button>
          {Object.entries(ESTADOS).map(([k, e]) => (
            <button key={k} className={`filtro-chip${filtroEstado === k ? ' active' : ''}`} onClick={() => setFiltroEstado(k)}>{e.label}</button>
          ))}
        </div>
      </div>
      <div className="filtro-row">
        <span className="filtro-label"><i className="ti ti-folder" style={{ fontSize: 13 }}></i> Proyecto:</span>
        <select style={{ ...inputStyle, width: 'auto', minWidth: 180, padding: '6px 10px', fontSize: 13 }}
          value={filtroProyecto} onChange={e => setFiltroProyecto(e.target.value)}>
          <option value="">Todos</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {/* TABS */}
      <div className="filtro-row">
        <div className="filtro-chips">
          <button className={`filtro-chip${tab === 'ventas' ? ' active' : ''}`} onClick={() => setTab('ventas')}>Ventas</button>
          <button className={`filtro-chip${tab === 'comisiones' ? ' active' : ''}`} onClick={() => setTab('comisiones')}>Comisiones</button>
        </div>
      </div>

      {/* VENTAS */}
      {tab === 'ventas' && (
        <div className="table-card">
          <div className="table-head">
            <div className="table-title"><i className="ti ti-list"></i> Ventas</div>
            <div className="table-actions"><span className="badge">{ventas.length} registro{ventas.length !== 1 ? 's' : ''}</span></div>
          </div>
          {!ventas.length ? (
            <div className="empty">
              <i className="ti ti-receipt-off"></i>
              <p>Sin ventas en este período</p>
              <small>Registra una con el botón “Nueva venta”</small>
            </div>
          ) : (
            <>
              <table className="egr-tabla">
                <thead>
                  <tr><th>Fecha</th><th>Cliente / Descripción</th><th>Total</th><th>Cobrado</th><th>Saldo</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  {ventas.map(v => (
                    <tr key={v.id} className="row-in" style={{ cursor: 'pointer', opacity: v.estado === 'anulada' ? 0.55 : 1 }} onClick={() => setDetalleId(v.id)}>
                      <td style={{ color: '#9ca3af', fontSize: 12 }}>{fechaDisplay(v.fecha)}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{v.cliente}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          {TIPOS[v.tipo]} · {v.servicio}
                          {v.cotizacion_numero && <> · Cot. {v.cotizacion_numero}</>}
                          {v.proyecto && <> · {v.proyecto}</>}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{fmt(v.monto)}</td>
                      <td style={{ color: '#059669', fontWeight: 600 }}>{fmt(v.cobrado)}</td>
                      <td style={{ color: v.saldo > 0 && v.estado !== 'anulada' ? '#d97706' : '#9ca3af', fontWeight: 600 }}>
                        {v.estado === 'anulada' ? '—' : fmt(v.saldo)}
                      </td>
                      <td><EstadoPill estado={v.estado} /></td>
                      <td>
                        <button className="btn-edit" title="Ver detalle y registrar cobros"
                          onClick={e => { e.stopPropagation(); setDetalleId(v.id); }}>
                          <i className="ti ti-eye"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="egr-lista">
                {ventas.map(v => {
                  const est = ESTADOS[v.estado];
                  return (
                    <div key={v.id} className="egr-item" onClick={() => setDetalleId(v.id)}>
                      <span className="egr-ico" style={{ background: est.color + '18', color: est.color }}><i className="ti ti-cash"></i></span>
                      <div className="egr-info">
                        <div className="egr-titulo">{v.cliente}</div>
                        <div className="egr-sub">
                          <span className="egr-detalle">{v.servicio}</span>
                          <span className="egr-proy">{est.label} · cobrado {fmt(v.cobrado)}</span>
                        </div>
                      </div>
                      <div className="egr-monto" style={{ color: '#111827' }}>{fmt(v.monto)}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* COMISIONES */}
      {tab === 'comisiones' && (
        <>
          <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
            {porPersona.map(p => (
              <div key={p.persona} className="kpi">
                <div className="kpi-label"><i className="ti ti-user" style={{ fontSize: 13, color: '#8b5cf6' }}></i> {p.persona}</div>
                <div className="kpi-value" style={{ color: '#8b5cf6' }}>{fmt(p.total)}</div>
                <div className="kpi-sub">{p.n} venta{p.n !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
          <div className="table-card">
            <div className="table-head">
              <div className="table-title"><i className="ti ti-users"></i> Comisiones por venta</div>
              <div className="table-actions"><span className="badge">{comisiones.length}</span></div>
            </div>
            {!comisiones.length ? (
              <div className="empty">
                <i className="ti ti-receipt-off"></i>
                <p>Sin comisiones en este período</p>
                <small>Se generan al elegir comisionistas en una venta</small>
              </div>
            ) : (
              <>
                <table className="egr-tabla">
                  <thead><tr><th>Fecha</th><th>Persona</th><th>Cliente / Descripción</th><th>Venta</th><th>%</th><th>Comisión</th></tr></thead>
                  <tbody>
                    {comisiones.map(c => (
                      <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setDetalleId(c.venta_id)}>
                        <td style={{ color: '#9ca3af', fontSize: 12 }}>{fechaDisplay(c.fecha)}</td>
                        <td style={{ fontWeight: 600 }}>{c.persona}</td>
                        <td>{c.cliente}<div style={{ fontSize: 12, color: '#6b7280' }}>{c.servicio}</div></td>
                        <td>{fmt(c.venta_monto)}</td>
                        <td>{Number(c.porcentaje)}%</td>
                        <td style={{ fontWeight: 600, color: '#8b5cf6' }}>{fmt(c.monto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="egr-lista">
                  {comisiones.map(c => (
                    <div key={c.id} className="egr-item" onClick={() => setDetalleId(c.venta_id)}>
                      <span className="egr-ico" style={{ background: '#8b5cf618', color: '#8b5cf6' }}><i className="ti ti-user"></i></span>
                      <div className="egr-info">
                        <div className="egr-titulo">{c.persona}</div>
                        <div className="egr-sub"><span className="egr-detalle">{c.cliente} · {fmt(c.venta_monto)}</span></div>
                      </div>
                      <div className="egr-monto" style={{ color: '#8b5cf6' }}>{fmt(c.monto)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Botón + (solo celular) */}
      {!form && !detalleId && (
        <button className="egr-fab" onClick={() => setForm({ venta: null })} aria-label="Nueva venta">
          <i className="ti ti-plus"></i>
        </button>
      )}

      {form && (
        <VentaForm
          venta={form.venta} proyectos={proyectos} usuarios={usuarios} pct={resumen.comision_pct}
          toast={toast} onClose={() => setForm(null)}
          onSaved={() => { setForm(null); cargar(); }}
        />
      )}

      {detalleId && (
        <DetalleVenta
          id={detalleId} toast={toast}
          onClose={() => setDetalleId(null)}
          onChanged={cargar}
          onEditar={v => { setDetalleId(null); setForm({ venta: v }); }}
        />
      )}
    </div>
  );
}

/* ═════════════════════════ FORMULARIO DE VENTA ═════════════════════════ */
function VentaForm({ venta, proyectos, usuarios, pct, toast, onClose, onSaved }) {
  const editando = !!venta;
  const [origen, setOrigen]           = useState(venta?.cotizacion_id ? 'cotizacion' : 'directa');
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cotCargada, setCotCargada]   = useState(false);
  const [cotId, setCotId]             = useState(venta?.cotizacion_id || '');
  const [fecha, setFecha]             = useState(venta?.fecha || fechaIso());
  const [cliente, setCliente]         = useState(venta?.cliente || '');
  const [tipo, setTipo]               = useState(venta?.tipo || 'servicio');
  const [servicio, setServicio]       = useState(venta?.servicio || '');
  const [monto, setMonto]             = useState(venta ? String(venta.monto) : '');
  const [proyectoId, setProyectoId]   = useState(venta?.proyecto_id ? String(venta.proyecto_id) : '');
  const [sel, setSel]                 = useState(() => new Set(venta?.comisionistas || []));
  const [err, setErr]                 = useState('');
  const [loading, setLoading]         = useState(false);

  // Cotizaciones GANADAS que todavía no tienen venta
  useEffect(() => {
    if (editando || origen !== 'cotizacion' || cotCargada) return;
    Promise.all([getCotizaciones(), getCotizacionesUsadas()])
      .then(([cots, usadas]) => {
        const u = new Set(usadas);
        setCotizaciones(cots.filter(q => q.status === 'ganada' && !u.has(q.id)));
        setCotCargada(true);
      })
      .catch(() => toast('No se pudieron cargar las cotizaciones', 'err'));
  }, [origen]);

  function elegirCotizacion(id) {
    setCotId(id);
    const q = cotizaciones.find(x => x.id === id);
    if (!q) return;
    setCliente(q.cliente || '');
    setServicio(q.proyecto || `Cotización ${q.numero}`);
    setMonto(calcularResumen(q).ventaTotal.toFixed(2));
    const pr = proyectos.find(p => p.nombre.trim().toLowerCase() === (q.proyecto || '').trim().toLowerCase());
    setProyectoId(pr ? String(pr.id) : '');
  }

  const toggleCom = id => setSel(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const m = parseFloat(monto);
  const comTotal = m > 0 ? (m * pct) / 100 : 0;

  async function guardar() {
    setErr('');
    if (origen === 'cotizacion' && !editando && !cotId) return setErr('Elige la cotización.');
    if (!cliente.trim())  return setErr('Escribe el cliente.');
    if (!servicio.trim()) return setErr('Escribe la descripción de la venta.');
    if (!(m > 0))         return setErr('Ingresa un monto válido mayor a 0.');

    const data = {
      fecha, cliente: cliente.trim(), tipo, servicio: servicio.trim(), monto: m,
      proyecto_id: proyectoId ? Number(proyectoId) : null,
      cotizacion_id: origen === 'cotizacion' ? cotId : null,
      comisionistas: [...sel],
    };
    setLoading(true);
    try {
      if (editando) await putVentaCobro(venta.id, data);
      else await postVentaCobro(data);
      toast(editando ? 'Venta actualizada' : 'Venta registrada', 'success');
      onSaved();
    } catch (e) { setErr(e.message || 'No se pudo guardar'); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 560, width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="modal-title"><i className="ti ti-receipt-2"></i> {editando ? 'Editar venta' : 'Nueva venta'}</div>

        {!editando && (
          <div className="filtro-chips" style={{ marginBottom: 12 }}>
            <button className={`filtro-chip${origen === 'directa' ? ' active' : ''}`} onClick={() => { setOrigen('directa'); setCotId(''); }}>Venta directa / servicio</button>
            <button className={`filtro-chip${origen === 'cotizacion' ? ' active' : ''}`} onClick={() => setOrigen('cotizacion')}>Desde cotización</button>
          </div>
        )}

        {origen === 'cotizacion' && !editando && (
          <div className="modal-field" style={{ marginBottom: 12 }}>
            <label>Cotización ganada</label>
            <select style={inputStyle} value={cotId} onChange={e => elegirCotizacion(e.target.value)}>
              <option value="">{cotCargada && !cotizaciones.length ? 'No hay cotizaciones ganadas por convertir' : 'Elige una cotización…'}</option>
              {cotizaciones.map(q => (
                <option key={q.id} value={q.id}>
                  {q.numero} · {q.cliente || 'Sin cliente'} · {q.proyecto || 'Sin proyecto'} · {fmt(calcularResumen(q).ventaTotal)}
                </option>
              ))}
            </select>
          </div>
        )}
        {editando && venta.cotizacion_numero && (
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>Origen: cotización {venta.cotizacion_numero}</div>
        )}

        <div className="modal-fields">
          <div className="modal-field">
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div className="modal-field">
            <label>Tipo</label>
            <select style={inputStyle} value={tipo} onChange={e => setTipo(e.target.value)}>
              {Object.entries(TIPOS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div className="modal-field" style={{ gridColumn: '1/-1' }}>
            <label>Cliente</label>
            <input type="text" maxLength={255} placeholder="Nombre o razón social" value={cliente} onChange={e => setCliente(e.target.value)} />
          </div>
          <div className="modal-field" style={{ gridColumn: '1/-1' }}>
            <label>Descripción / detalle</label>
            <input type="text" maxLength={255} placeholder="Ej: Visita técnica, instalación CCTV, venta de cámaras…" value={servicio} onChange={e => setServicio(e.target.value)} />
          </div>
          <div className="modal-field">
            <label>Monto total (S/)</label>
            <input type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" value={monto} onChange={e => setMonto(e.target.value)} />
          </div>
          <div className="modal-field">
            <label>Proyecto (opcional)</label>
            <select style={inputStyle} value={proyectoId} onChange={e => setProyectoId(e.target.value)}>
              <option value="">Sin proyecto</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        </div>

        {/* <div style={{ margin: '12px 0 4px' }}>
          <div className="cat-label">Comisionistas (opcional)</div>
          <div className="filtro-chips">
            {usuarios.map(u => (
              <button key={u.id} type="button" className={`filtro-chip${sel.has(u.id) ? ' active' : ''}`} onClick={() => toggleCom(u.id)}>
                {nombreUsuario(u)}
              </button>
            ))}
          </div>
          {sel.size > 0 && m > 0 && (
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
              Comisión {pct}%: {fmt(comTotal)} en total · ≈ {fmt(comTotal / sel.size)} por persona
            </div>
          )}
        </div> */}

        {err && <div className="form-error show">{err}</div>}

        <div className="modal-btns">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={guardar} disabled={loading}>
            {loading ? <span className="spinner"></span> : <><i className="ti ti-check" style={{ fontSize: 14 }}></i> {editando ? 'Guardar cambios' : 'Registrar venta'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════ DETALLE + COBROS ═════════════════════════ */
function DetalleVenta({ id, toast, onClose, onChanged, onEditar }) {
  const [d, setD]           = useState(null);
  const [fecha, setFecha]   = useState(fechaIso());
  const [monto, setMonto]   = useState('');
  const [metodo, setMetodo] = useState('Efectivo');
  const [ref, setRef]       = useState('');
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const r = await getVentaCobro(id);
      setD(r);
      setMonto(r.venta.saldo > 0 ? r.venta.saldo.toFixed(2) : '');
    } catch (e) { toast(e.message || 'No se pudo cargar la venta', 'err'); onClose(); }
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  if (!d) return null;
  const { venta, cobros, comisiones } = d;
  const anulada = venta.estado === 'anulada';
  const puedeCobrar = !anulada && venta.saldo > 0;

  async function registrarCobro() {
    const m = parseFloat(monto);
    if (!(m > 0)) return toast('Ingresa un monto válido', 'warn');
    if (m > venta.saldo + 0.001) return toast(`El cobro supera el saldo (${fmt(venta.saldo)})`, 'warn');
    setLoading(true);
    try {
      await postCobro(id, { fecha, monto: m, metodo, referencia: ref.trim() });
      setRef('');
      toast('Cobro registrado', 'success');
      await cargar(); onChanged();
    } catch (e) { toast(e.message || 'Error al registrar el cobro', 'err'); }
    finally { setLoading(false); }
  }

  async function quitarCobro(c) {
    if (!window.confirm(`¿Anular el cobro de ${fmt(c.monto)}?`)) return;
    try { await deleteCobro(c.id); toast('Cobro anulado', 'warn'); await cargar(); onChanged(); }
    catch (e) { toast(e.message || 'Error al anular el cobro', 'err'); }
  }

  async function anularVenta() {
    if (!window.confirm('¿Anular esta venta? Dejará de contar en los totales.')) return;
    try { await anularVentaCobro(id); toast('Venta anulada', 'warn'); onChanged(); onClose(); }
    catch (e) { toast(e.message || 'No se pudo anular', 'err'); }
  }

  const fila = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 };

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 560, width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="modal-title" style={{ justifyContent: 'space-between' }}>
          <span><i className="ti ti-receipt-2"></i> {venta.cliente}</span>
          <EstadoPill estado={venta.estado} />
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
          {fechaDisplay(venta.fecha)} · {TIPOS[venta.tipo]} · {venta.servicio}
          {venta.cotizacion_numero && <> · Cot. {venta.cotizacion_numero}</>}
          {venta.proyecto && <> · {venta.proyecto}</>}
        </div>

        {/* Vendido vs cobrado */}
        <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 12 }}>
          <div className="kpi"><div className="kpi-label">Total</div><div className="kpi-value" style={{ fontSize: 18 }}>{fmt(venta.monto)}</div></div>
          <div className="kpi"><div className="kpi-label">Cobrado</div><div className="kpi-value green" style={{ fontSize: 18 }}>{fmt(venta.cobrado)}</div></div>
          <div className="kpi"><div className="kpi-label">Saldo</div><div className="kpi-value" style={{ fontSize: 18, color: '#d97706' }}>{fmt(venta.saldo)}</div></div>
        </div>

        {/* Movimientos de cobro */}
        <div className="cat-label">Cobros</div>
        {!cobros.length && <div style={{ fontSize: 13, color: '#9ca3af', padding: '6px 0' }}>Aún no hay cobros registrados.</div>}
        {cobros.map(c => (
          <div key={c.id} style={{ ...fila, opacity: c.anulado ? 0.5 : 1, textDecoration: c.anulado ? 'line-through' : 'none' }}>
            <span>
              {fechaDisplay(c.fecha)} · {c.metodo}
              {c.referencia && <span style={{ color: '#9ca3af' }}> · {c.referencia}</span>}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <strong style={{ color: '#059669' }}>{fmt(c.monto)}</strong>
              {!c.anulado && !anulada && (
                <button className="btn-del" title="Anular cobro" onClick={() => quitarCobro(c)}><i className="ti ti-trash"></i></button>
              )}
            </span>
          </div>
        ))}

        {/* Nuevo cobro */}
        {puedeCobrar && (
          <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 10 }}>
            <div className="cat-label">Registrar cobro</div>
            <div className="modal-fields">
              <div className="modal-field">
                <label>Fecha</label>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
              </div>
              <div className="modal-field">
                <label>Monto (S/)</label>
                <input type="number" inputMode="decimal" min="0" step="0.01" value={monto} onChange={e => setMonto(e.target.value)} />
              </div>
              <div className="modal-field">
                <label>Método de pago</label>
                <select style={inputStyle} value={metodo} onChange={e => setMetodo(e.target.value)}>
                  {METODOS.map(x => <option key={x}>{x}</option>)}
                </select>
              </div>
              <div className="modal-field">
                <label>Referencia (opcional)</label>
                <input type="text" maxLength={255} placeholder="N° operación, observación…" value={ref} onChange={e => setRef(e.target.value)} />
              </div>
            </div>
            <button className="btn-save" style={{ marginTop: 10, width: '100%' }} onClick={registrarCobro} disabled={loading}>
              {loading ? <span className="spinner"></span> : <><i className="ti ti-plus" style={{ fontSize: 14 }}></i> Registrar cobro</>}
            </button>
          </div>
        )}

        {/* Comisiones de esta venta */}
        {comisiones.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="cat-label">Comisiones</div>
            {comisiones.map(c => (
              <div key={c.id} style={fila}>
                <span>{c.persona} <span style={{ color: '#9ca3af' }}>({Number(c.porcentaje)}% repartido)</span></span>
                <strong style={{ color: '#8b5cf6' }}>{fmt(c.monto)}</strong>
              </div>
            ))}
          </div>
        )}

        <div className="modal-btns" style={{ marginTop: 16 }}>
          {!anulada && <button className="btn-cancel" onClick={anularVenta}>Anular venta</button>}
          {!anulada && (
            <button className="btn-cancel" onClick={() => onEditar({ ...venta, comisionistas: comisiones.map(c => c.usuario_id) })}>
              <i className="ti ti-pencil" style={{ fontSize: 13 }}></i> Editar
            </button>
          )}
          <button className="btn-save" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}