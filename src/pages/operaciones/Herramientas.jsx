import { useEffect, useRef, useState } from "react";
import { Plus, Printer, Wrench, X, Trash2, Eye } from "lucide-react";
import { CATALOGO } from "../../data/kits";
import { previsualizarSalidaPDF, nombreArchivoSalida } from "../../utils/salidaPdf"; // ajusta la ruta a donde pongas salidaPDF.js
import {
  getCotizaciones, getHerramientas, postHerramienta, deleteHerramienta,
  getSalidas, getSalida, postSalida, postDevolucion,
  postSalidaItems, // NUEVO: agrega herramientas a una salida que sigue en obra
} from "../../api";

// Solo las cotizaciones en estos estados permiten sacar herramientas.
const ESTADOS_OK = ["ganada"];

// SQLite guarda UTC ("YYYY-MM-DD HH:MM:SS")
const fechaHora = (iso) =>
  iso
    ? new Date(iso.replace(" ", "T") + "Z").toLocaleString("es-PE", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      })
    : "";

const nombreItem = (it, cat) =>
  it.name || CATALOGO[cat]?.find((p) => p.id === it.pid)?.name || "Ítem";

/* ── Modal (no se cierra al hacer clic fuera, para no perder el checklist) ── */
function Modal({ title, onClose, children, footer, wide }) {
  return (
    <div className="hr-overlay">
      <div className={`hr-modal${wide ? " wide" : ""}`}>
        <div className="hr-modal-head">
          <b>{title}</b>
          <button className="hr-icon-btn" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="hr-modal-body">{children}</div>
        {footer && <div className="hr-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ── Vista previa del PDF (formato de la cotización, ver salidaPDF.js): imprimir o descargar ── */
function VistaPreviaPDF({ url, nombre, onClose }) {
  const ref = useRef(null);

  const imprimir = () => {
    try {
      ref.current.contentWindow.focus();
      ref.current.contentWindow.print();
    } catch {
      window.open(url, "_blank"); // si el navegador no deja imprimir desde el visor, se abre aparte
    }
  };
  const descargar = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();
  };

  const footer = (
    <>
      <button className="hr-btn" onClick={descargar}>Descargar PDF</button>
      <button className="hr-btn primary" onClick={imprimir}><Printer size={16} /> Imprimir</button>
    </>
  );

  return (
    <Modal title="Vista previa de la salida" onClose={onClose} footer={footer} wide>
      <iframe
        ref={ref} src={url} title="Vista previa de la salida"
        style={{ width: "100%", height: "70vh", border: 0 }}
      />
    </Modal>
  );
}

/* ── Selector de herramientas (lo usan "Nueva salida" y "Agregar más a una salida") ──
   · Marcar con ✓ y poner cantidad
   · Si la herramienta no existe: se escribe abajo y se agrega al catálogo sola, ya marcada
   · `excluir` = ids que NO deben aparecer (porque ya están en la salida)            */
function SelectorHerramientas({ tools, sel, setSel, recargar, excluir = [] }) {
  const [filtro, setFiltro] = useState("");
  const [nueva, setNueva] = useState("");
  const [creando, setCreando] = useState(false);

  const disponibles = tools.filter((t) => !excluir.includes(t.id));
  const q = filtro.trim().toLowerCase();
  const visibles = disponibles.filter((t) => !q || t.nombre.toLowerCase().includes(q));
  const n = Object.keys(sel).length;

  const toggle = (id) =>
    setSel((s) => {
      const nuevo = { ...s };
      if (nuevo[id]) delete nuevo[id]; else nuevo[id] = 1;
      return nuevo;
    });
  const setCant = (id, v) => setSel((s) => ({ ...s, [id]: Math.max(1, parseInt(v) || 1) }));

  const crear = async () => {
    const nombre = nueva.trim();
    if (!nombre) return alert("Escribe el nombre de la herramienta nueva");

    // Si ya existe en el catálogo, solo la marcamos (no se duplica)
    const existente = tools.find((t) => t.nombre.trim().toLowerCase() === nombre.toLowerCase());
    if (existente) {
      if (excluir.includes(existente.id)) {
        alert("Esa herramienta ya está en esta salida");
      } else {
        setSel((s) => ({ ...s, [existente.id]: s[existente.id] || 1 }));
        setNueva("");
        setFiltro("");
      }
      return;
    }

    setCreando(true);
    try {
      await postHerramienta({ nombre, marca: "", observacion: "" });
      const lista = await recargar();
      const creada = lista.find((t) => t.nombre.trim().toLowerCase() === nombre.toLowerCase());
      if (creada) setSel((s) => ({ ...s, [creada.id]: 1 }));
      setNueva("");
      setFiltro("");
    } catch (e) {
      alert("No se pudo agregar: " + e.message);
    } finally {
      setCreando(false);
    }
  };

  return (
    <>
      <div className="hr-list-head">
        <b>Herramientas ({n} marcadas)</b>
        <input
          type="text" className="hr-input sm" value={filtro}
          onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar…"
        />
      </div>

      {disponibles.length === 0 ? (
        <div className="hr-hint">
          {tools.length === 0
            ? "Aún no hay herramientas. Escribe una abajo para crearla."
            : "Ya agregaste todas las herramientas del catálogo. Escribe una abajo para crear otra."}
        </div>
      ) : visibles.length === 0 ? (
        <div className="hr-hint">Ninguna herramienta se llama así. Puedes crearla abajo.</div>
      ) : (
        <div className="hr-checklist">
          {visibles.map((t) => (
            <label key={t.id} className={`hr-check${sel[t.id] ? " on" : ""}`}>
              <input type="checkbox" checked={!!sel[t.id]} onChange={() => toggle(t.id)} />
              <span className="hr-check-name">{t.nombre}</span>
              {sel[t.id] && (
                <input
                  type="number" min="1" className="hr-qty"
                  value={sel[t.id]} onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setCant(t.id, e.target.value)}
                  aria-label={`Cantidad de ${t.nombre}`}
                />
              )}
            </label>
          ))}
        </div>
      )}

      <div className="hr-quick-label">¿No la encuentras? Escribe su nombre y se agrega sola:</div>
      <div className="hr-quick">
        <input
          type="text" className="hr-input" value={nueva} placeholder="Ej. Escalera de 3 metros"
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && crear()}
        />
        <button className="hr-btn" onClick={crear} disabled={creando}>
          <Plus size={16} /> {creando ? "Agregando…" : "Agregar"}
        </button>
      </div>
    </>
  );
}

