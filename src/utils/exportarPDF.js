// src/utils/exportarPDF.js
// 4 plantillas sobre la misma membretada de CAPTUSTEC:
//   simple -> EQUIPO (1 sección) + SUBTOTAL/IGV (si aplica) + TOTAL
//   alarma -> KIT (precio fijo) + INCLUYE + ADICIONALES + TRANSPORTE + INSTALACIÓN + TOTAL
//   caci   -> KIT + ADICIONALES + MATERIALES + SEÑALÉTICA + INSTALACIÓN/CONFIG + CERTIFICADO + TOTAL
//   cerco  -> igual que caci (los bloques vacíos no se dibujan)
import jsPDF from "jspdf";
import membreteUrl from "../assets/membrete.png";

// La plantilla se deduce sola del kit cargado (nombre del kit + proyecto). Sin kit = equipo simple.
// Si el kit trae `plantilla` en su patch ("alarma" | "caci" | "cerco"), se respeta.
export function plantillaDe(q) {
  if (q.plantilla === "kit") return "alarma";
  if (["simple", "alarma", "caci", "cerco"].includes(q.plantilla)) return q.plantilla;
  const hayKit = q.kitOrigen || (q.items?.equipos || []).some((i) => i.deKit);
  if (!hayKit) return "simple";
  const t = `${q.kitOrigen || ""} ${q.proyecto || ""}`.toLowerCase();
  if (/cerco|el[eé]ctric/.test(t)) return "cerco";
  if (/caci|incendio|fire|humo/.test(t)) return "caci";
  if (/alarma|shoctix|hagroy|rf3|voz|perifoneo|sirena/.test(t)) return "alarma";
  return "simple";
}

