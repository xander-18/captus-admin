// src/components/ModalesCotizacion.jsx
import React, { useEffect, useState } from "react";
import { X, Copy, FileDown, Pencil, ExternalLink } from "lucide-react";
import { previsualizarPDF, nombreArchivoPDF } from "../utils/exportarPDF";

const overlay = {
  position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 1000,
  display: "flex", alignItems: "center", justifyContent: "center", padding: 12,
};
const caja = {
  background: "#fff", borderRadius: 12, boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
  display: "flex", flexDirection: "column", maxHeight: "100%",
};
const cabecera = {
  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
  padding: "12px 16px", borderBottom: "1px solid #e5e7eb", flexWrap: "wrap",
};

// ---------------------------------------------------------------------------
// VISTA PREVIA: genera el PDF tal como saldría al exportar y lo muestra.
// ---------------------------------------------------------------------------
export function PreviewModal({ quote, summary, catalog, onClose, onEdit, onDuplicate, onExport }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true, actual = null;
    setUrl(null); setError("");
    previsualizarPDF(quote, summary, catalog)
      .then((u) => { actual = u; vivo ? setUrl(u) : URL.revokeObjectURL(u); })
      .catch(() => vivo && setError("No se pudo generar la vista previa."));
    return () => { vivo = false; if (actual) URL.revokeObjectURL(actual); };
    // summary se calcula a partir de quote; solo regeneramos cuando cambian quote o catalog
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote, catalog]);

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...caja, width: "min(960px, 100%)", height: "min(92vh, 1000px)" }} onClick={(e) => e.stopPropagation()}>
        <div style={cabecera}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700 }}>Cotización {quote.numero || "sin número"}</div>
            <div style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {quote.cliente || "Sin cliente"} · {quote.proyecto || "Sin proyecto"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => onEdit(quote.id)}><Pencil size={14} /> Editar</button>
            <button className="btn" onClick={() => onDuplicate(quote.id)}><Copy size={14} /> Duplicar</button>
            <button className="btn btn-primary" onClick={() => onExport(quote)}><FileDown size={14} /> Descargar PDF</button>
            <button className="btn" onClick={onClose} aria-label="Cerrar"><X size={14} /></button>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, background: "#f1f5f9", position: "relative" }}>
          {error ? (
            <div style={{ padding: 24, color: "#b91c1c" }}>{error}</div>
          ) : !url ? (
            <div style={{ padding: 24, color: "#64748b" }}>Generando vista previa…</div>
          ) : (
            <>
              <iframe title="Vista previa de la cotización" src={url} style={{ width: "100%", height: "100%", border: 0 }} />
              <a
                href={url} target="_blank" rel="noreferrer"
                style={{ position: "absolute", right: 14, bottom: 10, fontSize: 12, background: "#fff", padding: "4px 8px", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 4 }}
              >
                <ExternalLink size={12} /> Abrir en otra pestaña
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EXPORTAR: el número correlativo es fijo; el nombre / equipo lo escribe el usuario.
// ---------------------------------------------------------------------------
export function ExportModal({ quote, onClose, onConfirm }) {
  const [nombre, setNombre] = useState(quote.nombreArchivo ?? quote.proyecto ?? "");
  const archivo = nombreArchivoPDF({ ...quote, nombreArchivo: nombre });

  const confirmar = () => onConfirm(nombre.trim());

  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...caja, width: "min(520px, 100%)" }} onClick={(e) => e.stopPropagation()}>
        <div style={cabecera}>
          <div style={{ fontWeight: 700 }}>Exportar cotización</div>
          <button className="btn" onClick={onClose} aria-label="Cerrar"><X size={14} /></button>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="field">
            <label>Nombre del archivo / equipo</label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ background: "#f1f5f9", padding: "8px 10px", borderRadius: 6, fontWeight: 700, whiteSpace: "nowrap" }}>
                {quote.numero || "s/n"}
              </span>
              <input
                type="text"
                autoFocus
                placeholder="Ej. Alarma comunitaria – Surco"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmar()}
                style={{ flex: 1 }}
              />
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Se guardará como: <b>{archivo}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={confirmar}><FileDown size={14} /> Descargar</button>
          </div>
        </div>
      </div>
    </div>
  );
}