/* ── Página ── */
export default function Herramientas() {
  const [salidas, setSalidas] = useState([]);
  const [soloFaltantes, setSoloFaltantes] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { tipo: 'nueva' | 'catalogo' | 'detalle', id? }
  const [pdf, setPdf] = useState(null); // { url, nombre } de la vista previa abierta
  const [abriendoPdf, setAbriendoPdf] = useState(null); // id de la salida cuyo PDF se está preparando

  // Acepta una salida completa (con items) o solo su id. Si es id, la trae completa primero.
  const verPDF = async (salidaOId) => {
    const id = typeof salidaOId === "object" ? salidaOId.id : salidaOId;
    setAbriendoPdf(id);
    try {
      const s = typeof salidaOId === "object" ? salidaOId : await getSalida(salidaOId);
      const url = await previsualizarSalidaPDF(s, { fecha: fechaHora(s.fecha_salida) });
      setPdf({ url, nombre: nombreArchivoSalida(s) });
    } catch (e) {
      alert("No se pudo generar el PDF: " + e.message);
    } finally {
      setAbriendoPdf(null);
    }
  };
  const cerrarPDF = () => {
    if (pdf) URL.revokeObjectURL(pdf.url);
    setPdf(null);
  };

  const cargar = () => {
    setCargando(true);
    setError("");
    getSalidas(soloFaltantes)
      .then(setSalidas)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  };
  useEffect(cargar, [soloFaltantes]);

  return (
    <div className="page">
      <div className="hr-head">
        <h1>Salida de herramientas</h1>
        <label className="hr-toggle">
          <input type="checkbox" checked={soloFaltantes} onChange={(e) => setSoloFaltantes(e.target.checked)} />
          Solo con faltantes
        </label>
        <button className="hr-btn" onClick={() => setModal({ tipo: "catalogo" })}>
          <Wrench size={16} /> Catálogo
        </button>
        <button className="hr-btn primary" onClick={() => setModal({ tipo: "nueva" })}>
          <Plus size={16} /> Nueva salida
        </button>
      </div>

      <div className="hr-card">
        {cargando ? (
          <div className="hr-empty"><div className="hr-empty-text">Cargando…</div></div>
        ) : error ? (
          <div className="hr-empty">
            <div className="hr-empty-title">No se pudo cargar</div>
            <div className="hr-empty-text">{error}</div>
            <button className="hr-btn" onClick={cargar}>Reintentar</button>
          </div>
        ) : salidas.length === 0 ? (
          <div className="hr-empty">
            <div className="hr-empty-title">{soloFaltantes ? "Sin faltantes" : "Aún no hay salidas"}</div>
            <div className="hr-empty-text">
              {soloFaltantes
                ? "Ningún proyecto tiene herramientas faltantes."
                : "Crea una salida desde una cotización aprobada."}
            </div>
          </div>
        ) : (
          <table className="hr-table">
            <thead>
              <tr>
                <th>Proyecto</th><th>Responsable</th><th>Fecha</th><th>Herram.</th><th>Estado</th><th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {salidas.map((s) => (
                <tr key={s.id} className="click" onClick={() => setModal({ tipo: "detalle", id: s.id })}>
                  <td className="hr-cell-main">
                    <div className="hr-main">
                      {s.numero && <span className="hr-num">{s.numero} · </span>}
                      {s.cliente || "Sin cliente"}
                    </div>
                    <div className="hr-sub">{s.proyecto || "Sin proyecto"}</div>
                  </td>
                  <td data-label="Responsable">{s.responsable}</td>
                  <td data-label="Fecha" className="hr-muted">{fechaHora(s.fecha_salida)}</td>
                  <td data-label="Herram.">{s.n_items}</td>
                  <td data-label="Estado">
                    {s.estado === "salida" ? (
                      <span className="hr-badge warn">En obra</span>
                    ) : s.faltantes > 0 ? (
                      <span className="hr-badge bad">Faltan {s.faltantes}</span>
                    ) : (
                      <span className="hr-badge ok">Devuelta</span>
                    )}
                  </td>
                  <td data-label="PDF">
                    {/* stopPropagation: así el ojito NO abre el detalle, solo el PDF */}
                    <button
                      className="hr-btn small"
                      title="Ver PDF"
                      aria-label={`Ver PDF de ${s.cliente || "la salida"}`}
                      disabled={abriendoPdf === s.id}
                      onClick={(e) => { e.stopPropagation(); verPDF(s.id); }}
                    >
                      <Eye size={15} /> {abriendoPdf === s.id ? "Abriendo…" : "Ver PDF"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal?.tipo === "nueva" && (
        <NuevaSalida
          onClose={() => setModal(null)}
          onSaved={(saved) => {
            verPDF(saved);
            setModal({ tipo: "detalle", id: saved.id });
            cargar();
          }}
        />
      )}
      {modal?.tipo === "detalle" && (
        <DetalleSalida id={modal.id} onClose={() => setModal(null)} onChanged={cargar} onVerPDF={verPDF} />
      )}
      {modal?.tipo === "catalogo" && <Catalogo onClose={() => setModal(null)} />}
      {pdf && <VistaPreviaPDF url={pdf.url} nombre={pdf.nombre} onClose={cerrarPDF} />}
    </div>
  );
}

/* ── Nueva salida: ver cotización + checklist de herramientas ── */
function NuevaSalida({ onClose, onSaved }) {
  const [cots, setCots] = useState([]);
  const [tools, setTools] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cotId, setCotId] = useState("");
  const [responsable, setResponsable] = useState("");
  const [sel, setSel] = useState({}); // herramienta_id -> cantidad
  const [guardando, setGuardando] = useState(false);

  const recargarTools = () => getHerramientas().then((h) => { setTools(h); return h; });

  useEffect(() => {
    Promise.all([getCotizaciones(), getHerramientas()])
      .then(([c, h]) => {
        setCots(c.filter((q) => ESTADOS_OK.includes(q.status)));
        setTools(h);
      })
      .catch((e) => alert(e.message))
      .finally(() => setCargando(false));
  }, []);

  const q = cots.find((x) => x.id === cotId);
  const n = Object.keys(sel).length;

  const guardar = async () => {
    if (!q) return alert("Elige la cotización");
    if (!responsable.trim()) return alert("Escribe quién retira las herramientas");
    if (!n) return alert("Marca al menos una herramienta");
    setGuardando(true);
    try {
      const saved = await postSalida({
        cotizacion_id: q.id,
        numero: q.numero,
        cliente: q.cliente,
        proyecto: q.proyecto,
        responsable: responsable.trim(),
        items: Object.entries(sel).map(([id, cantidad]) => ({ herramienta_id: +id, cantidad })),
      });
      onSaved(saved);
    } catch (e) {
      alert("No se pudo guardar: " + e.message);
      setGuardando(false);
    }
  };

  const lista = (titulo, items, cat) =>
    items?.length > 0 && (
      <div className="hr-preview-group">
        <div className="hr-preview-title">{titulo}</div>
        {items.map((it, i) => (
          <div key={i} className="hr-preview-line">{it.qty} × {nombreItem(it, cat)}</div>
        ))}
      </div>
    );

  const footer = (
    <>
      <button className="hr-btn" onClick={onClose} disabled={guardando}>Cancelar</button>
      <button className="hr-btn primary" onClick={guardar} disabled={guardando || cargando}>
        <Printer size={16} /> {guardando ? "Guardando…" : "Guardar e imprimir"}
      </button>
    </>
  );

  return (
    <Modal title="Nueva salida de herramientas" onClose={onClose} footer={footer} wide>
      {cargando ? (
        <div className="hr-hint">Cargando…</div>
      ) : (
        <>
          <div className="hr-field">
            <label>Cotización aprobada</label>
            <select className="hr-input" value={cotId} onChange={(e) => setCotId(e.target.value)}>
              <option value="">{cots.length ? "Elige un proyecto…" : "No hay cotizaciones aprobadas"}</option>
              {cots.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.numero ? c.numero + " · " : ""}{c.cliente || "Sin cliente"} — {c.proyecto || "Sin proyecto"}
                </option>
              ))}
            </select>
          </div>

          {q && (
            <div className="hr-preview">
              {q.direccion && (
                <div className="hr-preview-group">
                  <div className="hr-preview-line"><b>Dirección:</b> {q.direccion}</div>
                </div>
              )}
              {lista("Equipos", q.items?.equipos, "equipos")}
              {lista("Materiales / accesorios", q.items?.accesorios, "accesorios")}
              {q.nota && (
                <div className="hr-preview-group">
                  <div className="hr-preview-line"><b>Nota:</b> {q.nota}</div>
                </div>
              )}
            </div>
          )}

          <div className="hr-field">
            <label>Responsable que retira</label>
            <input
              type="text" className="hr-input" value={responsable}
              onChange={(e) => setResponsable(e.target.value)} placeholder="Nombre del operario"
            />
          </div>

          <SelectorHerramientas tools={tools} sel={sel} setSel={setSel} recargar={recargarTools} />
        </>
      )}
    </Modal>
  );
}

/* ── Detalle: ver PDF, agregar más herramientas y registrar devolución ── */
function DetalleSalida({ id, onClose, onChanged, onVerPDF }) {
  const [s, setS] = useState(null);
  const [dev, setDev] = useState({}); // item.id -> cantidad devuelta
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Panel "Agregar más herramientas"
  const [agregando, setAgregando] = useState(false);
  const [tools, setTools] = useState([]);
  const [nuevos, setNuevos] = useState({}); // herramienta_id -> cantidad
  const [guardandoNuevos, setGuardandoNuevos] = useState(false);

  // Trae la salida actualizada y conserva lo que ya se escribió en "Devuelta"
  const recargarSalida = () =>
    getSalida(id).then((d) => {
      setS(d);
      setDev((prev) => Object.fromEntries(d.items.map((i) => [i.id, prev[i.id] ?? i.cantidad])));
      return d;
    });

  const recargarTools = () => getHerramientas().then((h) => { setTools(h); return h; });

  useEffect(() => {
    recargarSalida().catch((e) => alert(e.message));
  }, [id]);

  const abrirAgregar = () => {
    setAgregando(true);
    recargarTools().catch((e) => alert(e.message));
  };
  const cancelarAgregar = () => {
    setAgregando(false);
    setNuevos({});
  };

  const agregarALaSalida = async () => {
    const items = Object.entries(nuevos).map(([hid, cantidad]) => ({ herramienta_id: +hid, cantidad }));
    if (!items.length) return alert("Marca al menos una herramienta para agregar");
    setGuardandoNuevos(true);
    try {
      await postSalidaItems(id, { items });
      await recargarSalida();
      setNuevos({});
      setAgregando(false);
      onChanged();
    } catch (e) {
      alert("No se pudieron agregar: " + e.message);
    } finally {
      setGuardandoNuevos(false);
    }
  };

  const cerrar = async () => {
    if (!window.confirm("¿Registrar la devolución y cerrar esta salida? No se puede deshacer.")) return;
    setGuardando(true);
    try {
      const d = await postDevolucion(id, {
        items: s.items.map((i) => ({ id: i.id, cant_devuelta: dev[i.id] })),
        nota,
      });
      setS(d);
      onChanged();
    } catch (e) {
      alert("No se pudo cerrar: " + e.message);
    } finally {
      setGuardando(false);
    }
  };

  if (!s) return <Modal title="Salida" onClose={onClose}><div className="hr-hint">Cargando…</div></Modal>;
  const abierta = s.estado === "salida";

  // Herramientas que ya están en esta salida (para no ofrecerlas otra vez)
  const yaEnSalida = tools
    .filter((t) => s.items.some((i) => i.herramienta_id === t.id || i.nombre === t.nombre))
    .map((t) => t.id);
  const nNuevos = Object.keys(nuevos).length;

  const footer = (
    <>
      <button className="hr-btn" onClick={() => onVerPDF(s)}><Eye size={16} /> Ver PDF</button>
      {abierta && (
        <button className="hr-btn primary" onClick={cerrar} disabled={guardando || agregando}>
          {guardando ? "Guardando…" : "Registrar devolución"}
        </button>
      )}
    </>
  );

  return (
    <Modal
      title={`${s.numero ? s.numero + " · " : ""}${s.cliente || "Sin cliente"}`}
      onClose={onClose} footer={footer} wide
    >
      <div className="hr-meta">
        <div><b>Proyecto:</b> {s.proyecto || "—"}</div>
        <div><b>Responsable:</b> {s.responsable} · <b>Salió:</b> {fechaHora(s.fecha_salida)}</div>
        {!abierta && <div><b>Devuelta:</b> {fechaHora(s.fecha_retorno)}</div>}
      </div>

      <div className="hr-scroll">
        <table className="hr-ret">
          <thead>
            <tr><th>Herramienta</th><th>Salió</th><th>Devuelta</th><th>Falta</th></tr>
          </thead>
          <tbody>
            {s.items.map((i) => {
              const devuelta = abierta ? dev[i.id] ?? i.cantidad : i.cant_devuelta;
              const falta = i.cantidad - devuelta;
              return (
                <tr key={i.id}>
                  <td>{i.nombre}</td>
                  <td>{i.cantidad}</td>
                  <td>
                    {abierta ? (
                      <input
                        type="number" min="0" max={i.cantidad} className="hr-qty"
                        value={devuelta}
                        onChange={(e) =>
                          setDev((d) => ({ ...d, [i.id]: Math.min(i.cantidad, Math.max(0, parseInt(e.target.value) || 0)) }))
                        }
                      />
                    ) : (
                      devuelta
                    )}
                  </td>
                  <td className={falta > 0 ? "falta" : "ok"}>{falta > 0 ? falta : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Agregar más herramientas: solo mientras la salida sigue en obra */}
      {abierta && !agregando && (
        <div style={{ marginTop: 14 }}>
          <button className="hr-btn" onClick={abrirAgregar}>
            <Plus size={16} /> Agregar más herramientas
          </button>
        </div>
      )}

      {abierta && agregando && (
        <div className="hr-add-panel">
          <div className="hr-add-panel-title">Agregar más herramientas a esta salida</div>
          <div className="hr-add-panel-help">
            Marca las que se llevan además. Las que ya salieron no aparecen aquí.
          </div>
          <SelectorHerramientas
            tools={tools} sel={nuevos} setSel={setNuevos}
            recargar={recargarTools} excluir={yaEnSalida}
          />
          <div className="hr-add-panel-btns">
            <button className="hr-btn" onClick={cancelarAgregar} disabled={guardandoNuevos}>Cancelar</button>
            <button className="hr-btn primary" onClick={agregarALaSalida} disabled={guardandoNuevos || nNuevos === 0}>
              <Plus size={16} />{" "}
              {guardandoNuevos ? "Agregando…" : nNuevos ? `Agregar ${nNuevos} a la salida` : "Agregar a la salida"}
            </button>
          </div>
        </div>
      )}

      {abierta ? (
        <div className="hr-field" style={{ marginTop: 14 }}>
          <label>Nota de retorno (opcional)</label>
          <input
            type="text" className="hr-input" value={nota} onChange={(e) => setNota(e.target.value)}
            placeholder="Ej. Taladro dañado, se quedó en obra…"
          />
        </div>
      ) : (
        s.nota_retorno && <div className="hr-nota"><b>Nota:</b> {s.nota_retorno}</div>
      )}
    </Modal>
  );
}

/* ── Catálogo de herramientas ── */
function Catalogo({ onClose }) {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState({ nombre: "", marca: "", observacion: "" });
  const [filtro, setFiltro] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = () => getHerramientas().then(setLista).catch((e) => alert(e.message));
  useEffect(() => { cargar(); }, []);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const agregar = async () => {
    if (!form.nombre.trim()) return alert("Escribe el nombre de la herramienta");
    setGuardando(true);
    try {
      await postHerramienta({
        nombre: form.nombre.trim(),
        marca: form.marca.trim(),
        observacion: form.observacion.trim(),
      });
      setForm({ nombre: "", marca: "", observacion: "" });
      cargar();
    } catch (e) {
      alert(e.message);
    } finally {
      setGuardando(false);
    }
  };
  const quitar = async (id) => {
    if (!window.confirm("¿Quitar esta herramienta del catálogo?")) return;
    try { await deleteHerramienta(id); cargar(); } catch (e) { alert(e.message); }
  };

  const q = filtro.trim().toLowerCase();
  const visibles = lista.filter((t) =>
    !q || [t.nombre, t.marca, t.observacion].some((v) => (v || "").toLowerCase().includes(q))
  );

  return (
    <Modal title="Registrar herramienta" onClose={onClose} wide>
      <div className="hr-field">
        <label>Nombre</label>
        <input
          type="text" className="hr-input" value={form.nombre} placeholder="Ej. Taladro percutor"
          onChange={set("nombre")}
          onKeyDown={(e) => e.key === "Enter" && agregar()}
        />
      </div>
      <div className="hr-field">
        <label>Marca</label>
        <input
          type="text" className="hr-input" value={form.marca} placeholder="Ej. Bosch"
          onChange={set("marca")}
          onKeyDown={(e) => e.key === "Enter" && agregar()}
        />
      </div>
      <div className="hr-field">
        <label>Observación</label>
        <input
          type="text" className="hr-input" value={form.observacion} placeholder="Ej. Incluye maletín y 3 brocas"
          onChange={set("observacion")}
          onKeyDown={(e) => e.key === "Enter" && agregar()}
        />
      </div>
      <button className="hr-btn primary" onClick={agregar} disabled={guardando}>
        <Plus size={16} /> {guardando ? "Guardando…" : "Agregar"}
      </button>

      <div className="hr-list-head" style={{ marginTop: 18 }}>
        <b>Herramientas registradas ({visibles.length})</b>
        <input
          type="text" className="hr-input sm" value={filtro}
          onChange={(e) => setFiltro(e.target.value)} placeholder="Filtrar por nombre, marca u observación…"
        />
      </div>
      <div className="hr-list">
        {lista.length === 0 && <div className="hr-hint" style={{ padding: 12 }}>Sin herramientas todavía.</div>}
        {lista.length > 0 && visibles.length === 0 && (
          <div className="hr-hint" style={{ padding: 12 }}>Ninguna herramienta coincide con el filtro.</div>
        )}
        {visibles.map((t) => (
          <div key={t.id} className="hr-list-row">
            <span>
              <b>{t.nombre}</b>
              {t.marca && <span className="hr-muted"> · {t.marca}</span>}
              {t.observacion && <div className="hr-sub">{t.observacion}</div>}
            </span>
            <button className="hr-icon-btn danger" onClick={() => quitar(t.id)} aria-label="Quitar"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </Modal>
  );
}