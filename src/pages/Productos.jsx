import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getProductos, postProducto, putProducto, deleteProducto,
  getMovimientos, postMovimiento, deleteMovimiento,
} from '../api';
import { useFechas, fechaIso, fechaDisplay } from '../hooks/useFechas';
import { useToast } from '../components/Toast';
import FiltroFecha from '../components/FiltroFecha';

const UNIDADES = ['unidad', 'metro', 'caja', 'paquete', 'rollo', 'kit', 'par'];
// Alineado a las categorías reales detectadas en el inventario existente
const CATEGORIAS_SUGERIDAS = ['Cámaras', 'Sensores', 'Alarmas', 'Redes', 'Cableado', 'Eléctrico', 'Accesorios', 'Herramientas', 'Otros'];

const PROD_POR_PAGINA = 10;
const LIMITE_COMBO    = 8;

export default function Productos() {
  const toast = useToast();
  const { periodo, setPeriodo, rangoDesde, setRangoDesde, rangoHasta, setRangoHasta, calcRango, labelPeriodo } = useFechas();

  const [productos, setProductos]     = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [offline, setOffline]         = useState(false);

  // Form: nuevo producto
  const [pCodigo, setPCodigo]       = useState('');
  const [pNombre, setPNombre]       = useState('');
  const [pMarca, setPMarca]         = useState('');
  const [pModelo, setPModelo]       = useState('');
  const [pCategoria, setPCategoria] = useState('');
  const [pUnidad, setPUnidad]       = useState('unidad');
  const [pStockMin, setPStockMin]   = useState('');
  const [pPrecio, setPPrecio]       = useState('');
  const [pErr, setPErr]             = useState('');
  const [pLoading, setPLoading]     = useState(false);

  // Modal: editar producto
  const [editProd, setEditProd]         = useState(null);
  const [ePCodigo, setEPCodigo]         = useState('');
  const [ePNombre, setEPNombre]         = useState('');
  const [ePMarca, setEPMarca]           = useState('');
  const [ePModelo, setEPModelo]         = useState('');
  const [ePCategoria, setEPCategoria]   = useState('');
  const [ePUnidad, setEPUnidad]         = useState('unidad');
  const [ePStockMin, setEPStockMin]     = useState('');
  const [ePPrecio, setEPPrecio]         = useState('');
  const [ePErr, setEPErr]               = useState('');
  const [ePLoading, setEPLoading]       = useState(false);

  // Catálogo: búsqueda + paginación
  const [busquedaProd, setBusquedaProd] = useState('');
  const [paginaProd, setPaginaProd]     = useState(1);

  // Form: nuevo movimiento
  const [mProductoId, setMProductoId]       = useState('');
  const [mProductoQuery, setMProductoQuery] = useState('');
  const [mProductoOpen, setMProductoOpen]   = useState(false);
  const [mTipo, setMTipo]             = useState('entrada');
  const [mCantidad, setMCantidad]     = useState('');
  const [mFecha, setMFecha]           = useState(fechaIso());
  const [mMotivo, setMMotivo]         = useState('');
  const [mErr, setMErr]               = useState('');
  const [mLoading, setMLoading]       = useState(false);

  const comboRef = useRef(null);

  const cargarProductos = useCallback(async () => {
    try {
      const data = await getProductos();
      setProductos(data);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);

  const cargarMovimientos = useCallback(async () => {
    const rango = calcRango();
    if (!rango.desde || !rango.hasta) return;
    try {
      const data = await getMovimientos(rango.desde, rango.hasta);
      setMovimientos(data);
    } catch { /* silencioso, el banner offline ya lo cubre getProductos */ }
  }, [calcRango]);

  useEffect(() => { cargarProductos(); }, [cargarProductos]);
  useEffect(() => { cargarMovimientos(); }, [periodo, rangoDesde, rangoHasta, cargarMovimientos]);
  useEffect(() => {
    const t = setInterval(() => { cargarProductos(); cargarMovimientos(); }, 60000);
    return () => clearInterval(t);
  }, [cargarProductos, cargarMovimientos]);

  useEffect(() => {
    if (!editProd) return;
    const onKey = e => { if (e.key === 'Escape') cerrarEdicionProducto(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editProd]);

  // Vuelve a la página 1 cada vez que cambia la búsqueda del catálogo
  useEffect(() => { setPaginaProd(1); }, [busquedaProd]);

  // Cierra el combo de producto al hacer click afuera
  useEffect(() => {
    function onClickFuera(e) {
      if (comboRef.current && !comboRef.current.contains(e.target)) {
        setMProductoOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickFuera);
    return () => document.removeEventListener('mousedown', onClickFuera);
  }, []);

  // ── Producto: crear ──
  async function agregarProducto() {
    setPErr('');
    if (!pNombre.trim()) { setPErr('Escribe el nombre del producto.'); return; }
    setPLoading(true);
    try {
      await postProducto({
        codigo: pCodigo.trim(),
        nombre: pNombre.trim(),
        marca: pMarca.trim(),
        modelo: pModelo.trim(),
        categoria: pCategoria.trim() || 'Otros',
        unidad: pUnidad,
        stock_minimo: parseFloat(pStockMin) || 0,
        precio: parseFloat(pPrecio) || 0,
      });
      setPCodigo(''); setPNombre(''); setPMarca(''); setPModelo('');
      setPCategoria(''); setPUnidad('unidad'); setPStockMin(''); setPPrecio('');
      await cargarProductos();
      toast('Producto agregado', 'success');
    } catch (e) { setPErr('Error al guardar: ' + (e.message || 'intenta de nuevo')); }
    finally { setPLoading(false); }
  }

  // ── Producto: editar ──
  function abrirEdicionProducto(p) {
    setEPCodigo(p.codigo || '');
    setEPNombre(p.nombre);
    setEPMarca(p.marca || '');
    setEPModelo(p.modelo || '');
    setEPCategoria(p.categoria || '');
    setEPUnidad(p.unidad);
    setEPStockMin(String(p.stock_minimo));
    setEPPrecio(String(p.precio));
    setEPErr('');
    setEditProd(p);
  }
  function cerrarEdicionProducto() { setEditProd(null); }

  async function guardarEdicionProducto() {
    setEPErr('');
    if (!ePNombre.trim()) { setEPErr('Escribe el nombre del producto.'); return; }
    setEPLoading(true);
    try {
      await putProducto(editProd.id, {
        codigo: ePCodigo.trim(),
        nombre: ePNombre.trim(),
        marca: ePMarca.trim(),
        modelo: ePModelo.trim(),
        categoria: ePCategoria.trim() || 'Otros',
        unidad: ePUnidad,
        stock_minimo: parseFloat(ePStockMin) || 0,
        precio: parseFloat(ePPrecio) || 0,
      });
      toast('Producto actualizado', 'success');
      cerrarEdicionProducto();
      await cargarProductos();
    } catch (e) { setEPErr('Error al guardar: ' + (e.message || 'intenta de nuevo')); }
    finally { setEPLoading(false); }
  }

  async function eliminarProducto(id) {
    try {
      await deleteProducto(id);
      if (editProd?.id === id) cerrarEdicionProducto();
      await cargarProductos();
      await cargarMovimientos();
      toast('Producto eliminado', '');
    } catch (e) { toast('Error al eliminar: ' + (e.message || ''), 'err'); }
  }

  // ── Movimiento: crear / eliminar ──
  async function agregarMovimiento() {
    setMErr('');
    if (!mProductoId)                          { setMErr('Elige un producto.'); return; }
    if (!mCantidad || parseFloat(mCantidad) <= 0) { setMErr('Ingresa una cantidad válida.'); return; }

    setMLoading(true);
    try {
      await postMovimiento({
        producto_id: parseInt(mProductoId, 10),
        tipo: mTipo,
        cantidad: parseFloat(mCantidad),
        fecha: mFecha,
        motivo: mMotivo.trim(),
      });
      setMCantidad(''); setMMotivo('');
      await cargarProductos();
      await cargarMovimientos();
      toast(mTipo === 'entrada' ? 'Entrada registrada' : 'Salida registrada', 'success');
    } catch (e) { setMErr(e.message || 'Error al registrar el movimiento'); }
    finally { setMLoading(false); }
  }

  async function eliminarMovimiento(id) {
    try {
      await deleteMovimiento(id);
      await cargarProductos();
      await cargarMovimientos();
      toast('Movimiento eliminado', '');
    } catch (e) { toast('Error al eliminar: ' + (e.message || ''), 'err'); }
  }

  function elegirProductoCombo(p) {
    setMProductoId(String(p.id));
    setMProductoQuery(`${p.codigo ? p.codigo + ' · ' : ''}${p.nombre}`);
    setMProductoOpen(false);
  }

  // KPIs
  const totalProductos   = productos.length;
  const stockBajo        = productos.filter(p => p.stock_actual <= p.stock_minimo);
  const valorInventario  = productos.reduce((s, p) => s + p.stock_actual * p.precio, 0);
  const entradasPeriodo  = movimientos.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.cantidad, 0);
  const salidasPeriodo   = movimientos.filter(m => m.tipo === 'salida').reduce((s, m) => s + m.cantidad, 0);

  // Catálogo: filtrado + paginado
  const qCatalogo = busquedaProd.trim().toLowerCase();
  const productosFiltrados = !qCatalogo ? productos : productos.filter(p =>
    p.nombre.toLowerCase().includes(qCatalogo) ||
    (p.codigo || '').toLowerCase().includes(qCatalogo) ||
    (p.marca || '').toLowerCase().includes(qCatalogo) ||
    (p.categoria || '').toLowerCase().includes(qCatalogo)
  );
  const totalPaginasProd = Math.max(1, Math.ceil(productosFiltrados.length / PROD_POR_PAGINA));
  const paginaProdSegura = Math.min(paginaProd, totalPaginasProd);
  const productosPagina  = productosFiltrados.slice(
    (paginaProdSegura - 1) * PROD_POR_PAGINA,
    paginaProdSegura * PROD_POR_PAGINA
  );

  // Combo de producto (movimientos): filtrado y limitado
  const qCombo = mProductoQuery.trim().toLowerCase();
  const comboTodos = !qCombo ? productos : productos.filter(p =>
    p.nombre.toLowerCase().includes(qCombo) ||
    (p.codigo || '').toLowerCase().includes(qCombo) ||
    (p.marca || '').toLowerCase().includes(qCombo)
  );
  const comboOpciones  = comboTodos.slice(0, LIMITE_COMBO);
  const comboRestantes = comboTodos.length - comboOpciones.length;

  return (
    <div className="page">
      {/* HEADER */}
      <div className="header">
        <div className="brand">
          <div className="brand-icon"><i className="ti ti-package"></i></div>
          <div>
            <h1>Inventario de productos</h1>
            <p>Stock, entradas y salidas</p>
          </div>
        </div>
      </div>

      {offline && (
        <div className="banner show">
          <i className="ti ti-wifi-off" style={{ fontSize: 15 }}></i>
          No se puede conectar al servidor.
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-box" style={{ fontSize: 13, color: '#1a56db' }}></i> Productos</div>
          <div className="kpi-value blue">{totalProductos}</div>
          <div className="kpi-sub">en catálogo</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-alert-triangle" style={{ fontSize: 13, color: '#d97706' }}></i> Stock bajo</div>
          <div className="kpi-value amber">{stockBajo.length}</div>
          <div className="kpi-sub">{stockBajo.length ? 'requieren reposición' : 'todo en orden'}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-cash" style={{ fontSize: 13, color: '#059669' }}></i> Valor de inventario</div>
          <div className="kpi-value green">S/ {valorInventario.toFixed(2)}</div>
          <div className="kpi-sub">stock actual × precio</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-arrows-left-right" style={{ fontSize: 13, color: '#7c3aed' }}></i> Movimientos del período</div>
          <div className="kpi-value">{movimientos.length}</div>
          <div className="kpi-sub">+{entradasPeriodo} entradas · −{salidasPeriodo} salidas</div>
        </div>
      </div>

      {/* FORM: NUEVO PRODUCTO */}
      <div className="form-card">
        <div className="form-card-title"><i className="ti ti-plus-circle"></i> Registrar producto</div>
        <div className="fields-row">
          <div className="field" style={{ maxWidth: 110 }}>
            <label>Código</label>
            <input type="text" placeholder="Ej: CT239" value={pCodigo}
              onChange={e => setPCodigo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregarProducto()} />
          </div>
          <div className="field">
            <label>Nombre</label>
            <input type="text" placeholder="Ej: Cámara domo 2MP" value={pNombre}
              onChange={e => setPNombre(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregarProducto()} />
          </div>
          <div className="field">
            <label>Marca</label>
            <input type="text" placeholder="Ej: EZVIZ" value={pMarca}
              onChange={e => setPMarca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregarProducto()} />
          </div>
          <div className="field">
            <label>Modelo</label>
            <input type="text" placeholder="Opcional" value={pModelo}
              onChange={e => setPModelo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregarProducto()} />
          </div>
          <div className="field">
            <label>Categoría</label>
            <input type="text" list="categorias-lista" placeholder="Ej: Cámaras" value={pCategoria}
              onChange={e => setPCategoria(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregarProducto()} />
            <datalist id="categorias-lista">
              {CATEGORIAS_SUGERIDAS.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="field">
            <label>Unidad</label>
            <select value={pUnidad} onChange={e => setPUnidad(e.target.value)}>
              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Stock mínimo</label>
            <input type="number" placeholder="0" min="0" step="1" value={pStockMin}
              onChange={e => setPStockMin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregarProducto()} />
          </div>
          <div className="field">
            <label>Precio unitario (S/)</label>
            <input type="number" placeholder="0.00" min="0" step="0.01" value={pPrecio}
              onChange={e => setPPrecio(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregarProducto()} />
          </div>
          <button className="btn-add" onClick={agregarProducto} disabled={pLoading}>
            {pLoading ? <span className="spinner"></span> : <><i className="ti ti-plus" style={{ fontSize: 15 }}></i> Agregar</>}
          </button>
        </div>
        {pErr && <div className="form-error show">{pErr}</div>}
      </div>

      {/* TABLA PRODUCTOS */}
      <div className="table-card">
        <div className="table-head">
          <div className="table-title"><i className="ti ti-list"></i> Catálogo de productos</div>
          <div className="table-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <i className="ti ti-search" style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 13, color: '#9ca3af',
              }}></i>
              <input
                type="text"
                placeholder="Buscar por nombre, código, marca..."
                value={busquedaProd}
                onChange={e => setBusquedaProd(e.target.value)}
                style={{
                  padding: '6px 10px 6px 30px', fontSize: 13,
                  border: '1px solid #e5e7eb', borderRadius: 8, width: 230,
                }}
              />
            </div>
            <span className="badge">
              {productosFiltrados.length}{busquedaProd ? ` de ${totalProductos}` : ''} producto{totalProductos !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div>
          {!productos.length ? (
            <div className="empty">
              <i className="ti ti-clipboard-x"></i>
              <p>Aún no hay productos registrados</p>
              <small>Agrega tu primer producto arriba</small>
            </div>
          ) : !productosPagina.length ? (
            <div className="empty">
              <i className="ti ti-search-off"></i>
              <p>Sin resultados para "{busquedaProd}"</p>
              <small>Prueba con otro término de búsqueda</small>
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>Código</th><th>Producto</th><th>Marca</th><th>Categoría</th><th>Stock</th><th>Precio</th><th>Valor</th><th></th></tr>
              </thead>
              <tbody>
                {productosPagina.map(p => {
                  const bajo = p.stock_actual <= p.stock_minimo;
                  return (
                    <tr key={p.id} className="row-in">
                      <td style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'monospace' }}>{p.codigo || '—'}</td>
                      <td className="td-cliente">{p.nombre}</td>
                      <td style={{ color: '#6b7280', fontSize: 13 }}>{p.marca || '—'}</td>
                      <td>
                        <span className="pill" style={{ background: '#f3f4f6', color: '#6b7280' }}>{p.categoria}</span>
                      </td>
                      <td>
                        <span className="pill" style={{
                          background: bajo ? '#fef2f2' : '#f0fdf4',
                          color: bajo ? '#dc2626' : '#059669',
                        }}>
                          {bajo && <i className="ti ti-alert-triangle" style={{ fontSize: 12 }}></i>}
                          {p.stock_actual} {p.unidad}
                        </span>
                      </td>
                      <td className="td-monto">S/ {parseFloat(p.precio).toFixed(2)}</td>
                      <td style={{ color: '#6b7280', fontSize: 13 }}>S/ {(p.stock_actual * p.precio).toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-del" style={{ color: '#1a56db' }} onClick={() => abrirEdicionProducto(p)} title="Editar">
                            <i className="ti ti-pencil"></i>
                          </button>
                          <button className="btn-del" onClick={() => eliminarProducto(p.id)} title="Eliminar">
                            <i className="ti ti-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {productosFiltrados.length > PROD_POR_PAGINA && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 14, padding: '12px 16px', borderTop: '1px solid #f3f4f6',
          }}>
            <button
              className="btn-del"
              onClick={() => setPaginaProd(p => Math.max(1, p - 1))}
              disabled={paginaProdSegura <= 1}
              title="Página anterior"
            >
              <i className="ti ti-chevron-left"></i>
            </button>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Página {paginaProdSegura} de {totalPaginasProd}
            </span>
            <button
              className="btn-del"
              onClick={() => setPaginaProd(p => Math.min(totalPaginasProd, p + 1))}
              disabled={paginaProdSegura >= totalPaginasProd}
              title="Página siguiente"
            >
              <i className="ti ti-chevron-right"></i>
            </button>
          </div>
        )}
      </div>

      {/* FILTRO FECHA (para movimientos) */}
      <FiltroFecha
        periodo={periodo} setPeriodo={setPeriodo}
        rangoDesde={rangoDesde} setRangoDesde={setRangoDesde}
        rangoHasta={rangoHasta} setRangoHasta={setRangoHasta}
        calcRango={calcRango} labelPeriodo={labelPeriodo}
        onAplicar={cargarMovimientos} toast={toast}
      />

      {/* FORM: NUEVO MOVIMIENTO */}
      <div className="form-card">
        <div className="form-card-title"><i className="ti ti-transfer-in"></i> Registrar movimiento</div>
        <div className="serv-label">Tipo de movimiento</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <button
            className={`serv-btn${mTipo === 'entrada' ? ' active' : ''}`}
            style={{ flex: 1 }}
            onClick={() => { setMTipo('entrada'); setMErr(''); }}
          >
            <i className="ti ti-arrow-down-circle" style={{ color: '#059669' }}></i>
            <span>Entrada</span>
          </button>
          <button
            className={`serv-btn${mTipo === 'salida' ? ' active' : ''}`}
            style={{ flex: 1 }}
            onClick={() => { setMTipo('salida'); setMErr(''); }}
          >
            <i className="ti ti-arrow-up-circle" style={{ color: '#dc2626' }}></i>
            <span>Salida</span>
          </button>
        </div>

        <div className="fields-row">
          <div className="field" ref={comboRef} style={{ position: 'relative' }}>
            <label>Producto</label>
            <input
              type="text"
              placeholder="Escribe para buscar..."
              value={mProductoQuery}
              onChange={e => {
                setMProductoQuery(e.target.value);
                setMProductoId('');
                setMProductoOpen(true);
              }}
              onFocus={() => setMProductoOpen(true)}
            />
            {mProductoOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
                marginTop: 4, maxHeight: 240, overflowY: 'auto',
                boxShadow: '0 8px 20px rgba(17,24,39,.12)',
              }}>
                {comboOpciones.length === 0 ? (
                  <div style={{ padding: '10px 12px', fontSize: 13, color: '#9ca3af' }}>
                    Sin resultados
                  </div>
                ) : comboOpciones.map(p => (
                  <div
                    key={p.id}
                    onClick={() => elegirProductoCombo(p)}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    style={{
                      padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {p.codigo ? `${p.codigo} · ` : ''}{p.nombre}{' '}
                    <span style={{ color: '#9ca3af' }}>(stock: {p.stock_actual} {p.unidad})</span>
                  </div>
                ))}
                {comboRestantes > 0 && (
                  <div style={{ padding: '6px 12px', fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>
                    +{comboRestantes} más · sigue escribiendo para filtrar
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="field">
            <label>Cantidad</label>
            <input type="number" placeholder="0" min="0" step="1" value={mCantidad}
              onChange={e => setMCantidad(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregarMovimiento()} />
          </div>
          <div className="field">
            <label>Fecha</label>
            <input type="date" value={mFecha} onChange={e => setMFecha(e.target.value)} />
          </div>
          <div className="field">
            <label>Responsable / motivo (opcional)</label>
            <input type="text" placeholder="Ej: Piero Gómez, Proyecto Chanchería" value={mMotivo}
              onChange={e => setMMotivo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregarMovimiento()} />
          </div>
          <button className="btn-add" onClick={agregarMovimiento} disabled={mLoading}>
            {mLoading ? <span className="spinner"></span> : <><i className="ti ti-plus" style={{ fontSize: 15 }}></i> Registrar</>}
          </button>
        </div>
        {mErr && <div className="form-error show">{mErr}</div>}
      </div>

      {/* TABLA MOVIMIENTOS */}
      <div className="table-card">
        <div className="table-head">
          <div className="table-title">
            <i className="ti ti-history"></i> Movimientos
            <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 12, marginLeft: 4 }}>· {labelPeriodo()}</span>
          </div>
          <div className="table-actions">
            <span className="badge">{movimientos.length} movimiento{movimientos.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div>
          {!movimientos.length ? (
            <div className="empty">
              <i className="ti ti-clipboard-x"></i>
              <p>No hay movimientos en este período</p>
              <small>Prueba con otro rango de fechas o registra uno nuevo</small>
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Responsable / motivo</th><th></th></tr>
              </thead>
              <tbody>
                {movimientos.map(m => (
                  <tr key={m.id} className="row-in">
                    <td style={{ color: '#9ca3af', fontSize: 12 }}>{fechaDisplay(m.fecha)}</td>
                    <td className="td-cliente">
                      {m.producto_codigo && <span style={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: 11, marginRight: 6 }}>{m.producto_codigo}</span>}
                      {m.producto_nombre}
                    </td>
                    <td>
                      <span className="pill" style={{
                        background: m.tipo === 'entrada' ? '#f0fdf4' : '#fef2f2',
                        color: m.tipo === 'entrada' ? '#059669' : '#dc2626',
                      }}>
                        <i className={`ti ${m.tipo === 'entrada' ? 'ti-arrow-down-circle' : 'ti-arrow-up-circle'}`} style={{ fontSize: 12 }}></i>
                        {m.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                      </span>
                    </td>
                    <td className="td-monto">{m.cantidad} {m.producto_unidad}</td>
                    <td style={{ color: '#6b7280', fontSize: 13 }}>{m.motivo || '—'}</td>
                    <td>
                      <button className="btn-del" onClick={() => eliminarMovimiento(m.id)} title="Eliminar">
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

      {/* MODAL EDICIÓN PRODUCTO */}
      {editProd && (
        <div
          onClick={cerrarEdicionProducto}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(17,24,39,.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="form-card"
            style={{ width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', margin: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="form-card-title" style={{ margin: 0 }}>
                <i className="ti ti-pencil"></i> Editar producto
              </div>
              <button className="btn-del" onClick={cerrarEdicionProducto} title="Cerrar">
                <i className="ti ti-x"></i>
              </button>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label>Código</label>
              <input type="text" value={ePCodigo}
                onChange={e => setEPCodigo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && guardarEdicionProducto()} />
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>Nombre</label>
              <input type="text" value={ePNombre}
                onChange={e => setEPNombre(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && guardarEdicionProducto()} />
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>Marca</label>
              <input type="text" value={ePMarca}
                onChange={e => setEPMarca(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && guardarEdicionProducto()} />
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>Modelo</label>
              <input type="text" value={ePModelo}
                onChange={e => setEPModelo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && guardarEdicionProducto()} />
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>Categoría</label>
              <input type="text" list="categorias-lista" value={ePCategoria}
                onChange={e => setEPCategoria(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && guardarEdicionProducto()} />
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>Unidad</label>
              <select value={ePUnidad} onChange={e => setEPUnidad(e.target.value)}>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>Stock mínimo</label>
              <input type="number" min="0" step="1" value={ePStockMin}
                onChange={e => setEPStockMin(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && guardarEdicionProducto()} />
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>Precio unitario (S/)</label>
              <input type="number" min="0" step="0.01" value={ePPrecio}
                onChange={e => setEPPrecio(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && guardarEdicionProducto()} />
            </div>

            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 10 }}>
              El stock actual ({editProd.stock_actual} {editProd.unidad}) solo cambia registrando movimientos de entrada o salida.
            </div>

            {ePErr && <div className="form-error show">{ePErr}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn-add" style={{ flex: 1 }} onClick={guardarEdicionProducto} disabled={ePLoading}>
                {ePLoading ? <span className="spinner"></span> : <><i className="ti ti-check" style={{ fontSize: 15 }}></i> Guardar cambios</>}
              </button>
              <button className="btn-set" style={{ background: '#6b7280' }} onClick={cerrarEdicionProducto} disabled={ePLoading}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}