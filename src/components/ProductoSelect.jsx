// src/components/ProductoSelect.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, ChevronDown, Plus, Check, X, SearchX } from "lucide-react";

const CUSTOM_OPTION = "__custom__";

// "Batería" y "bateria" cuentan igual; mayúsculas no importan.
const norm = (s) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// ---------------------------------------------------------------------------
// Resaltado: marca en amarillo lo que el usuario escribió, aunque haya
// escrito sin tilde ("bateria" marca "Batería").
// ---------------------------------------------------------------------------
function Resaltado({ texto, toks }) {
  if (!toks.length) return texto;

  // Texto normalizado + mapa de cada letra normalizada a su posición original
  let n = "";
  const mapa = [];
  for (let i = 0; i < texto.length; i++) {
    const c = norm(texto[i]);
    for (let k = 0; k < c.length; k++) mapa.push(i);
    n += c;
  }

  const rangos = [];
  toks.forEach((t) => {
    let desde = 0;
    let k;
    while ((k = n.indexOf(t, desde)) > -1) {
      rangos.push([mapa[k], mapa[k + t.length - 1] + 1]);
      desde = k + t.length;
    }
  });
  if (!rangos.length) return texto;

  // Une rangos que se pisan
  rangos.sort((a, b) => a[0] - b[0]);
  const unidos = [rangos[0].slice()];
  for (let i = 1; i < rangos.length; i++) {
    const ult = unidos[unidos.length - 1];
    if (rangos[i][0] <= ult[1]) ult[1] = Math.max(ult[1], rangos[i][1]);
    else unidos.push(rangos[i].slice());
  }

  const partes = [];
  let pos = 0;
  unidos.forEach(([a, b]) => {
    if (a > pos) partes.push(texto.slice(pos, a));
    partes.push(<mark key={a}>{texto.slice(a, b)}</mark>);
    pos = b;
  });
  if (pos < texto.length) partes.push(texto.slice(pos));
  return <>{partes}</>;
}