const W = 210, H = 297;
const X = { l: 22, cant: 34, prod: 124, unit: 157, r: 190 };
const FOOTER_SAFE_Y = 278;
const Y_CONTINUACION = 42;
const IGV = 1.18;
const n2 = (n) => (Number(n) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function cargarImagenBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      c.getContext("2d").drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function nombreItem(item, cat, catalog) {
  if (item.name) return item.name;
  const p = (catalog[cat] || []).find((x) => x.id === item.pid);
  return p ? p.name : "Producto";
}

// ---------------------------------------------------------------------------
// FILAS. Todo sale de lo que ya existe en la cotización:
// Equipos principales, Accesorios, Mano de obra, Transporte y Certificado.
// ---------------------------------------------------------------------------
const lineasDe = (quote, cat, catalog) =>
  (quote.items[cat] || []).map((it) => ({
    t: "item", qty: it.qty, nombre: nombreItem(it, cat, catalog), pu: it.precio, deKit: !!it.deKit,
  }));
// Kit = equipos que cargó el kit. Lo agregado después = adicionales. Sin marcas, todo es kit.
const partirEquipos = (eq) => {
  const hayKit = eq.some((r) => r.deKit);
  return { kit: hayKit ? eq.filter((r) => r.deKit) : eq, adic: hayKit ? eq.filter((r) => !r.deKit) : [] };
};
const sumaFilas = (f) => f.reduce((a, r) => a + r.pu * r.qty, 0);
const cant = (r) => `${String(r.qty).padStart(2, "0")} ${r.nombre}`;
const aprobado = (e) => e?.required && e?.approval === "approved" && e.value > 0;
const manoDeObra = (q) => (q.laborApproval === "approved" ? q.laborValue || 0 : 0);
const nombreKit = (q) => (q.proyecto || q.kitOrigen || "Kit").trim();
const ajuste = (q, negrita) =>
  q.ajusteGlobal ? [{ t: "item", qty: 1, nombre: q.ajusteGlobal < 0 ? "DESCUENTO" : "AJUSTE", pu: q.ajusteGlobal, bold: negrita }] : [];

function extrasSueltos(quote, etiquetaMO, negrita) {
  const out = [];
  if (aprobado(quote.transporte)) out.push({ t: "item", qty: 1, nombre: "TRANSPORTE", pu: quote.transporte.value, bold: negrita });
  if (manoDeObra(quote) > 0) out.push({ t: "item", qty: 1, nombre: etiquetaMO, pu: manoDeObra(quote), bold: negrita });
  if (aprobado(quote.certificado)) out.push({ t: "item", qty: 1, nombre: "CERTIFICADO", pu: quote.certificado.value, bold: negrita });
  return [...out, ...ajuste(quote, negrita)];
}

// EQUIPO simple: una sola sección con equipos y accesorios.
function filasSimple(quote, summary, catalog) {
  const f = quote.mostrarIgv ? 1 / IGV : 1; // con IGV desglosado, las líneas van en neto (como la 0451)
  const neto = (r) => ({ ...r, pu: r.pu * f });
  const rows = [
    { t: "seccion", texto: "EQUIPO" },
    ...[...lineasDe(quote, "equipos", catalog), ...lineasDe(quote, "accesorios", catalog)].map(neto),
  ];
  const extras = extrasSueltos(quote, "MANO DE OBRA", false).map(neto);
  if (extras.length) rows.push({ t: "vacio" }, ...extras);
  if (quote.mostrarIgv) {
    const subtotal = summary.ventaTotal / IGV;
    rows.push(
      { t: "vacio" },
      { t: "resumen", etiqueta: "Subtotal", valor: subtotal },
      { t: "resumen", etiqueta: "IGV", valor: summary.ventaTotal - subtotal }
    );
  }
  return rows;
}

// KIT / ALARMA: lo que cargó el kit = KIT (precio fijo + incluye); lo agregado después y los accesorios = adicionales.
function filasAlarma(quote, catalog) {
  const { kit, adic } = partirEquipos(lineasDe(quote, "equipos", catalog));
  const rows = [{ t: "seccion", texto: "EQUIPOS ALARMA COMUNITARIA" }];
  if (kit.length) rows.push(
    { t: "item", qty: 1, nombre: nombreKit(quote), pu: sumaFilas(kit) },
    { t: "incluye", texto: "Incluye:" },
    ...kit.map((r) => ({ t: "incluye", texto: cant(r) }))
  );
  rows.push(...adic, ...lineasDe(quote, "accesorios", catalog));
  const extras = extrasSueltos(quote, "INSTALACIÓN", true);
  if (extras.length) rows.push({ t: "vacio" }, ...extras);
  return rows;
}

// KIT / PROYECTO (CACI y cerco eléctrico): kit, adicionales, materiales, señalética, instalación, certificado.
const INSTALACION_DET = {
  caci: ["Instalación y configuración del sistema CACI", "Capacitación del sistema al finalizar la instalación"],
  cerco: ["Instalación y configuración del cerco eléctrico", "Capacitación del sistema al finalizar la instalación"],
};
const CERTIFICADO_DET = {
  caci: "Emisión de certificado de operatividad – sistema CACI + MEMORIAL DEL CACI",
  cerco: "Emisión de certificado de operatividad del sistema",
};

function filasProyecto(quote, catalog, p) {
  const { kit, adic } = partirEquipos(lineasDe(quote, "equipos", catalog));
  const ac = lineasDe(quote, "accesorios", catalog);
  const esSenal = (r) => /se[ñn]al/i.test(r.nombre);
  const rows = [];
  if (kit.length) rows.push(
    { t: "item", qty: 1, nombre: nombreKit(quote).toUpperCase(), pu: sumaFilas(kit), bold: true },
    ...kit.map((r) => ({ t: "detalle", texto: cant(r) }))
  );
  const bloque = (titulo, lista) => {
    if (!lista.length) return;
    if (rows.length) rows.push({ t: "vacio" });
    rows.push({ t: "seccion", texto: titulo, valor: sumaFilas(lista) }, ...lista);
  };
  bloque(p === "caci" ? "OTROS EQUIPOS CACI ADICIONALES" : "OTROS EQUIPOS ADICIONALES", adic);
  bloque("MATERIALES PARA LA INSTALACIÓN", ac.filter((r) => !esSenal(r)));
  bloque("SEÑALÉTICA FOTOLUMINISCENTE", ac.filter(esSenal));

  if (manoDeObra(quote) > 0) {
    rows.push({ t: "vacio" }, { t: "item", qty: 1, nombre: "SERVICIO DE INSTALACIÓN", pu: manoDeObra(quote), bold: true });
    INSTALACION_DET[p].forEach((s) => rows.push({ t: "detalle", texto: s }));
    if (!aprobado(quote.transporte)) rows.push({ t: "detalle", texto: "Incluye transporte" });
  }
  if (aprobado(quote.certificado)) {
    rows.push(
      { t: "vacio" },
      { t: "item", qty: 1, nombre: "EMISIÓN DE CERTIFICADOS", pu: quote.certificado.value, bold: true },
      { t: "detalle", texto: CERTIFICADO_DET[p] },
      { t: "incluye", texto: "El certificado incluye la firma de Ing. Eléctrico colegiado" }
    );
  }
  if (aprobado(quote.transporte)) rows.push({ t: "vacio" }, { t: "item", qty: 1, nombre: "TRANSPORTE", pu: quote.transporte.value, bold: true });
  rows.push(...ajuste(quote, true));
  return rows;
}

function condiciones(quote, p) {
  if (p === "caci" || p === "cerco") return [
    "Pago a cuenta de banco al contado.",
    "Cotización válida por 05 días.",
    "Se confirma el servicio con adelanto del 60% del monto total.",
    "Garantía por servicio y equipos: 01 año",
    "Por servicio se emite RRHH",
    "Por equipos y bienes se emite factura o boleta",
  ];
  if (p === "simple" && quote.mostrarIgv) return [
    "Emitir orden de servicio/compra",
    "Pago a cuenta de banco con crédito de 15 días y anticipo del 60% del monto total.",
    "Se emite factura. El costo final incluye IGV.",
    "Validez de la cotización 05 días calendario.",
  ];
  return [
    "Pago a cuenta de banco. Se emite recibo o factura por los equipos y materiales.",
    "Validez de la cotización: 05 días calendario.",
  ];
}

// ---------------------------------------------------------------------------
// DIBUJO. Se genera normal; si pasa de 1 hoja, se regenera en modo compacto.
// ---------------------------------------------------------------------------
const TAM = (c) => (c ? { fs: 8, fsInc: 7.5, lh: 3.8, vacio: 2, pad: 0.6 } : { fs: 9, fsInc: 8.5, lh: 4.6, vacio: 3, pad: 1 });

function dibujarTabla(doc, rows, total, etiquetaTotal, y0, membrete, t) {
  let y = y0, top = y0;
  doc.setLineHeightFactor(t.lh / (t.fs * 0.3528));

  const borde = () => {
    doc.setDrawColor(0); doc.setLineWidth(0.2);
    doc.rect(X.l, top, X.r - X.l, y - top);
    [X.cant, X.prod, X.unit].forEach((x) => doc.line(x, top, x, y));
  };
  const cabecera = () => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(t.fs); doc.setTextColor(0);
    const ty = y + 4.2;
    doc.text("CANT", (X.l + X.cant) / 2, ty, { align: "center" });
    doc.text("PRODUCTO", (X.cant + X.prod) / 2, ty, { align: "center" });
    doc.text("COSTO UNITARIO", (X.prod + X.unit) / 2, ty, { align: "center" });
    doc.text("COSTOS TOTAL", (X.unit + X.r) / 2, ty, { align: "center" });
    y += 6; doc.line(X.l, y, X.r, y);
  };
  const pagina = () => {
    borde();
    doc.addPage();
    doc.addImage(membrete, "PNG", 0, 0, W, H);
    y = Y_CONTINUACION; top = y;
    cabecera();
  };
  const fuente = (r) => {
    const negrita = r.bold || r.t === "seccion" || r.t === "resumen";
    doc.setFont("helvetica", negrita ? "bold" : r.t === "incluye" ? "italic" : "normal");
    doc.setFontSize(r.t === "incluye" ? t.fsInc : t.fs);
  };

  cabecera();
  y += 2;

  rows.forEach((r) => {
    if (r.t === "vacio") { y += t.vacio; return; }
    const sangria = r.sangria ?? (r.t === "incluye" ? 5 : 0);
    fuente(r);
    const ls = r.t === "resumen" ? [r.etiqueta] : doc.splitTextToSize(r.texto ?? r.nombre, X.prod - X.cant - 4 - sangria);
    const h = ls.length * t.lh + t.pad;
    if (y + h > FOOTER_SAFE_Y - 10) { pagina(); y += 2; fuente(r); }

    const by = y + t.lh * 0.78;
    if (r.t === "resumen") {
      doc.text(r.etiqueta, X.unit - 3, by, { align: "right" });
      doc.text(n2(r.valor), X.r - 3, by, { align: "right" });
    } else {
      if (r.qty != null) doc.text(String(r.qty).padStart(2, "0"), (X.l + X.cant) / 2, by, { align: "center" });
      doc.text(ls, X.cant + 2 + sangria, by);
      if (r.pu != null) {
        doc.text(n2(r.pu), X.unit - 3, by, { align: "right" });
        doc.text(n2(r.pu * r.qty), X.r - 3, by, { align: "right" });
      }
      if (r.valor != null) doc.text(n2(r.valor), X.r - 3, by, { align: "right" });
    }
    y += h;
  });

  // TOTAL: siempre
  y += 2;
  if (y + 8 > FOOTER_SAFE_Y) pagina();
  doc.setFillColor(255, 242, 0);
  doc.rect(X.unit, y, X.r - X.unit, 8, "F");
  doc.setDrawColor(0); doc.line(X.l, y, X.r, y);
  doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text(etiquetaTotal, X.unit - 3, y + 5.5, { align: "right" });
  doc.text("S/. " + n2(total), X.r - 3, y + 5.5, { align: "right" });
  y += 8;
  borde();
  return y;
}

