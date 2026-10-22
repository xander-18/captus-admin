import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  EyeOff,
  FileDown,
  Plus,
  Trash2,
  Zap,
  Search,
  X
} from "lucide-react";
import KitPicker from "../components/KitPicker";
import { PreviewModal, ExportModal } from "../components/ModalesCotizacion";
import { useKits } from "../hooks/useKits";
import { CATALOGO } from "../data/kits";
import { exportarPDF, plantillaDe } from "../utils/exportarPDF";
import {
  duplicarCotizacion,
  tokens,
  coincide,
  productosQueCoinciden,
} from "../utils/cotizaciones";
import { consultarDocumento } from "../components/consultarDocument";
import { getCotizaciones, putCotizacion } from "../api";

const CUSTOM_OPTION = "__custom__";
const STATUS_LABELS = { borrador: "Borrador", revision: "En revisión", aprobada: "Aprobada", enviada: "Enviada", ganada: "Ganada" };
const STATUS_NEXT = { borrador: "revision", revision: "aprobada", aprobada: "enviada", enviada: "ganada" };
const STATUS_BTN = { borrador: "Enviar a revisión", revision: "Aprobar cotización", aprobada: "Marcar enviada", enviada: "Marcar ganada" };
const STATUS_BADGE_CLASS = { borrador: "status-borrador", revision: "status-revision", aprobada: "status-aprobada", enviada: "status-enviada", ganada: "status-aprobada" };
const PUEDE_AVANZAR = { borrador: ["vendedor", "supervisor", "gerente"], revision: ["supervisor", "gerente"], aprobada: ["vendedor", "supervisor", "gerente"], enviada: ["vendedor", "supervisor", "gerente"] };
const TITULO_AC = { simple: "Accesorios de instalación", alarma: "Adicionales", caci: "Materiales para la instalación", cerco: "Materiales para la instalación" };

