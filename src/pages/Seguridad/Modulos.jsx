import { useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { getModulos, postModulo, putModulo, deleteModulo } from '../../api';

// ── Configuración: para agregar un campo, solo se añade una línea aquí ──
const FIELDS = [
  { name: 'name',        label: 'Nombre',      required: true, placeholder: 'Ej: Ventas' },
  { name: 'code',        label: 'Código',      required: true, placeholder: 'Ej: MOD_VENTAS' },
  { name: 'route',       label: 'Ruta',        required: true, placeholder: 'Ej: /ventas', full: true, hint: 'Ruta de acceso en el frontend' },
  { name: 'description', label: 'Descripción', required: true, placeholder: 'Descripción del módulo...', full: true, type: 'textarea' },
];

const COLUMNS = [
  { key: 'id',          label: 'ID' },
  { key: 'name',        label: 'Nombre',      className: 'td-cliente' },
  { key: 'code',        label: 'Código',      render: v => <span className="pill-proy">{v}</span> },
  { key: 'description', label: 'Descripción' },
  { key: 'route',       label: 'Ruta',        render: v => <span className="badge">{v}</span> },
];

const SEARCH_KEYS = ['name', 'code', 'description', 'route'];
const EMPTY_FORM = Object.fromEntries(FIELDS.map(f => [f.name, '']));

export default function Modulos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const cargarModulos = () => {
    setLoading(true);
    setError('');
    getModulos()
      .then(setData)
      .catch(e => setError(e.message || 'Error al cargar módulos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarModulos();
  }, []);

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
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await putModulo(editingId, form);
      } else {
        await postModulo(form);
      }
      await cargarModulos();
      closeModal();
    } catch (e) {
      setError(e.message || 'Error al guardar el módulo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Seguro que deseas eliminar este módulo?')) return;
    setError('');
    try {
      await deleteModulo(id);
      await cargarModulos();
    } catch (e) {
      setError(e.message || 'Error al eliminar el módulo');
    }
  };

  return (
    <div className="page row-in">
      {/* Cabecera */}
      <div className="header">
        <div className="brand">
          <div className="brand-icon"><i className="fas fa-cubes"></i></div>
          <div>
            <h1>Módulos</h1>
            <p>Gestión de los módulos del sistema</p>
          </div>
        </div>
        <div className="header-right">
          <button type="button" className="btn-add" onClick={() => openModal()}>
            <i className="fas fa-plus"></i> Nuevo Módulo
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Tabla */}
      <div className="table-card">
        <div className="table-head">
          <div className="table-title"><i className="fas fa-list"></i> Lista de Módulos</div>
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
              {loading ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="empty">
                    <p>Cargando módulos...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="empty">
                    <i className="fas fa-inbox"></i>
                    <p>{data.length === 0 ? 'Aún no hay módulos' : 'No se encontraron resultados'}</p>
                    {data.length === 0 && <small>Crea el primero con "Nuevo Módulo"</small>}
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
          {editingId ? 'Editar Módulo' : 'Nuevo Módulo'}
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
                    type="text"
                    name={f.name}
                    required={f.required}
                    value={form[f.name]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                  />
                )}
                {f.hint && <small className="modal-hint">{f.hint}</small>}
              </div>
            ))}
          </div>

          <div className="modal-btns">
            <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving}>
              <i className="fas fa-save"></i> {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}