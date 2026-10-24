import React, { useState, useMemo, useEffect, useRef } from "react";
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
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  GripVertical,
  Pencil,
} from "lucide-react";
import KitPicker from "../components/KitPicker";
import ProductoSelect, { BuscadorProductos } from "../components/ProductoSelect";
import { PreviewModal, ExportModal } from "../components/ModalesCotizacion";
import { useKits } from "../hooks/useKits";
import { CATALOGO } from "../data/kits";
import { exportarPDF, exportarPDFConCarpeta, plantillaDe } from "../utils/exportarPDF";
import {
  duplicarCotizacion,
  tokens,
  coincide,
  productosQueCoinciden,
} from "../utils/cotizaciones";
import { normalizarTexto, limpiarEspacios, normalizarCotizacion, clave } from "../utils/textos";
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
// Servicios adicionales y descuentos: listas de { descripcion, monto } que el usuario agrega y describe.
// Solo cuentan las líneas con monto > 0 (las cotizaciones antiguas no traen estas listas).
const blankLinea = () => ({ descripcion: "", monto: 0 });
const sumaLineas = (arr) => (arr || []).reduce((a, l) => a + (l.monto > 0 ? l.monto : 0), 0);
// Garantía en Términos y condiciones: el usuario decide si va y con qué texto exacto.
const garantiaDefault = () => ({ activa: true, texto: "Garantía por servicio y equipos: 01 año" });
// Descripciones largas no deben desbordar el resumen financiero.
const ETIQUETA_LINEA = { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 };
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
    serviciosAdicionales: [],
    descuentos: [],
    nota: "",              // texto libre; sale en el PDF antes de Términos y condiciones
    garantia: garantiaDefault(),
    ajusteGlobal: 0,      // heredado: ya no se edita; se respeta en cotizaciones antiguas
    fecha: new Date().toISOString(),
    items: { equipos: [], accesorios: [] },
  };
}

// Cotizaciones guardadas antes de tener el campo `garantia` no lo traen: se les asigna,
// la primera vez que se abren, el valor que tenían de forma implícita en el PDF (garantía
// fija solo en CACI y cerco eléctrico). De ahí en adelante queda guardado y es editable.
const aseguraGarantia = (q) => {
  if (q.garantia) return q;
  const p = plantillaDe(q);
  return { ...q, garantia: { activa: p === "caci" || p === "cerco", texto: "Garantía por servicio y equipos: 01 año" } };
};

const fechaCorta = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
};

