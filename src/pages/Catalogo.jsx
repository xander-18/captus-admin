// // src/pages/Catalogo.jsx
// // Catálogo editable: equipos, accesorios y kits.
// // Lo que se guarda aquí es lo que leen las cotizaciones (GET /api/catalogo).
// import { useCallback, useEffect, useMemo, useState } from 'react';
// import { Package, Plus, Pencil, Trash2, Search, X } from 'lucide-react';
// import {
//   getCatalogo,
//   putCatalogoProducto,
//   deleteCatalogoProducto,
//   putCatalogoKit,
//   deleteCatalogoKit,
// } from '../api';

// /* ───────────── Utilidades ───────────── */

// const TIPOS = {
//   equipo: { plural: 'Equipos', singular: 'equipo' },
//   accesorio: { plural: 'Accesorios', singular: 'accesorio' },
// };

// const money = (n) =>
//   'S/ ' +
//   (Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// const norm = (s) =>
//   String(s ?? '')
//     .normalize('NFD')
//     .replace(/[\u0300-\u036f]/g, '')
//     .toLowerCase();

// const slug = (s) =>
//   norm(s)
//     .replace(/[^a-z0-9]+/g, '-')
//     .replace(/^-+|-+$/g, '')
//     .slice(0, 50);

// // Genera un id que no choque con los existentes
// function idUnico(base, usados) {
//   const b = base || 'item';
//   let id = b;
//   let n = 2;
//   while (usados.has(id)) id = `${b}-${n++}`;
//   return id;
// }

// const margenPct = (costo, precio) =>
//   Number(precio) > 0 ? ((Number(precio) - Number(costo)) / Number(precio)) * 100 : null;

// function Margen({ costo, precio }) {
//   const m = margenPct(costo, precio);
//   if (m == null) return <span style={{ color: '#9ca3af' }}>—</span>;
//   const color = m < 0 ? '#dc2626' : m < 15 ? '#d97706' : '#059669';
//   return <span style={{ fontWeight: 600, color }}>{m.toFixed(0)}%</span>;
// }

// // Costo / venta de un kit (solo ítems no opcionales). null si el kit no tiene el formato conocido.
// function resumenKit(kit, mapa) {
//   if (!Array.isArray(kit.items)) return null;
//   let costo = 0;
//   let precio = 0;
//   for (const it of kit.items) {
//     if (it.opcional) continue;
//     const p = mapa.get(`${it.tipo}:${it.id}`);
//     if (!p) continue;
//     const qty = Number(it.qty) || 1;
//     costo += p.costo * qty;
//     precio += p.precio * qty;
//   }
//   return { costo, precio };
// }

// /* ───────────── Modal: producto ───────────── */

// function ProductoModal({ tipo, item, idsUsados, marcas, unidades, onClose, onSave }) {
//   const editando = !!item;
//   // Si "incluye" viene con otro formato (no lista de textos) no lo tocamos
//   const incluyeEditable =
//     !item?.incluye || (Array.isArray(item.incluye) && item.incluye.every((x) => typeof x === 'string'));

//   const [f, setF] = useState({
//     name: item?.name ?? '',
//     marca: item?.marca ?? '',
//     unidad: item?.unidad ?? '',
//     costo: item?.costo ?? '',
//     precio: item?.precio ?? '',
//     nota: item?.nota ?? '',
//     incluye: incluyeEditable && Array.isArray(item?.incluye) ? item.incluye.join('\n') : '',
//   });
//   const [error, setError] = useState('');
//   const [guardando, setGuardando] = useState(false);
//   const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

//   const enviar = async () => {
//     const costo = f.costo === '' ? 0 : Number(f.costo);
//     const precio = Number(f.precio);
//     if (!f.name.trim()) return setError('El nombre es obligatorio');
//     if (f.precio === '' || !Number.isFinite(precio) || precio < 0) return setError('Ingresa un precio válido');
//     if (!Number.isFinite(costo) || costo < 0) return setError('Ingresa un costo válido');

//     const lineas = f.incluye.split('\n').map((s) => s.trim()).filter(Boolean);
//     const body = {
//       name: f.name.trim(),
//       marca: f.marca.trim(),
//       unidad: f.unidad.trim(),
//       costo,
//       precio,
//       nota: f.nota.trim(),
//       incluye: incluyeEditable ? (lineas.length ? lineas : null) : item.incluye,
//     };
//     const id = editando ? item.id : idUnico(slug(f.name), idsUsados);

//     try {
//       setGuardando(true);
//       setError('');
//       await onSave(tipo, id, body);
//     } catch (e) {
//       setError(e.message || 'No se pudo guardar');
//       setGuardando(false);
//     }
//   };

//   return (
//     <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
//       <div className="modal tk-modal">
//         <div className="modal-title">
//           <span>
//             {editando ? 'Editar' : 'Nuevo'} {TIPOS[tipo].singular}
//           </span>
//           <button className="tk-x" onClick={onClose} aria-label="Cerrar">
//             <X size={18} />
//           </button>
//         </div>

//         <div className="modal-fields">
//           <div className="modal-field tk-full">
//             <label>Nombre *</label>
//             <input value={f.name} onChange={set('name')} autoFocus placeholder="Ej. Cámara bala 2MP" />
//           </div>

//           <div className="modal-field">
//             <label>Marca</label>
//             <input list="cg-marcas" value={f.marca} onChange={set('marca')} placeholder="Ej. HAGROY" />
//             <datalist id="cg-marcas">
//               {marcas.map((m) => <option key={m} value={m} />)}
//             </datalist>
//           </div>
//           <div className="modal-field">
//             <label>Unidad</label>
//             <input list="cg-unidades" value={f.unidad} onChange={set('unidad')} placeholder="und, m, rollo…" />
//             <datalist id="cg-unidades">
//               {unidades.map((u) => <option key={u} value={u} />)}
//             </datalist>
//           </div>

//           <div className="modal-field">
//             <label>Costo (S/)</label>
//             <input type="number" min="0" step="0.01" value={f.costo} onChange={set('costo')} placeholder="0.00" />
//           </div>
//           <div className="modal-field">
//             <label>Precio de venta (S/) *</label>
//             <input type="number" min="0" step="0.01" value={f.precio} onChange={set('precio')} placeholder="0.00" />
//           </div>

