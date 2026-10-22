// src/utils/cotizaciones.js
// Helpers de la lista de cotizaciones: numeración correlativa, búsqueda por contenido y duplicado.

// Primer número que se usará si todavía no hay cotizaciones del año. Cámbialo aquí.
export const NUMERO_INICIAL = 476;

export const LS_COTIZACIONES = "captus_cotizaciones";

// ---------------------------------------------------------------------------
// NUMERACIÓN: 0476-2026  (correlativo de 4 dígitos + año)
// ---------------------------------------------------------------------------
export const formatoNumero = (n, anio = new Date().getFullYear()) =>
  `${String(n).padStart(4, "0")}-${anio}`;

/**
 * Siguiente número libre del año en curso.
 * Reconoce "0476-2026" y también números viejos sin año ("0479"), para no repetirlos.
 */
export function siguienteNumero(lista) {
  const anio = new Date().getFullYear();
  let max = NUMERO_INICIAL - 1;
  lista.forEach((q) => {
    const m = /^(\d+)(?:-(\d{4}))?$/.exec((q.numero || "").trim());
    if (!m) return;
    if (m[2] && Number(m[2]) !== anio) return; // otro año: su serie es aparte
    max = Math.max(max, Number(m[1]));
  });
  return formatoNumero(max + 1, anio);
}

// ---------------------------------------------------------------------------
// BÚSQUEDA POR CONTENIDO
// ---------------------------------------------------------------------------
export const normalizar = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const nombreDeItem = (it, cat, catalog) => {
  if (it.name) return it.name;
  const p = (catalog?.[cat] || []).find((x) => x.id === it.pid);
  return p ? p.name : "";
};

/** Todos los nombres de producto de la cotización (equipos + accesorios). */
export function productosDe(q, catalog) {
  return ["equipos", "accesorios"].flatMap((cat) =>
    (q.items?.[cat] || []).map((it) => nombreDeItem(it, cat, catalog)).filter(Boolean)
  );
}

/** Texto plano donde se busca: datos del cliente, número, kit y cada producto. */
export function textoBusqueda(q, catalog) {
  return normalizar(
    [
      q.numero, q.nombreArchivo, q.cliente, q.proyecto, q.atencion, q.direccion, q.ruc,
      q.kitOrigen, ...productosDe(q, catalog),
    ].join(" | ")
  );
}

/** Divide lo escrito en palabras; la cotización debe contener TODAS (sin importar tildes ni mayúsculas). */
export const tokens = (texto) => normalizar(texto).split(/\s+/).filter(Boolean);

export const coincide = (q, toks, catalog) => {
  if (!toks.length) return true;
  const h = textoBusqueda(q, catalog);
  return toks.every((t) => h.includes(t));
};

/** Productos que coinciden con la búsqueda, para mostrarlos bajo el proyecto en la lista. */
export function productosQueCoinciden(q, toks, catalog, max = 3) {
  if (!toks.length) return [];
  const hit = productosDe(q, catalog).filter((n) => {
    const nn = normalizar(n);
    return toks.some((t) => nn.includes(t));
  });
  return [...new Set(hit)].slice(0, max);
}

// ---------------------------------------------------------------------------
// DUPLICAR
// ---------------------------------------------------------------------------
/** Copia completa de una cotización: nuevo id, nuevo correlativo, borrador y fecha de hoy. */
// export function duplicarCotizacion(orig, lista) {
//   const copia = JSON.parse(JSON.stringify(orig));
//   return {
//     ...copia,
//     id: `cot_${Date.now()}`,
//     numero: siguienteNumero(lista),
//     status: "borrador",
//     fecha: new Date().toISOString(),
//   };
// }
export function duplicarCotizacion(orig) {
  const copia = JSON.parse(JSON.stringify(orig));
  return {
    ...copia,
    id: `cot_${Date.now()}`,
    numero: "",
    status: "borrador",
    fecha: new Date().toISOString(),
  };
}