// ---------------------------------------------------------------------------
// BuscadorProductos: el cuadro desplegable con la caja de búsqueda.
// Se usa tanto en cada fila (para cambiar producto) como en el botón
// "Agregar … del catálogo". Es el mismo, así se ve y se usa igual.
//  · Escritorio: cuadro flotante pegado al botón (debajo o arriba).
//  · Celular: hoja que sube desde abajo.
//  · Teclado: ↑ ↓ para moverse, Enter para elegir, Esc para cerrar.
// ---------------------------------------------------------------------------
export function BuscadorProductos({ anchorEl, grupos, valorActual, onElegir, onCustom, onCerrar }) {
  const [q, setQ] = useState("");
  const [activo, setActivo] = useState(0);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const listaRef = useRef(null);

  const [movil] = useState(() => window.matchMedia("(max-width: 767px)").matches);

  // Posición en escritorio: debajo del botón; si no cabe, arriba.
  // "fixed" para que la tabla con scroll no lo recorte.
  const [pos] = useState(() => {
    if (movil) return null;
    const r = anchorEl.getBoundingClientRect();
    const ancho = Math.max(r.width, 360);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - ancho - 8));
    const abajo = window.innerHeight - r.bottom - 12;
    const arriba = r.top - 12;
    const bajar = abajo >= 340 || abajo >= arriba;
    const espacio = bajar ? abajo : arriba;
    return {
      estilo: bajar
        ? { left, width: ancho, top: r.bottom + 4 }
        : { left, width: ancho, bottom: window.innerHeight - r.top + 4 },
      listaMax: Math.max(160, Math.min(340, espacio - 120)),
    };
  });

  // Todas las palabras escritas deben aparecer (en el nombre o en la marca).
  const toks = useMemo(() => norm(q).split(/\s+/).filter(Boolean), [q]);
  const { bloques, plano } = useMemo(() => {
    const bloques = [];
    const plano = [];
    for (const [marca, lista] of Object.entries(grupos)) {
      const items = lista.filter((p) => toks.every((t) => norm(p.name + " " + marca).includes(t)));
      if (!items.length) continue;
      bloques.push({ marca, items: items.map((p) => ({ p, idx: plano.push(p) - 1 })) });
    }
    return { bloques, plano };
  }, [grupos, toks]);

  // Al abrir: enfoca la búsqueda y deja marcado el producto actual
  useEffect(() => {
    inputRef.current?.focus();
    const i = plano.findIndex((p) => p.id === valorActual);
    if (i > 0) setActivo(i);
    // eslint-disable-next-line
  }, []);

  // Cierre: clic fuera, Esc, scroll / resize (solo escritorio)
  useEffect(() => {
    const fuera = (e) => {
      if (panelRef.current?.contains(e.target) || anchorEl.contains(e.target)) return;
      onCerrar();
    };
    const tecla = (e) => e.key === "Escape" && onCerrar();
    const scroll = (e) => !panelRef.current?.contains(e.target) && onCerrar();
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);

    // En celular el teclado en pantalla dispara resize/scroll: no se cierra por eso.
    if (!movil) {
      window.addEventListener("scroll", scroll, true);
      window.addEventListener("resize", onCerrar);
    } else {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
      window.removeEventListener("scroll", scroll, true);
      window.removeEventListener("resize", onCerrar);
      if (movil) document.body.style.overflow = "";
    };
    // eslint-disable-next-line
  }, []);

  // El elemento marcado siempre queda a la vista
  useEffect(() => {
    listaRef.current
      ?.querySelector(`[data-idx="${activo}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activo]);

  const onTecla = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((i) => Math.min(plano.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && plano[activo]) {
      e.preventDefault();
      onElegir(plano[activo].id);
    }
  };

  return (
    <>
      {movil && <div className="ps-backdrop" onClick={onCerrar} />}
      <div
        ref={panelRef}
        className={`ps-panel${movil ? " ps-sheet" : ""}`}
        style={movil ? undefined : pos.estilo}
        role="dialog"
        aria-label="Buscar producto"
      >
        {movil && (
          <div className="ps-sheet-head">
            <b>Elegir producto</b>
            <button type="button" className="ps-sheet-x" onClick={onCerrar} aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Caja de búsqueda */}
        <div className="ps-search">
          <Search size={16} className="ps-search-ico" />
          <input
            ref={inputRef}
            className="ps-input"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="ps-lista"
            aria-activedescendant={plano[activo] ? `ps-op-${plano[activo].id}` : undefined}
            autoComplete="off"
            spellCheck={false}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActivo(0); }}
            onKeyDown={onTecla}
            placeholder="Escribe para buscar… (ej. detector, bateria)"
          />
          {q && (
            <button
              type="button"
              className="ps-clear"
              onClick={() => { setQ(""); setActivo(0); inputRef.current?.focus(); }}
              aria-label="Borrar búsqueda"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Resultados */}
        <div
          id="ps-lista"
          ref={listaRef}
          role="listbox"
          className="ps-lista"
          style={movil ? undefined : { maxHeight: pos.listaMax }}
        >
          {plano.length === 0 ? (
            <div className="ps-vacio">
              <SearchX size={22} />
              <b>Sin resultados</b>
              <span>No hay productos con “{q}”.</span>
            </div>
          ) : (
            bloques.map(({ marca, items }) => (
              <div key={marca} role="group" aria-label={marca}>
                <div className="ps-grupo">
                  <span>{marca}</span>
                  <span className="ps-grupo-n">{items.length}</span>
                </div>
                {items.map(({ p, idx }) => {
                  const sel = p.id === valorActual;
                  return (
                    <div
                      key={p.id}
                      id={`ps-op-${p.id}`}
                      role="option"
                      aria-selected={sel}
                      data-idx={idx}
                      className={`ps-op${idx === activo ? " activo" : ""}${sel ? " sel" : ""}`}
                      onMouseEnter={() => setActivo(idx)}
                      onClick={() => onElegir(p.id)}
                    >
                      <span className="ps-op-nombre"><Resaltado texto={p.name} toks={toks} /></span>
                      {sel && <Check size={15} className="ps-op-check" />}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Siempre disponible, al pie */}
        <button type="button" className="ps-custom" onClick={onCustom}>
          <span className="ps-custom-ico"><Plus size={15} /></span>
          <span>
            <b>Producto nuevo</b>
            <small>Personalizado, fuera del catálogo</small>
          </span>
        </button>
      </div>
    </>
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
        className={`compact-select ps-trigger${abierto ? " abierto" : ""}`}
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        title="Clic para buscar otro producto"
      >
        <span className={`ps-trigger-txt${nombre ? "" : " vacio"}`}>{nombre || "Elegir producto"}</span>
        <ChevronDown size={14} className="ps-chev" />
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