//           <div className="modal-field tk-full">
//             <label>
//               Margen:{' '}
//               <Margen costo={f.costo === '' ? 0 : f.costo} precio={f.precio} />
//             </label>
//           </div>

//           <div className="modal-field tk-full">
//             <label>Nota (opcional)</label>
//             <input value={f.nota} onChange={set('nota')} placeholder="Texto que acompaña al producto en la cotización" />
//           </div>

//           {incluyeEditable && (
//             <div className="modal-field tk-full">
//               <label>Incluye (opcional)</label>
//               <textarea
//                 rows={4}
//                 value={f.incluye}
//                 onChange={set('incluye')}
//                 placeholder={'Una línea por cada cosa que incluye\nEj. Fuente de poder 12V'}
//               />
//               <span className="modal-hint">Una línea por ítem.</span>
//             </div>
//           )}
//         </div>

//         {error && <div className="form-error show" style={{ marginBottom: 12 }}>{error}</div>}

//         <div className="modal-btns">
//           <button className="btn-cancel" onClick={onClose}>Cancelar</button>
//           <button className="btn-save" onClick={enviar} disabled={guardando}>
//             {guardando ? <span className="spinner" /> : null} Guardar
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ───────────── Modal: kit ─────────────
//    Forma que asume este editor (ajústala aquí si tus kits son distintos):
//    { name, categoria, items: [{ tipo, id, qty, opcional }] }
//    Cualquier otro campo del kit se conserva tal cual al guardar. */

// const itemVacio = () => ({ tipo: 'equipo', id: '', qty: 1, opcional: false });

// function KitModal({ kit, productos, mapa, idsUsados, categorias, onClose, onSave }) {
//   const editando = !!kit;
//   const formaConocida =
//     !kit || (Array.isArray(kit.items) && kit.items.every((i) => i && typeof i.id === 'string'));

//   const [name, setName] = useState(kit?.name ?? '');
//   const [categoria, setCategoria] = useState(kit?.categoria ?? '');
//   const [items, setItems] = useState(
//     formaConocida && Array.isArray(kit?.items)
//       ? kit.items.map((i) => ({ ...i, tipo: i.tipo || 'equipo', qty: Number(i.qty) || 1, opcional: !!i.opcional }))
//       : []
//   );
//   const [error, setError] = useState('');
//   const [guardando, setGuardando] = useState(false);

//   const setItem = (idx, patch) => setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
//   const quitar = (idx) => setItems((arr) => arr.filter((_, i) => i !== idx));

//   const resumen = useMemo(() => resumenKit({ items }, mapa), [items, mapa]);

//   const equipos = productos.filter((p) => p.tipo === 'equipo');
//   const accesorios = productos.filter((p) => p.tipo === 'accesorio');

//   const enviar = async () => {
//     if (!name.trim()) return setError('El kit necesita un nombre');
//     if (formaConocida && items.some((i) => !i.id)) return setError('Hay ítems sin producto elegido');

//     const datos = formaConocida
//       ? { ...(kit ?? {}), name: name.trim(), categoria: categoria.trim(), items: items.map((i) => ({ ...i, qty: Number(i.qty) || 1 })) }
//       : { ...kit, name: name.trim(), categoria: categoria.trim() };
//     const id = editando ? kit.id : idUnico(slug(name), idsUsados);

//     try {
//       setGuardando(true);
//       setError('');
//       await onSave(id, datos);
//     } catch (e) {
//       setError(e.message || 'No se pudo guardar');
//       setGuardando(false);
//     }
//   };

//   return (
//     <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
//       <div className="modal tk-modal" style={{ maxWidth: 760 }}>
//         <div className="modal-title">
//           <span>{editando ? 'Editar kit' : 'Nuevo kit'}</span>
//           <button className="tk-x" onClick={onClose} aria-label="Cerrar">
//             <X size={18} />
//           </button>
//         </div>

//         <div className="modal-fields">
//           <div className="modal-field">
//             <label>Nombre del kit *</label>
//             <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ej. Kit alarma RF3 SMART" />
//           </div>
//           <div className="modal-field">
//             <label>Categoría</label>
//             <input list="cg-categorias" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ej. Alarmas" />
//             <datalist id="cg-categorias">
//               {categorias.map((c) => <option key={c} value={c} />)}
//             </datalist>
//           </div>
//         </div>

//         {!formaConocida ? (
//           <div className="banner show" style={{ marginBottom: 14 }}>
//             Este kit tiene un formato que el editor no reconoce, así que aquí solo puedes cambiar su nombre y categoría. Sus ítems no se tocan.
//           </div>
//         ) : (
//           <>
//             <div className="block-label" style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, marginBottom: 6 }}>
//               Productos del kit
//             </div>

//             {items.length === 0 && (
//               <div style={{ fontSize: 13, color: '#9ca3af', padding: '6px 0 10px' }}>
//                 Aún no agregas productos.
//               </div>
//             )}

//             {items.map((it, idx) => {
//               const clave = it.id ? `${it.tipo}:${it.id}` : '';
//               const existe = !clave || mapa.has(clave);
//               return (
//                 <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
//                   <select
//                     className="tk-select"
//                     style={{ flex: '1 1 240px' }}
//                     value={clave}
//                     onChange={(e) => {
//                       const v = e.target.value;
//                       const i = v.indexOf(':');
//                       setItem(idx, { tipo: v.slice(0, i), id: v.slice(i + 1) });
//                     }}
//                   >
//                     <option value="">Elegir producto…</option>
//                     {!existe && <option value={clave}>⚠ {it.id} (ya no existe)</option>}
//                     <optgroup label="Equipos">
//                       {equipos.map((p) => (
//                         <option key={p.id} value={`equipo:${p.id}`}>
//                           {p.name}{p.marca ? ` · ${p.marca}` : ''}
//                         </option>
//                       ))}
//                     </optgroup>
//                     <optgroup label="Accesorios">
//                       {accesorios.map((p) => (
//                         <option key={p.id} value={`accesorio:${p.id}`}>
//                           {p.name}{p.marca ? ` · ${p.marca}` : ''}
//                         </option>
//                       ))}
//                     </optgroup>
//                   </select>

