import jsPDF from "jspdf";
import logoUrl from "../assets/logo.png";

// ---------------------------------------------------------------------------
// PDF de "Salida de herramientas". Mismo estilo que el PDF de cotización
// (logo, encabezado con caja de número, colores y pie), en un módulo aparte.
//
// Uso:
//   previsualizarSalidaPDF(salida, { fecha })  -> devuelve una URL (blob) para mostrar el PDF en un <iframe>
//   exportarSalidaPDF(salida, { fecha })       -> descarga el PDF
//
// `salida` es lo que devuelve el backend: { id, numero, cliente, proyecto, responsable, items: [{ nombre, cantidad }] }
// `fecha` es el texto ya formateado de la fecha de salida (así se usa el mismo formateo que la pantalla).
// ---------------------------------------------------------------------------

// DATOS DE LA EMPRESA: mantenerlos iguales a los del PDF de cotización.
const EMPRESA = {
  nombre: "CAPTUS SOLUCIONES TECNOLÓGICAS S.A.C.",
  lineas: [
    "R.U.C. 20609689804",
    "VILLA MARÍA DEL TRIUNFO - LIMA",
    "ventas@captustec.com",
  ],
  pie: "954135990   ·   (01) 7556748   ·   ventas@captustec.com   ·   Captustec",
};

// Medidas y colores (mm), iguales a los de la cotización.
const W = 210;
const L = 15, R = 195;
const COL = { n: 15, desc: 24, cant: 104, sal: 120, ret: 138, obs: 156 }; // bordes de columna; el último es R
const FOOTER_SAFE_Y = 278;
const Y_CONTINUACION = 32;
const C = {
  azul: [16, 134, 191],
  verde: [116, 175, 53],
  caja: [238, 244, 232],
  linea: [205, 210, 215],
  gris: [90, 90, 90],
};
const FS = 9;       // tamaño de letra de las filas
const LH = 4.4;     // alto de línea (mm)
const FILA_MIN = 9; // alto mínimo de fila: deja espacio para marcar a mano

const limpio = (s) => String(s ?? "").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
const numeroDe = (s) => String(s.id ?? "").padStart(4, "0");

export function nombreArchivoSalida(s) {
  const cliente = limpio(s.cliente);
  return `Salida ${numeroDe(s)}${cliente ? " - " + cliente : ""}.pdf`;
}

function cargarLogo(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      c.getContext("2d").drawImage(img, 0, 0);
      resolve({ data: c.toDataURL("image/png"), ratio: img.width / img.height });
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ---------------------------------------------------------------------------
// DIBUJO
// ---------------------------------------------------------------------------
function dibujarEncabezado(doc, logo, s) {
  const lw = 50, lh = lw / logo.ratio, yTop = 9;
  doc.addImage(logo.data, "PNG", L, yTop, lw, lh);

  const xe = L + lw + 5, xCaja = 142, we = xCaja - xe - 4, alto = 3.7;
  doc.setLineHeightFactor(1.2);
  let ye = 13;
  [[EMPRESA.nombre, true], ...EMPRESA.lineas.map((t) => [t, false])].forEach(([txt, bold]) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 8.5 : 8);
    doc.setTextColor(...(bold ? [0, 0, 0] : C.gris));
    const ls = doc.splitTextToSize(txt, we);
    doc.text(ls, xe, ye);
    ye += ls.length * alto;
  });

  const num = numeroDe(s);
  doc.setFillColor(...C.caja);
  doc.setDrawColor(...C.gris); doc.setLineWidth(0.3);
  doc.rect(xCaja, 10, R - xCaja, 26, "FD");
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
  doc.text("SALIDA DE HERRAMIENTAS", (xCaja + R) / 2, 18, { align: "center" });
  doc.setFontSize(num.length > 8 ? 14 : 18);
  doc.text("Nº " + num, (xCaja + R) / 2, 29, { align: "center" });

  const yFin = Math.max(yTop + lh, ye, 36) + 3;
  doc.setDrawColor(...C.verde); doc.setLineWidth(0.7);
  doc.line(L, yFin, R, yFin);
  doc.setLineWidth(0.2);
  return yFin + 7;
}

function dibujarMini(doc, logo, s) {
  const w = 30;
  doc.addImage(logo.data, "PNG", L, 8, w, w / logo.ratio);
  doc.setTextColor(0); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text("SALIDA DE HERRAMIENTAS N° " + numeroDe(s), R, 17, { align: "right" });
  doc.setDrawColor(...C.verde); doc.setLineWidth(0.7);
  doc.line(L, 24, R, 24);
  doc.setLineWidth(0.2);
}

function dibujarDatos(doc, s, fecha, y0) {
  const fs = 9, lh = fs * 1.2 * 0.3528;
  doc.setLineHeightFactor(1.2);
  doc.setFontSize(fs);

  const izq = [
    ["Cotización:", (s.numero || "").trim() || "—"],
    ["Cliente:", (s.cliente || "").trim() || "—"],
    ["Proyecto:", (s.proyecto || "").trim() || "—"],
  ];
  const der = [
    ["Responsable:", (s.responsable || "").trim() || "—"],
    ["Fecha salida:", fecha || "—"],
  ];

  const bloque = (filas, xl, xv, ancho) => {
    let y = y0;
    filas.forEach(([lab, val]) => {
      doc.setFont("helvetica", "bold"); doc.text(lab, xl, y);
      doc.setFont("helvetica", "normal");
      const ls = doc.splitTextToSize(String(val), ancho);
      doc.text(ls, xv, y);
      y += ls.length * lh + 1.4;
    });
    return y;
  };

  doc.setTextColor(0);
  const yi = bloque(izq, L, L + 22, 124 - (L + 22) - 3);
  const yd = bloque(der, 130, 130 + 24, R - (130 + 24));
  return Math.max(yi, yd) + 4;
}