function dibujarCierre(doc, y, membrete, quote, p, c) {
  const k = c ? { a: 4, b: 3.5, g: 5, t: 4, l: 3.4, fs: 8, fc: 7.5 } : { a: 5, b: 4, g: 9, t: 5, l: 4, fs: 9, fc: 8.5 };
  doc.setFont("helvetica", "normal"); doc.setFontSize(k.fc);
  const conds = condiciones(quote, p).flatMap((s) => doc.splitTextToSize(s, 168));
  const alto = k.a + k.b + k.g + k.t + conds.length * k.l + k.g + k.t + 3 * k.l + 4;

  y += c ? 5 : 8;
  if (y > FOOTER_SAFE_Y - alto) { doc.addPage(); doc.addImage(membrete, "PNG", 0, 0, W, H); y = Y_CONTINUACION; }
  const L = X.l;
  doc.setTextColor(0);

  doc.setFontSize(k.fs);
  doc.text("ATENTAMENTE,", L, y); y += k.a;
  doc.setFont("helvetica", "bold"); doc.text("Sergio Gómez Cuadros", L, y); y += k.b;
  doc.setFont("helvetica", "normal"); doc.text("CAPTUSTEC SAC  —  934300161", L, y); y += k.g;

  doc.setFont("helvetica", "bold"); doc.text("CONDICIONES DE LA VENTA", L, y); y += k.t;
  doc.setFont("helvetica", "normal"); doc.setFontSize(k.fc);
  conds.forEach((s) => { doc.text(s, L, y); y += k.l; });
  y += k.g - 4;

  doc.setFontSize(k.fs); doc.setFont("helvetica", "bold"); doc.text("CUENTA BANCARIA", L, y); y += k.t;
  doc.setFont("helvetica", "normal"); doc.setFontSize(k.fc);
  doc.text("A nombre de: CAPTUS SOLUCIONES TECNOLÓGICAS SAC", L, y); y += k.l;
  doc.text("Cuenta Interbank: 200-3005505249", L, y); y += k.l;
  doc.text("CCI: 003-200-003005505249-39", L, y);
}