//                   <input
//                     type="number"
//                     min="1"
//                     step="1"
//                     value={it.qty}
//                     onChange={(e) => setItem(idx, { qty: e.target.value })}
//                     aria-label="Cantidad"
//                     style={{
//                       width: 64, textAlign: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8,
//                       padding: '7px 6px', fontSize: 13, fontFamily: 'inherit',
//                     }}
//                   />

//                   <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280', cursor: 'pointer' }}>
//                     <input type="checkbox" checked={it.opcional} onChange={(e) => setItem(idx, { opcional: e.target.checked })} />
//                     Opcional
//                   </label>

//                   <button className="btn-del" onClick={() => quitar(idx)} aria-label="Quitar">
//                     <Trash2 size={16} />
//                   </button>
//                 </div>
//               );
//             })}

//             <button
//               className="btn-cancel"
//               style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14 }}
//               onClick={() => setItems((arr) => [...arr, itemVacio()])}
//             >
//               <Plus size={14} /> Agregar producto
//             </button>

//             {resumen && (
//               <div
//                 style={{
//                   display: 'flex', gap: 18, flexWrap: 'wrap', background: '#f8fafc', border: '1px solid #e2e8f0',
//                   borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#475569',
//                 }}
//               >
//                 <span>Costo: <b>{money(resumen.costo)}</b></span>
//                 <span>Venta: <b>{money(resumen.precio)}</b></span>
//                 <span>Margen: <Margen costo={resumen.costo} precio={resumen.precio} /></span>
//                 <span style={{ color: '#9ca3af' }}>(sin contar los opcionales)</span>
//               </div>
//             )}
//           </>
//         )}

//         {error && <div className="form-error show" style={{ marginBottom: 12 }}>{error}</div>}

//         <div className="modal-btns">
//           <button className="btn-cancel" onClick={onClose}>Cancelar</button>
//           <button className="btn-save" onClick={enviar} disabled={guardando}>
//             {guardando ? <span className="spinner" /> : null} Guardar
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ───────────── Vista principal ───────────── */

// export default function Catalogo() {
//   const [data, setData] = useState({ productos: [], kits: [] });
//   const [cargando, setCargando] = useState(true);
//   const [error, setError] = useState('');
//   const [tab, setTab] = useState('equipo'); // equipo | accesorio | kit
//   const [q, setQ] = useState('');
//   const [marca, setMarca] = useState('');
//   const [modal, setModal] = useState(null); // { kind: 'producto'|'kit', tipo?, item? }
//   const [toast, setToast] = useState(null);

//   const avisar = useCallback((msg, kind = 'success') => {
//     setToast({ msg, kind });
//     setTimeout(() => setToast(null), 2600);
//   }, []);

//   const cargar = useCallback(async () => {
//     try {
//       setError('');
//       const d = await getCatalogo();
//       setData({ productos: d.productos ?? [], kits: d.kits ?? [] });
//     } catch (e) {
//       setError(e.message || 'No se pudo cargar el catálogo');
//     } finally {
//       setCargando(false);
//     }
//   }, []);

//   useEffect(() => { cargar(); }, [cargar]);

//   const esKit = tab === 'kit';
//   const mapa = useMemo(() => new Map(data.productos.map((p) => [`${p.tipo}:${p.id}`, p])), [data.productos]);
//   const porTipo = useMemo(
//     () => ({
//       equipo: data.productos.filter((p) => p.tipo === 'equipo'),
//       accesorio: data.productos.filter((p) => p.tipo === 'accesorio'),
//     }),
//     [data.productos]
//   );
//   const lista = esKit ? data.kits : porTipo[tab];

//   const marcas = useMemo(
//     () => [...new Set(data.productos.map((p) => p.marca).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
//     [data.productos]
//   );
//   const unidades = useMemo(
//     () => [...new Set(['und', 'm', ...data.productos.map((p) => p.unidad).filter(Boolean)])],
//     [data.productos]
//   );
//   const categorias = useMemo(
//     () => [...new Set(data.kits.map((k) => k.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
//     [data.kits]
//   );
//   const marcasTab = useMemo(
//     () => (esKit ? [] : [...new Set(porTipo[tab].map((p) => p.marca).filter(Boolean))].sort((a, b) => a.localeCompare(b))),
//     [esKit, porTipo, tab]
//   );

//   const filtrados = useMemo(() => {
//     const t = norm(q);
//     return lista.filter((x) => {
//       if (!esKit && marca && x.marca !== marca) return false;
//       if (!t) return true;
//       const texto = esKit ? `${x.name} ${x.categoria ?? ''}` : `${x.name} ${x.marca ?? ''} ${x.nota ?? ''}`;
//       return norm(texto).includes(t);
//     });
//   }, [lista, q, marca, esKit]);

//   /* ── Acciones ── */

//   const guardarProducto = async (tipo, id, body) => {
//     await putCatalogoProducto(tipo, id, body);
//     await cargar();
//     setModal(null);
//     avisar('Producto guardado');
//   };

//   const borrarProducto = async (p) => {
//     const enKits = data.kits.filter(
//       (k) => Array.isArray(k.items) && k.items.some((i) => i.tipo === p.tipo && i.id === p.id)
//     );
//     const aviso = enKits.length
//       ? `\n\nOjo: está en ${enKits.length} kit(s): ${enKits.map((k) => k.name).join(', ')}.`
//       : '';
//     if (!window.confirm(`¿Eliminar "${p.name}" del catálogo?${aviso}`)) return;
//     try {
//       await deleteCatalogoProducto(p.tipo, p.id);
//       await cargar();
//       avisar('Producto eliminado');
//     } catch (e) {
//       avisar(e.message || 'No se pudo eliminar', 'err');
//     }
//   };

//   const guardarKit = async (id, datos) => {
//     await putCatalogoKit(id, datos);
//     await cargar();
//     setModal(null);
//     avisar('Kit guardado');
//   };