function dibujarTabla(doc, items, y0, logo, s) {
  let y = y0;
  doc.setLineHeightFactor(LH / (FS * 0.3528));

  const mid = (a, b) => (a + b) / 2;

  const cabecera = () => {
    doc.setFillColor(...C.azul);
    doc.rect(L, y, R - L, 7, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(255);
    const ty = y + 4.7;
    doc.text("N°", mid(COL.n, COL.desc), ty, { align: "center" });
    doc.text("HERRAMIENTA", mid(COL.desc, COL.cant), ty, { align: "center" });
    doc.text("CANT.", mid(COL.cant, COL.sal), ty, { align: "center" });
    doc.text("SALIDA", mid(COL.sal, COL.ret), ty, { align: "center" });
    doc.text("RETORNO", mid(COL.ret, COL.obs), ty, { align: "center" });
    doc.text("OBSERVACIÓN", mid(COL.obs, R), ty, { align: "center" });
    doc.setTextColor(0);
    y += 7;
  };
  const pagina = () => {
    doc.addPage();
    dibujarMini(doc, logo, s);
    y = Y_CONTINUACION;
    cabecera();
  };
  const linea = () => {
    doc.setDrawColor(...C.linea); doc.setLineWidth(0.2);
    doc.line(L, y, R, y);
  };
  const casilla = (xc, yc) => {
    doc.setDrawColor(0); doc.setLineWidth(0.4);
    doc.rect(xc - 2.2, yc - 2.2, 4.4, 4.4);
    doc.setLineWidth(0.2);
  };

  cabecera();

  items.forEach((it, i) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(FS); doc.setTextColor(0);
    const ls = doc.splitTextToSize(String(it.nombre ?? ""), COL.cant - COL.desc - 4);
    const h = Math.max(FILA_MIN, ls.length * LH + 4);
    if (y + h > FOOTER_SAFE_Y - 10) { pagina(); doc.setFont("helvetica", "normal"); doc.setFontSize(FS); doc.setTextColor(0); }

    const cy = y + h / 2;
    const base = cy + 1.2; // baseline para centrar verticalmente una línea
    doc.text(String(i + 1), mid(COL.n, COL.desc), base, { align: "center" });
    doc.text(ls, COL.desc + 2, base - ((ls.length - 1) * LH) / 2);
    doc.text(String(it.cantidad), mid(COL.cant, COL.sal), base, { align: "center" });
    casilla(mid(COL.sal, COL.ret), cy);
    casilla(mid(COL.ret, COL.obs), cy);
    y += h;
    linea();
  });

  const unidades = items.reduce((a, it) => a + (Number(it.cantidad) || 0), 0);
  y += 5;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(...C.gris);
  doc.text(`Total: ${items.length} herramienta${items.length === 1 ? "" : "s"} · ${unidades} unidad${unidades === 1 ? "" : "es"}`, L, y);
  doc.setTextColor(0);
  return y;
}

function dibujarFirmas(doc, y, logo, s) {
  y += 8;
  if (y + 42 > FOOTER_SAFE_Y) {
    doc.addPage();
    dibujarMini(doc, logo, s);
    y = Y_CONTINUACION;
  }
  y += 28; // espacio para firmar
  doc.setDrawColor(...C.gris); doc.setLineWidth(0.3);
  doc.line(L, y, L + 70, y);
  doc.line(R - 70, y, R, y);
  doc.setLineWidth(0.2);

  doc.setTextColor(0); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text("Responsable", L + 35, y + 5, { align: "center" });
  doc.text("Almacén", R - 35, y + 5, { align: "center" });

  const nombre = (s.responsable || "").trim();
  if (nombre) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...C.gris);
    doc.text(doc.splitTextToSize(nombre, 68)[0], L + 35, y + 9.5, { align: "center" });
    doc.setTextColor(0);
  }
}

function dibujarPies(doc) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...C.linea); doc.setLineWidth(0.2);
    doc.line(L, 284, R, 284);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...C.gris);
    doc.text(EMPRESA.pie, W / 2, 289, { align: "center" });
    doc.text(`Página ${i} de ${total}`, W / 2, 293, { align: "center" });
  }
  doc.setTextColor(0);
}

// Separado para poder probarlo sin navegador (el logo se pasa ya cargado).
export function construirSalidaPDF(s, logo, fecha) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setProperties({ title: nombreArchivoSalida(s).replace(/\.pdf$/i, "") });

  let y = dibujarEncabezado(doc, logo, s);
  y = dibujarDatos(doc, s, fecha, y);
  y = dibujarTabla(doc, s.items || [], y, logo, s);
  dibujarFirmas(doc, y, logo, s);
  dibujarPies(doc);
  return doc;
}

async function generar(s, { fecha } = {}) {
  const logo = await cargarLogo(logoUrl);
  return construirSalidaPDF(s, logo, fecha);
}

export async function exportarSalidaPDF(s, opts) {
  const doc = await generar(s, opts);
  doc.save(nombreArchivoSalida(s));
}

// URL temporal del PDF para la vista previa. Quien la use debe llamar URL.revokeObjectURL(url) al cerrar.
export async function previsualizarSalidaPDF(s, opts) {
  const doc = await generar(s, opts);
  return URL.createObjectURL(doc.output("blob"));
}