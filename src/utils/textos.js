// ---------------------------------------------------------------------------
// NORMALIZACIÓN DE TEXTO
// Corrige mayúsculas/minúsculas sin importar cómo lo escriba el usuario.
// Para agregar una sigla o forma especial, solo añádela a SIGLAS.
// ---------------------------------------------------------------------------
const SIGLAS = [
  "CCTV", "DVR", "NVR", "XVR", "GPS", "IP", "PC", "UPS", "LED", "HD", "UHD",
  "USB", "UTP", "HDMI", "BNC", "VGA", "LAN", "WAN", "VPN", "CPU", "RAM", "SSD", "HDD",
  "PTZ", "IR", "TV", "AC", "DC", "CACI", "WiFi", "PoE", "RJ45",
  "RUC", "DNI", "IGV", "SUNAT",
  "SAC", "SA", "SRL", "EIRL", "SCRL", "ONG",
];
const CANON = new Map(SIGLAS.map((s) => [s.toLowerCase(), s]));

// Palabras que van en minúscula cuando no están al inicio
const MINUS = new Set(["de", "del", "la", "las", "los", "el", "y", "en", "con", "para", "por", "al", "sin", "un", "una"]);

const ES = "es-PE";
const up = (s) => s.toLocaleUpperCase(ES);
const low = (s) => s.toLocaleLowerCase(ES);
const cap = (s) => (s ? up(s.charAt(0)) + s.slice(1) : s);

const RE_PALABRA = /[\p{L}\p{N}][\p{L}\p{N}.'’\-º°]*/gu;
const RE_SIGLA_PUNTOS = /^(?:\p{L}\.)+\p{L}\.?$/u;          // S.A.C.  S.A.
const RE_ORDINAL = /^\d+(ra|da|do|ro|to|vo|mo|no|er|ero|º|°)$/; // 2da, 5to

function palabra(tok, i, todoMayus) {
  const l = low(tok);
  const sinPunto = l.replace(/\.+$/, "");

  if (CANON.has(sinPunto)) return CANON.get(sinPunto) + l.slice(sinPunto.length);
  if (RE_SIGLA_PUNTOS.test(tok)) return up(tok);
  if (RE_ORDINAL.test(l)) return l;
  if (/\d/.test(tok)) return up(tok); // modelos y medidas: 2MP, DS-2CD2043, 12V

  if (!todoMayus) {
    // "cLIENTE" (caps lock invertido) → se corrige
    if (tok.length >= 4 && /^\p{Ll}\p{Lu}+$/u.test(tok)) return cap(l);
    // Sigla escrita a propósito en mayúsculas (BCP, SHOCTIX) → se respeta
    if (tok.length >= 2 && tok === up(tok)) return tok;
    // Mezcla intencional (iPhone, McDonald) → se respeta
    if (/\p{Ll}\p{Lu}/u.test(tok)) return tok;
  }

  if (i > 0 && MINUS.has(l)) return l;
  return l.split("-").map(cap).join("-");
}

// "  surco   LIMA " → "Surco Lima"
export function normalizarTexto(valor) {
  if (typeof valor !== "string") return valor;
  const t = valor.replace(/\s+/g, " ").trim();
  if (!t) return "";
  const todoMayus = t === up(t) && /\p{L}/u.test(t);
  let i = 0;
  return t.replace(RE_PALABRA, (tok) => palabra(tok, i++, todoMayus));
}

// Solo limpia espacios: respeta mayúsculas/minúsculas y saltos de línea tal como los escribió el usuario.
export function limpiarEspacios(valor) {
  if (typeof valor !== "string") return valor;
  return valor
    .replace(/[ \t]+/g, " ")   // espacios/tabs repetidos → uno
    .replace(/ *\n */g, "\n")  // sin espacios alrededor de saltos de línea
    .trim();
}
// Clave para comparar/buscar: sin mayúsculas, sin tildes, sin espacios dobles
export const clave = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Normaliza todos los campos de texto libre de una cotización
// export function normalizarCotizacion(q) {
//   const fixItem = (it) => (it.pid ? it : { ...it, name: normalizarTexto(it.name || "") });
//   return {
//     ...q,
//     cliente: normalizarTexto(q.cliente),
//     proyecto: normalizarTexto(q.proyecto),
//     atencion: normalizarTexto(q.atencion),
//     direccion: normalizarTexto(q.direccion),
//     items: {
//       equipos: (q.items?.equipos || []).map(fixItem),
//       accesorios: (q.items?.accesorios || []).map(fixItem),
//     },
//   };
// }
export function normalizarCotizacion(q) {
  const fixItem = (it) => (it.pid ? it : { ...it, name: limpiarEspacios(it.name || "") });
  return {
    ...q,
    cliente: normalizarTexto(q.cliente),
    proyecto: normalizarTexto(q.proyecto),
    atencion: normalizarTexto(q.atencion),
    direccion: normalizarTexto(q.direccion),
    nota: limpiarEspacios(q.nota),
    items: {
      equipos: (q.items?.equipos || []).map(fixItem),
      accesorios: (q.items?.accesorios || []).map(fixItem),
    },
  };
}