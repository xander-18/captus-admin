import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getRoles, getPrivilegios, getModulos, getRolPrivilegios, setRolPrivilegios } from '../../api';


export default function RolPrivilegios() {
  const { id } = useParams();

  // TODO API: estos tres vendrán de rolesApi / privilegiosApi / modulosApi / getRolPrivilegios(id)
  
  const [rol] = useState(null);
  const [privilegios] = useState([]);
  const [modulos] = useState([]);

  const [sel, setSel] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
  (async () => {
    try {
      const [roles, privs, mods, asignados] = await Promise.all([
        getRoles(), getPrivilegios(), getModulos(), getRolPrivilegios(id),
      ]);
      setRol(roles.find(r => String(r.id) === String(id)) || null);
      setPrivilegios(privs);
      setModulos(mods);
      setSel(new Set(asignados));
    } catch (e) {
      setError(e.message || 'No se pudo cargar');
    }
  })();
}, [id]);

  // Agrupar privilegios por módulo (null => "Sin módulo")
  const grupos = useMemo(() => {
    const map = new Map();
    privilegios.forEach(p => {
      const key = p.id_modulo ?? 0;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    });
    return [...map.entries()].map(([key, items]) => ({
      key,
      nombre: key === 0 ? 'Sin módulo' : modulos.find(m => m.id === key)?.name || `Módulo ${key}`,
      items,
    }));
  }, [privilegios, modulos]);

  const toggle = pid => {
    setSel(prev => {
      const n = new Set(prev);
      n.has(pid) ? n.delete(pid) : n.add(pid);
      return n;
    });
  };

  const toggleGrupo = items => {
    setSel(prev => {
      const n = new Set(prev);
      const todos = items.every(p => n.has(p.id));
      items.forEach(p => (todos ? n.delete(p.id) : n.add(p.id)));
      return n;
    });
  };

  // TODO API: await setRolPrivilegios(id, [...sel]) dentro de un try/catch
 async function guardar() {
  setSaving(true); setError(''); setOk('');
  try {
    await setRolPrivilegios(id, [...sel]);
    setOk('Privilegios guardados');
  } catch (e) {
    setError(e.message || 'No se pudo guardar');
  } finally {
    setSaving(false);
  }
}
  return (
    <div className="sg-page">
      <div className="sg-head">
        <h1>Privilegios del rol{rol ? `: ${rol.name}` : ''}</h1>
        <Link className="sg-btn" to="/seguridad/roles">Volver a roles</Link>
      </div>

      {error && <div className="sg-error" role="alert">{error}</div>}
      {ok && <div className="sg-ok" role="status">{ok}</div>}

      {grupos.length === 0 && (
        <div className="sg-empty">Aún no hay privilegios. Créalos primero en la pantalla de Privilegios.</div>
      )}

      {grupos.map(g => {
        const marcados = g.items.filter(p => sel.has(p.id)).length;
        return (
          <section key={g.key} className="sg-group">
            <div className="sg-group-head">
              <span>{g.nombre} ({marcados}/{g.items.length})</span>
              <button type="button" className="sg-btn small" onClick={() => toggleGrupo(g.items)}>
                {marcados === g.items.length ? 'Quitar todos' : 'Marcar todos'}
              </button>
            </div>
            <div className="sg-checks">
              {g.items.map(p => (
                <label key={p.id} className="sg-check">
                  <input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)} />
                  <span>{p.name}<small>{p.code}</small></span>
                </label>
              ))}
            </div>
          </section>
        );
      })}

      <div className="sg-sticky">
        <button type="button" className="sg-btn primary" onClick={guardar} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}