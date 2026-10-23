// src/components/ProductoSelect.jsx
import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Plus } from "lucide-react";

const CUSTOM_OPTION = "__custom__";

// "Batería" y "bateria" cuentan igual; mayúsculas no importan.
const norm = (s) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// ---------------------------------------------------------------------------
// BuscadorProductos: el cuadro desplegable con la caja de búsqueda.
// Se usa tanto en cada fila (para cambiar producto) como en el botón
// "Agregar … del catálogo". Es el mismo, así se ve y se usa igual.
// ---------------------------------------------------------------------------
export function BuscadorProductos({ anchorEl, grupos, valorActual, onElegir, onCustom, onCerrar }) {
  const [q, setQ] = useState("");
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  // Posición: debajo del botón; si no cabe, arriba. "fixed" para que
  // la tabla con scroll no lo recorte.
  const [pos] = useState(() => {
    const r = anchorEl.getBoundingClientRect();
    const ancho = Math.max(r.width, 340);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - ancho - 8));
    const abajo = window.innerHeight - r.bottom;
    return abajo >= 340 || abajo >= r.top
      ? { left, width: ancho, top: r.bottom + 4 }
      : { left, width: ancho, bottom: window.innerHeight - r.top + 4 };
  });

  useEffect(() => {
    inputRef.current?.focus();
    const fuera = (e) => {
      if (panelRef.current?.contains(e.target) || anchorEl.contains(e.target)) return;
      onCerrar();
    };
    const tecla = (e) => e.key === "Escape" && onCerrar();
    const scroll = (e) => !panelRef.current?.contains(e.target) && onCerrar();
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    window.addEventListener("scroll", scroll, true);
    window.addEventListener("resize", onCerrar);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
      window.removeEventListener("scroll", scroll, true);
      window.removeEventListener("resize", onCerrar);
    };
    // eslint-disable-next-line
  }, []);

  // Todas las palabras escritas deben aparecer (en el nombre o en la marca).
  const toks = norm(q).split(/\s+/).filter(Boolean);
  const filtrados = Object.entries(grupos)
    .map(([marca, lista]) => [
      marca,
      lista.filter((p) => toks.every((t) => norm(p.name + " " + marca).includes(t))),
    ])
    .filter(([, lista]) => lista.length > 0);
  const primero = filtrados[0]?.[1][0];
  const total = filtrados.reduce((a, [, l]) => a + l.length, 0);

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed", zIndex: 1000, ...pos,
        background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8,
        boxShadow: "0 10px 30px rgba(15,23,42,.18)", overflow: "hidden",
        textAlign: "left", fontWeight: 400,
      }}
    >
      {/* Caja de búsqueda */}
      <div style={{ position: "relative", padding: 8, borderBottom: "1px solid #e2e8f0" }}>
        <Search size={15} style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && primero) { e.preventDefault(); onElegir(primero.id); }
          }}
          placeholder="Escribe para buscar… (ej. detector, bateria)"
          style={{ width: "100%", paddingLeft: 30, fontSize: 16, boxSizing: "border-box" }}
        />
      </div>

      {/* Resultados */}
      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {total === 0 ? (
          <div style={{ padding: "14px 12px", fontSize: 13, color: "#64748b" }}>
            No hay productos con “{q}”.
          </div>
        ) : (
          filtrados.map(([marca, lista]) => (
            <div key={marca}>
              <div style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#475569", background: "#f1f5f9", position: "sticky", top: 0 }}>
                {marca}
              </div>
              {lista.map((p) => {
                const activo = p.id === valorActual;
                return (
                  <div
                    key={p.id}
                    onClick={() => onElegir(p.id)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#eef2ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = activo ? "#e0e7ff" : "transparent")}
                    style={{
                      padding: "8px 12px 8px 20px", fontSize: 13, cursor: "pointer",
                      background: activo ? "#e0e7ff" : "transparent",
                      fontWeight: activo ? 600 : 400,
                    }}
                  >
                    {p.name}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Siempre disponible, al pie */}
      <div
        onClick={onCustom}
        style={{ padding: "10px 12px", fontSize: 13, cursor: "pointer", borderTop: "1px solid #e2e8f0", color: "#4f46e5", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
      >
        <Plus size={14} /> Producto nuevo (personalizado)
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProductoSelect: reemplaza al <select> de cada fila.
// ---------------------------------------------------------------------------
export default function ProductoSelect({ value, nombre, grupos, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const btnRef = useRef(null);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="compact-select"
        onClick={() => setAbierto((v) => !v)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, width: "100%", textAlign: "left", cursor: "pointer" }}
        title="Clic para buscar otro producto"
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombre || "Elegir producto"}</span>
        <ChevronDown size={14} style={{ flexShrink: 0 }} />
      </button>
      {abierto && (
        <BuscadorProductos
          anchorEl={btnRef.current}
          grupos={grupos}
          valorActual={value}
          onElegir={(pid) => { onChange(pid); setAbierto(false); }}
          onCustom={() => { onChange(CUSTOM_OPTION); setAbierto(false); }}
          onCerrar={() => setAbierto(false)}
        />
      )}
    </>
  );
}