// ---------------------------------------------------------------------------
// CAMPO DE TEXTO que se corrige solo al salir del campo (mayúsculas/minúsculas,
// espacios dobles, etc.). Se usa en todos los textos libres.
// ---------------------------------------------------------------------------
// function CampoTexto({ value, onChange, ...props }) {
//   return (
//     <input
//       type="text"
//       {...props}
//       value={value ?? ""}
//       onChange={(e) => onChange(e.target.value)}
//       onBlur={(e) => {
//         const limpio = normalizarTexto(e.target.value);
//         if (limpio !== e.target.value) onChange(limpio);
//       }}
//     />
//   );
// }
function CampoTexto({ value, onChange, normalizar = false, ...props }) {
  return (
    <input
      type="text"
      {...props}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => {
        const limpio = normalizar ? normalizarTexto(e.target.value) : limpiarEspacios(e.target.value);
        if (limpio !== e.target.value) onChange(limpio);
      }}
    />
  );
}
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
            const nombre = normalizarTexto(item.name);
            // Compara sin mayúsculas ni tildes: "Cámara" y "camara" son el mismo producto
            const i = next[cat].findIndex((p) => clave(p.name) === clave(nombre));
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
      // Los datos de SUNAT/RENIEC vienen en MAYÚSCULAS: se normalizan al traerlos
      setQuote((q) => normalizarCotizacion({ ...q, ...datos }));
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
  const openQuote = (id) => {
    const q = quotes.find((x) => x.id === id);
    if (q) { setQuote(aseguraGarantia(q)); setView("editor"); setPreview(null); }
  };

  // Guarda en el servidor y devuelve la cotización con su número asignado.
  // Antes de guardar se normalizan todos los textos (red de seguridad).
  const guardar = async (q = quote) => {
    setGuardando(true);
    try {
      const saved = await putCotizacion(normalizarCotizacion(q));
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
      setQuote(aseguraGarantia(copia));
      setPreview(null);
      setView("editor");
    } catch (e) {
      alert("No se pudo duplicar: " + e.message);
    }
  };

  // Exportar: guarda primero (así tiene número) y descarga, o guarda directo en la carpeta
  // compartida configurada (ver ModalesCotizacion/ExportModal), "<correlativo> - <nombre>.pdf".
  const confirmarExport = async (nombre, usarCarpeta) => {
    try {
      const saved = await guardar({ ...exportando, nombreArchivo: nombre });
      if (quote.id === saved.id) setQuote(saved);
      const resumen = resumenDe(saved);
      if (usarCarpeta) {
        const r = await exportarPDFConCarpeta(saved, resumen, catalog);
        if (!r.guardadoEnCarpeta && r.error) {
          alert("No se pudo guardar en la carpeta compartida (se descargó por el navegador en su lugar):\n" + r.error);
        }
      } else {
        await exportarPDF(saved, resumen, catalog);
      }
      setExportando(null);
    } catch (e) {
      alert("No se pudo guardar la cotización: " + e.message);
    }
  };

  // Agrega un producto del catálogo. Si se indica pid, agrega ese; si no, el primero.
  const addItem = (cat, pid) => {
    const p = pid ? catalog[cat]?.find((x) => x.id === pid) : catalog[cat]?.[0];
    if (!p) return addCustomItem(cat);
    setQuote((q) => ({ ...q, items: { ...q.items, [cat]: [...(q.items[cat] || []), { pid: p.id, qty: 1, costo: p.costo, precio: p.precio }] } }));
  };
  const addCustomItem = (cat) =>
    setQuote((q) => ({ ...q, items: { ...q.items, [cat]: [...(q.items[cat] || []), blankCustomItem()] } }));
  const removeItem = (cat, i) =>
    setQuote((q) => ({ ...q, items: { ...q.items, [cat]: (q.items[cat] || []).filter((_, idx) => idx !== i) } }));

  // Cambia de posición un ítem dentro de su lista (equipos o accesorios).
  const moveItem = (cat, from, to) =>
    setQuote((q) => {
      const list = [...(q.items[cat] || [])];
      if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return q;
      const [it] = list.splice(from, 1);
      list.splice(to, 0, it);
      return { ...q, items: { ...q.items, [cat]: list } };
    });

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

  // Servicios adicionales / descuentos (f = "serviciosAdicionales" | "descuentos")
  const addLinea = (f) =>
    setQuote((q) => ({ ...q, [f]: [...(q[f] || []), blankLinea()] }));
  const updateLinea = (f, i, campo, v) =>
    setQuote((q) => ({
      ...q,
      [f]: (q[f] || []).map((l, idx) =>
        idx === i ? { ...l, [campo]: campo === "monto" ? Math.max(0, parseFloat(v) || 0) : v } : l
      ),
    }));
  const removeLinea = (f, i) =>
    setQuote((q) => ({ ...q, [f]: (q[f] || []).filter((_, idx) => idx !== i) }));

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
    const servicios = sumaLineas(quote.serviciosAdicionales);
    const descuentos = sumaLineas(quote.descuentos);
    const costoTotal = eq.costo + ac.costo + labor + transporte + certificado;
    const ventaTotal = eq.venta + ac.venta + labor + transporte + certificado + servicios - descuentos + (quote.ajusteGlobal || 0);
    const margen = ventaTotal - costoTotal;
    return {
      costoEq: eq.costo, ventaEq: eq.venta, costoAc: ac.costo, ventaAc: ac.venta,
      labor, transporte, certificado, servicios, descuentos, costoTotal, ventaTotal, margen,
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
                      <CampoTexto
                        placeholder="Nombre o razón social"
                        value={quote.cliente}
                        onChange={(v) => updateField("cliente", v)}
                      />
                    </div>
                    <div className="field">
                      <label>Proyecto</label>
                      <CampoTexto
                        placeholder="Ej. Detección 5 zonas – Local Surco"
                        value={quote.proyecto}
                        onChange={(v) => updateField("proyecto", v)}
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
                      <CampoTexto
                        placeholder="Nombre de contacto (si difiere del cliente)"
                        value={quote.atencion}
                        onChange={(v) => updateField("atencion", v)}
                      />
                    </div>
                    <div className="field">
                      <label>Dirección</label>
                      <CampoTexto
                        placeholder="Distrito / referencia"
                        value={quote.direccion}
                        onChange={(v) => updateField("direccion", v)}
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
                  moveItem={moveItem}
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
                  moveItem={moveItem}
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
                    label="CERTIFICADO"
                    field="certificado"
                    data={quote.certificado}
                    onToggle={toggleExtraRequired}
                    onChangeValue={updateExtraValue}
                    onConfirm={confirmExtra}
                    role={role}
                  />
                  <div className="separator spaced"></div>
                  <LineasLibres
                    label="SERVICIOS ADICIONALES"
                    textoAgregar="Agregar servicio adicional"
                    placeholder="Describe el servicio (Ej. Configuración de CCTV remoto)"
                    field="serviciosAdicionales"
                    lineas={quote.serviciosAdicionales || []}
                    onAdd={addLinea}
                    onUpdate={updateLinea}
                    onRemove={removeLinea}
                  />
                  <div className="separator spaced"></div>
                  <LineasLibres
                    label="DESCUENTOS"
                    textoAgregar="Agregar descuento"
                    placeholder="Describe el descuento (Ej. Descuento por pronto pago)"
                    field="descuentos"
                    lineas={quote.descuentos || []}
                    onAdd={addLinea}
                    onUpdate={updateLinea}
                    onRemove={removeLinea}
                    restar
                  />
                  {/* {p === "simple" && (
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
                  )} */}
                </div>

                {/* Nota y garantía: la nota sale en el PDF justo antes de Términos y condiciones */}
                <div className="card">
                  <div className="card-title card-title-block">Nota y garantía</div>

                  <div className="field">
                    <label>Nota (aparece en el PDF, antes de Términos y condiciones)</label>
                    <textarea
                      rows={3}
                      placeholder="Ej. Materiales según demanda, tiempos de entrega sujetos a stock…"
                      value={quote.nota || ""}
                      onChange={(e) => updateField("nota", e.target.value)}
                      // onBlur={(e) => {
                      //   const limpio = normalizarTexto(e.target.value);
                      //   if (limpio !== e.target.value) updateField("nota", limpio);
                      // }}.
                      onBlur={(e) => {
  const limpio = limpiarEspacios(e.target.value);
  if (limpio !== e.target.value) updateField("nota", limpio);
}}
                      style={{
                        width: "100%",
                        resize: "vertical",
                        fontFamily: "inherit",
                        fontSize: 14,
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div className="separator spaced"></div>

                  <label className="extra-cost-toggle">
                    <input
                      type="checkbox"
                      checked={!!quote.garantia?.activa}
                      onChange={(e) =>
                        setQuote((q) => ({
                          ...q,
                          garantia: { ...(q.garantia || garantiaDefault()), activa: e.target.checked },
                        }))
                      }
                    />
                    Incluir garantía en términos y condiciones
                  </label>
                  {quote.garantia?.activa && (
                    <CampoTexto
                      placeholder="Ej. Garantía por servicio y equipos: 01 año"
                      value={quote.garantia?.texto ?? ""}
                      onChange={(v) =>
                        setQuote((q) => ({ ...q, garantia: { ...(q.garantia || garantiaDefault()), texto: v } }))
                      }
                      style={{ width: "100%", marginTop: 6 }}
                    />
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

                {(quote.serviciosAdicionales || []).map((l, i) => l.monto > 0 && (
                  <div className="summary-line" key={`sa-${i}`}>
                    <span style={ETIQUETA_LINEA}>{l.descripcion || "Servicio adicional"}</span>
                    <span>{fmt(l.monto)}</span>
                  </div>
                ))}
                {(quote.descuentos || []).map((l, i) => l.monto > 0 && (
                  <div className="summary-line" key={`ds-${i}`}>
                    <span style={ETIQUETA_LINEA}>{l.descripcion || "Descuento"}</span>
                    <span>-{fmt(l.monto)}</span>
                  </div>
                ))}

                {/* Ajuste heredado: solo aparece en cotizaciones antiguas que ya lo tenían */}
                {!!quote.ajusteGlobal && (
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
                )}

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
  const ventaTotal = eq.v + ac.v + extras + sumaLineas(q.serviciosAdicionales) - sumaLineas(q.descuentos) + (q.ajusteGlobal || 0);
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

// Bloque opcional (servicios adicionales / descuentos): el usuario agrega líneas y escribe
// qué es cada una y su monto. Se ve igual que Transporte o Certificado.
function LineasLibres({ label, textoAgregar, placeholder, field, lineas, onAdd, onUpdate, onRemove, restar = false }) {
  const total = lineas.reduce((a, l) => a + (l.monto > 0 ? l.monto : 0), 0);
  return (
    <div className="extra-cost-block">
      <div className="extra-cost-header">
        <span className="extra-cost-name">{label}</span>
        {lineas.length > 0
          ? <span className="card-amount">{restar && total > 0 ? "-" : ""}{fmt(total)}</span>
          : <span className="not-required-tag">No aplica</span>}
      </div>

      {lineas.map((l, i) => (
        <div className="labor-row" key={i} style={{ flexWrap: "wrap" }}>
          <CampoTexto
            placeholder={placeholder}
            value={l.descripcion}
            onChange={(v) => onUpdate(field, i, "descripcion", v)}
            style={{ flex: "1 1 220px", minWidth: 0 }}
          />
          <div className="labor-input-wrap">
            <span>{restar ? "- S/" : "S/"}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="labor-input"
              value={l.monto || ""}
              onChange={(e) => onUpdate(field, i, "monto", e.target.value)}
            />
          </div>
          <button className="del-btn" onClick={() => onRemove(field, i)} aria-label={`Quitar de ${label.toLowerCase()}`}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <div style={{ marginTop: lineas.length ? 8 : 0 }}>
        <button className="add-btn secondary" onClick={() => onAdd(field)}>
          <Plus size={14} /> {textoAgregar}
        </button>
      </div>
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

// Ancho de la columna "ORDEN" (asa + flechas) que aparece al activar el modo ordenar.
const ANCHO_ORDEN = 84;

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

function ItemsCard({ title, cat, items, catalogItems, addItem, addCustomItem, removeItem, moveItem, updateItem, costo, total, onKit }) {
  const [showCols, setShowCols] = useState(esEscritorio);
  const [agregando, setAgregando] = useState(false); // buscador de "Agregar del catálogo" abierto
  const [ordenando, setOrdenando] = useState(false); // modo ordenar (toggle)
  const [drag, setDrag] = useState({ from: null, over: null }); // fila que se arrastra / fila sobre la que está
  const addRef = useRef(null);

  // Filas (por índice) cuyo nombre se está editando a mano, sin tocar el producto del catálogo.
  // El botón que lo activa vive en la columna de acciones, junto al de eliminar.
  const [editandoNombre, setEditandoNombre] = useState(() => new Set());
  const toggleEditarNombre = (i) =>
    setEditandoNombre((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  // El modo ordenar solo tiene sentido con 2 o más ítems
  const modoOrden = ordenando && items.length > 1;
  // Con la columna ORDEN visible, las columnas fijas (CANT y nombre) se corren a la derecha
  const izq1 = modoOrden ? { left: ANCHO_ORDEN } : undefined;
  const izq2 = modoOrden ? { left: ANCHO_ORDEN + 60 } : undefined;

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
          {items.length > 1 && (
            <button
              className={`btn btn-toggle-cols ${modoOrden ? "is-active" : ""}`}
              onClick={() => { setOrdenando(!ordenando); setDrag({ from: null, over: null }); }}
            >
              <ArrowUpDown size={14} />
              {modoOrden ? "Listo" : "Ordenar"}
            </button>
          )}
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
            <table className="items-table" style={{ minWidth: (showCols ? 1050 : 500) + (modoOrden ? ANCHO_ORDEN : 0) }}>
              <thead>
                {/* Fila 1: grupos. Los colSpan DEBEN coincidir con las columnas de la fila 2 y del cuerpo:
                    compra = 4 | venta = 5 (visible) o 3 (oculto) | margen = 2 */}
                <tr>
                  {modoOrden && (
                    <th rowSpan={2} className="sticky-0" style={{ width: ANCHO_ORDEN, minWidth: ANCHO_ORDEN }}>ORDEN</th>
                  )}
                  <th rowSpan={2} className="sticky-1" style={izq1}>CANT</th>
                  <th rowSpan={2} className="sticky-2" style={{ minWidth: 200, ...izq2 }}>{etiqueta.toUpperCase()}</th>
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
                  const editandoEsteNombre = editandoNombre.has(i);

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

                  // Clases de la fila mientras se arrastra: la arrastrada se atenúa y
                  // la de destino muestra una línea donde caerá.
                  const claseFila = [
                    drag.from === i ? "dragging" : "",
                    modoOrden && drag.from !== null && drag.over === i && drag.from !== i
                      ? (drag.from > i ? "drop-before" : "drop-after")
                      : "",
                  ].join(" ").trim();

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
                    <tr
                      key={i}
                      className={claseFila || undefined}
                      draggable={modoOrden}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", String(i));
                        setDrag({ from: i, over: i });
                      }}
                      onDragOver={(e) => {
                        if (drag.from === null) return;
                        e.preventDefault();
                        if (drag.over !== i) setDrag((d) => ({ ...d, over: i }));
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (drag.from !== null) moveItem(cat, drag.from, i);
                        setDrag({ from: null, over: null });
                      }}
                      onDragEnd={() => setDrag({ from: null, over: null })}
                    >
                      {modoOrden && (
                        <td className="sticky-0" style={{ width: ANCHO_ORDEN, minWidth: ANCHO_ORDEN }}>
                          <div className="order-cell">
                            <span className="drag-handle" title="Arrastra para ordenar">
                              <GripVertical size={16} />
                            </span>
                            <button
                              className="del-btn"
                              disabled={i === 0}
                              onClick={() => moveItem(cat, i, i - 1)}
                              aria-label="Subir"
                              title="Subir"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              className="del-btn"
                              disabled={i === items.length - 1}
                              onClick={() => moveItem(cat, i, i + 1)}
                              aria-label="Bajar"
                              title="Bajar"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </td>
                      )}

                      <td className="sticky-1" style={izq1}>
                        <input
                          type="number"
                          min="1"
                          className="compact-input qty-input"
                          value={item.qty}
                          onChange={(e) => updateItem(cat, i, "qty", e.target.value)}
                        />
                      </td>

                      <td className="sticky-2" style={izq2}>
                        {isCustom ? (
                          <div className="custom-name-wrap">
                            <span className="custom-name-tag">Nuevo</span>
                            <CampoTexto
                              className="compact-input full"
                              placeholder="Nombre del producto"
                              value={item.name || ""}
                              onChange={(v) => updateItem(cat, i, "name", v)}
                            />
                          </div>
                        ) : editandoEsteNombre ? (
                          <CampoTexto
                            className="compact-input full"
                            placeholder="Nombre del producto"
                            autoFocus
                            value={item.name ?? catalogItems.find((x) => x.id === item.pid)?.name ?? ""}
                            onChange={(v) => updateItem(cat, i, "name", v)}
                            onKeyDown={(e) => e.key === "Enter" && toggleEditarNombre(i)}
                          />
                        ) : (
                          <ProductoSelect
                            value={item.pid}
                            nombre={item.name || catalogItems.find((x) => x.id === item.pid)?.name}
                            grupos={grupos}
                            onChange={(pid) => updateItem(cat, i, "pid", pid)}
                          />
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
                        {!isCustom && (
                          <button
                            className="del-btn"
                            onClick={() => toggleEditarNombre(i)}
                            aria-label={editandoEsteNombre ? "Terminar de editar nombre" : "Editar nombre del producto"}
                            title={editandoEsteNombre ? "Listo" : "Editar nombre"}
                          >
                            {editandoEsteNombre ? <Check size={16} /> : <Pencil size={16} />}
                          </button>
                        )}
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
          <>
            <button ref={addRef} className="add-btn" onClick={() => setAgregando((v) => !v)}>
              <Plus size={14} /> Agregar {etiqueta} 
            </button>
            {agregando && (
              <BuscadorProductos
                anchorEl={addRef.current}
                grupos={grupos}
                onElegir={(pid) => { addItem(cat, pid); setAgregando(false); }}
                onCustom={() => { addCustomItem(cat); setAgregando(false); }}
                onCerrar={() => setAgregando(false)}
              />
            )}
          </>
        )}
        <button className="add-btn secondary" onClick={() => addCustomItem(cat)}>
          <Plus size={14} /> Agregar producto nuevo
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
// import React, { useState, useMemo, useEffect, useRef } from "react";
// import {
//   ArrowLeft,
//   Check,
//   Copy,
//   Eye,
//   EyeOff,
//   FileDown,
//   Plus,
//   Trash2,
//   Zap,
//   Search,
//   X,
//   ArrowUp,
//   ArrowDown,
//   ArrowUpDown,
//   GripVertical
// } from "lucide-react";
// import KitPicker from "../components/KitPicker";
// import ProductoSelect, { BuscadorProductos } from "../components/ProductoSelect";
// import { PreviewModal, ExportModal } from "../components/ModalesCotizacion";
// import { useKits } from "../hooks/useKits";
// import { CATALOGO } from "../data/kits";
// import { exportarPDF, exportarPDFConCarpeta, plantillaDe } from "../utils/exportarPDF";
// import {
//   duplicarCotizacion,
//   tokens,
//   coincide,
//   productosQueCoinciden,
// } from "../utils/cotizaciones";
// import { normalizarTexto, normalizarCotizacion, clave } from "../utils/textos";
// import { consultarDocumento } from "../components/consultarDocument";
// import { getCotizaciones, putCotizacion } from "../api";

// const CUSTOM_OPTION = "__custom__";
// const STATUS_LABELS = { borrador: "Borrador", revision: "En revisión", aprobada: "Aprobada", enviada: "Enviada", ganada: "Ganada" };
// const STATUS_NEXT = { borrador: "revision", revision: "aprobada", aprobada: "enviada", enviada: "ganada" };
// const STATUS_BTN = { borrador: "Enviar a revisión", revision: "Aprobar cotización", aprobada: "Marcar enviada", enviada: "Marcar ganada" };
// const STATUS_BADGE_CLASS = { borrador: "status-borrador", revision: "status-revision", aprobada: "status-aprobada", enviada: "status-enviada", ganada: "status-aprobada" };
// const PUEDE_AVANZAR = { borrador: ["vendedor", "supervisor", "gerente"], revision: ["supervisor", "gerente"], aprobada: ["vendedor", "supervisor", "gerente"], enviada: ["vendedor", "supervisor", "gerente"] };
// const TITULO_AC = { simple: "Accesorios de instalación", alarma: "Adicionales", caci: "Materiales para la instalación", cerco: "Materiales para la instalación" };

// const fmt = (n) => "S/ " + (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// const blankExtra = () => ({ required: false, value: 0, approval: null });
// const blankCustomItem = () => ({ pid: null, name: "", qty: 1, costo: 0, precio: 0 });
// // Servicios adicionales y descuentos: listas de { descripcion, monto } que el usuario agrega y describe.
// // Solo cuentan las líneas con monto > 0 (las cotizaciones antiguas no traen estas listas).
// const blankLinea = () => ({ descripcion: "", monto: 0 });
// const sumaLineas = (arr) => (arr || []).reduce((a, l) => a + (l.monto > 0 ? l.monto : 0), 0);
// // Garantía en Términos y condiciones: el usuario decide si va y con qué texto exacto.
// const garantiaDefault = () => ({ activa: true, texto: "Garantía por servicio y equipos: 01 año" });
// // Descripciones largas no deben desbordar el resumen financiero.
// const ETIQUETA_LINEA = { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 };
// // Lo que carga un kit queda marcado (deKit): el PDF lo agrupa como KIT.
// // Todo equipo que se agregue después va como adicional. No hay nada que elegir.
// const marcarKit = (patch) =>
//   patch.items?.equipos
//     ? { ...patch, items: { ...patch.items, equipos: patch.items.equipos.map((it) => ({ ...it, deKit: true })) } }
//     : patch;
  
// // Escritorio = 768px o más. Por debajo, las columnas de costo arrancan ocultas.
// const esEscritorio = () =>
//   typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;

// // ---------------------------------------------------------------------------
// // MARGEN (misma lógica que el Excel)
// // Excel:  CU.NETO venta = CU.TOTAL compra / (1 - %)   →   luego + IGV (x 1.18)
// // El % es un DATO guardado en el ítem (item.margen) y el precio sale de él.
// // Solo se recalcula el % cuando el precio de venta se escribe a mano.
// // ---------------------------------------------------------------------------
// const IGV_F = 1.18;
// const redondear = (n) => Math.round(n * 100) / 100;
// // % (estilo Excel) → precio de venta con IGV
// const precioDesdeMargen = (costo, m) => redondear((costo / (1 - m / 100)) * IGV_F);
// // precio de venta con IGV → % (estilo Excel) que lo produce
// const margenDesdePrecio = (costo, precio) =>
//   costo > 0 && precio > 0 ? (1 - (costo * IGV_F) / precio) * 100 : 0;
// // % vigente del ítem: el guardado, o el que sale del precio de catálogo si aún no se tocó
// const margenDe = (item) => item.margen ?? margenDesdePrecio(item.costo, item.precio);

// // El número (0476-2026) lo asigna el servidor la primera vez que se guarda.
// function blankQuote() {
//   return {
//     id: `cot_${Date.now()}`,
//     cliente: "",
//     proyecto: "",
//     atencion: "",
//     direccion: "",
//     ruc: "",
//     numero: "",
//     nombreArchivo: "",   // lo escribe el usuario al exportar
//     status: "borrador",
//     kitOrigen: null,
//     mostrarIgv: false,   // solo en equipo simple: SUBTOTAL e IGV "si aplica"
//     laborValue: 0,
//     laborApproval: null,
//     transporte: blankExtra(),
//     certificado: blankExtra(),
//     serviciosAdicionales: [],
//     descuentos: [],
//     nota: "",              // texto libre; sale en el PDF antes de Términos y condiciones
//     garantia: garantiaDefault(),
//     ajusteGlobal: 0,      // heredado: ya no se edita; se respeta en cotizaciones antiguas
//     fecha: new Date().toISOString(),
//     items: { equipos: [], accesorios: [] },
//   };
// }

// // Cotizaciones guardadas antes de tener el campo `garantia` no lo traen: se les asigna,
// // la primera vez que se abren, el valor que tenían de forma implícita en el PDF (garantía
// // fija solo en CACI y cerco eléctrico). De ahí en adelante queda guardado y es editable.
// const aseguraGarantia = (q) => {
//   if (q.garantia) return q;
//   const p = plantillaDe(q);
//   return { ...q, garantia: { activa: p === "caci" || p === "cerco", texto: "Garantía por servicio y equipos: 01 año" } };
// };

// const fechaCorta = (iso) => {
//   const d = new Date(iso);
//   return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
// };

// // ---------------------------------------------------------------------------
// // CAMPO DE TEXTO que se corrige solo al salir del campo (mayúsculas/minúsculas,
// // espacios dobles, etc.). Se usa en todos los textos libres.
// // ---------------------------------------------------------------------------
// function CampoTexto({ value, onChange, ...props }) {
//   return (
//     <input
//       type="text"
//       {...props}
//       value={value ?? ""}
//       onChange={(e) => onChange(e.target.value)}
//       onBlur={(e) => {
//         const limpio = normalizarTexto(e.target.value);
//         if (limpio !== e.target.value) onChange(limpio);
//       }}
//     />
//   );
// }

// // ---------------------------------------------------------------------------
// // COMPONENTE PRINCIPAL
// // ---------------------------------------------------------------------------
// export default function CotizacionesApp() {
//   const [view, setView] = useState("list");
//   const [role, setRole] = useState("supervisor");
//   const [quotes, setQuotes] = useState([]);
//   const [cargando, setCargando] = useState(true);
//   const [errorLista, setErrorLista] = useState("");
//   const [guardando, setGuardando] = useState(false);
//   const [quote, setQuote] = useState(blankQuote());
//   const [catalog, setCatalog] = useState(CATALOGO);
//   const [kitOpen, setKitOpen] = useState(false);
//   const { kits, guardarKit } = useKits();
//   const [buscando, setBuscando] = useState(false);
//   const [errorDoc, setErrorDoc] = useState("");
//   const [busqueda, setBusqueda] = useState("");
//   const [preview, setPreview] = useState(null);     // cotización que se está viendo
//   const [exportando, setExportando] = useState(null); // cotización que se va a exportar

//   // Cargar la lista desde el servidor
//   const cargar = () => {
//     setCargando(true);
//     setErrorLista("");
//     getCotizaciones()
//       .then(setQuotes)
//       .catch((e) => setErrorLista(e.message))
//       .finally(() => setCargando(false));
//   };
//   useEffect(cargar, []);

//   useEffect(() => {
//     const t = setTimeout(() => {
//       setCatalog((cur) => {
//         let changed = false;
//         const next = { equipos: [...cur.equipos], accesorios: [...cur.accesorios] };
//         ["equipos", "accesorios"].forEach((cat) => {
//           quote.items[cat].forEach((item) => {
//             if (item.pid || !item.name?.trim()) return;
//             const nombre = normalizarTexto(item.name);
//             // Compara sin mayúsculas ni tildes: "Cámara" y "camara" son el mismo producto
//             const i = next[cat].findIndex((p) => clave(p.name) === clave(nombre));
//             if (i === -1) {
//               next[cat].push({ id: `${cat[0]}_auto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: nombre, costo: item.costo, precio: item.precio, marca: "Nuevos" });
//               changed = true;
//             } else if (next[cat][i].id.includes("_auto_") && (next[cat][i].costo !== item.costo || next[cat][i].precio !== item.precio)) {
//               next[cat][i] = { ...next[cat][i], costo: item.costo, precio: item.precio };
//               changed = true;
//             }
//           });
//         });
//         return changed ? next : cur;
//       });
//     }, 800);
//     return () => clearTimeout(t);
//   }, [quote]);

//   const buscarDocumento = async () => {
//     setErrorDoc("");
//     setBuscando(true);
//     try {
//       const datos = await consultarDocumento(quote.ruc);
//       // Los datos de SUNAT/RENIEC vienen en MAYÚSCULAS: se normalizan al traerlos
//       setQuote((q) => normalizarCotizacion({ ...q, ...datos }));
//     } catch (e) {
//       setErrorDoc(e.message);
//     } finally {
//       setBuscando(false);
//     }
//   };

//   const newQuote = () => {
//     setQuote(blankQuote());
//     setView("editor");
//     setKitOpen(true);
//   };
//   const openQuote = (id) => {
//     const q = quotes.find((x) => x.id === id);
//     if (q) { setQuote(aseguraGarantia(q)); setView("editor"); setPreview(null); }
//   };

//   // Guarda en el servidor y devuelve la cotización con su número asignado.
//   // Antes de guardar se normalizan todos los textos (red de seguridad).
//   const guardar = async (q = quote) => {
//     setGuardando(true);
//     try {
//       const saved = await putCotizacion(normalizarCotizacion(q));
//       setQuotes((prev) =>
//         prev.some((x) => x.id === saved.id) ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev]
//       );
//       return saved;
//     } finally {
//       setGuardando(false);
//     }
//   };

//   const guardarYVolver = async () => {
//     // Una cotización nueva y vacía no se guarda (no gasta número)
//     const yaGuardada = quotes.some((x) => x.id === quote.id);
//     if (!yaGuardada && summary.nItems === 0 && !quote.cliente && !quote.proyecto) return setView("list");
//     try {
//       await guardar();
//       setView("list");
//     } catch (e) {
//       alert("No se pudo guardar: " + e.message);
//     }
//   };

//   const updateField = (f, v) => setQuote((q) => ({ ...q, [f]: v }));

//   // Replicar una cotización ya hecha: copia todo, con nuevo correlativo y en borrador.
//   const duplicar = async (id) => {
//     const orig = quotes.find((x) => x.id === id);
//     if (!orig) return;
//     try {
//       const copia = await guardar(duplicarCotizacion(orig));
//       setQuote(aseguraGarantia(copia));
//       setPreview(null);
//       setView("editor");
//     } catch (e) {
//       alert("No se pudo duplicar: " + e.message);
//     }
//   };

//   // Exportar: guarda primero (así tiene número) y descarga, o guarda directo en la carpeta
//   // compartida configurada (ver ModalesCotizacion/ExportModal), "<correlativo> - <nombre>.pdf".
//   const confirmarExport = async (nombre, usarCarpeta) => {
//     try {
//       const saved = await guardar({ ...exportando, nombreArchivo: nombre });
//       if (quote.id === saved.id) setQuote(saved);
//       const resumen = resumenDe(saved);
//       if (usarCarpeta) {
//         const r = await exportarPDFConCarpeta(saved, resumen, catalog);
//         if (!r.guardadoEnCarpeta && r.error) {
//           alert("No se pudo guardar en la carpeta compartida (se descargó por el navegador en su lugar):\n" + r.error);
//         }
//       } else {
//         await exportarPDF(saved, resumen, catalog);
//       }
//       setExportando(null);
//     } catch (e) {
//       alert("No se pudo guardar la cotización: " + e.message);
//     }
//   };

//   // Agrega un producto del catálogo. Si se indica pid, agrega ese; si no, el primero.
//   const addItem = (cat, pid) => {
//     const p = pid ? catalog[cat]?.find((x) => x.id === pid) : catalog[cat]?.[0];
//     if (!p) return addCustomItem(cat);
//     setQuote((q) => ({ ...q, items: { ...q.items, [cat]: [...(q.items[cat] || []), { pid: p.id, qty: 1, costo: p.costo, precio: p.precio }] } }));
//   };
//   const addCustomItem = (cat) =>
//     setQuote((q) => ({ ...q, items: { ...q.items, [cat]: [...(q.items[cat] || []), blankCustomItem()] } }));
//   const removeItem = (cat, i) =>
//     setQuote((q) => ({ ...q, items: { ...q.items, [cat]: (q.items[cat] || []).filter((_, idx) => idx !== i) } }));

//   // Cambia de posición un ítem dentro de su lista (equipos o accesorios).
//   const moveItem = (cat, from, to) =>
//     setQuote((q) => {
//       const list = [...(q.items[cat] || [])];
//       if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return q;
//       const [it] = list.splice(from, 1);
//       list.splice(to, 0, it);
//       return { ...q, items: { ...q.items, [cat]: list } };
//     });

//   const updateItem = (cat, i, field, val) => {
//     setQuote((q) => {
//       const list = [...q.items[cat]];
//       const item = { ...list[i] };
//       const numVal = parseFloat(val) || 0;
//       const m0 = margenDe(item); // % vigente ANTES de editar

//       // El costo cambia → el % se queda y el precio se recalcula (como en el Excel).
//       const fijarCosto = (nuevo) => {
//         const precioManda = !(item.costo > 0) && item.precio > 0; // precio escrito antes que el costo
//         item.costo = nuevo;
//         if (precioManda) item.margen = margenDesdePrecio(nuevo, item.precio);
//         else { item.margen = m0; item.precio = precioDesdeMargen(nuevo, m0); }
//       };
//       // El precio se escribe a mano → se recalcula el %.
//       const fijarPrecio = (nuevo) => {
//         item.precio = nuevo;
//         item.margen = item.costo > 0 && nuevo > 0 ? margenDesdePrecio(item.costo, nuevo) : m0;
//       };

//       if (field === "qty") item.qty = Math.max(1, parseInt(val) || 1);
//       else if (field === "costo") fijarCosto(numVal);
//       else if (field === "costo_neto") fijarCosto(numVal * IGV_F);
//       else if (field === "sin_igv") {
//         if (item.sinIgv) { item.sinIgv = false; fijarCosto(item.costo * IGV_F); }
//         else { item.sinIgv = true; fijarCosto(item.costo / IGV_F); }
//       }
//       else if (field === "precio") fijarPrecio(numVal);
//       else if (field === "precio_neto") fijarPrecio(numVal * IGV_F);
//       else if (field === "total_venta") fijarPrecio(item.qty > 0 ? numVal / item.qty : 0);
//       else if (field === "margen") {
//         item.margen = Math.min(numVal, 99.99); // permite negativos (hay productos con costo = precio)
//         item.precio = precioDesdeMargen(item.costo, item.margen);
//       }
//       else if (field === "name") item.name = val;
//       else if (field === "pid") {
//         delete item.margen; // se vuelve a calcular desde el precio de catálogo
//         if (val === CUSTOM_OPTION) Object.assign(item, { pid: null, name: "", costo: 0, precio: 0 });
//         else {
//           const p = catalog[cat].find((x) => x.id === val);
//           if (p) { item.pid = val; delete item.name; item.costo = p.costo; item.precio = p.precio; }
//         }
//       }
//       list[i] = item;
//       return { ...q, items: { ...q.items, [cat]: list } };
//     });
//   };

//   const confirmLabor = () => updateField("laborApproval", "approved");
//   const toggleExtraRequired = (f) =>
//     setQuote((q) => ({ ...q, [f]: q[f].required ? blankExtra() : { ...q[f], required: true } }));
//   const updateExtraValue = (f, v) =>
//     setQuote((q) => ({ ...q, [f]: { ...q[f], value: parseFloat(v) || 0 } }));
//   const confirmExtra = (f) =>
//     setQuote((q) => ({ ...q, [f]: { ...q[f], approval: "approved" } }));

//   // Servicios adicionales / descuentos (f = "serviciosAdicionales" | "descuentos")
//   const addLinea = (f) =>
//     setQuote((q) => ({ ...q, [f]: [...(q[f] || []), blankLinea()] }));
//   const updateLinea = (f, i, campo, v) =>
//     setQuote((q) => ({
//       ...q,
//       [f]: (q[f] || []).map((l, idx) =>
//         idx === i ? { ...l, [campo]: campo === "monto" ? Math.max(0, parseFloat(v) || 0) : v } : l
//       ),
//     }));
//   const removeLinea = (f, i) =>
//     setQuote((q) => ({ ...q, [f]: (q[f] || []).filter((_, idx) => idx !== i) }));

//   const advanceStatus = async () => {
//     const permitidos = PUEDE_AVANZAR[quote.status] || [];
//     if (!permitidos.includes(role)) { alert("Tu perfil no puede realizar este paso."); return; }
//     const next = STATUS_NEXT[quote.status];
//     if (!next) return;
//     try {
//       setQuote(await guardar({ ...quote, status: next }));
//     } catch (e) {
//       alert("No se pudo guardar el cambio de estado: " + e.message);
//     }
//   };

//   const summary = useMemo(() => {
//     const suma = (arr) => arr.reduce((a, it) => ({ costo: a.costo + it.costo * it.qty, venta: a.venta + it.precio * it.qty }), { costo: 0, venta: 0 });
//     const eq = suma(quote.items.equipos);
//     const ac = suma(quote.items.accesorios);
//     const labor = quote.laborApproval === "approved" ? quote.laborValue : 0;
//     const extra = (e) => (e?.required && e?.approval === "approved" ? e.value : 0);
//     const transporte = extra(quote.transporte);
//     const certificado = extra(quote.certificado);
//     const servicios = sumaLineas(quote.serviciosAdicionales);
//     const descuentos = sumaLineas(quote.descuentos);
//     const costoTotal = eq.costo + ac.costo + labor + transporte + certificado;
//     const ventaTotal = eq.venta + ac.venta + labor + transporte + certificado + servicios - descuentos + (quote.ajusteGlobal || 0);
//     const margen = ventaTotal - costoTotal;
//     return {
//       costoEq: eq.costo, ventaEq: eq.venta, costoAc: ac.costo, ventaAc: ac.venta,
//       labor, transporte, certificado, servicios, descuentos, costoTotal, ventaTotal, margen,
//       margenPct: ventaTotal > 0 ? (margen / ventaTotal) * 100 : 0,
//       nItems: quote.items.equipos.length + quote.items.accesorios.length,
//     };
//   }, [quote]);

//   // Lista filtrada: busca en número, cliente, proyecto, RUC, dirección, kit y en cada producto.
//   const toks = useMemo(() => tokens(busqueda), [busqueda]);
//   const filtradas = useMemo(
//     () => quotes.filter((q) => coincide(q, toks, catalog)),
//     [quotes, toks, catalog]
//   );

//   const p = plantillaDe(quote);
//   const esKit = p !== "simple";
//   const conKit = p === "caci" || p === "cerco";
//   const vacia = summary.nItems === 0;
//   const puedeAvanzar = (PUEDE_AVANZAR[quote.status] || []).includes(role);

//   return (
//     <div className="app-root">
//       <div className="app">
//         {/* TOPBAR */}
//         <header className="topbar">
//           <div className="topbar-left">
//             {view === "editor" && (
//               <button className="back-btn" onClick={guardarYVolver} disabled={guardando} aria-label="Volver a lista">
//                 <ArrowLeft size={16} />
//                 <span className="back-label">{guardando ? "Guardando…" : "Volver a lista"}</span>
//               </button>
//             )}
//             <span className="page-title">
//               {view === "list" ? "Cotizaciones" : quote.proyecto || "Nueva cotización"}
//             </span>
//           </div>

//           <div className="topbar-right">
//             <div className="topbar-actions">
//               {view === "list" ? (
//                 <button className="btn btn-primary" onClick={newQuote}>
//                   <Plus size={16} /> Nueva cotización
//                 </button>
//               ) : (
//                 <>
//                   {STATUS_BTN[quote.status] && (
//                     <button
//                       className={`btn btn-status ${puedeAvanzar ? "btn-primary" : ""}`}
//                       onClick={advanceStatus}
//                       disabled={!puedeAvanzar || guardando}
//                     >
//                       {STATUS_BTN[quote.status]}
//                     </button>
//                   )}
//                   <button className="btn" onClick={() => setExportando(quote)} disabled={guardando}>
//                     <FileDown size={16} /> Exportar
//                   </button>
//                 </>
//               )}
//             </div>
//           </div>
//         </header>

//         <div className="main">
//           {/* LISTA */}
//           {view === "list" && (
//             <div id="viewList">
//               <div className="list-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
//                 <span className="list-title">Todas las cotizaciones</span>
//                 <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 460 }}>
//                   <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
//                   <input
//                     type="text"
//                     value={busqueda}
//                     onChange={(e) => setBusqueda(e.target.value)}
//                     placeholder="Buscar por número, cliente, equipo, RUC…"
//                     style={{ width: "100%", paddingLeft: 32, paddingRight: busqueda ? 30 : 10 }}
//                   />
//                   {busqueda && (
//                     <button
//                       onClick={() => setBusqueda("")}
//                       aria-label="Limpiar búsqueda"
//                       style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: 0, cursor: "pointer", color: "#64748b" }}
//                     >
//                       <X size={14} />
//                     </button>
//                   )}
//                 </div>
//               </div>

//               {cargando ? (
//                 <div className="list-empty">
//                   <div className="empty-text">Cargando cotizaciones…</div>
//                 </div>
//               ) : errorLista ? (
//                 <div className="list-empty">
//                   <div className="empty-title">No se pudieron cargar</div>
//                   <div className="empty-text">{errorLista}</div>
//                   <button className="btn" onClick={cargar}>Reintentar</button>
//                 </div>
//               ) : quotes.length === 0 ? (
//                 <div className="list-empty">
//                   <div className="empty-title">Aún no hay cotizaciones</div>
//                   <div className="empty-text">
//                     Crea una nueva y parte de un kit (CACI, alarmas, cerco) para no armarla desde cero.
//                   </div>
//                   <button className="btn btn-primary" onClick={newQuote}><Plus size={16} /> Nueva cotización</button>
//                 </div>
//               ) : filtradas.length === 0 ? (
//                 <div className="list-empty">
//                   <div className="empty-title">Sin resultados</div>
//                   <div className="empty-text">No hay cotizaciones que contengan “{busqueda}”.</div>
//                 </div>
//               ) : (
//                 <table className="list-table">
//                   <thead>
//                     <tr>
//                       <th>Cliente / Proyecto</th>
//                       <th>Estado</th>
//                       <th>Venta total</th>
//                       <th>Margen</th>
//                       <th>Fecha</th>
//                       <th></th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {filtradas.map((row) => {
//                       const s = resumenDe(row);
//                       const hits = productosQueCoinciden(row, toks, catalog);
//                       return (
//                         <tr key={row.id} onClick={() => openQuote(row.id)}>
//                           <td className="cell-main">
//                             <div className="client-name">
//                               {row.numero && <span style={{ color: "#64748b", fontWeight: 600 }}>{row.numero} · </span>}
//                               {row.cliente || "Sin cliente"}
//                             </div>
//                             <div className="project-name">{row.proyecto || "Sin proyecto"}</div>
//                             {hits.length > 0 && (
//                               <div style={{ fontSize: 11, color: "#4f46e5", marginTop: 2 }}>
//                                 Contiene: {hits.join(" · ")}
//                               </div>
//                             )}
//                           </td>
//                           <td data-label="Estado">
//                             <span className={`status-badge ${STATUS_BADGE_CLASS[row.status]}`}>{STATUS_LABELS[row.status]}</span>
//                           </td>
//                           <td data-label="Venta total" className="cell-strong">{fmt(s.ventaTotal)}</td>
//                           <td data-label="Margen" className={`cell-margin ${s.margenPct < 20 ? "c-danger" : "c-ok"}`}>
//                             {s.margenPct.toFixed(1)}%
//                           </td>
//                           <td data-label="Fecha" className="cell-muted">{fechaCorta(row.fecha)}</td>
//                           <td onClick={(e) => e.stopPropagation()} style={{ whiteSpace: "nowrap", textAlign: "right" }}>
//                             <button className="btn" title="Vista previa del PDF" onClick={() => setPreview(row)}>
//                               <Eye size={14} />
//                             </button>{" "}
//                             <button className="btn" title="Duplicar cotización" onClick={() => duplicar(row.id)} disabled={guardando}>
//                               <Copy size={14} />
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               )}
//             </div>
//           )}

//           {/* EDITOR */}
//           {view === "editor" && (
//             <div id="viewEditor">
//               <div className="editor">
//                 {/* Datos del cliente */}
//                 <div className="card">
//                   <div className="card-title card-title-block">Datos del cliente</div>
//                   <div className="field-row">
//                     <div className="field">
//                       <label>Cliente</label>
//                       <CampoTexto
//                         placeholder="Nombre o razón social"
//                         value={quote.cliente}
//                         onChange={(v) => updateField("cliente", v)}
//                       />
//                     </div>
//                     <div className="field">
//                       <label>Proyecto</label>
//                       <CampoTexto
//                         placeholder="Ej. Detección 5 zonas – Local Surco"
//                         value={quote.proyecto}
//                         onChange={(v) => updateField("proyecto", v)}
//                       />
//                     </div>
//                   </div>
//                   <div className="field-row">
//                     <div className="field">
//                       <label>N° de cotización</label>
//                       <input
//                         type="text"
//                         readOnly
//                         placeholder="Se asigna al guardar"
//                         value={quote.numero}
//                       />
//                     </div>

//                     <div className="field">
//                       <label>DNI / RUC</label>
//                       <div style={{ display: "flex", gap: 6 }}>
//                         <input
//                           type="text"
//                           inputMode="numeric"
//                           maxLength={11}
//                           placeholder="8 dígitos (DNI) u 11 (RUC)"
//                           value={quote.ruc || ""}
//                           onChange={(e) => updateField("ruc", e.target.value.replace(/\D/g, ""))}
//                           onKeyDown={(e) => e.key === "Enter" && buscarDocumento()}
//                         />
//                         <button className="btn" onClick={buscarDocumento} disabled={buscando} title="Buscar y autocompletar">
//                           <Search size={16} /> {buscando ? "..." : "Buscar"}
//                         </button>
//                       </div>
//                       {errorDoc && <small style={{ color: "#b91c1c" }}>{errorDoc}</small>}
//                     </div>

//                     <div className="field">
//                       <label>Atención</label>
//                       <CampoTexto
//                         placeholder="Nombre de contacto (si difiere del cliente)"
//                         value={quote.atencion}
//                         onChange={(v) => updateField("atencion", v)}
//                       />
//                     </div>
//                     <div className="field">
//                       <label>Dirección</label>
//                       <CampoTexto
//                         placeholder="Distrito / referencia"
//                         value={quote.direccion}
//                         onChange={(v) => updateField("direccion", v)}
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 {vacia && (
//                   <div className="card kit-banner">
//                     <div>
//                       <div className="kit-banner-title"><Zap size={16} /> Empieza desde un kit</div>
//                       <div className="kit-banner-text">
//                         CACI 5 y 8 zonas, alarmas SHOCTIX y HAGROY, cerco eléctrico. Se cargan equipos, accesorios y mano de obra base; después solo reemplazas modelos o agregas lo que falte.
//                       </div>
//                     </div>
//                     <button className="btn btn-primary" onClick={() => setKitOpen(true)}>Elegir kit</button>
//                   </div>
//                 )}

//                 <ItemsCard
//                   title="Equipos principales"
//                   cat="equipos"
//                   items={quote.items.equipos}
//                   catalogItems={catalog.equipos}
//                   costo={summary.costoEq}
//                   total={summary.ventaEq}
//                   addItem={addItem}
//                   addCustomItem={addCustomItem}
//                   removeItem={removeItem}
//                   moveItem={moveItem}
//                   updateItem={updateItem}
//                   onKit={() => setKitOpen(true)}
//                 />

//                 <ItemsCard
//                   title={TITULO_AC[p]}
//                   cat="accesorios"
//                   items={quote.items.accesorios}
//                   catalogItems={catalog.accesorios}
//                   costo={summary.costoAc}
//                   total={summary.ventaAc}
//                   addItem={addItem}
//                   addCustomItem={addCustomItem}
//                   removeItem={removeItem}
//                   moveItem={moveItem}
//                   updateItem={updateItem}
//                   onKit={() => setKitOpen(true)}
//                 />

//                 {/* Mano de obra + extras */}
//                 <div className="card">
//                   <div className="card-header labor-header">
//                     <span className="card-title">{esKit ? "Instalación" : "Mano de obra"}</span>
//                     <span className="card-amount">
//                       {quote.laborApproval === "approved" ? fmt(quote.laborValue) : "S/ 0.00"}
//                     </span>
//                   </div>
//                   <div className="labor-row">
//                     <div className="labor-input-wrap">
//                       <span>S/</span>
//                       <input
//                         type="number"
//                         className="labor-input"
//                         value={quote.laborApproval === "approved" ? quote.laborValue : quote.laborValue || ""}
//                         readOnly={quote.laborApproval === "approved" && role === "vendedor"}
//                         onChange={(e) => updateField("laborValue", parseFloat(e.target.value) || 0)}
//                       />
//                     </div>
//                     {quote.laborApproval === "approved" ? (
//                       <span className="approved-tag"><Check size={12} /> Aprobado</span>
//                     ) : (
//                       <button className="btn btn-primary" onClick={confirmLabor}>Confirmar</button>
//                     )}
//                   </div>

//                   <div className="separator spaced"></div>
//                   <ExtraCostRow
//                     label="Transporte"
//                     field="transporte"
//                     data={quote.transporte}
//                     onToggle={toggleExtraRequired}
//                     onChangeValue={updateExtraValue}
//                     onConfirm={confirmExtra}
//                     role={role}
//                   />
//                   <div className="separator spaced"></div>
//                   <ExtraCostRow
//                     label="CERTIFICADO"
//                     field="certificado"
//                     data={quote.certificado}
//                     onToggle={toggleExtraRequired}
//                     onChangeValue={updateExtraValue}
//                     onConfirm={confirmExtra}
//                     role={role}
//                   />
//                   <div className="separator spaced"></div>
//                   <LineasLibres
//                     label="SERVICIOS ADICIONALES"
//                     textoAgregar="Agregar servicio adicional"
//                     placeholder="Describe el servicio (Ej. Configuración de CCTV remoto)"
//                     field="serviciosAdicionales"
//                     lineas={quote.serviciosAdicionales || []}
//                     onAdd={addLinea}
//                     onUpdate={updateLinea}
//                     onRemove={removeLinea}
//                   />
//                   <div className="separator spaced"></div>
//                   <LineasLibres
//                     label="DESCUENTOS"
//                     textoAgregar="Agregar descuento"
//                     placeholder="Describe el descuento (Ej. Descuento por pronto pago)"
//                     field="descuentos"
//                     lineas={quote.descuentos || []}
//                     onAdd={addLinea}
//                     onUpdate={updateLinea}
//                     onRemove={removeLinea}
//                     restar
//                   />
//                   {/* {p === "simple" && (
//                     <>
//                       <div className="separator spaced"></div>
//                       <label className="extra-cost-toggle">
//                         <input
//                           type="checkbox"
//                           checked={!!quote.mostrarIgv}
//                           onChange={(e) => updateField("mostrarIgv", e.target.checked)}
//                         />
//                         Mostrar subtotal e IGV en el PDF
//                       </label>
//                     </>
//                   )} */}
//                 </div>

//                 {/* Nota y garantía: la nota sale en el PDF justo antes de Términos y condiciones */}
//                 <div className="card">
//                   <div className="card-title card-title-block">Nota y garantía</div>

//                   <div className="field">
//                     <label>Nota (aparece en el PDF, antes de Términos y condiciones)</label>
//                     <textarea
//                       rows={3}
//                       placeholder="Ej. Materiales según demanda, tiempos de entrega sujetos a stock…"
//                       value={quote.nota || ""}
//                       onChange={(e) => updateField("nota", e.target.value)}
//                       onBlur={(e) => {
//                         const limpio = normalizarTexto(e.target.value);
//                         if (limpio !== e.target.value) updateField("nota", limpio);
//                       }}
//                       style={{
//                         width: "100%",
//                         resize: "vertical",
//                         fontFamily: "inherit",
//                         fontSize: 14,
//                         padding: "8px 10px",
//                         borderRadius: 6,
//                         border: "1px solid #cbd5e1",
//                         boxSizing: "border-box",
//                       }}
//                     />
//                   </div>

//                   <div className="separator spaced"></div>

//                   <label className="extra-cost-toggle">
//                     <input
//                       type="checkbox"
//                       checked={!!quote.garantia?.activa}
//                       onChange={(e) =>
//                         setQuote((q) => ({
//                           ...q,
//                           garantia: { ...(q.garantia || garantiaDefault()), activa: e.target.checked },
//                         }))
//                       }
//                     />
//                     Incluir garantía en términos y condiciones
//                   </label>
//                   {quote.garantia?.activa && (
//                     <CampoTexto
//                       placeholder="Ej. Garantía por servicio y equipos: 01 año"
//                       value={quote.garantia?.texto ?? ""}
//                       onChange={(v) =>
//                         setQuote((q) => ({ ...q, garantia: { ...(q.garantia || garantiaDefault()), texto: v } }))
//                       }
//                       style={{ width: "100%", marginTop: 6 }}
//                     />
//                   )}
//                 </div>
//               </div>

//               {/* RESUMEN */}
//               <aside className="summary-panel">
//                 <div className="summary-title">Resumen financiero</div>
//                 <div className="separator"></div>

//                 <div className="block-label">Costos</div>
//                 <div className="summary-line"><span>Equipos</span><span>{fmt(summary.costoEq)}</span></div>
//                 <div className="summary-line"><span>{conKit ? "Materiales" : "Accesorios"}</span><span>{fmt(summary.costoAc)}</span></div>
//                 <div className="summary-line"><span>{esKit ? "Instalación" : "Mano de obra"}</span><span>{fmt(summary.labor)}</span></div>
//                 {quote.transporte?.required && (
//                   <div className="summary-line"><span>Transporte</span><span>{fmt(summary.transporte)}</span></div>
//                 )}
//                 {quote.certificado?.required && (
//                   <div className="summary-line"><span>Certificado</span><span>{fmt(summary.certificado)}</span></div>
//                 )}
//                 <div className="summary-line total"><span>Costo total</span><span>{fmt(summary.costoTotal)}</span></div>

//                 <div className="separator spaced-sm"></div>

//                 <div className="block-label">Venta</div>
//                 <div className="summary-line"><span>Equipos</span><span>{fmt(summary.ventaEq)}</span></div>
//                 <div className="summary-line"><span>{conKit ? "Materiales" : "Accesorios"}</span><span>{fmt(summary.ventaAc)}</span></div>
//                 <div className="summary-line"><span>{esKit ? "Instalación" : "Mano de obra"}</span><span>{fmt(summary.labor)}</span></div>
//                 {quote.transporte?.required && (
//                   <div className="summary-line"><span>Transporte</span><span>{fmt(summary.transporte)}</span></div>
//                 )}
//                 {quote.certificado?.required && (
//                   <div className="summary-line"><span>Certificado</span><span>{fmt(summary.certificado)}</span></div>
//                 )}

//                 {(quote.serviciosAdicionales || []).map((l, i) => l.monto > 0 && (
//                   <div className="summary-line" key={`sa-${i}`}>
//                     <span style={ETIQUETA_LINEA}>{l.descripcion || "Servicio adicional"}</span>
//                     <span>{fmt(l.monto)}</span>
//                   </div>
//                 ))}
//                 {(quote.descuentos || []).map((l, i) => l.monto > 0 && (
//                   <div className="summary-line" key={`ds-${i}`}>
//                     <span style={ETIQUETA_LINEA}>{l.descripcion || "Descuento"}</span>
//                     <span>-{fmt(l.monto)}</span>
//                   </div>
//                 ))}

//                 {/* Ajuste heredado: solo aparece en cotizaciones antiguas que ya lo tenían */}
//                 {!!quote.ajusteGlobal && (
//                   <div className="summary-line with-input">
//                     <span>Ajuste / Descuento</span>
//                     <input
//                       type="number"
//                       step="0.01"
//                       className="adjust-input"
//                       value={quote.ajusteGlobal || ""}
//                       placeholder="S/ 0.00"
//                       onChange={(e) => updateField("ajusteGlobal", parseFloat(e.target.value) || 0)}
//                     />
//                   </div>
//                 )}

//                 <div className="summary-line total primary">
//                   <span>Venta total</span><span>{fmt(summary.ventaTotal)}</span>
//                 </div>

//                 <div className="separator"></div>
//               </aside>
//             </div>
//           )}
//         </div>

//         <KitPicker
//           open={kitOpen}
//           onClose={() => setKitOpen(false)}
//           kits={kits}
//           catalogo={catalog}
//           quote={quote}
//           onSaveKit={guardarKit}
//           onApply={(patch) => setQuote((q) => ({ ...q, ...marcarKit(patch), kitOrigen: patch.kitOrigen ?? q.kitOrigen }))}
//         />

//         {preview && (
//           <PreviewModal
//             quote={preview}
//             summary={resumenDe(preview)}
//             catalog={catalog}
//             onClose={() => setPreview(null)}
//             onEdit={openQuote}
//             onDuplicate={duplicar}
//             onExport={(q) => setExportando(q)}
//           />
//         )}

//         {exportando && (
//           <ExportModal
//             quote={exportando}
//             onClose={() => setExportando(null)}
//             onConfirm={confirmarExport}
//           />
//         )}
//       </div>
//     </div>
//   );
// }

// function resumenDe(q) {
//   const suma = (arr) => arr.reduce((a, it) => ({ c: a.c + it.costo * it.qty, v: a.v + it.precio * it.qty }), { c: 0, v: 0 });
//   const eq = suma(q.items.equipos), ac = suma(q.items.accesorios);
//   const labor = q.laborApproval === "approved" ? q.laborValue : 0;
//   const ex = (e) => (e?.required && e?.approval === "approved" ? e.value : 0);
//   const extras = labor + ex(q.transporte) + ex(q.certificado);
//   const costoTotal = eq.c + ac.c + extras;
//   const ventaTotal = eq.v + ac.v + extras + sumaLineas(q.serviciosAdicionales) - sumaLineas(q.descuentos) + (q.ajusteGlobal || 0);
//   return { costoTotal, ventaTotal, margenPct: ventaTotal > 0 ? ((ventaTotal - costoTotal) / ventaTotal) * 100 : 0 };
// }

// function ExtraCostRow({ label, field, data, onToggle, onChangeValue, onConfirm, role }) {
//   const canEdit = role === "gerente" || role === "supervisor";
//   return (
//     <div className="extra-cost-block">
//       <div className="extra-cost-header">
//         <span className="extra-cost-name">{label}</span>
//         {data.required
//           ? <span className="card-amount">{data.approval === "approved" ? fmt(data.value) : "S/ 0.00"}</span>
//           : <span className="not-required-tag">No requerido</span>}
//       </div>
//       <label className="extra-cost-toggle">
//         <input type="checkbox" checked={data.required} onChange={() => onToggle(field)} />
//         ¿Se requiere {label.toLowerCase()}?
//       </label>
//       {data.required && (
//         <div className="labor-row">
//           <div className="labor-input-wrap">
//             <span>S/</span>
//             <input
//               type="number"
//               className="labor-input"
//               value={data.approval === "approved" ? data.value : data.value || ""}
//               readOnly={data.approval === "approved" && !canEdit}
//               onChange={(e) => onChangeValue(field, e.target.value)}
//             />
//           </div>
//           {data.approval === "approved"
//             ? <span className="approved-tag"><Check size={12} /> Aprobado</span>
//             : <button className="btn btn-primary" onClick={() => onConfirm(field)}>Confirmar</button>}
//         </div>
//       )}
//     </div>
//   );
// }

// // Bloque opcional (servicios adicionales / descuentos): el usuario agrega líneas y escribe
// // qué es cada una y su monto. Se ve igual que Transporte o Certificado.
// function LineasLibres({ label, textoAgregar, placeholder, field, lineas, onAdd, onUpdate, onRemove, restar = false }) {
//   const total = lineas.reduce((a, l) => a + (l.monto > 0 ? l.monto : 0), 0);
//   return (
//     <div className="extra-cost-block">
//       <div className="extra-cost-header">
//         <span className="extra-cost-name">{label}</span>
//         {lineas.length > 0
//           ? <span className="card-amount">{restar && total > 0 ? "-" : ""}{fmt(total)}</span>
//           : <span className="not-required-tag">No aplica</span>}
//       </div>

//       {lineas.map((l, i) => (
//         <div className="labor-row" key={i} style={{ flexWrap: "wrap" }}>
//           <CampoTexto
//             placeholder={placeholder}
//             value={l.descripcion}
//             onChange={(v) => onUpdate(field, i, "descripcion", v)}
//             style={{ flex: "1 1 220px", minWidth: 0 }}
//           />
//           <div className="labor-input-wrap">
//             <span>{restar ? "- S/" : "S/"}</span>
//             <input
//               type="number"
//               min="0"
//               step="0.01"
//               className="labor-input"
//               value={l.monto || ""}
//               onChange={(e) => onUpdate(field, i, "monto", e.target.value)}
//             />
//           </div>
//           <button className="del-btn" onClick={() => onRemove(field, i)} aria-label={`Quitar de ${label.toLowerCase()}`}>
//             <Trash2 size={16} />
//           </button>
//         </div>
//       ))}

//       <div style={{ marginTop: lineas.length ? 8 : 0 }}>
//         <button className="add-btn secondary" onClick={() => onAdd(field)}>
//           <Plus size={14} /> {textoAgregar}
//         </button>
//       </div>
//     </div>
//   );
// }

// // ---------------------------------------------------------------------------
// // ITEMS CARD
// // ---------------------------------------------------------------------------
// const COLORES = {
//   compra: { group: "#fcd34d", sub: "#fef3c7", cell: "#fffbeb", strong: "#fde68a", text: "#78350f" },
//   venta:  { group: "#93c5fd", sub: "#dbeafe", cell: "#eff6ff", strong: "#bfdbfe", text: "#1e3a8a" },
//   igv:    { group: "#fca5a5", sub: "#fee2e2", cell: "#fef2f2", strong: "#fecaca", text: "#b91c1c" },
//   margen: { group: "#86efac", sub: "#dcfce7", cell: "#f0fdf4", text: "#14532d" },
//   ok:  "#15803d",
//   bad: "#b91c1c",
// };

// const LINEA = "1px solid rgba(15, 23, 42, 0.08)";
// const SEPARADOR = "3px solid #ffffff";

// // Ancho de la columna "ORDEN" (asa + flechas) que aparece al activar el modo ordenar.
// const ANCHO_ORDEN = 84;

// const estiloGrupo = (c) => ({
//   textAlign: "center",
//   padding: "6px 4px",
//   fontSize: 10,
//   fontWeight: 800,
//   letterSpacing: "0.05em",
//   textTransform: "uppercase",
//   background: c.group,
//   color: c.text,
//   borderLeft: SEPARADOR,
// });

// const estiloSub = (c, { strong = false } = {}) => ({
//   textAlign: "right",
//   padding: "5px 6px",
//   fontSize: 10,
//   fontWeight: strong ? 800 : 700,
//   whiteSpace: "nowrap",
//   background: strong ? c.strong : c.sub,
//   color: c.text,
//   borderLeft: LINEA,
//   borderTop: LINEA,
// });

// const estiloCelda = (bg, extra = {}) => ({
//   padding: "4px 6px",
//   borderLeft: LINEA,
//   verticalAlign: "middle",
//   background: bg,
//   ...extra,
// });

// const estiloCeldaInicioGrupo = (bg, extra = {}) =>
//   estiloCelda(bg, { borderLeft: SEPARADOR, ...extra });

// const estiloSoloLectura = (c, extra = {}) =>
//   estiloCelda(c.cell, {
//     textAlign: "right",
//     fontSize: 12,
//     color: c.text,
//     fontWeight: 600,
//     ...extra,
//   });

// function ItemsCard({ title, cat, items, catalogItems, addItem, addCustomItem, removeItem, moveItem, updateItem, costo, total, onKit }) {
//   const [showCols, setShowCols] = useState(esEscritorio);
//   const [agregando, setAgregando] = useState(false); // buscador de "Agregar del catálogo" abierto
//   const [ordenando, setOrdenando] = useState(false); // modo ordenar (toggle)
//   const [drag, setDrag] = useState({ from: null, over: null }); // fila que se arrastra / fila sobre la que está
//   const addRef = useRef(null);

//   // El modo ordenar solo tiene sentido con 2 o más ítems
//   const modoOrden = ordenando && items.length > 1;
//   // Con la columna ORDEN visible, las columnas fijas (CANT y nombre) se corren a la derecha
//   const izq1 = modoOrden ? { left: ANCHO_ORDEN } : undefined;
//   const izq2 = modoOrden ? { left: ANCHO_ORDEN + 60 } : undefined;

//   const grupos = useMemo(() => {
//     const g = catalogItems.reduce((acc, p) => {
//       (acc[p.marca || "General"] ||= []).push(p);
//       return acc;
//     }, {});
//     return Object.fromEntries(
//       Object.entries(g)
//         .sort(([a], [b]) => a.localeCompare(b, "es"))
//         .map(([m, lista]) => [
//           m,
//           [...lista].sort((x, y) => x.name.localeCompare(y.name, "es", { numeric: true })),
//         ])
//     );
//   }, [catalogItems]);

//   const etiqueta = cat === "equipos" ? "equipo" : "accesorio";

//   return (
//     <div className="card">
//       <div className="card-header items-card-header">
//         <div className="items-card-title">
//           <span className="card-title">{title}</span>
//           <button className="btn btn-toggle-cols" onClick={() => setShowCols(!showCols)}>
//             {showCols ? <EyeOff size={14} /> : <Eye size={14} />}
//             {showCols ? "Ocultar columnas" : "Ver columnas"}
//           </button>
//           {items.length > 1 && (
//             <button
//               className={`btn btn-toggle-cols ${modoOrden ? "is-active" : ""}`}
//               onClick={() => { setOrdenando(!ordenando); setDrag({ from: null, over: null }); }}
//             >
//               <ArrowUpDown size={14} />
//               {modoOrden ? "Listo" : "Ordenar"}
//             </button>
//           )}
//         </div>
//         <div className="items-card-total">
//           <span className="card-amount">{fmt(total)}</span>
//           {showCols && <span className="card-sub">costo {fmt(costo)}</span>}
//         </div>
//       </div>

//       {items.length === 0 ? (
//         <div className="items-empty">Sin {etiqueta}s todavía. Carga un kit o agrégalos uno por uno.</div>
//       ) : (
//         <>
//           <div className="scroll-hint">Desliza horizontalmente para ver todas las columnas →</div>
//           <div className="items-scroll">
//             <table className="items-table" style={{ minWidth: (showCols ? 1050 : 500) + (modoOrden ? ANCHO_ORDEN : 0) }}>
//               <thead>
//                 {/* Fila 1: grupos. Los colSpan DEBEN coincidir con las columnas de la fila 2 y del cuerpo:
//                     compra = 4 | venta = 5 (visible) o 3 (oculto) | margen = 2 */}
//                 <tr>
//                   {modoOrden && (
//                     <th rowSpan={2} className="sticky-0" style={{ width: ANCHO_ORDEN, minWidth: ANCHO_ORDEN }}>ORDEN</th>
//                   )}
//                   <th rowSpan={2} className="sticky-1" style={izq1}>CANT</th>
//                   <th rowSpan={2} className="sticky-2" style={{ minWidth: 200, ...izq2 }}>{etiqueta.toUpperCase()}</th>
//                   {showCols && <th colSpan={4} style={estiloGrupo(COLORES.compra)}>Costo de compra</th>}
//                   <th colSpan={showCols ? 5 : 3} style={estiloGrupo(COLORES.venta)}>Costo de venta</th>
//                   {showCols && <th colSpan={2} style={estiloGrupo(COLORES.margen)}>Margen</th>}
//                   <th rowSpan={2} className="col-actions"></th>
//                 </tr>
//                 {/* Fila 2: columnas */}
//                 <tr>
//                   {/* Costo de compra (4) */}
//                   {showCols && <th style={estiloSub(COLORES.compra)}>CU.NETO</th>}
//                   {showCols && <th style={estiloSub(COLORES.igv)}>IGV</th>}
//                   {showCols && <th style={estiloSub(COLORES.compra)}>CU.TOTAL</th>}
//                   {showCols && <th style={estiloSub(COLORES.compra, { strong: true })}>C. TOTAL</th>}

//                   {/* Costo de venta: CU.NETO → % MARGEN → IGV UNIT → CU.TOTAL → C. TOTAL (5) */}
//                   {showCols && <th style={estiloSub(COLORES.venta)}>CU.NETO</th>}
//                   {showCols && <th style={estiloSub(COLORES.venta)}>% MARGEN</th>}

//                   {showCols && <th style={estiloSub(COLORES.igv)}>IGV UNIT</th>}
//                   <th style={estiloSub(COLORES.venta, { strong: true })}>CU.TOTAL</th>

//                   {!showCols && <th style={estiloSub(COLORES.venta)}>% MARGEN</th>}
//                   <th style={estiloSub(COLORES.venta)}>C. TOTAL</th>

//                   {/* Margen (2) */}
//                   {showCols && <th style={estiloSub(COLORES.margen)}>UNIT</th>}
//                   {showCols && <th style={estiloSub(COLORES.margen)}>FINAL</th>}
//                 </tr>
//               </thead>
//               <tbody>
//                 {items.map((item, i) => {
//                   const isCustom = !item.pid;

//                   const cuTotalCompra = item.costo || 0;
//                   const cuNetoCompra = cuTotalCompra / 1.18;
//                   const igvCompra = cuTotalCompra - cuNetoCompra;
//                   const cTotalCompra = cuTotalCompra * item.qty;

//                   const cuTotalVenta = item.precio || 0;
//                   const cuNetoVenta = cuTotalVenta / 1.18;
//                   const igvVenta = cuTotalVenta - cuNetoVenta;
//                   const cTotalVenta = cuTotalVenta * item.qty;

//                   // % MARGEN estilo Excel: es un dato guardado en el ítem (item.margen).
//                   // Si el ítem aún no se tocó, sale del precio de catálogo.
//                   const margenActual = margenDe(item);
//                   const mUnit = cuTotalVenta - cuTotalCompra;
//                   const mTotal = cTotalVenta - cTotalCompra;

//                   // Clases de la fila mientras se arrastra: la arrastrada se atenúa y
//                   // la de destino muestra una línea donde caerá.
//                   const claseFila = [
//                     drag.from === i ? "dragging" : "",
//                     modoOrden && drag.from !== null && drag.over === i && drag.from !== i
//                       ? (drag.from > i ? "drop-before" : "drop-after")
//                       : "",
//                   ].join(" ").trim();

//                   // Celda de % MARGEN (se usa en una u otra posición según showCols)
//                   const celdaMargenPct = (
//                     <td style={estiloCelda(COLORES.venta.cell)}>
//                       <input
//                         type="number"
//                         className="compact-input"
//                         step="0.01"
//                         value={Number(margenActual.toFixed(3))}
//                         onChange={(e) => updateItem(cat, i, "margen", e.target.value)}
//                         title={`CU.NETO venta = ${cuTotalCompra.toFixed(2)} / (1 - ${margenActual.toFixed(3)}%) = ${(cuTotalCompra / (1 - margenActual / 100)).toFixed(2)}`}
//                       />
//                     </td>
//                   );
//                   return (
//                     <tr
//                       key={i}
//                       className={claseFila || undefined}
//                       draggable={modoOrden}
//                       onDragStart={(e) => {
//                         e.dataTransfer.effectAllowed = "move";
//                         e.dataTransfer.setData("text/plain", String(i));
//                         setDrag({ from: i, over: i });
//                       }}
//                       onDragOver={(e) => {
//                         if (drag.from === null) return;
//                         e.preventDefault();
//                         if (drag.over !== i) setDrag((d) => ({ ...d, over: i }));
//                       }}
//                       onDrop={(e) => {
//                         e.preventDefault();
//                         if (drag.from !== null) moveItem(cat, drag.from, i);
//                         setDrag({ from: null, over: null });
//                       }}
//                       onDragEnd={() => setDrag({ from: null, over: null })}
//                     >
//                       {modoOrden && (
//                         <td className="sticky-0" style={{ width: ANCHO_ORDEN, minWidth: ANCHO_ORDEN }}>
//                           <div className="order-cell">
//                             <span className="drag-handle" title="Arrastra para ordenar">
//                               <GripVertical size={16} />
//                             </span>
//                             <button
//                               className="del-btn"
//                               disabled={i === 0}
//                               onClick={() => moveItem(cat, i, i - 1)}
//                               aria-label="Subir"
//                               title="Subir"
//                             >
//                               <ArrowUp size={14} />
//                             </button>
//                             <button
//                               className="del-btn"
//                               disabled={i === items.length - 1}
//                               onClick={() => moveItem(cat, i, i + 1)}
//                               aria-label="Bajar"
//                               title="Bajar"
//                             >
//                               <ArrowDown size={14} />
//                             </button>
//                           </div>
//                         </td>
//                       )}

//                       <td className="sticky-1" style={izq1}>
//                         <input
//                           type="number"
//                           min="1"
//                           className="compact-input qty-input"
//                           value={item.qty}
//                           onChange={(e) => updateItem(cat, i, "qty", e.target.value)}
//                         />
//                       </td>

//                       <td className="sticky-2" style={izq2}>
//                         {isCustom ? (
//                           <div className="custom-name-wrap">
//                             <span className="custom-name-tag">Nuevo</span>
//                             <CampoTexto
//                               className="compact-input full"
//                               placeholder="Nombre del producto"
//                               value={item.name || ""}
//                               onChange={(v) => updateItem(cat, i, "name", v)}
//                             />
//                           </div>
//                         ) : (
//                           <ProductoSelect
//                             value={item.pid}
//                             nombre={catalogItems.find((x) => x.id === item.pid)?.name}
//                             grupos={grupos}
//                             onChange={(pid) => updateItem(cat, i, "pid", pid)}
//                           />
//                         )}
//                       </td>

//                       {/* COSTO DE COMPRA (4) */}
//                       {showCols && (
//                         <td style={estiloCeldaInicioGrupo(COLORES.compra.cell)}>
//                           <input
//                             type="number"
//                             className="compact-input"
//                             step="0.01"
//                             value={cuNetoCompra.toFixed(2)}
//                             onChange={(e) => updateItem(cat, i, "costo_neto", e.target.value)}
//                             title="Editar Neto"
//                           />
//                         </td>
//                       )}
//                       {showCols && (
//                         <td style={estiloSoloLectura(COLORES.igv)}>
//                           {igvCompra.toFixed(2)}
//                         </td>
//                       )}
//                       {showCols && (
//                         <td style={estiloCelda(COLORES.compra.cell)}>
//                           <input
//                             type="number"
//                             className="compact-input"
//                             step="0.01"
//                             value={cuTotalCompra.toFixed(2)}
//                             onChange={(e) => updateItem(cat, i, "costo", e.target.value)}
//                             title="Editar CU Total"
//                           />
//                         </td>
//                       )}
//                       {showCols && (
//                         <td style={estiloSoloLectura(
//                           { cell: COLORES.compra.strong, text: COLORES.compra.text },
//                           { fontWeight: 800 }
//                         )}>
//                           {item.qty > 0 ? cTotalCompra.toFixed(2) : "-"}
//                         </td>
//                       )}

//                       {/* COSTO DE VENTA: CU.NETO → % MARGEN → IGV UNIT → CU.TOTAL → C. TOTAL (5) */}
//                       {showCols && (
//                         <td style={estiloCeldaInicioGrupo(COLORES.venta.cell)}>
//                           <input
//                             type="number"
//                             className="compact-input"
//                             step="0.01"
//                             value={cuNetoVenta.toFixed(2)}
//                             onChange={(e) => updateItem(cat, i, "precio_neto", e.target.value)}
//                             title="Editar Neto Venta"
//                           />
//                         </td>
//                       )}
//                       {showCols && celdaMargenPct}
//                       {showCols && (
//                         <td style={estiloSoloLectura(COLORES.igv)}>
//                           {igvVenta.toFixed(2)}
//                         </td>
//                       )}
//                       <td style={estiloCelda(COLORES.venta.strong, showCols ? {} : { borderLeft: SEPARADOR })}>
//                         <input
//                           type="number"
//                           className="compact-input hl-venta-input"
//                           step="0.01"
//                           value={cuTotalVenta.toFixed(2)}
//                           onChange={(e) => updateItem(cat, i, "precio", e.target.value)}
//                         />
//                       </td>
//                       {!showCols && celdaMargenPct}
//                       <td className="total-cell" style={estiloCelda(COLORES.venta.cell)}>
//                         <input
//                           type="number"
//                           className="compact-input bold-input"
//                           step="0.01"
//                           value={cTotalVenta.toFixed(2)}
//                           onChange={(e) => updateItem(cat, i, "total_venta", e.target.value)}
//                         />
//                       </td>

//                       {/* MARGEN (2) */}
//                       {showCols && (
//                         <td style={estiloCeldaInicioGrupo(COLORES.margen.cell, {
//                           textAlign: "right",
//                           fontSize: 12,
//                           fontWeight: 600,
//                           color: mUnit < 0 ? COLORES.bad : COLORES.margen.text,
//                         })}>
//                           {mUnit.toFixed(2)}
//                         </td>
//                       )}
//                       {showCols && (
//                         <td style={estiloSoloLectura(COLORES.margen, {
//                           fontWeight: 800,
//                           color: mTotal < 0 ? COLORES.bad : COLORES.ok,
//                         })}>
//                           {mTotal.toFixed(2)}
//                         </td>
//                       )}

//                       <td className="col-actions">
//                         <button className="del-btn" onClick={() => removeItem(cat, i)} aria-label="Eliminar">
//                           <Trash2 size={16} />
//                         </button>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </>
//       )}

//       <div className="items-footer">
//         {catalogItems.length > 0 && (
//           <>
//             <button ref={addRef} className="add-btn" onClick={() => setAgregando((v) => !v)}>
//               <Plus size={14} /> Agregar {etiqueta} 
//             </button>
//             {agregando && (
//               <BuscadorProductos
//                 anchorEl={addRef.current}
//                 grupos={grupos}
//                 onElegir={(pid) => { addItem(cat, pid); setAgregando(false); }}
//                 onCustom={() => { addCustomItem(cat); setAgregando(false); }}
//                 onCerrar={() => setAgregando(false)}
//               />
//             )}
//           </>
//         )}
//         <button className="add-btn secondary" onClick={() => addCustomItem(cat)}>
//           <Plus size={14} /> Agregar producto nuevo
//         </button>
//         {items.length === 0 && onKit && (
//           <button className="add-btn secondary" onClick={onKit}>
//             <Zap size={14} /> Cargar desde kit
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }