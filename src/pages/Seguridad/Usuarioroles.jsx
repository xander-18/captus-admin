import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getUsuarios, getRoles, getUsuarioRoles, setUsuarioRoles } from '../../api';

export default function UsuarioRoles() {
  const { id } = useParams();
  const [usuario, setUsuario] = useState(null);
  const [roles, setRoles] = useState([]);
  const [asignados, setAsignados] = useState([]); // array de ids
  const [rolElegido, setRolElegido] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      const [usuarios, todosLosRoles, ids] = await Promise.all([
        getUsuarios(),
        getRoles(),
        getUsuarioRoles(id),
      ]);
      setUsuario(usuarios.find(u => String(u.id) === String(id)) || null);
      setRoles(todosLosRoles);
      setAsignados(ids);
    } catch (e) {
      setError(e.message || 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [id]);

  const rolesAsignados = useMemo(
    () => asignados.map(rid => roles.find(r => r.id === rid)).filter(Boolean),
    [asignados, roles]
  );
  const rolesDisponibles = useMemo(
    () => roles.filter(r => !asignados.includes(r.id)),
    [roles, asignados]
  );

  const guardarLista = async (nuevaLista) => {
    setSaving(true);
    setError('');
    try {
      await setUsuarioRoles(id, nuevaLista);
      setAsignados(nuevaLista);
    } catch (e) {
      setError(e.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const agregar = () => {
    if (!rolElegido) return;
    guardarLista([...asignados, Number(rolElegido)]);
    setRolElegido('');
  };

  const quitar = (rolId) => {
    guardarLista(asignados.filter(rid => rid !== rolId));
  };

  if (loading) return <div className="sg-page"><div className="sg-empty">Cargando…</div></div>;

  return (
    <div className="sg-page">
      <div className="sg-head">
        <h1>Roles del usuario{usuario ? `: ${usuario.name}` : ''}</h1>
        <Link className="sg-btn" to="/seguridad/usuarios">Volver a usuarios</Link>
      </div>

      {error && <div className="sg-error" role="alert">{error}</div>}

      <section className="sg-group">
        <div className="sg-group-head">
          <span>Asignar rol</span>
        </div>

        <div className="sg-checks">
          <div className="sg-add-row" style={{ gridColumn: '1 / -1' }}>
            <select
              value={rolElegido}
              onChange={e => setRolElegido(e.target.value)}
              disabled={saving || rolesDisponibles.length === 0}
            >
              <option value="">
                {rolesDisponibles.length === 0 ? 'No hay más roles por asignar' : 'Selecciona un rol para asignar…'}
              </option>
              {rolesDisponibles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <button className="sg-btn primary" onClick={agregar} disabled={!rolElegido || saving}>
              Asignar
            </button>
          </div>
        </div>
      </section>

      <section className="sg-group">
        <div className="sg-group-head">
          <span>Roles asignados</span>
        </div>

        <div className="sg-checks">
          {rolesAsignados.length === 0 && (
            <div className="sg-empty" style={{ gridColumn: '1 / -1' }}>
              Este usuario no tiene roles asignados.
            </div>
          )}
          {rolesAsignados.map(r => (
            <div key={r.id} className="sg-check between">
              <span>{r.name}<small>{r.description}</small></span>
              <button
                type="button"
                className="btn-del"
                onClick={() => quitar(r.id)}
                disabled={saving}
                title="Quitar"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}