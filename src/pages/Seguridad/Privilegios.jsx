import { useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { getPrivilegios, postPrivilegio, putPrivilegio, deletePrivilegio, getModulos } from '../../api';

const SINGULAR = 'privilegio';

const TIPOS = [
  { value: 'modulo', label: 'Módulo (acceso a una sección)' },
  { value: 'boton',  label: 'Botón (acción dentro de una pantalla)' },
];

const SEARCH_KEYS = ['name', 'code', 'type', 'description'];

export default function Privilegios() {
  const [data, setData] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = () => getPrivilegios().then(setData).catch(err => alert(err.message));
  const loadModulos = () => getModulos().then(setModulos).catch(err => alert(err.message));

  useEffect(() => { load(); loadModulos(); }, []);

  const nombreModulo = useMemo(
    () => Object.fromEntries(modulos.map(m => [m.id, m.name])),
    [modulos]
  );

  const COLUMNS = useMemo(() => [
    { key: 'id',          label: 'ID' },
    { key: 'name',        label: 'Nombre', className: 'td-cliente' },
    { key: 'code',        label: 'Código', render: v => <span className="pill-proy">{v}</span> },
    { key: 'type',        label: 'Tipo',   render: v => <span className="badge">{v}</span> },
    { key: 'description', label: 'Descripción' },
    { key: 'id_modulo',   label: 'Módulo', render: (v, r) => nombreModulo[r.id_modulo] || '—' },
  ], [nombreModulo]);

  const FIELDS = useMemo(() => [
    { name: 'name',        label: 'Nombre',      required: true },
    { name: 'code',        label: 'Código',      required: true, placeholder: 'Ej: VENTAS_VER', help: 'Único.' },
    { name: 'type',        label: 'Tipo',        required: true, type: 'select', options: TIPOS },
    {
      name: 'id_modulo', label: 'Módulo', type: 'select', help: 'Opcional',
      options: modulos.map(m => ({ value: m.id, label: m.name })),
    },
    { name: 'description', label: 'Descripción', required: false, type: 'textarea', full: true },
  ], [modulos]);

  const emptyForm = useMemo(
    () => Object.fromEntries(FIELDS.map(f => [f.name, f.type === 'checkbox' ? false : ''])),
    [FIELDS]
  );
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(row => SEARCH_KEYS.some(k => String(row[k] ?? '').toLowerCase().includes(q)));
  }, [data, search]);

  const openModal = (row = null) => {
    setForm(row ? { ...emptyForm, ...row, id_modulo: row.id_modulo ?? '' } : emptyForm);
    setEditingId(row ? row.id : null);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // el select entrega string: convertir a número o null
  const toPayload = v => ({ ...v, id_modulo: v.id_modulo === '' || v.id_modulo == null ? null : Number(v.id_modulo) });

  const handleSave = async e => {
    e.preventDefault();
    try {
      const values = toPayload(form);
      if (editingId) await putPrivilegio(editingId, values);
      else await postPrivilegio(values);
      closeModal();
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm(`¿Seguro que deseas eliminar este ${SINGULAR}?`)) return;
    try {
      await deletePrivilegio(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page row-in">
      <div className="header">
        <div className="brand">
          <div className="brand-icon"><i className="fas fa-key"></i></div>
          <div>
            <h1>Privilegios</h1>
            <p>Permisos de acceso y acciones del sistema</p>
          </div>
        </div>
        <div className="header-right">
          <button type="button" className="btn-add" onClick={() => openModal()}>
            <i className="fas fa-plus"></i> Nuevo Privilegio
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-head">
          <div className="table-title"><i className="fas fa-list"></i> Lista de Privilegios</div>
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
                    <p>{data.length === 0 ? 'Aún no hay privilegios' : 'No se encontraron resultados'}</p>
                    {data.length === 0 && <small>Crea el primero con "Nuevo Privilegio"</small>}
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
          {editingId ? 'Editar Privilegio' : 'Nuevo Privilegio'}
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
                ) : f.type === 'select' ? (
                  <select name={f.name} required={f.required} value={form[f.name]} onChange={handleChange}>
                    <option value="">{f.required ? 'Selecciona…' : '— Ninguno —'}</option>
                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
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