import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import { getUsuarios, postUsuario, putUsuario, deleteUsuario } from '../../api';

const SINGULAR = 'usuario';

const COLUMNS = [
  { key: 'id',    label: 'ID' },
  { key: 'name',  label: 'Nombre', className: 'td-cliente' },
  { key: 'email', label: 'Email' },
  { key: 'dni',   label: 'DNI' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'active', label: 'Estado', render: v => <span className={`sg-tag ${v ? 'on' : 'off'}`}>{v ? 'Activo' : 'Inactivo'}</span> },
];

const FIELDS = [
  { name: 'name',     label: 'Nombre', required: true, full: true },
  { name: 'email',    label: 'Email', type: 'email', required: true, full: true },
  { name: 'dni',      label: 'DNI' },
  { name: 'phone',    label: 'Teléfono' },
  { name: 'password', label: 'Contraseña', type: 'password', requiredOnCreate: true, full: true, help: 'Al editar, déjala vacía para no cambiarla.' },
  { name: 'active',   label: 'Usuario activo', type: 'checkbox', full: true },
];

const SEARCH_KEYS = ['name', 'email', 'dni', 'phone'];
const EMPTY_FORM = { name: '', email: '', dni: '', phone: '', password: '', active: true };

export default function Usuarios() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => getUsuarios().then(setData).catch(err => alert(err.message));

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(row => SEARCH_KEYS.some(k => String(row[k] ?? '').toLowerCase().includes(q)));
  }, [data, search]);

  const openModal = (row = null) => {
    // nunca precargar la contraseña
    setForm(row
      ? { name: row.name ?? '', email: row.email ?? '', dni: row.dni ?? '', phone: row.phone ?? '', password: '', active: !!row.active }
      : EMPTY_FORM);
    setEditingId(row ? row.id : null);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async e => {
    e.preventDefault();
    try {
      if (editingId) await putUsuario(editingId, form);
      else await postUsuario(form);
      closeModal();
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm(`¿Seguro que deseas eliminar este ${SINGULAR}?`)) return;
    try {
      await deleteUsuario(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page row-in">
      <div className="header">
        <div className="brand">
          <div className="brand-icon"><i className="fas fa-users"></i></div>
          <div>
            <h1>Usuarios</h1>
            <p>Gestión de los usuarios del sistema</p>
          </div>
        </div>
        <div className="header-right">
          <button type="button" className="btn-add" onClick={() => openModal()}>
            <i className="fas fa-plus"></i> Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-head">
          <div className="table-title"><i className="fas fa-list"></i> Lista de Usuarios</div>
          <div className="table-actions">
            <input
              type="text"
              placeholder="Buscar por nombre, email o DNI..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div>
          <table>
            <thead>
              <tr>
                {COLUMNS.map(c => <th key={c.key}>{c.label}</th>)}
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="empty">
                    <i className="fas fa-inbox"></i>
                    <p>{data.length === 0 ? 'Aún no hay usuarios' : 'No se encontraron resultados'}</p>
                    {data.length === 0 && <small>Crea el primero con "Nuevo Usuario"</small>}
                  </td>
                </tr>
              ) : (
                filtered.map(row => (
                  <tr key={row.id}>
                    {COLUMNS.map(c => (
                      <td key={c.key} className={c.className}>
                        {c.render ? c.render(row[c.key], row) : row[c.key]}
                      </td>
                    ))}
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {/* <Link className="sg-btn small" to={`/seguridad/usuarios/${row.id}/roles`}>Roles</Link> */}
                      <Link className="sg-btn small" to={`/usuario/${row.id}`}>Roles</Link>
                      
                      <button type="button" className="btn-edit" onClick={() => openModal(row)} title="Editar">
                        <i className="fas fa-pen"></i>
                      </button>
                      <button type="button" className="btn-del" onClick={() => handleDelete(row.id)} title="Eliminar">
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

<Dialog open={modalOpen} onClose={closeModal} slotProps={{ paper: { className: 'modal' } }}>        
  <div className="modal-title">
          <i className={editingId ? 'fas fa-edit' : 'fas fa-plus-circle'}></i>
          {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-fields">
            {FIELDS.map(f => {
              const required = f.required || (f.requiredOnCreate && !editingId);
              return (
                <div key={f.name} className="modal-field" style={f.full ? { gridColumn: '1 / -1' } : undefined}>
                  {f.type === 'checkbox' ? (
                    <label className="modal-check">
                      <input type="checkbox" name={f.name} checked={!!form[f.name]} onChange={handleChange} />
                      <span>{f.label}</span>
                    </label>
                  ) : (
                    <>
                      <label>{f.label}{required && ' *'}</label>
                      <input
                        type={f.type || 'text'}
                        name={f.name}
                        required={required}
                        value={form[f.name]}
                        onChange={handleChange}
                        autoComplete={f.type === 'password' ? 'new-password' : undefined}
                      />
                    </>
                  )}
                  {f.help && <small className="modal-hint">{f.help}</small>}
                </div>
              );
            })}
          </div>

          <div className="modal-btns">
            <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="btn-save"><i className="fas fa-save"></i> Guardar</button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}