function construir(quote, summary, catalog, membrete, compacto) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const p = plantillaDe(quote);

  doc.addImage(membrete, "PNG", 0, 0, W, H);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("COTIZACIÓN N° " + (quote.numero || quote.id.slice(-4)), X.l, 20);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  const fecha = new Date(quote.fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
  doc.text("Lima, " + fecha, X.l, 26);

  let y = 36;
  const conRuc = !!quote.ruc?.trim();
  doc.setFont("helvetica", "bold");
  doc.text("Señor(es):" + (conRuc && quote.cliente ? " " + quote.cliente : ""), X.l, y); y += 5;
  if (conRuc) { doc.text("RUC: " + quote.ruc.trim(), X.l, y); y += 5; }
  if (quote.atencion || !conRuc) { doc.text("ATENCIÓN: " + (quote.atencion || quote.cliente || "—"), X.l, y); y += 5; }
  doc.setFont("helvetica", "normal");
  if (quote.direccion) { doc.text("DIRECCIÓN: " + quote.direccion, X.l, y); y += 5; }
  y += 3;
  doc.text("Estimados señores:", X.l, y); y += 5;
  doc.setFontSize(9);
  const objeto = p === "caci" || p === "cerco" ? "nuestra cotización" : "nuestros productos";
  doc.text(`Reciba un cordial saludo, nos dirigimos a usted para presentar ${objeto} según nuestra lista de precios.`, X.l, y, { maxWidth: X.r - X.l });
  y += 9;

  const rows = p === "simple" ? filasSimple(quote, summary, catalog)
    : p === "alarma" ? filasAlarma(quote, catalog)
    : filasProyecto(quote, catalog, p);
  const etiquetaTotal = p === "caci" || p === "cerco" ? "TOTAL" : p === "simple" && quote.mostrarIgv ? "Costo Total" : "Costo Final";

  // El total sale de summary: una sola fuente de verdad.
  const yFin = dibujarTabla(doc, rows, summary.ventaTotal, etiquetaTotal, y, membrete, TAM(compacto));
  dibujarCierre(doc, yFin, membrete, quote, p, compacto);
  return doc;
}

// ---------------------------------------------------------------------------
// API PÚBLICA (misma firma que antes)
// ---------------------------------------------------------------------------
export async function exportarPDF(quote, summary, catalog) {
  const membrete = await cargarImagenBase64(membreteUrl);
  let doc = construir(quote, summary, catalog, membrete, false);
  if (doc.getNumberOfPages() > 1) {
    const compacto = construir(quote, summary, catalog, membrete, true);
    if (compacto.getNumberOfPages() < doc.getNumberOfPages()) doc = compacto;
  }
  doc.save("cotizacion-" + (quote.numero || quote.id) + ".pdf");
}