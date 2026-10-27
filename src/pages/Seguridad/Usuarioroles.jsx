import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
// import { usuariosApi, rolesApi, getUsuarioRoles, setUsuarioRoles } from '../../api';

export default function UsuarioRoles() {
  const { id } = useParams();
  const [usuario, setUsuario] = useState(null);
  const [roles, setRoles] = useState([]);
  const [sel, setSel] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

//   useEffect(() => {
//   (async () => {
//     try {
//       const [users, rls, asignados] = await Promise.all([
//         getUsuarios(), getRoles(), getUsuarioRoles(id),
//       ]);
//       setUsuario(users.find(u => String(u.id) === String(id)) || null);
//       setRoles(rls);
//       setSel(new Set(asignados));
//     } catch (e) {
//       setError(e.message || 'No se pudo cargar');
//     } finally {
//       setLoading(false);
//     }
//   })();
// }, [id]);

  const toggle = (rid) =>
    setSel((prev) => {
      const n = new Set(prev);
      n.has(rid) ? n.delete(rid) : n.add(rid);
      return n;
    });

  async function guardar() {
    setSaving(true); setError(''); setOk('');
    try {
      await setUsuarioRoles(id, [...sel]);
      setOk('Roles guardados');
    } catch (e) {
      setError(e.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="sg-page"><div className="sg-empty">Cargando…</div></div>;

  return (
    <div className="sg-page">
      <div className="sg-head">
        <h1>Roles del usuario{usuario ? `: ${usuario.name}` : ''}</h1>
        <Link className="sg-btn" to="/seguridad/usuarios">Volver a usuarios</Link>
      </div>

      {error && <div className="sg-error" role="alert">{error}</div>}
      {ok && <div className="sg-ok" role="status">{ok}</div>}

      <section className="sg-group">
        <div className="sg-checks">
          {roles.length === 0 && <div className="sg-empty">No hay roles creados.</div>}
          {roles.map((r) => (
            <label key={r.id} className="sg-check">
              <input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} />
              <span>{r.name}<small>{r.description}</small></span>
            </label>
          ))}
        </div>
      </section>

      <div className="sg-sticky">
        <button className="sg-btn primary" onClick={guardar} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}