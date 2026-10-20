import { useState, useEffect, useCallback } from 'react';
import {
  getClientes, postCliente, putCliente, deleteCliente
} from '../api'; 
import { useToast } from '../components/Toast';

// ── Estados CRM ──
const ESTADOS_CRM = [
  { key: 'Prospecto',   icon: 'ti-user-search', color: '#0ea5e9', bg: '#0ea5e918', label: 'Prospecto' },
  { key: 'Negociación', icon: 'ti-messages',    color: '#f59e0b', bg: '#f59e0b18', label: 'En Negociación' },
  { key: 'Cliente',     icon: 'ti-briefcase',   color: '#10b981', bg: '#10b98118', label: 'Cliente Activo' },
  { key: 'Inactivo',    icon: 'ti-user-off',    color: '#6b7280', bg: '#f3f4f6',   label: 'Inactivo / Perdido' },
];

const getEstadoColor = (key) => ESTADOS_CRM.find(e => e.key === key)?.color || '#9ca3af';
const getEstadoBg    = (key) => ESTADOS_CRM.find(e => e.key === key)?.bg || '#f3f4f6';

export default function ClientesCRM() {
  const toast = useToast();

  // ── Estados ──
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [offline, setOffline]   = useState(false);

  // Formulario Nuevo Cliente
  const [nombre, setNombre]       = useState('');
  const [documento, setDocumento] = useState(''); 
  const [telefono, setTelefono]   = useState('');
  const [correo, setCorreo]       = useState('');
  const [estado, setEstado]       = useState('Prospecto'); // Por defecto entra como Prospecto
  const [notas, setNotas]         = useState('');
  const [formErr, setFormErr]     = useState('');
  const [loadingAdd, setLoadingAdd] = useState(false);

  // Modal Edición
  const [modal, setModal]             = useState(null);
  const [mNombre, setMNombre]         = useState('');
  const [mDocumento, setMDocumento]   = useState('');
  const [mTelefono, setMTelefono]     = useState('');
  const [mCorreo, setMCorreo]         = useState('');
  const [mEstado, setMEstado]         = useState('');
  const [mNotas, setMNotas]           = useState('');
  const [loadingSave, setLoadingSave] = useState(false);

  // ── Cargar Datos ──
  const cargar = useCallback(async () => {
    try {
      const data = await getClientes();
      setClientes(data || []);
      setOffline(false);
    } catch { 
      setOffline(true); 
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Agregar ──
  async function agregar() {
    setFormErr('');
    if (!nombre.trim()) { 
      setFormErr('El nombre del cliente o empresa es obligatorio.'); 
      return; 
    }

    setLoadingAdd(true);
    try {
      const nuevo = { 
        nombre: nombre.trim(), 
        documento: documento.trim(), 
        telefono: telefono.trim(), 
        correo: correo.trim(),
        estado: estado,
        notas: notas.trim()
      };
      
      await postCliente(nuevo);
      
      // Limpiar form
      setNombre(''); setDocumento(''); setTelefono(''); setCorreo(''); setNotas(''); setEstado('Prospecto');
      
      await cargar();
      toast(`Registrado: ${nuevo.nombre}`, 'success');
    } catch (e) { 
      toast('Error al guardar: ' + (e.message || 'intenta de nuevo'), 'err'); 
    } finally { 
      setLoadingAdd(false); 
    }
  }

  // ── Eliminar ──
  async function eliminar(id, nombreCli) {
    if(!window.confirm(`¿Seguro que deseas eliminar a ${nombreCli}?`)) return;
    try { 
      await deleteCliente(id); 
      await cargar(); 
      toast('Registro eliminado', ''); 
    }
    catch { toast('Error al eliminar', 'err'); }
  }

  // ── Modal ──
  function abrirModal(c) {
    setMNombre(c.nombre || '');
    setMDocumento(c.documento || '');
    setMTelefono(c.telefono || '');
    setMCorreo(c.correo || '');
    setMEstado(c.estado || 'Prospecto');
    setMNotas(c.notas || '');
    setModal(c);
  }

  async function guardarEdicion() {
    if (!mNombre.trim()) { toast('El nombre es obligatorio', 'warn'); return; }

    setLoadingSave(true);
    try {
      await putCliente(modal.id, { 
        nombre: mNombre.trim(), 
        documento: mDocumento.trim(), 
        telefono: mTelefono.trim(), 
        correo: mCorreo.trim(),
        estado: mEstado,
        notas: mNotas.trim()
      });
      setModal(null);
      await cargar();
      toast('Ficha del cliente actualizada', 'success');
    } catch (e) { 
      toast('Error al guardar', 'err'); 
    } finally { 
      setLoadingSave(false); 
    }
  }

  // ── Métricas CRM ──
  const kpiProspectos = clientes.filter(c => c.estado === 'Prospecto' || c.estado === 'Negociación').length;
  const kpiClientes   = clientes.filter(c => c.estado === 'Cliente').length;

  // ── Filtro ──
  const clientesFiltrados = clientes.filter(c => 
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    c.documento?.includes(busqueda)
  );

  return (
    <div className="page">
      {/* HEADER */}
      <div className="header">
        <div className="brand">
          <div className="brand-icon" style={{ background: '#3b82f618', color: '#3b82f6' }}>
            <i className="ti ti-address-book"></i>
          </div>
          <div>
            <h1>CRM Clientes</h1>
            <p>Directorio y embudo de ventas · Captus</p>
          </div>
        </div>
      </div>

      {offline && (
        <div className="banner show">
          <i className="ti ti-wifi-off" style={{ fontSize: 15 }}></i>
          No se puede conectar al servidor.
        </div>
      )}

      {/* KPIs CRM */}
      <div className="kpi-row tres">
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-users" style={{ fontSize: 13, color: '#6b7280' }}></i> Base Total</div>
          <div className="kpi-value">{clientes.length}</div>
          <div className="kpi-sub">Contactos registrados</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-user-search" style={{ fontSize: 13, color: '#0ea5e9' }}></i> En Pipeline</div>
          <div className="kpi-value" style={{ color: '#0ea5e9' }}>{kpiProspectos}</div>
          <div className="kpi-sub">Prospectos y negociaciones</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-briefcase" style={{ fontSize: 13, color: '#10b981' }}></i> Conversión</div>
          <div className="kpi-value" style={{ color: '#10b981' }}>{kpiClientes}</div>
          <div className="kpi-sub">Clientes activos ganados</div>
        </div>
      </div>

      {/* BÚSQUEDA RAPIDA (En una card simple) */}
      <div className="form-card" style={{ padding: '12px 20px', marginBottom: 20 }}>
        <div className="filtro-row" style={{ padding: 0, margin: 0, border: 'none' }}>
          <i className="ti ti-search" style={{ fontSize: 16, color: '#9ca3af', marginLeft: 5 }}></i>
          <input 
            type="text" 
            placeholder="Buscar contacto por nombre, empresa o DNI/RUC..." 
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: '8px' }}
          />
        </div>
      </div>

      {/* FORMULARIO AGREGAR */}
      <div className="form-card">
        <div className="form-card-title"><i className="ti ti-user-plus"></i> Registrar nuevo contacto</div>

        {/* Etapa del cliente (Reutilizando diseño de Categorías) */}
        <div className="cat-label">Etapa / Estado comercial</div>
        <div className="cat-grid" style={{ marginBottom: 20 }}>
          {ESTADOS_CRM.map(e => (
            <button
              key={e.key}
              className={`cat-btn${estado === e.key ? ' active' : ''}`}
              onClick={() => { setEstado(e.key); setFormErr(''); }}
            >
              <i className={`ti ${e.icon}`} style={{ color: estado === e.key ? e.color : '' }}></i>
              <span>{e.label}</span>
            </button>
          ))}
        </div>

        <div className="fields-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Nombre o Razón Social <span style={{color: '#dc2626'}}>*</span></label>
            <input type="text" placeholder="Ej: Empresa ABC S.A.C. / Juan Pérez" value={nombre}
              onChange={e => setNombre(e.target.value)} />
          </div>
          
          <div className="field">
            <label>DNI / RUC</label>
            <input type="text" placeholder="Documento" value={documento}
              onChange={e => setDocumento(e.target.value)} />
          </div>
          <div className="field">
            <label>Teléfono</label>
            <input type="text" placeholder="Ej: 999 999 999" value={telefono}
              onChange={e => setTelefono(e.target.value)} />
          </div>
          <div className="field">
            <label>Correo Electrónico</label>
            <input type="email" placeholder="contacto@empresa.com" value={correo}
              onChange={e => setCorreo(e.target.value)} />
          </div>
        </div>

        <div className="fields-row" style={{ marginTop: 15 }}>
          <div className="field" style={{ flexGrow: 1, gridColumn: 'span 2' }}>
            <label>Notas / Siguiente acción (CRM)</label>
            <input type="text" placeholder="Ej: Llamar el lunes para enviar cotización..." value={notas}
              onChange={e => setNotas(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregar()} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn-add" onClick={agregar} disabled={loadingAdd}>
              {loadingAdd ? <span className="spinner"></span> : <><i className="ti ti-device-floppy" style={{ fontSize: 15 }}></i> Guardar Ficha</>}
            </button>
          </div>
        </div>
        
        {formErr && <div className="form-error show">{formErr}</div>}
      </div>

      {/* TABLA DE CRM */}
      <div className="table-card">
        <div className="table-head">
          <div className="table-title">
            <i className="ti ti-list-details"></i> Fichas de Clientes
          </div>
          <div className="table-actions">
            <span className="badge">{clientesFiltrados.length} registro(s)</span>
          </div>
        </div>
        <div>
          {!clientesFiltrados.length ? (
            <div className="empty">
              <i className="ti ti-address-book"></i>
              <p>Sin contactos registrados</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>Cliente</th><th>Contacto</th><th>Estado</th><th>Notas CRM</th><th></th></tr>
              </thead>
              <tbody>
                {[...clientesFiltrados].reverse().map(c => (
                  <tr key={c.id} className="row-in">
                    <td style={{ fontWeight: 500, color: '#111827' }}>
                      {c.nombre}
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginTop: 2 }}>{c.documento}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 13 }}>
                        {c.telefono ? <span><i className="ti ti-phone" style={{color: '#9ca3af', width: 14}}></i> {c.telefono}</span> : null}
                        {c.correo ? <span><i className="ti ti-mail" style={{color: '#9ca3af', width: 14}}></i> {c.correo}</span> : null}
                        {!c.telefono && !c.correo && <span style={{ color: '#d1d5db' }}>—</span>}
                      </div>
                    </td>
                    <td>
                      <span className="pill" style={{ background: getEstadoBg(c.estado), color: getEstadoColor(c.estado) }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: getEstadoColor(c.estado), display: 'inline-block', flexShrink: 0 }}></span>
                        {ESTADOS_CRM.find(e => e.key === c.estado)?.label || c.estado}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#6b7280', maxWidth: '250px' }}>
                      {c.notas ? (
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.notas}>
                          <i className="ti ti-note" style={{ marginRight: 4 }}></i>{c.notas}
                        </div>
                      ) : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'flex-end' }}>
                      <button className="btn-edit" onClick={() => abrirModal(c)} title="Editar / Mover Etapa">
                        <i className="ti ti-pencil"></i>
                      </button>
                      <button className="btn-del" onClick={() => eliminar(c.id, c.nombre)} title="Eliminar">
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

      {/* MODAL EDITAR CRM */}
      {modal && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal">
            <div className="modal-title"><i className="ti ti-pencil"></i> Ficha CRM</div>

            {/* Cambiar Estado desde el Modal */}
            <div style={{ marginBottom: 16 }}>
              <div className="cat-label">Estado Comercial</div>
              <div className="modal-cat-grid">
                {ESTADOS_CRM.map(e => (
                  <button
                    key={e.key}
                    className={`cat-btn${mEstado === e.key ? ' active' : ''}`}
                    style={{ padding: '8px 4px' }}
                    onClick={() => setMEstado(e.key)}
                  >
                    <i className={`ti ${e.icon}`}></i>
                    <span>{e.key}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-fields">
              <div className="modal-field" style={{ gridColumn: '1/-1' }}>
                <label>Nombre o Razón Social</label>
                <input type="text" value={mNombre} onChange={e => setMNombre(e.target.value)} />
              </div>
              <div className="modal-field">
                <label>DNI / RUC</label>
                <input type="text" value={mDocumento} onChange={e => setMDocumento(e.target.value)} />
              </div>
              <div className="modal-field">
                <label>Teléfono</label>
                <input type="text" value={mTelefono} onChange={e => setMTelefono(e.target.value)} />
              </div>
              <div className="modal-field" style={{ gridColumn: '1/-1' }}>
                <label>Correo Electrónico</label>
                <input type="email" value={mCorreo} onChange={e => setMCorreo(e.target.value)} />
              </div>
              <div className="modal-field" style={{ gridColumn: '1/-1' }}>
                <label>Notas de Seguimiento (Observaciones)</label>
                <input type="text" value={mNotas} onChange={e => setMNotas(e.target.value)} />
              </div>
            </div>

            <div className="modal-btns">
              <button className="btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-save" onClick={guardarEdicion} disabled={loadingSave}>
                {loadingSave ? <span className="spinner"></span> : <><i className="ti ti-check" style={{ fontSize: 14 }}></i> Actualizar Ficha</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}