//   const borrarKit = async (k) => {
//     if (!window.confirm(`¿Eliminar el kit "${k.name}"?`)) return;
//     try {
//       await deleteCatalogoKit(k.id);
//       await cargar();
//       avisar('Kit eliminado');
//     } catch (e) {
//       avisar(e.message || 'No se pudo eliminar', 'err');
//     }
//   };

//   const nuevo = () => setModal(esKit ? { kind: 'kit' } : { kind: 'producto', tipo: tab });

//   const cambiarTab = (t) => {
//     setTab(t);
//     setMarca('');
//     setQ('');
//   };

//   /* ── Render ── */

//   return (
//     <div className="page">
//       <div className="header">
//         <div className="brand">
//           <div className="brand-icon"><Package /></div>
//           <div>
//             <h1>Catálogo</h1>
//             <p>Equipos, accesorios y kits que aparecen en las cotizaciones</p>
//           </div>
//         </div>
//         <div className="header-right">
//           <button className="btn-add" onClick={nuevo} disabled={cargando}>
//             <Plus size={16} />
//             {esKit ? 'Nuevo kit' : `Nuevo ${TIPOS[tab].singular}`}
//           </button>
//         </div>
//       </div>

//       {error && (
//         <div className="banner show" style={{ justifyContent: 'space-between' }}>
//           <span>{error}</span>
//           <button className="btn-set" onClick={cargar}>Reintentar</button>
//         </div>
//       )}

//       <div className="filtro-fecha-card">
//         <div className="periodo-chips">
//           <button className={`periodo-chip ${tab === 'equipo' ? 'active' : ''}`} onClick={() => cambiarTab('equipo')}>
//             Equipos ({porTipo.equipo.length})
//           </button>
//           <button className={`periodo-chip ${tab === 'accesorio' ? 'active' : ''}`} onClick={() => cambiarTab('accesorio')}>
//             Accesorios ({porTipo.accesorio.length})
//           </button>
//           <button className={`periodo-chip ${tab === 'kit' ? 'active' : ''}`} onClick={() => cambiarTab('kit')}>
//             Kits ({data.kits.length})
//           </button>
//         </div>
//       </div>

//       <div className="table-card">
//         <div className="table-head">
//           <div className="table-title">
//             {esKit ? 'Kits' : TIPOS[tab].plural}
//             <span className="badge">{filtrados.length}</span>
//           </div>
//           <div className="table-actions">
//             {!esKit && marcasTab.length > 0 && (
//               <select className="tk-select" value={marca} onChange={(e) => setMarca(e.target.value)}>
//                 <option value="">Todas las marcas</option>
//                 {marcasTab.map((m) => <option key={m} value={m}>{m}</option>)}
//               </select>
//             )}
//             <div style={{ position: 'relative' }}>
//               <input
//                 type="text"
//                 value={q}
//                 onChange={(e) => setQ(e.target.value)}
//                 placeholder={esKit ? 'Buscar kit…' : 'Buscar producto…'}
//                 style={{ paddingLeft: 32 }}
//               />
//               <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
//             </div>
//           </div>
//         </div>

//         {cargando ? (
//           <div className="empty"><p>Cargando catálogo…</p></div>
//         ) : filtrados.length === 0 ? (
//           <div className="empty">
//             <Package size={36} style={{ color: '#d1d5db', marginBottom: 10 }} />
//             <p>{lista.length === 0 ? `Aún no hay ${esKit ? 'kits' : TIPOS[tab].plural.toLowerCase()}` : 'Sin resultados'}</p>
//             {lista.length === 0 && <small>Usa el botón "{esKit ? 'Nuevo kit' : `Nuevo ${TIPOS[tab].singular}`}" para agregar el primero</small>}
//           </div>
//         ) : esKit ? (
//           <div>
//             <table>
//               <thead>
//                 <tr>
//                   <th>Kit</th><th>Categoría</th><th>Ítems</th><th>Costo</th><th>Venta</th><th>Margen</th><th></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filtrados.map((k) => {
//                   const r = resumenKit(k, mapa);
//                   return (
//                     <tr key={k.id}>
//                       <td className="td-cliente">{k.name}</td>
//                       <td>{k.categoria || <span style={{ color: '#9ca3af' }}>—</span>}</td>
//                       <td>{Array.isArray(k.items) ? k.items.length : '—'}</td>
//                       <td>{r ? money(r.costo) : '—'}</td>
//                       <td>{r ? money(r.precio) : '—'}</td>
//                       <td>{r ? <Margen costo={r.costo} precio={r.precio} /> : '—'}</td>
//                       <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
//                         <button className="btn-edit" onClick={() => setModal({ kind: 'kit', item: k })} aria-label="Editar"><Pencil size={16} /></button>
//                         <button className="btn-del" onClick={() => borrarKit(k)} aria-label="Eliminar"><Trash2 size={16} /></button>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <div>
//             <table>
//               <thead>
//                 <tr>
//                   <th>Producto</th><th>Marca</th><th>Unidad</th><th>Costo</th><th>Precio</th><th>Margen</th><th></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filtrados.map((p) => (
//                   <tr key={`${p.tipo}:${p.id}`}>
//                     <td>
//                       <div className="td-cliente">{p.name}</div>
//                       {p.nota && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{p.nota}</div>}
//                     </td>
//                     <td>{p.marca || <span style={{ color: '#9ca3af' }}>—</span>}</td>
//                     <td>{p.unidad || <span style={{ color: '#9ca3af' }}>—</span>}</td>
//                     <td>{money(p.costo)}</td>
//                     <td className="td-monto">{money(p.precio)}</td>
//                     <td><Margen costo={p.costo} precio={p.precio} /></td>
//                     <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
//                       <button className="btn-edit" onClick={() => setModal({ kind: 'producto', tipo: p.tipo, item: p })} aria-label="Editar"><Pencil size={16} /></button>
//                       <button className="btn-del" onClick={() => borrarProducto(p)} aria-label="Eliminar"><Trash2 size={16} /></button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {modal?.kind === 'producto' && (
//         <ProductoModal
//           key={modal.item?.id ?? 'nuevo'}
//           tipo={modal.tipo}
//           item={modal.item}
//           idsUsados={new Set(porTipo[modal.tipo].map((p) => p.id))}
//           marcas={marcas}
//           unidades={unidades}
//           onClose={() => setModal(null)}
//           onSave={guardarProducto}
//         />
//       )}

