import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';

const SINGULAR = 'rol';

const COLUMNS = [
  { key: 'id',          label: 'ID' },
  { key: 'name',        label: 'Nombre', className: 'td-cliente' },
  { key: 'code',        label: 'Código', render: v => <span className="pill-proy">{v}</span> },
  { key: 'description', label: 'Descripción' },
];

const FIELDS = [
  { name: 'name',        label: 'Nombre',      required: true, placeholder: 'Ej: Administrador' },
  { name: 'code',        label: 'Código',      required: true, placeholder: 'Ej: ADMIN', help: 'Único.' },
  { name: 'description', label: 'Descripción', required: true, type: 'textarea', full: true, placeholder: 'Descripción del rol...' },
];

const SEARCH_KEYS = ['name', 'code', 'description'];
const EMPTY_FORM = Object.fromEntries(FIELDS.map(f => [f.name, f.type === 'checkbox' ? false : '']));
const nextId = rows => rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;

export default function Roles() {
  const [data, setData] = useState([]);          // TODO API: rolesApi.list()
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(row => SEARCH_KEYS.some(k => String(row[k] ?? '').toLowerCase().includes(q)));
  }, [data, search]);

  const openModal = (row = null) => {
    setForm(row ? { ...EMPTY_FORM, ...row } : EMPTY_FORM);
    setEditingId(row ? row.id : null);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // TODO API: rolesApi.create / update
  const handleSave = e => {
    e.preventDefault();
    if (editingId) {
      setData(prev => prev.map(r => (r.id === editingId ? { ...r, ...form } : r)));
    } else {
      setData(prev => [...prev, { id: nextId(prev), ...form }]);
    }
    closeModal();
  };

  // TODO API: rolesApi.remove
  const handleDelete = id => {
    if (!window.confirm(`¿Seguro que deseas eliminar este ${SINGULAR}?`)) return;
    setData(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="page row-in">
      <div className="header">
        <div className="brand">
          <div className="brand-icon"><i className="fas fa-user-shield"></i></div>
          <div>
            <h1>Roles</h1>
            <p>Gestión de los roles del sistema</p>
          </div>
        </div>
        <div className="header-right">
          <button type="button" className="btn-add" onClick={() => openModal()}>
            <i className="fas fa-plus"></i> Nuevo Rol
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-head">
          <div className="table-title"><i className="fas fa-list"></i> Lista de Roles</div>
          <div className="table-actions">
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
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
                    <p>{data.length === 0 ? 'Aún no hay roles' : 'No se encontraron resultados'}</p>
                    {data.length === 0 && <small>Crea el primero con "Nuevo Rol"</small>}
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
                      <Link className="sg-btn small" to={`/seguridad/roles/${row.id}/privilegios`}>Privilegios</Link>
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
          {editingId ? 'Editar Rol' : 'Nuevo Rol'}
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-fields">
            {FIELDS.map(f => (
              <div key={f.name} className="modal-field" style={f.full ? { gridColumn: '1 / -1' } : undefined}>
                <label>{f.label}{f.required && ' *'}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    name={f.name}
                    required={f.required}
                    value={form[f.name]}
                    onChange={handleChange}
                    rows={3}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <input
                    type={f.type || 'text'}
                    name={f.name}
                    required={f.required}
                    value={form[f.name]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                  />
                )}
                {f.help && <small className="modal-hint">{f.help}</small>}
              </div>
            ))}
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