const fmt = (n) => "S/ " + (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const blankExtra = () => ({ required: false, value: 0, approval: null });
const blankCustomItem = () => ({ pid: null, name: "", qty: 1, costo: 0, precio: 0 });
// Lo que carga un kit queda marcado (deKit): el PDF lo agrupa como KIT.
// Todo equipo que se agregue después va como adicional. No hay nada que elegir.
const marcarKit = (patch) =>
  patch.items?.equipos
    ? { ...patch, items: { ...patch.items, equipos: patch.items.equipos.map((it) => ({ ...it, deKit: true })) } }
    : patch;

// Escritorio = 768px o más. Por debajo, las columnas de costo arrancan ocultas.
const esEscritorio = () =>
  typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;

// ---------------------------------------------------------------------------
// MARGEN (misma lógica que el Excel)
// Excel:  CU.NETO venta = CU.TOTAL compra / (1 - %)   →   luego + IGV (x 1.18)
// El % es un DATO guardado en el ítem (item.margen) y el precio sale de él.
// Solo se recalcula el % cuando el precio de venta se escribe a mano.
// ---------------------------------------------------------------------------
const IGV_F = 1.18;
const redondear = (n) => Math.round(n * 100) / 100;
// % (estilo Excel) → precio de venta con IGV
const precioDesdeMargen = (costo, m) => redondear((costo / (1 - m / 100)) * IGV_F);
// precio de venta con IGV → % (estilo Excel) que lo produce
const margenDesdePrecio = (costo, precio) =>
  costo > 0 && precio > 0 ? (1 - (costo * IGV_F) / precio) * 100 : 0;
// % vigente del ítem: el guardado, o el que sale del precio de catálogo si aún no se tocó
const margenDe = (item) => item.margen ?? margenDesdePrecio(item.costo, item.precio);

// El número (0476-2026) lo asigna el servidor la primera vez que se guarda.
function blankQuote() {
  return {
    id: `cot_${Date.now()}`,
    cliente: "",
    proyecto: "",
    atencion: "",
    direccion: "",
    ruc: "",
    numero: "",
    nombreArchivo: "",   // lo escribe el usuario al exportar
    status: "borrador",
    kitOrigen: null,
    mostrarIgv: false,   // solo en equipo simple: SUBTOTAL e IGV "si aplica"
    laborValue: 0,
    laborApproval: null,
    transporte: blankExtra(),
    certificado: blankExtra(),
    ajusteGlobal: 0,
    fecha: new Date().toISOString(),
    items: { equipos: [], accesorios: [] },
  };
}

const fechaCorta = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
};

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------------
export default function CotizacionesApp() {
  const [view, setView] = useState("list");
  const [role, setRole] = useState("supervisor");
  const [quotes, setQuotes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorLista, setErrorLista] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [quote, setQuote] = useState(blankQuote());
  const [catalog, setCatalog] = useState(CATALOGO);
  const [kitOpen, setKitOpen] = useState(false);
  const { kits, guardarKit } = useKits();
  const [buscando, setBuscando] = useState(false);
  const [errorDoc, setErrorDoc] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [preview, setPreview] = useState(null);     // cotización que se está viendo
  const [exportando, setExportando] = useState(null); // cotización que se va a exportar

  // Cargar la lista desde el servidor
  const cargar = () => {
    setCargando(true);
    setErrorLista("");
    getCotizaciones()
      .then(setQuotes)
      .catch((e) => setErrorLista(e.message))
      .finally(() => setCargando(false));
  };
  useEffect(cargar, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setCatalog((cur) => {
        let changed = false;
        const next = { equipos: [...cur.equipos], accesorios: [...cur.accesorios] };
        ["equipos", "accesorios"].forEach((cat) => {
          quote.items[cat].forEach((item) => {
            if (item.pid || !item.name?.trim()) return;
            const nombre = item.name.trim();
            const i = next[cat].findIndex((p) => p.name.toLowerCase() === nombre.toLowerCase());
            if (i === -1) {
              next[cat].push({ id: `${cat[0]}_auto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: nombre, costo: item.costo, precio: item.precio, marca: "Nuevos" });
              changed = true;
            } else if (next[cat][i].id.includes("_auto_") && (next[cat][i].costo !== item.costo || next[cat][i].precio !== item.precio)) {
              next[cat][i] = { ...next[cat][i], costo: item.costo, precio: item.precio };
              changed = true;
            }
          });
        });
        return changed ? next : cur;
      });
    }, 800);
    return () => clearTimeout(t);
  }, [quote]);

  const buscarDocumento = async () => {
    setErrorDoc("");
    setBuscando(true);
    try {
      const datos = await consultarDocumento(quote.ruc);
      setQuote((q) => ({ ...q, ...datos }));
    } catch (e) {
      setErrorDoc(e.message);
    } finally {
      setBuscando(false);
    }
  };

  const newQuote = () => {
    setQuote(blankQuote());
    setView("editor");
    setKitOpen(true);
  };
  const openQuote = (id) => { const q = quotes.find((x) => x.id === id); if (q) { setQuote(q); setView("editor"); setPreview(null); } };

  // Guarda en el servidor y devuelve la cotización con su número asignado.
  const guardar = async (q = quote) => {
    setGuardando(true);
    try {
      const saved = await putCotizacion(q);
      setQuotes((prev) =>
        prev.some((x) => x.id === saved.id) ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev]
      );
      return saved;
    } finally {
      setGuardando(false);
    }
  };

  const guardarYVolver = async () => {
    // Una cotización nueva y vacía no se guarda (no gasta número)
    const yaGuardada = quotes.some((x) => x.id === quote.id);
    if (!yaGuardada && summary.nItems === 0 && !quote.cliente && !quote.proyecto) return setView("list");
    try {
      await guardar();
      setView("list");
    } catch (e) {
      alert("No se pudo guardar: " + e.message);
    }
  };

  const updateField = (f, v) => setQuote((q) => ({ ...q, [f]: v }));

  // Replicar una cotización ya hecha: copia todo, con nuevo correlativo y en borrador.
  const duplicar = async (id) => {
    const orig = quotes.find((x) => x.id === id);
    if (!orig) return;
    try {
      const copia = await guardar(duplicarCotizacion(orig));
      setQuote(copia);
      setPreview(null);
      setView("editor");
    } catch (e) {
      alert("No se pudo duplicar: " + e.message);
    }
  };

  // Exportar: guarda primero (así tiene número) y descarga "<correlativo> - <nombre>.pdf".
  const confirmarExport = async (nombre) => {
    try {
      const saved = await guardar({ ...exportando, nombreArchivo: nombre });
      if (quote.id === saved.id) setQuote(saved);
      exportarPDF(saved, resumenDe(saved), catalog);
      setExportando(null);
    } catch (e) {
      alert("No se pudo guardar la cotización: " + e.message);
    }
  };

  const addItem = (cat) => {
    const p = catalog[cat]?.[0];
    if (!p) return addCustomItem(cat);
    setQuote((q) => ({ ...q, items: { ...q.items, [cat]: [...(q.items[cat] || []), { pid: p.id, qty: 1, costo: p.costo, precio: p.precio }] } }));
  };
  const addCustomItem = (cat) =>
    setQuote((q) => ({ ...q, items: { ...q.items, [cat]: [...(q.items[cat] || []), blankCustomItem()] } }));
  const removeItem = (cat, i) =>
    setQuote((q) => ({ ...q, items: { ...q.items, [cat]: (q.items[cat] || []).filter((_, idx) => idx !== i) } }));

  const updateItem = (cat, i, field, val) => {
    setQuote((q) => {
      const list = [...q.items[cat]];
      const item = { ...list[i] };
      const numVal = parseFloat(val) || 0;
      const m0 = margenDe(item); // % vigente ANTES de editar

      // El costo cambia → el % se queda y el precio se recalcula (como en el Excel).
      const fijarCosto = (nuevo) => {
        const precioManda = !(item.costo > 0) && item.precio > 0; // precio escrito antes que el costo
        item.costo = nuevo;
        if (precioManda) item.margen = margenDesdePrecio(nuevo, item.precio);
        else { item.margen = m0; item.precio = precioDesdeMargen(nuevo, m0); }
      };
      // El precio se escribe a mano → se recalcula el %.
      const fijarPrecio = (nuevo) => {
        item.precio = nuevo;
        item.margen = item.costo > 0 && nuevo > 0 ? margenDesdePrecio(item.costo, nuevo) : m0;
      };

      if (field === "qty") item.qty = Math.max(1, parseInt(val) || 1);
      else if (field === "costo") fijarCosto(numVal);
      else if (field === "costo_neto") fijarCosto(numVal * IGV_F);
      else if (field === "sin_igv") {
        if (item.sinIgv) { item.sinIgv = false; fijarCosto(item.costo * IGV_F); }
        else { item.sinIgv = true; fijarCosto(item.costo / IGV_F); }
      }
      else if (field === "precio") fijarPrecio(numVal);
      else if (field === "precio_neto") fijarPrecio(numVal * IGV_F);
      else if (field === "total_venta") fijarPrecio(item.qty > 0 ? numVal / item.qty : 0);
      else if (field === "margen") {
        item.margen = Math.min(numVal, 99.99); // permite negativos (hay productos con costo = precio)
        item.precio = precioDesdeMargen(item.costo, item.margen);
      }
      else if (field === "name") item.name = val;
      else if (field === "pid") {
        delete item.margen; // se vuelve a calcular desde el precio de catálogo
        if (val === CUSTOM_OPTION) Object.assign(item, { pid: null, name: "", costo: 0, precio: 0 });
        else {
          const p = catalog[cat].find((x) => x.id === val);
          if (p) { item.pid = val; delete item.name; item.costo = p.costo; item.precio = p.precio; }
        }
      }
      list[i] = item;
      return { ...q, items: { ...q.items, [cat]: list } };
    });
  };

  const confirmLabor = () => updateField("laborApproval", "approved");
  const toggleExtraRequired = (f) =>
    setQuote((q) => ({ ...q, [f]: q[f].required ? blankExtra() : { ...q[f], required: true } }));
  const updateExtraValue = (f, v) =>
    setQuote((q) => ({ ...q, [f]: { ...q[f], value: parseFloat(v) || 0 } }));
  const confirmExtra = (f) =>
    setQuote((q) => ({ ...q, [f]: { ...q[f], approval: "approved" } }));

  const advanceStatus = async () => {
    const permitidos = PUEDE_AVANZAR[quote.status] || [];
    if (!permitidos.includes(role)) { alert("Tu perfil no puede realizar este paso."); return; }
    const next = STATUS_NEXT[quote.status];
    if (!next) return;
    try {
      setQuote(await guardar({ ...quote, status: next }));
    } catch (e) {
      alert("No se pudo guardar el cambio de estado: " + e.message);
    }
  };

  const summary = useMemo(() => {
    const suma = (arr) => arr.reduce((a, it) => ({ costo: a.costo + it.costo * it.qty, venta: a.venta + it.precio * it.qty }), { costo: 0, venta: 0 });
    const eq = suma(quote.items.equipos);
    const ac = suma(quote.items.accesorios);
    const labor = quote.laborApproval === "approved" ? quote.laborValue : 0;
    const extra = (e) => (e?.required && e?.approval === "approved" ? e.value : 0);
    const transporte = extra(quote.transporte);
    const certificado = extra(quote.certificado);
    const costoTotal = eq.costo + ac.costo + labor + transporte + certificado;
    const ventaTotal = eq.venta + ac.venta + labor + transporte + certificado + (quote.ajusteGlobal || 0);
    const margen = ventaTotal - costoTotal;
    return {
      costoEq: eq.costo, ventaEq: eq.venta, costoAc: ac.costo, ventaAc: ac.venta,
      labor, transporte, certificado, costoTotal, ventaTotal, margen,
      margenPct: ventaTotal > 0 ? (margen / ventaTotal) * 100 : 0,
      nItems: quote.items.equipos.length + quote.items.accesorios.length,
    };
  }, [quote]);

  // Lista filtrada: busca en número, cliente, proyecto, RUC, dirección, kit y en cada producto.
  const toks = useMemo(() => tokens(busqueda), [busqueda]);
  const filtradas = useMemo(
    () => quotes.filter((q) => coincide(q, toks, catalog)),
    [quotes, toks, catalog]
  );

  const p = plantillaDe(quote);
  const esKit = p !== "simple";
  const conKit = p === "caci" || p === "cerco";
  const vacia = summary.nItems === 0;
  const puedeAvanzar = (PUEDE_AVANZAR[quote.status] || []).includes(role);

  return (
    <div className="app-root">
      <div className="app">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-left">
            {view === "editor" && (
              <button className="back-btn" onClick={guardarYVolver} disabled={guardando} aria-label="Volver a lista">
                <ArrowLeft size={16} />
                <span className="back-label">{guardando ? "Guardando…" : "Volver a lista"}</span>
              </button>
            )}
            <span className="page-title">
              {view === "list" ? "Cotizaciones" : quote.proyecto || "Nueva cotización"}
            </span>
          </div>

          <div className="topbar-right">
            <div className="topbar-actions">
              {view === "list" ? (
                <button className="btn btn-primary" onClick={newQuote}>
                  <Plus size={16} /> Nueva cotización
                </button>
              ) : (
                <>
                  {STATUS_BTN[quote.status] && (
                    <button
                      className={`btn btn-status ${puedeAvanzar ? "btn-primary" : ""}`}
                      onClick={advanceStatus}
                      disabled={!puedeAvanzar || guardando}
                    >
                      {STATUS_BTN[quote.status]}
                    </button>
                  )}
                  <button className="btn" onClick={() => setExportando(quote)} disabled={guardando}>
                    <FileDown size={16} /> Exportar
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="main">
          {/* LISTA */}
          {view === "list" && (
            <div id="viewList">
              <div className="list-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span className="list-title">Todas las cotizaciones</span>
                <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 460 }}>
                  <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por número, cliente, equipo, RUC…"
                    style={{ width: "100%", paddingLeft: 32, paddingRight: busqueda ? 30 : 10 }}
                  />
                  {busqueda && (
                    <button
                      onClick={() => setBusqueda("")}
                      aria-label="Limpiar búsqueda"
                      style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: 0, cursor: "pointer", color: "#64748b" }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {cargando ? (
                <div className="list-empty">
                  <div className="empty-text">Cargando cotizaciones…</div>
                </div>
              ) : errorLista ? (
                <div className="list-empty">
                  <div className="empty-title">No se pudieron cargar</div>
                  <div className="empty-text">{errorLista}</div>
                  <button className="btn" onClick={cargar}>Reintentar</button>
                </div>
              ) : quotes.length === 0 ? (
                <div className="list-empty">
                  <div className="empty-title">Aún no hay cotizaciones</div>
                  <div className="empty-text">
                    Crea una nueva y parte de un kit (CACI, alarmas, cerco) para no armarla desde cero.
                  </div>
                  <button className="btn btn-primary" onClick={newQuote}><Plus size={16} /> Nueva cotización</button>
                </div>
              ) : filtradas.length === 0 ? (
                <div className="list-empty">
                  <div className="empty-title">Sin resultados</div>
                  <div className="empty-text">No hay cotizaciones que contengan “{busqueda}”.</div>
                </div>
              ) : (
                <table className="list-table">
                  <thead>
                    <tr>
                      <th>Cliente / Proyecto</th>
                      <th>Estado</th>
                      <th>Venta total</th>
                      <th>Margen</th>
                      <th>Fecha</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map((row) => {
                      const s = resumenDe(row);
                      const hits = productosQueCoinciden(row, toks, catalog);
                      return (
                        <tr key={row.id} onClick={() => openQuote(row.id)}>
                          <td className="cell-main">
                            <div className="client-name">
                              {row.numero && <span style={{ color: "#64748b", fontWeight: 600 }}>{row.numero} · </span>}
                              {row.cliente || "Sin cliente"}
                            </div>
                            <div className="project-name">{row.proyecto || "Sin proyecto"}</div>
                            {hits.length > 0 && (
                              <div style={{ fontSize: 11, color: "#4f46e5", marginTop: 2 }}>
                                Contiene: {hits.join(" · ")}
                              </div>
                            )}
                          </td>
                          <td data-label="Estado">
                            <span className={`status-badge ${STATUS_BADGE_CLASS[row.status]}`}>{STATUS_LABELS[row.status]}</span>
                          </td>
                          <td data-label="Venta total" className="cell-strong">{fmt(s.ventaTotal)}</td>
                          <td data-label="Margen" className={`cell-margin ${s.margenPct < 20 ? "c-danger" : "c-ok"}`}>
                            {s.margenPct.toFixed(1)}%
                          </td>
                          <td data-label="Fecha" className="cell-muted">{fechaCorta(row.fecha)}</td>
                          <td onClick={(e) => e.stopPropagation()} style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                            <button className="btn" title="Vista previa del PDF" onClick={() => setPreview(row)}>
                              <Eye size={14} />
                            </button>{" "}
                            <button className="btn" title="Duplicar cotización" onClick={() => duplicar(row.id)} disabled={guardando}>
                              <Copy size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* EDITOR */}
          {view === "editor" && (
            <div id="viewEditor">
              <div className="editor">
                {/* Datos del cliente */}
                <div className="card">
                  <div className="card-title card-title-block">Datos del cliente</div>
                  <div className="field-row">
                    <div className="field">
                      <label>Cliente</label>
                      <input
                        type="text"
                        placeholder="Nombre o razón social"
                        value={quote.cliente}
                        onChange={(e) => updateField("cliente", e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Proyecto</label>
                      <input
                        type="text"
                        placeholder="Ej. Detección 5 zonas – Local Surco"
                        value={quote.proyecto}
                        onChange={(e) => updateField("proyecto", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label>N° de cotización</label>
                      <input
                        type="text"
                        readOnly
                        placeholder="Se asigna al guardar"
                        value={quote.numero}
                      />
                    </div>

                    <div className="field">
                      <label>DNI / RUC</label>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={11}
                          placeholder="8 dígitos (DNI) u 11 (RUC)"
                          value={quote.ruc || ""}
                          onChange={(e) => updateField("ruc", e.target.value.replace(/\D/g, ""))}
                          onKeyDown={(e) => e.key === "Enter" && buscarDocumento()}
                        />
                        <button className="btn" onClick={buscarDocumento} disabled={buscando} title="Buscar y autocompletar">
                          <Search size={16} /> {buscando ? "..." : "Buscar"}
                        </button>
                      </div>
                      {errorDoc && <small style={{ color: "#b91c1c" }}>{errorDoc}</small>}
                    </div>

                    <div className="field">
                      <label>Atención</label>
                      <input
                        type="text"
                        placeholder="Nombre de contacto (si difiere del cliente)"
                        value={quote.atencion}
                        onChange={(e) => updateField("atencion", e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Dirección</label>
                      <input
                        type="text"
                        placeholder="Distrito / referencia"
                        value={quote.direccion}
                        onChange={(e) => updateField("direccion", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {vacia && (
                  <div className="card kit-banner">
                    <div>
                      <div className="kit-banner-title"><Zap size={16} /> Empieza desde un kit</div>
                      <div className="kit-banner-text">
                        CACI 5 y 8 zonas, alarmas SHOCTIX y HAGROY, cerco eléctrico. Se cargan equipos, accesorios y mano de obra base; después solo reemplazas modelos o agregas lo que falte.
                      </div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setKitOpen(true)}>Elegir kit</button>
                  </div>
                )}

                <ItemsCard
                  title="Equipos principales"
                  cat="equipos"
                  items={quote.items.equipos}
                  catalogItems={catalog.equipos}
                  costo={summary.costoEq}
                  total={summary.ventaEq}
                  addItem={addItem}
                  addCustomItem={addCustomItem}
                  removeItem={removeItem}
                  updateItem={updateItem}
                  onKit={() => setKitOpen(true)}
                />

                <ItemsCard
                  title={TITULO_AC[p]}
                  cat="accesorios"
                  items={quote.items.accesorios}
                  catalogItems={catalog.accesorios}
                  costo={summary.costoAc}
                  total={summary.ventaAc}
                  addItem={addItem}
                  addCustomItem={addCustomItem}
                  removeItem={removeItem}
                  updateItem={updateItem}
                  onKit={() => setKitOpen(true)}
                />

                {/* Mano de obra + extras */}
                <div className="card">
                  <div className="card-header labor-header">
                    <span className="card-title">{esKit ? "Instalación" : "Mano de obra"}</span>
                    <span className="card-amount">
                      {quote.laborApproval === "approved" ? fmt(quote.laborValue) : "S/ 0.00"}
                    </span>
                  </div>
                  <div className="labor-row">
                    <div className="labor-input-wrap">
                      <span>S/</span>
                      <input
                        type="number"
                        className="labor-input"
                        value={quote.laborApproval === "approved" ? quote.laborValue : quote.laborValue || ""}
                        readOnly={quote.laborApproval === "approved" && role === "vendedor"}
                        onChange={(e) => updateField("laborValue", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    {quote.laborApproval === "approved" ? (
                      <span className="approved-tag"><Check size={12} /> Aprobado</span>
                    ) : (
                      <button className="btn btn-primary" onClick={confirmLabor}>Confirmar</button>
                    )}
                  </div>

                  <div className="separator spaced"></div>
                  <ExtraCostRow
                    label="Transporte"
                    field="transporte"
                    data={quote.transporte}
                    onToggle={toggleExtraRequired}
                    onChangeValue={updateExtraValue}
                    onConfirm={confirmExtra}
                    role={role}
                  />
                  <div className="separator spaced"></div>
                  <ExtraCostRow
                    label="Certificado"
                    field="certificado"
                    data={quote.certificado}
                    onToggle={toggleExtraRequired}
                    onChangeValue={updateExtraValue}
                    onConfirm={confirmExtra}
                    role={role}
                  />
                  {p === "simple" && (
                    <>
                      <div className="separator spaced"></div>
                      <label className="extra-cost-toggle">
                        <input
                          type="checkbox"
                          checked={!!quote.mostrarIgv}
                          onChange={(e) => updateField("mostrarIgv", e.target.checked)}
                        />
                        Mostrar subtotal e IGV en el PDF
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* RESUMEN */}
              <aside className="summary-panel">
                <div className="summary-title">Resumen financiero</div>
                <div className="separator"></div>

                <div className="block-label">Costos</div>
                <div className="summary-line"><span>Equipos</span><span>{fmt(summary.costoEq)}</span></div>
                <div className="summary-line"><span>{conKit ? "Materiales" : "Accesorios"}</span><span>{fmt(summary.costoAc)}</span></div>
                <div className="summary-line"><span>{esKit ? "Instalación" : "Mano de obra"}</span><span>{fmt(summary.labor)}</span></div>
                {quote.transporte?.required && (
                  <div className="summary-line"><span>Transporte</span><span>{fmt(summary.transporte)}</span></div>
                )}
                {quote.certificado?.required && (
                  <div className="summary-line"><span>Certificado</span><span>{fmt(summary.certificado)}</span></div>
                )}
                <div className="summary-line total"><span>Costo total</span><span>{fmt(summary.costoTotal)}</span></div>

                <div className="separator spaced-sm"></div>

                <div className="block-label">Venta</div>
                <div className="summary-line"><span>Equipos</span><span>{fmt(summary.ventaEq)}</span></div>
                <div className="summary-line"><span>{conKit ? "Materiales" : "Accesorios"}</span><span>{fmt(summary.ventaAc)}</span></div>
                <div className="summary-line"><span>{esKit ? "Instalación" : "Mano de obra"}</span><span>{fmt(summary.labor)}</span></div>
                {quote.transporte?.required && (
                  <div className="summary-line"><span>Transporte</span><span>{fmt(summary.transporte)}</span></div>
                )}
                {quote.certificado?.required && (
                  <div className="summary-line"><span>Certificado</span><span>{fmt(summary.certificado)}</span></div>
                )}

                <div className="summary-line with-input">
                  <span>Ajuste / Descuento</span>
                  <input
                    type="number"
                    step="0.01"
                    className="adjust-input"
                    value={quote.ajusteGlobal || ""}
                    placeholder="S/ 0.00"
                    onChange={(e) => updateField("ajusteGlobal", parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="summary-line total primary">
                  <span>Venta total</span><span>{fmt(summary.ventaTotal)}</span>
                </div>

                <div className="separator"></div>
              </aside>
            </div>
          )}
        </div>

        <KitPicker
          open={kitOpen}
          onClose={() => setKitOpen(false)}
          kits={kits}
          catalogo={catalog}
          quote={quote}
          onSaveKit={guardarKit}
          onApply={(patch) => setQuote((q) => ({ ...q, ...marcarKit(patch), kitOrigen: patch.kitOrigen ?? q.kitOrigen }))}
        />

        {preview && (
          <PreviewModal
            quote={preview}
            summary={resumenDe(preview)}
            catalog={catalog}
            onClose={() => setPreview(null)}
            onEdit={openQuote}
            onDuplicate={duplicar}
            onExport={(q) => setExportando(q)}
          />
        )}

        {exportando && (
          <ExportModal
            quote={exportando}
            onClose={() => setExportando(null)}
            onConfirm={confirmarExport}
          />
        )}
      </div>
    </div>
  );
}

function resumenDe(q) {
  const suma = (arr) => arr.reduce((a, it) => ({ c: a.c + it.costo * it.qty, v: a.v + it.precio * it.qty }), { c: 0, v: 0 });
  const eq = suma(q.items.equipos), ac = suma(q.items.accesorios);
  const labor = q.laborApproval === "approved" ? q.laborValue : 0;
  const ex = (e) => (e?.required && e?.approval === "approved" ? e.value : 0);
  const extras = labor + ex(q.transporte) + ex(q.certificado);
  const costoTotal = eq.c + ac.c + extras;
  const ventaTotal = eq.v + ac.v + extras + (q.ajusteGlobal || 0);
  return { costoTotal, ventaTotal, margenPct: ventaTotal > 0 ? ((ventaTotal - costoTotal) / ventaTotal) * 100 : 0 };
}

function ExtraCostRow({ label, field, data, onToggle, onChangeValue, onConfirm, role }) {
  const canEdit = role === "gerente" || role === "supervisor";
  return (
    <div className="extra-cost-block">
      <div className="extra-cost-header">
        <span className="extra-cost-name">{label}</span>
        {data.required
          ? <span className="card-amount">{data.approval === "approved" ? fmt(data.value) : "S/ 0.00"}</span>
          : <span className="not-required-tag">No requerido</span>}
      </div>
      <label className="extra-cost-toggle">
        <input type="checkbox" checked={data.required} onChange={() => onToggle(field)} />
        ¿Se requiere {label.toLowerCase()}?
      </label>
      {data.required && (
        <div className="labor-row">
          <div className="labor-input-wrap">
            <span>S/</span>
            <input
              type="number"
              className="labor-input"
              value={data.approval === "approved" ? data.value : data.value || ""}
              readOnly={data.approval === "approved" && !canEdit}
              onChange={(e) => onChangeValue(field, e.target.value)}
            />
          </div>
          {data.approval === "approved"
            ? <span className="approved-tag"><Check size={12} /> Aprobado</span>
            : <button className="btn btn-primary" onClick={() => onConfirm(field)}>Confirmar</button>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ITEMS CARD
// ---------------------------------------------------------------------------
const COLORES = {
  compra: { group: "#fcd34d", sub: "#fef3c7", cell: "#fffbeb", strong: "#fde68a", text: "#78350f" },
  venta:  { group: "#93c5fd", sub: "#dbeafe", cell: "#eff6ff", strong: "#bfdbfe", text: "#1e3a8a" },
  igv:    { group: "#fca5a5", sub: "#fee2e2", cell: "#fef2f2", strong: "#fecaca", text: "#b91c1c" },
  margen: { group: "#86efac", sub: "#dcfce7", cell: "#f0fdf4", text: "#14532d" },
  ok:  "#15803d",
  bad: "#b91c1c",
};

const LINEA = "1px solid rgba(15, 23, 42, 0.08)";
const SEPARADOR = "3px solid #ffffff";

const estiloGrupo = (c) => ({
  textAlign: "center",
  padding: "6px 4px",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  background: c.group,
  color: c.text,
  borderLeft: SEPARADOR,
});

const estiloSub = (c, { strong = false } = {}) => ({
  textAlign: "right",
  padding: "5px 6px",
  fontSize: 10,
  fontWeight: strong ? 800 : 700,
  whiteSpace: "nowrap",
  background: strong ? c.strong : c.sub,
  color: c.text,
  borderLeft: LINEA,
  borderTop: LINEA,
});

const estiloCelda = (bg, extra = {}) => ({
  padding: "4px 6px",
  borderLeft: LINEA,
  verticalAlign: "middle",
  background: bg,
  ...extra,
});

const estiloCeldaInicioGrupo = (bg, extra = {}) =>
  estiloCelda(bg, { borderLeft: SEPARADOR, ...extra });

const estiloSoloLectura = (c, extra = {}) =>
  estiloCelda(c.cell, {
    textAlign: "right",
    fontSize: 12,
    color: c.text,
    fontWeight: 600,
    ...extra,
  });

function ItemsCard({ title, cat, items, catalogItems, addItem, addCustomItem, removeItem, updateItem, costo, total, onKit }) {
  const [showCols, setShowCols] = useState(esEscritorio);

  const grupos = useMemo(() => {
    const g = catalogItems.reduce((acc, p) => {
      (acc[p.marca || "General"] ||= []).push(p);
      return acc;
    }, {});
    return Object.fromEntries(
      Object.entries(g)
        .sort(([a], [b]) => a.localeCompare(b, "es"))
        .map(([m, lista]) => [
          m,
          [...lista].sort((x, y) => x.name.localeCompare(y.name, "es", { numeric: true })),
        ])
    );
  }, [catalogItems]);

  const etiqueta = cat === "equipos" ? "equipo" : "accesorio";

  return (
    <div className="card">
      <div className="card-header items-card-header">
        <div className="items-card-title">
          <span className="card-title">{title}</span>
          <button className="btn btn-toggle-cols" onClick={() => setShowCols(!showCols)}>
            {showCols ? <EyeOff size={14} /> : <Eye size={14} />}
            {showCols ? "Ocultar columnas" : "Ver columnas"}
          </button>
        </div>
        <div className="items-card-total">
          <span className="card-amount">{fmt(total)}</span>
          {showCols && <span className="card-sub">costo {fmt(costo)}</span>}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="items-empty">Sin {etiqueta}s todavía. Carga un kit o agrégalos uno por uno.</div>
      ) : (
        <>
          <div className="scroll-hint">Desliza horizontalmente para ver todas las columnas →</div>
          <div className="items-scroll">
            <table className="items-table" style={{ minWidth: showCols ? 1050 : 500 }}>
              <thead>
                {/* Fila 1: grupos. Los colSpan DEBEN coincidir con las columnas de la fila 2 y del cuerpo:
                    compra = 4 | venta = 5 (visible) o 3 (oculto) | margen = 2 */}
                <tr>
                  <th rowSpan={2} className="sticky-1">CANT</th>
                  <th rowSpan={2} className="sticky-2" style={{ minWidth: 200 }}>{etiqueta.toUpperCase()}</th>
                  {showCols && <th colSpan={4} style={estiloGrupo(COLORES.compra)}>Costo de compra</th>}
                  <th colSpan={showCols ? 5 : 3} style={estiloGrupo(COLORES.venta)}>Costo de venta</th>
                  {showCols && <th colSpan={2} style={estiloGrupo(COLORES.margen)}>Margen</th>}
                  <th rowSpan={2} className="col-actions"></th>
                </tr>
                {/* Fila 2: columnas */}
                <tr>
                  {/* Costo de compra (4) */}
                  {showCols && <th style={estiloSub(COLORES.compra)}>CU.NETO</th>}
                  {showCols && <th style={estiloSub(COLORES.igv)}>IGV</th>}
                  {showCols && <th style={estiloSub(COLORES.compra)}>CU.TOTAL</th>}
                  {showCols && <th style={estiloSub(COLORES.compra, { strong: true })}>C. TOTAL</th>}

                  {/* Costo de venta: CU.NETO → % MARGEN → IGV UNIT → CU.TOTAL → C. TOTAL (5) */}
                  {showCols && <th style={estiloSub(COLORES.venta)}>CU.NETO</th>}
                  {showCols && <th style={estiloSub(COLORES.venta)}>% MARGEN</th>}

                  {showCols && <th style={estiloSub(COLORES.igv)}>IGV UNIT</th>}
                  <th style={estiloSub(COLORES.venta, { strong: true })}>CU.TOTAL</th>

                  {!showCols && <th style={estiloSub(COLORES.venta)}>% MARGEN</th>}
                  <th style={estiloSub(COLORES.venta)}>C. TOTAL</th>

                  {/* Margen (2) */}
                  {showCols && <th style={estiloSub(COLORES.margen)}>UNIT</th>}
                  {showCols && <th style={estiloSub(COLORES.margen)}>FINAL</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const isCustom = !item.pid;

                  const cuTotalCompra = item.costo || 0;
                  const cuNetoCompra = cuTotalCompra / 1.18;
                  const igvCompra = cuTotalCompra - cuNetoCompra;
                  const cTotalCompra = cuTotalCompra * item.qty;

                  const cuTotalVenta = item.precio || 0;
                  const cuNetoVenta = cuTotalVenta / 1.18;
                  const igvVenta = cuTotalVenta - cuNetoVenta;
                  const cTotalVenta = cuTotalVenta * item.qty;

                  // % MARGEN estilo Excel: es un dato guardado en el ítem (item.margen).
                  // Si el ítem aún no se tocó, sale del precio de catálogo.
                  const margenActual = margenDe(item);
                  const mUnit = cuTotalVenta - cuTotalCompra;
                  const mTotal = cTotalVenta - cTotalCompra;

                  // Celda de % MARGEN (se usa en una u otra posición según showCols)
                  const celdaMargenPct = (
                    <td style={estiloCelda(COLORES.venta.cell)}>
                      <input
                        type="number"
                        className="compact-input"
                        step="0.01"
                        value={Number(margenActual.toFixed(3))}
                        onChange={(e) => updateItem(cat, i, "margen", e.target.value)}
                        title={`CU.NETO venta = ${cuTotalCompra.toFixed(2)} / (1 - ${margenActual.toFixed(3)}%) = ${(cuTotalCompra / (1 - margenActual / 100)).toFixed(2)}`}
                      />
                    </td>
                  );
                  return (
                    <tr key={i}>
                      <td className="sticky-1">
                        <input
                          type="number"
                          min="1"
                          className="compact-input qty-input"
                          value={item.qty}
                          onChange={(e) => updateItem(cat, i, "qty", e.target.value)}
                        />
                      </td>

                      <td className="sticky-2">
                        {isCustom ? (
                          <div className="custom-name-wrap">
                            <span className="custom-name-tag">Nuevo</span>
                            <input
                              type="text"
                              className="compact-input full"
                              placeholder="Nombre del producto"
                              value={item.name || ""}
                              onChange={(e) => updateItem(cat, i, "name", e.target.value)}
                            />
                          </div>
                        ) : (
                          <select
                            className="compact-select"
                            value={item.pid}
                            onChange={(e) => updateItem(cat, i, "pid", e.target.value)}
                          >
                            {Object.entries(grupos).map(([marca, lista]) => (
                              <optgroup key={marca} label={marca}>
                                {lista.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </optgroup>
                            ))}
                            <option value={CUSTOM_OPTION}>+ Producto nuevo (personalizado)</option>
                          </select>
                        )}
                      </td>

                      {/* COSTO DE COMPRA (4) */}
                      {showCols && (
                        <td style={estiloCeldaInicioGrupo(COLORES.compra.cell)}>
                          <input
                            type="number"
                            className="compact-input"
                            step="0.01"
                            value={cuNetoCompra.toFixed(2)}
                            onChange={(e) => updateItem(cat, i, "costo_neto", e.target.value)}
                            title="Editar Neto"
                          />
                        </td>
                      )}
                      {showCols && (
                        <td style={estiloSoloLectura(COLORES.igv)}>
                          {igvCompra.toFixed(2)}
                        </td>
                      )}
                      {showCols && (
                        <td style={estiloCelda(COLORES.compra.cell)}>
                          <input
                            type="number"
                            className="compact-input"
                            step="0.01"
                            value={cuTotalCompra.toFixed(2)}
                            onChange={(e) => updateItem(cat, i, "costo", e.target.value)}
                            title="Editar CU Total"
                          />
                        </td>
                      )}
                      {showCols && (
                        <td style={estiloSoloLectura(
                          { cell: COLORES.compra.strong, text: COLORES.compra.text },
                          { fontWeight: 800 }
                        )}>
                          {item.qty > 0 ? cTotalCompra.toFixed(2) : "-"}
                        </td>
                      )}

                      {/* COSTO DE VENTA: CU.NETO → % MARGEN → IGV UNIT → CU.TOTAL → C. TOTAL (5) */}
                      {showCols && (
                        <td style={estiloCeldaInicioGrupo(COLORES.venta.cell)}>
                          <input
                            type="number"
                            className="compact-input"
                            step="0.01"
                            value={cuNetoVenta.toFixed(2)}
                            onChange={(e) => updateItem(cat, i, "precio_neto", e.target.value)}
                            title="Editar Neto Venta"
                          />
                        </td>
                      )}
                      {showCols && celdaMargenPct}
                      {showCols && (
                        <td style={estiloSoloLectura(COLORES.igv)}>
                          {igvVenta.toFixed(2)}
                        </td>
                      )}
                      <td style={estiloCelda(COLORES.venta.strong, showCols ? {} : { borderLeft: SEPARADOR })}>
                        <input
                          type="number"
                          className="compact-input hl-venta-input"
                          step="0.01"
                          value={cuTotalVenta.toFixed(2)}
                          onChange={(e) => updateItem(cat, i, "precio", e.target.value)}
                        />
                      </td>
                      {!showCols && celdaMargenPct}
                      <td className="total-cell" style={estiloCelda(COLORES.venta.cell)}>
                        <input
                          type="number"
                          className="compact-input bold-input"
                          step="0.01"
                          value={cTotalVenta.toFixed(2)}
                          onChange={(e) => updateItem(cat, i, "total_venta", e.target.value)}
                        />
                      </td>

                      {/* MARGEN (2) */}
                      {showCols && (
                        <td style={estiloCeldaInicioGrupo(COLORES.margen.cell, {
                          textAlign: "right",
                          fontSize: 12,
                          fontWeight: 600,
                          color: mUnit < 0 ? COLORES.bad : COLORES.margen.text,
                        })}>
                          {mUnit.toFixed(2)}
                        </td>
                      )}
                      {showCols && (
                        <td style={estiloSoloLectura(COLORES.margen, {
                          fontWeight: 800,
                          color: mTotal < 0 ? COLORES.bad : COLORES.ok,
                        })}>
                          {mTotal.toFixed(2)}
                        </td>
                      )}

                      <td className="col-actions">
                        <button className="del-btn" onClick={() => removeItem(cat, i)} aria-label="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="items-footer">
        {catalogItems.length > 0 && (
          <button className="add-btn" onClick={() => addItem(cat)}>
            <Plus size={14} /> Agregar {etiqueta} del catálogo
          </button>
        )}
        <button className="add-btn secondary" onClick={() => addCustomItem(cat)}>
          <Plus size={14} /> Producto nuevo
        </button>
        {items.length === 0 && onKit && (
          <button className="add-btn secondary" onClick={onKit}>
            <Zap size={14} /> Cargar desde kit
          </button>
        )}
      </div>
    </div>
  );
}