//       {modal?.kind === 'kit' && (
//         <KitModal
//           key={modal.item?.id ?? 'nuevo'}
//           kit={modal.item}
//           productos={data.productos}
//           mapa={mapa}
//           idsUsados={new Set(data.kits.map((k) => k.id))}
//           categorias={categorias}
//           onClose={() => setModal(null)}
//           onSave={guardarKit}
//         />
//       )}

//       <div className="toast-wrap">
//         <div className={`toast ${toast ? `show ${toast.kind}` : ''}`}>{toast?.msg}</div>
//       </div>
//     </div>
//   );
// }
// src/pages/Catalogo.jsx
// Catálogo editable: equipos, accesorios y kits.
// Lo que se guarda aquí es lo que leen las cotizaciones (GET /api/catalogo).
//
// Forma de un kit (la misma que ya usan las cotizaciones):
// { id, name, categoria, laborValue?, precioReferencia?, nota?,
//   items:      { equipos: [{ pid, qty }], accesorios: [{ pid, qty }] },
//   opcionales: { equipos: [{ pid, qty }], accesorios: [{ pid, qty }] } }
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Package, Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import {
  getCatalogo,
  putCatalogoProducto,
  deleteCatalogoProducto,
  putCatalogoKit,
  deleteCatalogoKit,
} from '../api';

/* ───────────── Utilidades ───────────── */

const TIPOS = {
  equipo: { plural: 'Equipos', singular: 'equipo' },
  accesorio: { plural: 'Accesorios', singular: 'accesorio' },
};

const money = (n) =>
  'S/ ' +
  (Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const slug = (s) =>
  norm(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

// Genera un id que no choque con los existentes
function idUnico(base, usados) {
  const b = base || 'item';
  let id = b;
  let n = 2;
  while (usados.has(id)) id = `${b}-${n++}`;
  return id;
}

const margenPct = (costo, precio) =>
  Number(precio) > 0 ? ((Number(precio) - Number(costo)) / Number(precio)) * 100 : null;

function Margen({ costo, precio }) {
  const m = margenPct(costo, precio);
  if (m == null) return <span style={{ color: '#9ca3af' }}>—</span>;
  const color = m < 0 ? '#dc2626' : m < 15 ? '#d97706' : '#059669';
  return <span style={{ fontWeight: 600, color }}>{m.toFixed(0)}%</span>;
}

/* ── Kits: conversión entre la forma guardada y filas planas para editar ── */

const SECCION = { equipo: 'equipos', accesorio: 'accesorios' };

function kitAFilas(kit) {
  const filas = [];
  for (const grupo of ['items', 'opcionales']) {
    for (const tipo of ['equipo', 'accesorio']) {
      for (const r of kit?.[grupo]?.[SECCION[tipo]] ?? []) {
        filas.push({ grupo, tipo, pid: r.pid, qty: Number(r.qty) || 1 });
      }
    }
  }
  return filas;
}

function filasAKit(filas) {
  const out = {
    items: { equipos: [], accesorios: [] },
    opcionales: { equipos: [], accesorios: [] },
  };
  for (const f of filas) {
    out[f.grupo][SECCION[f.tipo]].push({ pid: f.pid, qty: Number(f.qty) || 1 });
  }
  return out;
}

// ¿El kit usa este producto (en incluidos u opcionales)?
const kitUsa = (kit, p) => kitAFilas(kit).some((f) => f.tipo === p.tipo && f.pid === p.id);

// Costo / venta de los productos incluidos (sin opcionales) y cantidad de ítems
function resumenKit(kit, mapa) {
  let costo = 0;
  let precio = 0;
  let n = 0;
  let opc = 0;
  for (const tipo of ['equipo', 'accesorio']) {
    for (const r of kit.items?.[SECCION[tipo]] ?? []) {
      n++;
      const p = mapa.get(`${tipo}:${r.pid}`);
      if (!p) continue;
      const qty = Number(r.qty) || 1;
      costo += p.costo * qty;
      precio += p.precio * qty;
    }
    opc += (kit.opcionales?.[SECCION[tipo]] ?? []).length;
  }
  return { costo, precio, n, opc };
}

/* ── Productos: "incluye" se guarda como pares [cantidad, texto] ── */

const esPar = (x) => Array.isArray(x) && x.length === 2;

const incluyeATexto = (arr) =>
  (arr ?? []).map((x) => (esPar(x) ? `${x[0]}x ${x[1]}` : `1x ${x}`)).join('\n');

const textoAIncluye = (t) =>
  t
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(\d+)\s*[x×]?\s+(.+)$/i);
      return m ? [Number(m[1]), m[2].trim()] : [1, l];
    });

/* ───────────── Modal: producto ───────────── */

