// src/components/KitPicker.jsx
import React, { useMemo, useState } from "react";
import { ArrowLeft, Plus, Search, Trash2, X } from "lucide-react";
import { CATALOGO, kitAItems, fusionarItems, resumenKit, kitDesdeCotizacion } from "../data/kits";

const fmt = (n) => "S/ " + (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/**
 * props:
 *  open, onClose
 *  kits          -> array de kits (predefinidos + guardados)
 *  catalogo      -> opcional, por defecto CATALOGO
 *  quote         -> cotización actual
 *  onApply(patch)-> recibe { items, laborValue, proyecto, kitOrigen }
 *  onSaveKit(kit)-> opcional, para guardar un kit nuevo
 */
export default function KitPicker({ open, onClose, kits, catalogo = CATALOGO, quote, onApply, onSaveKit }) {
  const [sel, setSel] = useState(null);
  const [opc, setOpc] = useState([]);
  const [q, setQ] = useState("");
  const [nombreKit, setNombreKit] = useState("");
  // "lista" = lista de kits | "detalle" = detalle del kit (solo se nota en celular)
  const [vista, setVista] = useState("lista");

  // Pestaña activa de la columna izquierda: kits predefinidos vs pedido libre
  const [modoIzq, setModoIzq] = useState("kits"); // "kits" | "personalizado"
  const [qPers, setQPers] = useState("");
  const [carrito, setCarrito] = useState([]); // [{ cat, pid, qty }]

  const grupos = useMemo(() => {
    const filtrados = kits.filter((k) => k.name.toLowerCase().includes(q.toLowerCase()));
    return filtrados.reduce((acc, k) => {
      (acc[k.categoria || "Otros"] ||= []).push(k);
      return acc;
    }, {});
  }, [kits, q]);

  // Productos del modo personalizado, agrupados por categoría.
  // Sin texto en el buscador se muestran todos (igual que la lista de kits);
  // con texto, se filtran por nombre dentro de cada grupo.
  const gruposPersonalizado = useMemo(() => {
    const ql = qPers.trim().toLowerCase();
    const acc = {};
    const etiquetas = { equipos: "Equipos", accesorios: "Accesorios" };
    ["equipos", "accesorios"].forEach((cat) => {
      const lista = catalogo[cat].filter((p) => !ql || p.name.toLowerCase().includes(ql));
      if (lista.length) acc[etiquetas[cat]] = lista.map((p) => ({ ...p, cat }));
    });
    return acc;
  }, [catalogo, qPers]);

  // Resumen de costo/venta/margen del carrito personalizado.
  // Este hook debe quedar SIEMPRE antes del "if (!open) return null;" de abajo:
  // KitPicker no se desmonta al cerrarse (el padre solo cambia la prop `open`),
  // así que todos los hooks deben llamarse en el mismo orden en cada render,
  // sin importar si el modal está abierto o cerrado.
  const resumenCarrito = useMemo(() => {
    let costo = 0, venta = 0;
    carrito.forEach((l) => {
      const p = catalogo[l.cat]?.find((x) => x.id === l.pid);
      if (!p) return;
      costo += p.costo * l.qty;
      venta += p.precio * l.qty;
    });
    return { costo, venta, margen: venta - costo, margenPct: venta ? ((venta - costo) / venta) * 100 : 0 };
  }, [carrito, catalogo]);

  if (!open) return null;

  const kit = kits.find((k) => k.id === sel);
  const res = kit ? resumenKit(kit, catalogo, opc) : null;
  const nombre = (cat, pid) => catalogo[cat].find((p) => p.id === pid)?.name || pid;

  // Si no hay kit seleccionado válido (o estamos en modo personalizado), la vista manda
  const vistaReal =
    modoIzq === "personalizado"
      ? vista === "detalle"
        ? "detalle"
        : "lista"
      : kit && vista === "detalle"
      ? "detalle"
      : "lista";

  const cerrar = () => {
    setVista("lista");
    setModoIzq("kits");
    setQPers("");
    setCarrito([]);
    onClose();
  };

  const cambiarTab = (modo) => {
    setModoIzq(modo);
    setVista("lista");
  };

  const aplicar = (modo) => {
    if (!kit) return;
    const nuevos = kitAItems(kit, catalogo, opc);
    const items =
      modo === "reemplazar"
        ? nuevos
        : {
            equipos: fusionarItems(quote.items.equipos, nuevos.equipos),
            accesorios: fusionarItems(quote.items.accesorios, nuevos.accesorios),
          };
    onApply({
      items,
      laborValue: kit.laborValue ?? quote.laborValue,
      proyecto: quote.proyecto || kit.name,
      kitOrigen: modo === "reemplazar" ? kit.name : quote.kitOrigen || kit.name,
    });
    cerrar();
  };

  const elegirKit = (id) => {
    setSel(id);
    setOpc([]);
    setVista("detalle");
  };

  const guardarActual = () => {
    if (!nombreKit.trim() || !onSaveKit) return;
    onSaveKit(kitDesdeCotizacion(nombreKit.trim(), quote));
    setNombreKit("");
  };

  // ---------------------------------------------------------------------
  // MODO PERSONALIZADO: buscar productos sueltos y armar un carrito libre
  // ---------------------------------------------------------------------
  const cantidadEnCarrito = (cat, pid) => carrito.find((x) => x.cat === cat && x.pid === pid)?.qty || 0;

  const agregarCarrito = (cat, pid) => {
    setCarrito((c) => {
      const i = c.findIndex((x) => x.cat === cat && x.pid === pid);
      if (i >= 0) {
        const copia = [...c];
        copia[i] = { ...copia[i], qty: copia[i].qty + 1 };
        return copia;
      }
      return [...c, { cat, pid, qty: 1 }];
    });
  };

  const cambiarQtyCarrito = (cat, pid, qty) => {
    const n = Math.max(1, parseInt(qty) || 1);
    setCarrito((c) => c.map((x) => (x.cat === cat && x.pid === pid ? { ...x, qty: n } : x)));
  };

  const quitarCarrito = (cat, pid) => setCarrito((c) => c.filter((x) => !(x.cat === cat && x.pid === pid)));

  const carritoVacio = carrito.length === 0;
  const totalCarritoItems = carrito.reduce((a, l) => a + l.qty, 0);

  const aplicarCarrito = (modo) => {
    if (carritoVacio) return;
    const nuevos = { equipos: [], accesorios: [] };
    carrito.forEach((l) => {
      const p = catalogo[l.cat]?.find((x) => x.id === l.pid);
      if (!p) return;
      nuevos[l.cat].push({ pid: p.id, qty: l.qty, costo: p.costo, precio: p.precio });
    });
    const items =
      modo === "reemplazar"
        ? nuevos
        : {
            equipos: fusionarItems(quote.items.equipos, nuevos.equipos),
            accesorios: fusionarItems(quote.items.accesorios, nuevos.accesorios),
          };
    onApply({
      items,
      laborValue: quote.laborValue,
      proyecto: quote.proyecto || "Pedido personalizado",
      kitOrigen: modo === "reemplazar" ? "Personalizado" : quote.kitOrigen || "Personalizado",
    });
    cerrar();
  };

  const hayItems = quote.items.equipos.length + quote.items.accesorios.length > 0;
  const hayGrupos = Object.keys(grupos).length > 0;

  return (
    <div className="kp-overlay" onClick={cerrar}>
      <div
        className="kp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kp-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="kp-header">
          <div className="kp-header-left">
            {vistaReal === "detalle" && (
              <button className="kp-back" onClick={() => setVista("lista")} aria-label="Volver a la lista">
                <ArrowLeft size={20} />
              </button>
            )}
            <strong id="kp-title" className="kp-title">
              {modoIzq === "personalizado" ? "Pedido personalizado" : "Cargar kit"}
            </strong>
          </div>
          <button className="kp-close" onClick={cerrar} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className={`kp-body is-${vistaReal}`}>
          {/* COLUMNA IZQUIERDA: lista de kits o buscador personalizado (en celular es la pantalla 1) */}
          <div className="kp-left">
            {/* Selector de pestaña: Kits vs Personalizado */}
            <div className="kp-tabs" style={S.tabs}>
              <button
                type="button"
                className={`kp-tab ${modoIzq === "kits" ? "is-active" : ""}`}
                style={{ ...S.tab, ...(modoIzq === "kits" ? S.tabActive : {}) }}
                onClick={() => cambiarTab("kits")}
              >
                Kits
              </button>
              <button
                type="button"
                className={`kp-tab ${modoIzq === "personalizado" ? "is-active" : ""}`}
                style={{ ...S.tab, ...(modoIzq === "personalizado" ? S.tabActive : {}) }}
                onClick={() => cambiarTab("personalizado")}
              >
                Personalizado
              </button>
            </div>

            {modoIzq === "kits" ? (
              <>
                <div className="kp-search-wrap">
                  <Search size={15} className="kp-search-icon" />
                  <input
                    className="kp-input kp-search"
                    placeholder="Buscar kit…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>

                {!hayGrupos && <div className="kp-empty-sm">No hay kits con ese nombre.</div>}

                {Object.entries(grupos).map(([cat, lista]) => (
                  <div key={cat}>
                    <div className="kp-cat-title">{cat}</div>
                    {lista.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => elegirKit(k.id)}
                        className={`kp-kit-btn ${sel === k.id ? "is-active" : ""}`}
                      >
                        <span className="kp-kit-name">{k.name}</span>
                        <span className="kp-kit-price">{fmt(resumenKit(k, catalogo).venta)}</span>
                      </button>
                    ))}
                  </div>
                ))}

                {onSaveKit && hayItems && (
                  <div className="kp-save-box">
                    <div className="kp-sec-title">Guardar la cotización actual como kit</div>
                    <div className="kp-save-row">
                      <input
                        className="kp-input"
                        placeholder="Nombre del nuevo kit"
                        value={nombreKit}
                        onChange={(e) => setNombreKit(e.target.value)}
                      />
                      <button className="kp-btn" onClick={guardarActual}>Guardar</button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="kp-search-wrap">
                  <Search size={15} className="kp-search-icon" />
                  <input
                    className="kp-input kp-search"
                    placeholder="Buscar producto por nombre…"
                    value={qPers}
                    onChange={(e) => setQPers(e.target.value)}
                    autoFocus
                  />
                </div>

                {Object.keys(gruposPersonalizado).length === 0 ? (
                  <div className="kp-empty-sm">No se encontraron productos con ese nombre.</div>
                ) : (
                  Object.entries(gruposPersonalizado).map(([catLabel, lista]) => (
                    <div key={catLabel}>
                      <div className="kp-cat-title">{catLabel}</div>
                      {lista.map((p) => {
                        const enCarrito = cantidadEnCarrito(p.cat, p.id);
                        return (
                          <div key={p.cat + p.id} className="kp-prod-row" style={S.prodRow}>
                            <div className="kp-prod-info" style={S.prodInfo}>
                              <span className="kp-prod-name" style={S.prodName}>{p.name}</span>
                              <span className="kp-prod-price" style={S.prodPrice}>{fmt(p.precio)}</span>
                            </div>
                            <button
                              type="button"
                              className={`kp-add-btn ${enCarrito ? "is-added" : ""}`}
                              style={{ ...S.addBtn, ...(enCarrito ? S.addBtnActive : {}) }}
                              onClick={() => agregarCarrito(p.cat, p.id)}
                              aria-label={`Agregar ${p.name}`}
                            >
                              <Plus size={15} />
                              {enCarrito > 0 && <span style={S.addQty}>{enCarrito}</span>}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}

                {!carritoVacio && (
                  <button type="button" className="kp-cart-bar" style={S.cartBar} onClick={() => setVista("detalle")}>
                    <span>Ver selección ({totalCarritoItems})</span>
                    <span>{fmt(resumenCarrito.venta)}</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* COLUMNA DERECHA: detalle del kit o carrito personalizado (en celular es la pantalla 2) */}
          <div className="kp-right">
            {modoIzq === "kits" ? (
              <>
                {!kit && <div className="kp-empty">Selecciona un kit para ver qué incluye.</div>}

                {kit && (
                  <>
                    <div className="kp-kit-title">{kit.name}</div>

                    {["equipos", "accesorios"].map((cat) =>
                      (kit.items[cat] || []).length ? (
                        <div key={cat} className="kp-section">
                          <div className="kp-sec-title">{cat === "equipos" ? "Equipos" : "Accesorios"}</div>
                          {kit.items[cat].map((l) => (
                            <div key={l.pid} className="kp-row">
                              <span className="kp-qty">{l.qty}</span>
                              <span>{nombre(cat, l.pid)}</span>
                            </div>
                          ))}
                        </div>
                      ) : null
                    )}

                    {["equipos", "accesorios"].some((c) => (kit.opcionales?.[c] || []).length) && (
                      <div className="kp-section">
                        <div className="kp-sec-title">Opcionales</div>
                        {["equipos", "accesorios"].flatMap((cat) =>
                          (kit.opcionales?.[cat] || []).map((l) => (
                            <label key={cat + l.pid} className="kp-opt-row">
                              <input
                                type="checkbox"
                                checked={opc.includes(l.pid)}
                                onChange={() =>
                                  setOpc((p) => (p.includes(l.pid) ? p.filter((x) => x !== l.pid) : [...p, l.pid]))
                                }
                              />
                              <span className="kp-qty">{l.qty}</span>
                              <span>{nombre(cat, l.pid)}</span>
                            </label>
                          ))
                        )}
                      </div>
                    )}

                    <div className="kp-resumen">
                      <div><span>Costo</span><strong>{fmt(res.costo)}</strong></div>
                      <div><span>Venta</span><strong>{fmt(res.venta)}</strong></div>
                      <div>
                        <span>Margen</span>
                        <strong className={res.margenPct < 20 ? "kp-danger" : "kp-ok"}>
                          {fmt(res.margen)} · {res.margenPct.toFixed(1)}%
                        </strong>
                      </div>
                    </div>

                    <div className="kp-actions">
                      <button className="kp-btn kp-btn-primary" onClick={() => aplicar("reemplazar")}>
                        {hayItems ? "Reemplazar cotización" : "Cargar kit"}
                      </button>
                      {hayItems && (
                        <button className="kp-btn" onClick={() => aplicar("agregar")}>
                          Agregar a lo existente
                        </button>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {carritoVacio ? (
                  <div className="kp-empty">
                    Busca productos en la pestaña "Personalizado" y agrégalos con el botón + para armar tu pedido.
                  </div>
                ) : (
                  <>
                    <div className="kp-kit-title">Pedido personalizado</div>

                    <div className="kp-section">
                      {carrito.map((l) => {
                        const p = catalogo[l.cat]?.find((x) => x.id === l.pid);
                        if (!p) return null;
                        return (
                          <div key={l.cat + l.pid} className="kp-cart-row" style={S.cartRow}>
                            <input
                              type="number"
                              min="1"
                              className="kp-cart-qty"
                              style={S.cartQty}
                              value={l.qty}
                              onChange={(e) => cambiarQtyCarrito(l.cat, l.pid, e.target.value)}
                            />
                            <span className="kp-cart-name" style={S.cartName}>{p.name}</span>
                            <span className="kp-cart-price" style={S.cartPrice}>{fmt(p.precio * l.qty)}</span>
                            <button
                              type="button"
                              className="kp-cart-del"
                              style={S.cartDel}
                              onClick={() => quitarCarrito(l.cat, l.pid)}
                              aria-label={`Quitar ${p.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="kp-resumen">
                      <div><span>Costo</span><strong>{fmt(resumenCarrito.costo)}</strong></div>
                      <div><span>Venta</span><strong>{fmt(resumenCarrito.venta)}</strong></div>
                      <div>
                        <span>Margen</span>
                        <strong className={resumenCarrito.margenPct < 20 ? "kp-danger" : "kp-ok"}>
                          {fmt(resumenCarrito.margen)} · {resumenCarrito.margenPct.toFixed(1)}%
                        </strong>
                      </div>
                    </div>

                    <div className="kp-actions">
                      <button className="kp-btn kp-btn-primary" onClick={() => aplicarCarrito("reemplazar")}>
                        {hayItems ? "Reemplazar cotización" : "Cargar pedido"}
                      </button>
                      {hayItems && (
                        <button className="kp-btn" onClick={() => aplicarCarrito("agregar")}>
                          Agregar a lo existente
                        </button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Estilos puntuales para los elementos nuevos (pestañas, buscador personalizado y carrito),
// para que funcionen aunque el CSS global del proyecto aún no tenga estas clases definidas.
const S = {
  tabs: { display: "flex", gap: 6, marginBottom: 12 },
  tab: {
    flex: 1, padding: "8px 10px", fontSize: 13, fontWeight: 600, borderRadius: 8,
    border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer",
  },
  tabActive: { background: "#eff6ff", borderColor: "#93c5fd", color: "#1d4ed8" },

  prodRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
    padding: "8px 6px", borderBottom: "1px solid #f1f5f9",
  },
  prodInfo: { display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  prodName: { fontSize: 13, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  prodPrice: { fontSize: 11.5, color: "#64748b" },

  addBtn: {
    display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8,
    border: "1px solid #cbd5e1", background: "#fff", color: "#2563eb", cursor: "pointer",
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  addBtnActive: { background: "#2563eb", color: "#fff", borderColor: "#2563eb" },
  addQty: { minWidth: 16, textAlign: "center" },

  cartBar: {
    position: "sticky", bottom: 0, marginTop: 10, width: "100%", display: "flex",
    justifyContent: "space-between", alignItems: "center", padding: "10px 14px",
    borderRadius: 10, border: "none", background: "#2563eb", color: "#fff",
    fontWeight: 700, fontSize: 13, cursor: "pointer",
  },

  cartRow: {
    display: "grid", gridTemplateColumns: "48px 1fr auto auto", alignItems: "center",
    gap: 8, padding: "6px 0", fontSize: 13, borderBottom: "1px solid #f1f5f9",
  },
  cartQty: { width: 42, padding: "4px 6px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, textAlign: "center" },
  cartName: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  cartPrice: { color: "#64748b", fontSize: 12, whiteSpace: "nowrap" },
  cartDel: { border: "none", background: "none", color: "#94a3b8", cursor: "pointer", display: "flex", padding: 2 },
};