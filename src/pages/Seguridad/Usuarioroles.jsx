import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getUsuario, getRoles, getUsuarioRoles, asignarRol, quitarRol } from '../../api';

export default function UsuarioRoles() {
  const { id } = useParams();
  const [usuario, setUsuario] = useState(null);
  const [roles, setRoles] = useState([]);
  const [asignados, setAsignados] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // id del rol que se está actualizando
  const [error, setError] = useState('');

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      const [u, todosLosRoles, rolesDelUsuario] = await Promise.all([
        getUsuario(id),
        getRoles(),
        getUsuarioRoles(id),
      ]);
      setUsuario(u);
      setRoles(todosLosRoles);
      setAsignados(new Set(rolesDelUsuario.map(r => r.id)));
    } catch (e) {
      setError(e.message || 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [id]);

  const toggle = async (rol) => {
    const yaAsignado = asignados.has(rol.id);
    setSaving(rol.id);
    try {
      if (yaAsignado) await quitarRol(id, rol.id);
      else await asignarRol(id, rol.id);
      setAsignados(prev => {
        const next = new Set(prev);
        yaAsignado ? next.delete(rol.id) : next.add(rol.id);
        return next;
      });
    } catch (e) {
      alert(e.message || 'No se pudo actualizar el rol');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="sg-page"><div className="sg-empty">Cargando…</div></div>;
  }

  return (
    <div className="sg-page">
      <div className="sg-head">
        <h1>Roles del usuario{usuario ? `: ${usuario.name}` : ''}</h1>
        <Link className="sg-btn" to="/seguridad/usuarios">Volver a usuarios</Link>
      </div>

      {error && <div className="sg-error" role="alert">{error}</div>}

      <section className="sg-group">
        <div className="sg-checks">
          {roles.length === 0 && <div className="sg-empty">No hay roles creados.</div>}
          {roles.map(r => (
            <label key={r.id} className="sg-check">
              <input
                type="checkbox"
                checked={asignados.has(r.id)}
                disabled={saving === r.id}
                onChange={() => toggle(r)}
              />
              <span>{r.name}<small>{r.description}</small></span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}