function ProductoModal({ tipo, item, idsUsados, marcas, unidades, onClose, onSave }) {
  const editando = !!item;
  // Si "incluye" viene en un formato desconocido no lo tocamos
  const incluyeEditable =
    !item?.incluye ||
    (Array.isArray(item.incluye) && item.incluye.every((x) => esPar(x) || typeof x === 'string'));

  const [f, setF] = useState({
    name: item?.name ?? '',
    marca: item?.marca ?? '',
    unidad: item?.unidad ?? '',
    costo: item?.costo ?? '',
    precio: item?.precio ?? '',
    nota: item?.nota ?? '',
    incluye: incluyeEditable ? incluyeATexto(item?.incluye) : '',
  });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const enviar = async () => {
    const costo = f.costo === '' ? 0 : Number(f.costo);
    const precio = Number(f.precio);
    if (!f.name.trim()) return setError('El nombre es obligatorio');
    if (f.precio === '' || !Number.isFinite(precio) || precio < 0) return setError('Ingresa un precio válido');
    if (!Number.isFinite(costo) || costo < 0) return setError('Ingresa un costo válido');

    const lista = textoAIncluye(f.incluye);
    const body = {
      name: f.name.trim(),
      marca: f.marca.trim(),
      unidad: f.unidad.trim(),
      costo,
      precio,
      nota: f.nota.trim(),
      incluye: incluyeEditable ? (lista.length ? lista : null) : item.incluye,
    };
    const id = editando ? item.id : idUnico(slug(f.name), idsUsados);

    try {
      setGuardando(true);
      setError('');
      await onSave(tipo, id, body);
    } catch (e) {
      setError(e.message || 'No se pudo guardar');
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal tk-modal">
        <div className="modal-title">
          <span>
            {editando ? 'Editar' : 'Nuevo'} {TIPOS[tipo].singular}
          </span>
          <button className="tk-x" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-fields">
          <div className="modal-field tk-full">
            <label>Nombre *</label>
            <input value={f.name} onChange={set('name')} autoFocus placeholder="Ej. Cámara bala 2MP" />
          </div>

          <div className="modal-field">
            <label>Marca</label>
            <input list="cg-marcas" value={f.marca} onChange={set('marca')} placeholder="Ej. HAGROY" />
            <datalist id="cg-marcas">
              {marcas.map((m) => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div className="modal-field">
            <label>Unidad</label>
            <input list="cg-unidades" value={f.unidad} onChange={set('unidad')} placeholder="und, m, rollo…" />
            <datalist id="cg-unidades">
              {unidades.map((u) => <option key={u} value={u} />)}
            </datalist>
          </div>

          <div className="modal-field">
            <label>Costo (S/)</label>
            <input type="number" min="0" step="0.01" value={f.costo} onChange={set('costo')} placeholder="0.00" />
          </div>
          <div className="modal-field">
            <label>Precio de venta (S/) *</label>
            <input type="number" min="0" step="0.01" value={f.precio} onChange={set('precio')} placeholder="0.00" />
          </div>

          <div className="modal-field tk-full">
            <label>
              Margen:{' '}
              <Margen costo={f.costo === '' ? 0 : f.costo} precio={f.precio} />
            </label>
          </div>

          <div className="modal-field tk-full">
            <label>Nota (opcional)</label>
            <input value={f.nota} onChange={set('nota')} placeholder="Texto que acompaña al producto en la cotización" />
          </div>

          {incluyeEditable && (
            <div className="modal-field tk-full">
              <label>Incluye (opcional)</label>
              <textarea
                rows={4}
                value={f.incluye}
                onChange={set('incluye')}
                placeholder={'Una línea por cada cosa que incluye\nEj. 1x Fuente 12V 2A'}
              />
              <span className="modal-hint">Una línea por ítem, con la cantidad al inicio (ej. 2x Pulsador).</span>
            </div>
          )}
        </div>

        {error && <div className="form-error show" style={{ marginBottom: 12 }}>{error}</div>}

        <div className="modal-btns">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={enviar} disabled={guardando}>
            {guardando ? <span className="spinner" /> : null} Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Modal: kit ───────────── */

const GRUPOS = [
  ['items', 'Incluido en el kit'],
  ['opcionales', 'Opcionales (se pueden agregar en la cotización)'],
];

const filaVacia = (grupo) => ({ grupo, tipo: 'equipo', pid: '', qty: 1 });

function KitModal({ kit, productos, mapa, idsUsados, categorias, onClose, onSave }) {
  const editando = !!kit;

  const [name, setName] = useState(kit?.name ?? '');
  const [categoria, setCategoria] = useState(kit?.categoria ?? '');
  const [labor, setLabor] = useState(kit?.laborValue ?? '');
  const [refPrecio, setRefPrecio] = useState(kit?.precioReferencia ?? '');
  const [nota, setNota] = useState(kit?.nota ?? '');
  const [filas, setFilas] = useState(() => kitAFilas(kit));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const setFila = (idx, patch) => setFilas((arr) => arr.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  const quitar = (idx) => setFilas((arr) => arr.filter((_, i) => i !== idx));

  const resumen = useMemo(() => resumenKit(filasAKit(filas), mapa), [filas, mapa]);

  const equipos = productos.filter((p) => p.tipo === 'equipo');
  const accesorios = productos.filter((p) => p.tipo === 'accesorio');

  const enviar = async () => {
    if (!name.trim()) return setError('El kit necesita un nombre');
    if (filas.some((f) => !f.pid)) return setError('Hay filas sin producto elegido');
    if (labor !== '' && !(Number(labor) >= 0)) return setError('La mano de obra no es válida');
    if (refPrecio !== '' && !(Number(refPrecio) >= 0)) return setError('El precio de referencia no es válido');

    // Se parte del kit original para no perder ningún campo que este editor no muestre
    const datos = { ...(kit ?? {}), name: name.trim(), categoria: categoria.trim(), ...filasAKit(filas) };
    if (labor !== '') datos.laborValue = Number(labor); else delete datos.laborValue;
    if (refPrecio !== '') datos.precioReferencia = Number(refPrecio); else delete datos.precioReferencia;
    if (nota.trim()) datos.nota = nota.trim(); else delete datos.nota;
    delete datos.id;

    const id = editando ? kit.id : idUnico(slug(name), idsUsados);

    try {
      setGuardando(true);
      setError('');
      await onSave(id, datos);
    } catch (e) {
      setError(e.message || 'No se pudo guardar');
      setGuardando(false);
    }
  };

  const renderFila = (f, idx) => {
    const clave = f.pid ? `${f.tipo}:${f.pid}` : '';
    const existe = !clave || mapa.has(clave);
    return (
      <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <select
          className="tk-select"
          style={{ flex: '1 1 240px' }}
          value={clave}
          onChange={(e) => {
            const v = e.target.value;
            const i = v.indexOf(':');
            setFila(idx, { tipo: v.slice(0, i), pid: v.slice(i + 1) });
          }}
        >
          <option value="">Elegir producto…</option>
          {!existe && <option value={clave}>⚠ {f.pid} (no existe en el catálogo)</option>}
          <optgroup label="Equipos">
            {equipos.map((p) => (
              <option key={p.id} value={`equipo:${p.id}`}>
                {p.name}{p.marca ? ` · ${p.marca}` : ''}
              </option>
            ))}
          </optgroup>
          <optgroup label="Accesorios">
            {accesorios.map((p) => (
              <option key={p.id} value={`accesorio:${p.id}`}>
                {p.name}{p.marca ? ` · ${p.marca}` : ''}
              </option>
            ))}
          </optgroup>
        </select>

        <input
          type="number"
          min="1"
          step="1"
          value={f.qty}
          onChange={(e) => setFila(idx, { qty: e.target.value })}
          aria-label="Cantidad"
          style={{
            width: 64, textAlign: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8,
            padding: '7px 6px', fontSize: 13, fontFamily: 'inherit',
          }}
        />

        <button className="btn-del" onClick={() => quitar(idx)} aria-label="Quitar">
          <Trash2 size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal tk-modal" style={{ maxWidth: 760 }}>
        <div className="modal-title">
          <span>{editando ? 'Editar kit' : 'Nuevo kit'}</span>
          <button className="tk-x" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-fields">
          <div className="modal-field">
            <label>Nombre del kit *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ej. Kit alarma RF3 SMART" />
          </div>
          <div className="modal-field">
            <label>Categoría</label>
            <input list="cg-categorias" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ej. Alarmas / pánico" />
            <datalist id="cg-categorias">
              {categorias.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="modal-field">
            <label>Mano de obra (S/)</label>
            <input type="number" min="0" step="0.01" value={labor} onChange={(e) => setLabor(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="modal-field">
            <label>Precio de referencia (S/)</label>
            <input type="number" min="0" step="0.01" value={refPrecio} onChange={(e) => setRefPrecio(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="modal-field tk-full">
            <label>Nota (opcional)</label>
            <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Aclaración que acompaña al kit" />
          </div>
        </div>

        {GRUPOS.map(([grupo, titulo]) => {
          const delGrupo = filas.map((f, idx) => [f, idx]).filter(([f]) => f.grupo === grupo);
          return (
            <div key={grupo} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>{titulo}</div>
              {delGrupo.length === 0 && (
                <div style={{ fontSize: 13, color: '#9ca3af', padding: '2px 0 8px' }}>Sin productos.</div>
              )}
              {delGrupo.map(([f, idx]) => renderFila(f, idx))}
              <button
                className="btn-cancel"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => setFilas((arr) => [...arr, filaVacia(grupo)])}
              >
                <Plus size={14} /> Agregar producto
              </button>
            </div>
          );
        })}

        <div
          style={{
            display: 'flex', gap: 18, flexWrap: 'wrap', background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#475569',
          }}
        >
          <span>Costo: <b>{money(resumen.costo)}</b></span>
          <span>Venta: <b>{money(resumen.precio)}</b></span>
          <span>Margen: <Margen costo={resumen.costo} precio={resumen.precio} /></span>
          <span style={{ color: '#9ca3af' }}>(solo lo incluido, sin opcionales ni mano de obra)</span>
        </div>

        {error && <div className="form-error show" style={{ marginBottom: 12 }}>{error}</div>}

        <div className="modal-btns">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={enviar} disabled={guardando}>
            {guardando ? <span className="spinner" /> : null} Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Vista principal ───────────── */

export default function Catalogo() {
  const [data, setData] = useState({ productos: [], kits: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('equipo'); // equipo | accesorio | kit
  const [q, setQ] = useState('');
  const [marca, setMarca] = useState('');
  const [modal, setModal] = useState(null); // { kind: 'producto'|'kit', tipo?, item? }
  const [toast, setToast] = useState(null);

  const avisar = useCallback((msg, kind = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2600);
  }, []);

  const cargar = useCallback(async () => {
    try {
      setError('');
      const d = await getCatalogo();
      setData({ productos: d.productos ?? [], kits: d.kits ?? [] });
    } catch (e) {
      setError(e.message || 'No se pudo cargar el catálogo');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const esKit = tab === 'kit';
  const mapa = useMemo(() => new Map(data.productos.map((p) => [`${p.tipo}:${p.id}`, p])), [data.productos]);
  const porTipo = useMemo(
    () => ({
      equipo: data.productos.filter((p) => p.tipo === 'equipo'),
      accesorio: data.productos.filter((p) => p.tipo === 'accesorio'),
    }),
    [data.productos]
  );
  const lista = esKit ? data.kits : porTipo[tab];

  const marcas = useMemo(
    () => [...new Set(data.productos.map((p) => p.marca).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [data.productos]
  );
  const unidades = useMemo(
    () => [...new Set(['und', 'm', ...data.productos.map((p) => p.unidad).filter(Boolean)])],
    [data.productos]
  );
  const categorias = useMemo(
    () => [...new Set(data.kits.map((k) => k.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [data.kits]
  );
  const marcasTab = useMemo(
    () => (esKit ? [] : [...new Set(porTipo[tab].map((p) => p.marca).filter(Boolean))].sort((a, b) => a.localeCompare(b))),
    [esKit, porTipo, tab]
  );

  const filtrados = useMemo(() => {
    const t = norm(q);
    return lista.filter((x) => {
      if (!esKit && marca && x.marca !== marca) return false;
      if (!t) return true;
      const texto = esKit ? `${x.name} ${x.categoria ?? ''}` : `${x.name} ${x.marca ?? ''} ${x.nota ?? ''}`;
      return norm(texto).includes(t);
    });
  }, [lista, q, marca, esKit]);

  /* ── Acciones ── */

  const guardarProducto = async (tipo, id, body) => {
    await putCatalogoProducto(tipo, id, body);
    await cargar();
    setModal(null);
    avisar('Producto guardado');
  };

  const borrarProducto = async (p) => {
    const enKits = data.kits.filter((k) => kitUsa(k, p));
    const aviso = enKits.length
      ? `\n\nOjo: está en ${enKits.length} kit(s): ${enKits.map((k) => k.name).join(', ')}.`
      : '';
    if (!window.confirm(`¿Eliminar "${p.name}" del catálogo?${aviso}`)) return;
    try {
      await deleteCatalogoProducto(p.tipo, p.id);
      await cargar();
      avisar('Producto eliminado');
    } catch (e) {
      avisar(e.message || 'No se pudo eliminar', 'err');
    }
  };

  const guardarKit = async (id, datos) => {
    await putCatalogoKit(id, datos);
    await cargar();
    setModal(null);
    avisar('Kit guardado');
  };

  const borrarKit = async (k) => {
    if (!window.confirm(`¿Eliminar el kit "${k.name}"?`)) return;
    try {
      await deleteCatalogoKit(k.id);
      await cargar();
      avisar('Kit eliminado');
    } catch (e) {
      avisar(e.message || 'No se pudo eliminar', 'err');
    }
  };

  const nuevo = () => setModal(esKit ? { kind: 'kit' } : { kind: 'producto', tipo: tab });

  const cambiarTab = (t) => {
    setTab(t);
    setMarca('');
    setQ('');
  };

  /* ── Render ── */

  return (
    <div className="page">
      <div className="header">
        <div className="brand">
          <div className="brand-icon"><Package /></div>
          <div>
            <h1>Catálogo</h1>
            <p>Equipos, accesorios y kits que aparecen en las cotizaciones</p>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-add" onClick={nuevo} disabled={cargando}>
            <Plus size={16} />
            {esKit ? 'Nuevo kit' : `Nuevo ${TIPOS[tab].singular}`}
          </button>
        </div>
      </div>

      {error && (
        <div className="banner show" style={{ justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button className="btn-set" onClick={cargar}>Reintentar</button>
        </div>
      )}

      <div className="filtro-fecha-card">
        <div className="periodo-chips">
          <button className={`periodo-chip ${tab === 'equipo' ? 'active' : ''}`} onClick={() => cambiarTab('equipo')}>
            Equipos ({porTipo.equipo.length})
          </button>
          <button className={`periodo-chip ${tab === 'accesorio' ? 'active' : ''}`} onClick={() => cambiarTab('accesorio')}>
            Accesorios ({porTipo.accesorio.length})
          </button>
          <button className={`periodo-chip ${tab === 'kit' ? 'active' : ''}`} onClick={() => cambiarTab('kit')}>
            Kits ({data.kits.length})
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-head">
          <div className="table-title">
            {esKit ? 'Kits' : TIPOS[tab].plural}
            <span className="badge">{filtrados.length}</span>
          </div>
          <div className="table-actions">
            {!esKit && marcasTab.length > 0 && (
              <select className="tk-select" value={marca} onChange={(e) => setMarca(e.target.value)}>
                <option value="">Todas las marcas</option>
                {marcasTab.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={esKit ? 'Buscar kit…' : 'Buscar producto…'}
                style={{ paddingLeft: 32 }}
              />
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="empty"><p>Cargando catálogo…</p></div>
        ) : filtrados.length === 0 ? (
          <div className="empty">
            <Package size={36} style={{ color: '#d1d5db', marginBottom: 10 }} />
            <p>{lista.length === 0 ? `Aún no hay ${esKit ? 'kits' : TIPOS[tab].plural.toLowerCase()}` : 'Sin resultados'}</p>
            {lista.length === 0 && <small>Usa el botón "{esKit ? 'Nuevo kit' : `Nuevo ${TIPOS[tab].singular}`}" para agregar el primero</small>}
          </div>
        ) : esKit ? (
          <div>
            <table>
              <thead>
                <tr>
                  <th>Kit</th><th>Categoría</th><th>Ítems</th><th>Costo</th><th>Venta</th><th>Margen</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((k) => {
                  const r = resumenKit(k, mapa);
                  return (
                    <tr key={k.id}>
                      <td className="td-cliente">{k.name}</td>
                      <td>{k.categoria || <span style={{ color: '#9ca3af' }}>—</span>}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {r.n}
                        {r.opc > 0 && <span style={{ color: '#9ca3af' }}> (+{r.opc} opc.)</span>}
                      </td>
                      <td>{money(r.costo)}</td>
                      <td>{money(r.precio)}</td>
                      <td><Margen costo={r.costo} precio={r.precio} /></td>
                      <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <button className="btn-edit" onClick={() => setModal({ kind: 'kit', item: k })} aria-label="Editar"><Pencil size={16} /></button>
                        <button className="btn-del" onClick={() => borrarKit(k)} aria-label="Eliminar"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <table>
              <thead>
                <tr>
                  <th>Producto</th><th>Marca</th><th>Unidad</th><th>Costo</th><th>Precio</th><th>Margen</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={`${p.tipo}:${p.id}`}>
                    <td>
                      <div className="td-cliente">{p.name}</div>
                      {p.nota && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{p.nota}</div>}
                    </td>
                    <td>{p.marca || <span style={{ color: '#9ca3af' }}>—</span>}</td>
                    <td>{p.unidad || <span style={{ color: '#9ca3af' }}>—</span>}</td>
                    <td>{money(p.costo)}</td>
                    <td className="td-monto">{money(p.precio)}</td>
                    <td><Margen costo={p.costo} precio={p.precio} /></td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button className="btn-edit" onClick={() => setModal({ kind: 'producto', tipo: p.tipo, item: p })} aria-label="Editar"><Pencil size={16} /></button>
                      <button className="btn-del" onClick={() => borrarProducto(p)} aria-label="Eliminar"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal?.kind === 'producto' && (
        <ProductoModal
          key={modal.item?.id ?? 'nuevo'}
          tipo={modal.tipo}
          item={modal.item}
          idsUsados={new Set(porTipo[modal.tipo].map((p) => p.id))}
          marcas={marcas}
          unidades={unidades}
          onClose={() => setModal(null)}
          onSave={guardarProducto}
        />
      )}

      {modal?.kind === 'kit' && (
        <KitModal
          key={modal.item?.id ?? 'nuevo'}
          kit={modal.item}
          productos={data.productos}
          mapa={mapa}
          idsUsados={new Set(data.kits.map((k) => k.id))}
          categorias={categorias}
          onClose={() => setModal(null)}
          onSave={guardarKit}
        />
      )}

      <div className="toast-wrap">
        <div className={`toast ${toast ? `show ${toast.kind}` : ''}`}>{toast?.msg}</div>
      </div>
    </div>
  );
}