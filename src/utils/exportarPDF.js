// import jsPDF from "jspdf";
// import logoUrl from "../assets/logo.png";

// // ---------------------------------------------------------------------------
// // DATOS DE LA EMPRESA: edítalos aquí, no hay que tocar el resto del archivo.
// // ---------------------------------------------------------------------------
// const EMPRESA = {
//   nombre: "CAPTUS SOLUCIONES TECNOLÓGICAS S.A.C.",
//   lineas: [
//     "R.U.C. 20609689804",
//     // "CAL. EL CARMEN NRO. 112 URB. NUEVA ESPERANZA", delete for security reasons
//     "VILLA MARÍA DEL TRIUNFO - LIMA",
//     "ventas@captustec.com",
//   ],
//   vendedor: "Sergio Gómez Cuadros",
//   telefono: "934300161",
//   pie: "954135990   ·   (01) 7556748   ·   ventas@captustec.com   ·   Captustec",
//   banco: {
//     titular: "A nombre de: CAPTUS SOLUCIONES TECNOLÓGICAS SAC",
//     lineas: ["Cuenta Interbank: 200-3005505249", "CCI: 003-200-003005505249-39"],
//   },
//   validezDias: 5,
// };

// // La plantilla se deduce sola del kit cargado (nombre del kit + proyecto). Sin kit = equipo simple.
// // Si el kit trae `plantilla` en su patch ("alarma" | "caci" | "cerco"), se respeta.
// export function plantillaDe(q) {
//   if (q.plantilla === "kit") return "alarma";
//   if (["simple", "alarma", "caci", "cerco"].includes(q.plantilla)) return q.plantilla;
//   const hayKit = q.kitOrigen || (q.items?.equipos || []).some((i) => i.deKit);
//   if (!hayKit) return "simple";
//   const t = `${q.kitOrigen || ""} ${q.proyecto || ""}`.toLowerCase();
//   if (/cerco|el[eé]ctric/.test(t)) return "cerco";
//   if (/caci|incendio|fire|humo/.test(t)) return "caci";
//   if (/alarma|shoctix|hagroy|rf3|voz|perifoneo|sirena/.test(t)) return "alarma";
//   return "simple";
// }

// // ---------------------------------------------------------------------------
// // MEDIDAS Y COLORES (mm). Colores tomados del logo.
// // ---------------------------------------------------------------------------
// const W = 210, H = 297;
// const L = 15, R = 195;
// const COL = { n: 15, desc: 24, cant: 128, unit: 142, tot: 168 }; // bordes de columna; el último es R
// const FOOTER_SAFE_Y = 278;
// const Y_CONTINUACION = 32;
// const IGV = 1.18;
// const C = {
//   azul: [16, 134, 191],
//   verde: [116, 175, 53],
//   caja: [238, 244, 232],
//   linea: [205, 210, 215],
//   gris: [90, 90, 90],
// };
// const n2 = (n) => (Number(n) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// const f2 = (d) => d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });

// function cargarLogo(url) {
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.crossOrigin = "anonymous";
//     img.onload = () => {
//       const c = document.createElement("canvas");
//       c.width = img.width; c.height = img.height;
//       c.getContext("2d").drawImage(img, 0, 0);
//       resolve({ data: c.toDataURL("image/png"), ratio: img.width / img.height });
//     };
//     img.onerror = reject;
//     img.src = url;
//   });
// }

// function nombreItem(item, cat, catalog) {
//   if (item.name) return item.name;
//   const p = (catalog[cat] || []).find((x) => x.id === item.pid);
//   return p ? p.name : "Producto";
// }

// // ---------------------------------------------------------------------------
// // FILAS. Todo sale de lo que ya existe en la cotización:
// // Equipos principales, Accesorios, Mano de obra, Transporte y Certificado.
// // ---------------------------------------------------------------------------
// // Cada línea trae `incluye` si el producto del catálogo declara su contenido interno.
// const lineasDe = (quote, cat, catalog) =>
//   (quote.items[cat] || []).map((it) => {
//     const prod = (catalog[cat] || []).find((x) => x.id === it.pid);
//     return {
//       t: "item", qty: it.qty, nombre: nombreItem(it, cat, catalog), pu: it.precio,
//       deKit: !!it.deKit, incluye: prod?.incluye,
//     };
//   });
// // Kit = equipos que cargó el kit. Lo agregado después = adicionales. Sin marcas, todo es kit.
// const partirEquipos = (eq) => {
//   const hayKit = eq.some((r) => r.deKit);
//   return { kit: hayKit ? eq.filter((r) => r.deKit) : eq, adic: hayKit ? eq.filter((r) => !r.deKit) : [] };
// };
// const sumaFilas = (f) => f.reduce((a, r) => a + r.pu * r.qty, 0);
// const cant = (r) => `${String(r.qty).padStart(2, "0")} ${r.nombre}`;
// // Contenido del kit: si el producto declara `incluye`, se muestra eso (sin repetir el nombre del kit).
// // Si no lo declara, se muestra el producto tal cual.
// const detalleKit = (kit) =>
//   kit
//     .flatMap((r) => (r.incluye ? r.incluye.map(([q, n]) => ({ qty: q * r.qty, nombre: n })) : [r]))
//     .map(cant);
// const aprobado = (e) => e?.required && e?.approval === "approved" && e.value > 0;
// const manoDeObra = (q) => (q.laborApproval === "approved" ? q.laborValue || 0 : 0);
// const nombreKit = (q) => (q.proyecto || q.kitOrigen || "Kit").trim();
// // Servicios adicionales y descuentos que escribió el usuario (solo líneas con monto > 0), más el ajuste
// // heredado de cotizaciones antiguas. Estas filas deben sumar exactamente lo que entra en summary.ventaTotal.
// const ajuste = (q, negrita) => {
//   const servicios = (q.serviciosAdicionales || []).filter((l) => l.monto > 0);
//   const descuentos = (q.descuentos || []).filter((l) => l.monto > 0);
//   const rows = [];

//   if (servicios.length) {
//     const total = servicios.reduce((a, l) => a + l.monto, 0);
//     rows.push(
//       { t: "item", qty: 1, nombre: "OTRO SERVICIOS", pu: total, bold: negrita },
//       ...servicios.map((l) => ({ t: "detalle", texto: (l.descripcion || "").trim() || "Servicio adicional" }))
//     );
//   }

//   if (descuentos.length) {
//     const total = descuentos.reduce((a, l) => a + l.monto, 0);
//     if (rows.length) rows.push({ t: "vacio" });
//     rows.push(
//       { t: "item", qty: 1, nombre: "DESCUENTOS", pu: -total, bold: negrita },
//       ...descuentos.map((l) => ({ t: "detalle", texto: (l.descripcion || "").trim() || "Descuento" }))
//     );
//   }

//   if (q.ajusteGlobal) {
//     if (rows.length) rows.push({ t: "vacio" });
//     rows.push({ t: "item", qty: 1, nombre: q.ajusteGlobal < 0 ? "DESCUENTO" : "AJUSTE", pu: q.ajusteGlobal, bold: negrita });
//   }

//   return rows;
// };

// function extrasSueltos(quote, etiquetaMO, negrita) {
//   const out = [];
//   if (aprobado(quote.transporte)) out.push({ t: "item", qty: 1, nombre: "TRANSPORTE", pu: quote.transporte.value, bold: negrita });
//   if (manoDeObra(quote) > 0) out.push({ t: "item", qty: 1, nombre: etiquetaMO, pu: manoDeObra(quote), bold: negrita });
//   if (aprobado(quote.certificado)) out.push({ t: "item", qty: 1, nombre: "CERTIFICADO", pu: quote.certificado.value, bold: negrita });
//   return [...out, ...ajuste(quote, negrita)];
// }

// // EQUIPO simple: equipos y accesorios en una sola lista. El IGV, si aplica, se desglosa debajo (como Shoctix).
// // function filasSimple(quote, catalog) {
// //   const rows = [...lineasDe(quote, "equipos", catalog), ...lineasDe(quote, "accesorios", catalog)];
// //   const extras = extrasSueltos(quote, "MANO DE OBRA", false);
// //   if (extras.length) rows.push({ t: "vacio" }, ...extras);
// //   return rows;
// // }
// function filasSimple(quote, catalog) {
//   const rows = [...lineasDe(quote, "equipos", catalog), ...lineasDe(quote, "accesorios", catalog)];
//   const extras = extrasSueltos(quote, "MANO DE OBRA", true); // antes: false
//   if (extras.length) rows.push({ t: "vacio" }, ...extras);
//   return rows;
// }
// // KIT / ALARMA: lo que cargó el kit = KIT (precio fijo + incluye); lo agregado después y los accesorios = adicionales.
// function filasAlarma(quote, catalog) {
//   const { kit, adic } = partirEquipos(lineasDe(quote, "equipos", catalog));
//   const rows = [{ t: "seccion", texto: "EQUIPOS ALARMA COMUNITARIA" }];
//   if (kit.length) {
//     const det = detalleKit(kit);
//     rows.push({ t: "item", qty: 1, nombre: nombreKit(quote), pu: sumaFilas(kit) });
//     if (det.length) rows.push(
//       { t: "incluye", texto: "Incluye:" },
//       ...det.map((texto) => ({ t: "incluye", texto }))
//     );
//   }
//   rows.push(...adic, ...lineasDe(quote, "accesorios", catalog));
//   const extras = extrasSueltos(quote, "INSTALACIÓN", true);
//   if (extras.length) rows.push({ t: "vacio" }, ...extras);
//   return rows;
// }

// // KIT / PROYECTO (CACI y cerco eléctrico): kit, adicionales, materiales, señalética, instalación, certificado.
// const INSTALACION_DET = {
//   caci: ["Instalación y configuración del sistema CACI", "Capacitación del sistema al finalizar la instalación"],
//   cerco: ["Instalación y configuración del cerco eléctrico", "Capacitación del sistema al finalizar la instalación"],
// };
// const CERTIFICADO_DET = {
//   caci: "Emisión de certificado de operatividad – sistema CACI + MEMORIAL DEL CACI",
//   cerco: "Emisión de certificado de operatividad del sistema",
// };

// function filasProyecto(quote, catalog, p) {
//   const { kit, adic } = partirEquipos(lineasDe(quote, "equipos", catalog));
//   const ac = lineasDe(quote, "accesorios", catalog);
//   const esSenal = (r) => /se[ñn]al/i.test(r.nombre);
//   const rows = [];
//   if (kit.length) rows.push(
//     { t: "item", qty: 1, nombre: nombreKit(quote).toUpperCase(), pu: sumaFilas(kit), bold: true },
//     ...detalleKit(kit).map((texto) => ({ t: "detalle", texto }))
//   );
//   const bloque = (titulo, lista) => {
//     if (!lista.length) return;
//     if (rows.length) rows.push({ t: "vacio" });
//     rows.push({ t: "seccion", texto: titulo, valor: sumaFilas(lista) }, ...lista);
//   };
//   bloque(p === "caci" ? "OTROS EQUIPOS CACI ADICIONALES" : "OTROS EQUIPOS ADICIONALES", adic);
//   bloque("MATERIALES PARA LA INSTALACIÓN", ac.filter((r) => !esSenal(r)));
//   bloque("SEÑALÉTICA FOTOLUMINISCENTE", ac.filter(esSenal));

//   if (manoDeObra(quote) > 0) {
//     rows.push({ t: "vacio" }, { t: "item", qty: 1, nombre: "SERVICIO DE INSTALACIÓN", pu: manoDeObra(quote), bold: true });
//     INSTALACION_DET[p].forEach((s) => rows.push({ t: "detalle", texto: s }));
//     if (!aprobado(quote.transporte)) rows.push({ t: "detalle", texto: "Incluye transporte" });
//   }
//   if (aprobado(quote.certificado)) {
//     rows.push(
//       { t: "vacio" },
//       { t: "item", qty: 1, nombre: "EMISIÓN DE CERTIFICADOS", pu: quote.certificado.value, bold: true },
//       { t: "detalle", texto: CERTIFICADO_DET[p] },
//       { t: "incluye", texto: "El certificado incluye la firma de Ing. Eléctrico colegiado" }
//     );
//   }
//   if (aprobado(quote.transporte)) rows.push({ t: "vacio" }, { t: "item", qty: 1, nombre: "TRANSPORTE", pu: quote.transporte.value, bold: true });
//   rows.push(...ajuste(quote, true));
//   return rows;
// }

// function condiciones(quote, p) {
//   if (p === "caci" || p === "cerco") return [
//     "Pago a cuenta de banco al contado.",
//     "Cotización válida por 05 días.",
//     "Se confirma el servicio con adelanto del 60% del monto total.",
//     "Garantía por servicio y equipos: 01 año",
//     "Por servicio se emite RRHH",
//     "Por equipos y bienes se emite factura o boleta",
//   ];
//   if (p === "simple" && quote.mostrarIgv) return [
//     "Emitir orden de servicio/compra",
//     "Pago a cuenta de banco con crédito de 15 días y anticipo del 60% del monto total.",
//     "Se emite factura. El costo final incluye IGV.",
//     "Validez de la cotización 05 días calendario.",
//   ];
//   return [
//     "Pago a cuenta de banco. Se emite recibo o factura por los equipos y materiales.",
//     "Validez de la cotización: 05 días calendario.",
//   ];
// }

// // ---------------------------------------------------------------------------
// // DIBUJO
// // ---------------------------------------------------------------------------
// const numeroDe = (q) => q.numero || q.id.slice(-4);

// // Cabecera de la primera hoja: logo + datos de la empresa + caja con el número.
// function dibujarEncabezado(doc, logo, quote) {
//   const lw = 50, lh = lw / logo.ratio, yTop = 9;
//   doc.addImage(logo.data, "PNG", L, yTop, lw, lh);

//   // Datos de la empresa, a la derecha del logo
//   const xe = L + lw + 5, xCaja = 142, we = xCaja - xe - 4, alto = 3.7;
//   doc.setLineHeightFactor(1.2);
//   let ye = 13;
//   [[EMPRESA.nombre, true], ...EMPRESA.lineas.map((s) => [s, false])].forEach(([txt, bold]) => {
//     doc.setFont("helvetica", bold ? "bold" : "normal");
//     doc.setFontSize(bold ? 8.5 : 8);
//     doc.setTextColor(...(bold ? [0, 0, 0] : C.gris));
//     const ls = doc.splitTextToSize(txt, we);
//     doc.text(ls, xe, ye);
//     ye += ls.length * alto;
//   });

//   // Caja "COTIZACIÓN Nº"
//   const num = String(numeroDe(quote));
//   doc.setFillColor(...C.caja);
//   doc.setDrawColor(...C.gris); doc.setLineWidth(0.3);
//   doc.rect(xCaja, 10, R - xCaja, 26, "FD");
//   doc.setTextColor(0);
//   doc.setFont("helvetica", "bold"); doc.setFontSize(10);
//   doc.text("COTIZACIÓN Nº", (xCaja + R) / 2, 18, { align: "center" });
//   doc.setFontSize(num.length > 8 ? 14 : 18); // "0476-2026" (9 caracteres) entra a 14 pt
//   doc.text(num, (xCaja + R) / 2, 29, { align: "center" });

//   const yFin = Math.max(yTop + lh, ye, 36) + 3;
//   doc.setDrawColor(...C.verde); doc.setLineWidth(0.7);
//   doc.line(L, yFin, R, yFin);
//   doc.setLineWidth(0.2);
//   return yFin + 7;
// }

// // Cabecera reducida para las hojas siguientes.
// function dibujarMini(doc, logo, quote) {
//   const w = 30;
//   doc.addImage(logo.data, "PNG", L, 8, w, w / logo.ratio);
//   doc.setTextColor(0); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
//   doc.text("COTIZACIÓN N° " + numeroDe(quote), R, 17, { align: "right" });
//   doc.setDrawColor(...C.verde); doc.setLineWidth(0.7);
//   doc.line(L, 24, R, 24);
//   doc.setLineWidth(0.2);
// }

// // Cliente (izquierda) y detalles (derecha). Los textos largos se parten en varias líneas:
// // una dirección larga ya no se sale de la hoja.
// function dibujarDatos(doc, quote, y0) {
//   const fs = 9, lh = fs * 1.2 * 0.3528;
//   doc.setLineHeightFactor(1.2);
//   doc.setFontSize(fs);

//   const emision = new Date(quote.fecha);
//   const valida = new Date(emision);
//   valida.setDate(valida.getDate() + EMPRESA.validezDias);

//   const nro = (quote.ruc || "").trim();
//   const izq = [["Cliente:", (quote.cliente || "").trim() || "—"]];
//   if (nro) izq.push([nro.length === 8 ? "DNI:" : "RUC:", nro]);
//   if (quote.direccion?.trim()) izq.push(["Dirección:", quote.direccion.trim()]);
//   if (quote.atencion?.trim()) izq.push(["Atención:", quote.atencion.trim()]);
//   const der = [
//     ["Fecha emisión:", f2(emision)],
//     ["Válida hasta:", f2(valida)],
//     ["Vendedor:", EMPRESA.vendedor],
//     ["Teléfono:", EMPRESA.telefono],
//   ];

//   const bloque = (filas, xl, xv, ancho) => {
//     let y = y0;
//     filas.forEach(([lab, val]) => {
//       doc.setFont("helvetica", "bold"); doc.text(lab, xl, y);
//       doc.setFont("helvetica", "normal");
//       const ls = doc.splitTextToSize(String(val), ancho);
//       doc.text(ls, xv, y);
//       y += ls.length * lh + 1.4;
//     });
//     return y;
//   };

//   doc.setTextColor(0);
//   const yi = bloque(izq, L, L + 22, 128 - (L + 22) - 3);
//   const yd = bloque(der, 134, 134 + 24, R - (134 + 24));
//   return Math.max(yi, yd) + 4;
// }

// const TAM = (c) => (c ? { fs: 8, fsInc: 7.5, lh: 3.8, vacio: 2, pad: 0.5 } : { fs: 9, fsInc: 8.5, lh: 4.6, vacio: 3, pad: 0.8 });

// function dibujarTabla(doc, rows, total, conIgv, y0, logo, quote, t) {
//   let y = y0, n = 0;
//   doc.setLineHeightFactor(t.lh / (t.fs * 0.3528));

//   const cabecera = () => {
//     doc.setFillColor(...C.azul);
//     doc.rect(L, y, R - L, 7, "F");
//     doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(255);
//     const ty = y + 4.7;
//     doc.text("N°", (COL.n + COL.desc) / 2, ty, { align: "center" });
//     doc.text("DESCRIPCIÓN", (COL.desc + COL.cant) / 2, ty, { align: "center" });
//     doc.text("CANT.", (COL.cant + COL.unit) / 2, ty, { align: "center" });
//     doc.text("P. UNIT. (S/)", (COL.unit + COL.tot) / 2, ty, { align: "center" });
//     doc.text("TOTAL (S/)", (COL.tot + R) / 2, ty, { align: "center" });
//     doc.setTextColor(0);
//     y += 7;
//   };
//   const pagina = () => {
//     doc.addPage();
//     dibujarMini(doc, logo, quote);
//     y = Y_CONTINUACION;
//     cabecera();
//   };
//   const fuente = (r) => {
//     const negrita = r.bold || r.t === "seccion";
//     doc.setFont("helvetica", negrita ? "bold" : r.t === "incluye" ? "italic" : "normal");
//     doc.setFontSize(r.t === "incluye" ? t.fsInc : t.fs);
//     doc.setTextColor(r.t === "incluye" || r.t === "detalle" ? 70 : 0);
//   };
//   const linea = () => {
//     doc.setDrawColor(...C.linea); doc.setLineWidth(0.2);
//     doc.line(L, y, R, y);
//   };

//   cabecera();

//   rows.forEach((r, i) => {
//     if (r.t === "vacio") { y += t.vacio; return; }
//     const sangria = r.sangria ?? (r.t === "incluye" ? 5 : r.t === "detalle" ? 3 : 0);
//     fuente(r);
//     const ls = doc.splitTextToSize(r.texto ?? r.nombre, COL.cant - COL.desc - 4 - sangria);
//     const h = ls.length * t.lh + t.pad * 2;
//     if (y + h > FOOTER_SAFE_Y - 10) { pagina(); fuente(r); }

//     const by = y + t.pad + t.lh * 0.78;
//     if (r.t === "item") {
//       n += 1;
//       doc.text(String(n), (COL.n + COL.desc) / 2, by, { align: "center" });
//       doc.text(String(r.qty), (COL.cant + COL.unit) / 2, by, { align: "center" });
//     }
//     doc.text(ls, COL.desc + 2 + sangria, by);
//     if (r.pu != null) {
//       doc.text(n2(r.pu), COL.tot - 2, by, { align: "right" });
//       doc.text(n2(r.pu * r.qty), R - 2, by, { align: "right" });
//     }
//     if (r.valor != null) doc.text(n2(r.valor), R - 2, by, { align: "right" });
//     y += h;

//     // Línea fina entre filas; el detalle de un ítem queda pegado a su ítem.
//     const sig = rows[i + 1];
//     const pegado = sig && (sig.t === "incluye" || sig.t === "detalle");
//     if (!pegado && r.t !== "seccion") linea();
//   });

//   // Cierre de la tabla + totales (siempre)
//   linea();
//   y += 4;
//   if (y + (conIgv ? 11 : 0) + 9 > FOOTER_SAFE_Y) { pagina(); y += 2; }

//   doc.setTextColor(0);
//   const xEt = COL.tot - 5;
//   if (conIgv) {
//     const sub = total / IGV;
//     doc.setFont("helvetica", "normal"); doc.setFontSize(9);
//     [["Subtotal sin IGV", sub], ["IGV (18%)", total - sub]].forEach(([et, v]) => {
//       doc.text(et, xEt, y + 3.5, { align: "right" });
//       doc.text("S/ " + n2(v), R - 2, y + 3.5, { align: "right" });
//       y += 5.5;
//     });
//     y += 1;
//   }
//   doc.setFillColor(...C.azul);
//   doc.rect(COL.cant - 8, y, R - (COL.cant - 8), 9, "F");
//   doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
//   doc.text("TOTAL", xEt, y + 6.2, { align: "right" });
//   doc.text("S/ " + n2(total), R - 3, y + 6.2, { align: "right" });
//   doc.setTextColor(0);
//   return y + 9;
// }

// // Términos y condiciones + cuenta bancaria (caja, como en la referencia de Best Security).
// function dibujarCierre(doc, y, logo, quote, p, c) {
//   const k = c ? { fs: 8, fc: 7.5, l: 3.5, g: 4, t: 4 } : { fs: 9, fc: 8.5, l: 4.2, g: 6, t: 5 };
//   doc.setFont("helvetica", "normal"); doc.setFontSize(k.fc);
//   const conds = condiciones(quote, p).flatMap((s) => doc.splitTextToSize("-  " + s, R - L - 2));
//   const bancoLineas = [EMPRESA.banco.titular, ...EMPRESA.banco.lineas];
//   const altoBanco = 3 + k.t + bancoLineas.length * k.l + 2;
//   const alto = k.t + conds.length * k.l + k.g + altoBanco;

//   y += c ? 5 : 8;
//   if (y + alto > FOOTER_SAFE_Y) { doc.addPage(); dibujarMini(doc, logo, quote); y = Y_CONTINUACION; }

//   doc.setTextColor(0);
//   doc.setFont("helvetica", "bold"); doc.setFontSize(k.fs);
//   doc.text("TÉRMINOS Y CONDICIONES", L, y); y += k.t;
//   doc.setFont("helvetica", "normal"); doc.setFontSize(k.fc);
//   conds.forEach((s) => { doc.text(s, L, y); y += k.l; });
//   y += k.g - k.l + 1;

//   doc.setFillColor(...C.caja);
//   doc.setDrawColor(...C.linea); doc.setLineWidth(0.3);
//   doc.rect(L, y, R - L, altoBanco, "FD");
//   let yy = y + 3 + 3.2;
//   doc.setFont("helvetica", "bold"); doc.setFontSize(k.fs);
//   doc.text("CUENTA BANCARIA", L + 3, yy); yy += k.t;
//   doc.setFont("helvetica", "normal"); doc.setFontSize(k.fc);
//   bancoLineas.forEach((s) => { doc.text(s, L + 3, yy); yy += k.l; });
// }

// // Pie en todas las hojas: contacto y numeración.
// function dibujarPies(doc) {
//   const total = doc.getNumberOfPages();
//   for (let i = 1; i <= total; i++) {
//     doc.setPage(i);
//     doc.setDrawColor(...C.linea); doc.setLineWidth(0.2);
//     doc.line(L, 284, R, 284);
//     doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...C.gris);
//     doc.text(EMPRESA.pie, W / 2, 289, { align: "center" });
//     doc.text(`Página ${i} de ${total}`, W / 2, 293, { align: "center" });
//   }
//   doc.setTextColor(0);
// }

// function construir(quote, summary, catalog, logo, compacto) {
//   const doc = new jsPDF({ unit: "mm", format: "a4" });
//   const p = plantillaDe(quote);
//   doc.setProperties({ title: nombreArchivoPDF(quote).replace(/\.pdf$/i, "") });

//   let y = dibujarEncabezado(doc, logo, quote);
//   y = dibujarDatos(doc, quote, y);

//   const rows = p === "simple" ? filasSimple(quote, catalog)
//     : p === "alarma" ? filasAlarma(quote, catalog)
//     : filasProyecto(quote, catalog, p);
//   const conIgv = p === "simple" && !!quote.mostrarIgv;

//   // El total sale de summary: una sola fuente de verdad.
//   const yFin = dibujarTabla(doc, rows, summary.ventaTotal, conIgv, y, logo, quote, TAM(compacto));
//   dibujarCierre(doc, yFin, logo, quote, p, compacto);
//   dibujarPies(doc);
//   return doc;
// }

// // ---------------------------------------------------------------------------
// // NOMBRE DEL ARCHIVO: "<correlativo> - <nombre que escribe el usuario>.pdf"
// // Ej.: "0476-2026 - Alarma comunitaria Surco.pdf". Sin nombre: "0476-2026.pdf".
// // ---------------------------------------------------------------------------
// export function nombreArchivoPDF(quote) {
//   const limpio = (s) => String(s || "").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
//   const num = limpio(numeroDe(quote));
//   const nombre = limpio(quote.nombreArchivo);
//   return (nombre ? `${num} - ${nombre}` : num) + ".pdf";
// }

// // ---------------------------------------------------------------------------
// // API PÚBLICA
// // ---------------------------------------------------------------------------
// async function generarPDF(quote, summary, catalog) {
//   const logo = await cargarLogo(logoUrl);
//   let doc = construir(quote, summary, catalog, logo, false);
//   if (doc.getNumberOfPages() > 1) {
//     const compacto = construir(quote, summary, catalog, logo, true);
//     if (compacto.getNumberOfPages() < doc.getNumberOfPages()) doc = compacto;
//   }
//   return doc;
// }

// export async function exportarPDF(quote, summary, catalog) {
//   const doc = await generarPDF(quote, summary, catalog);
//   doc.save(nombreArchivoPDF(quote));
// }

// // Devuelve una URL temporal del PDF (quien la use debe liberarla con URL.revokeObjectURL).
// export async function previsualizarPDF(quote, summary, catalog) {
//   const doc = await generarPDF(quote, summary, catalog);
//   return URL.createObjectURL(doc.output("blob"));
// }
import jsPDF from "jspdf";
import logoUrl from "../assets/logo.png";
import { getCarpetaExport, guardarEnCarpeta } from "./carpetaExport";

// ---------------------------------------------------------------------------
// DATOS DE LA EMPRESA: edítalos aquí, no hay que tocar el resto del archivo.
// ---------------------------------------------------------------------------
const EMPRESA = {
  nombre: "CAPTUS SOLUCIONES TECNOLÓGICAS S.A.C.",
  lineas: [
    "R.U.C. 20609689804",
    // "CAL. EL CARMEN NRO. 112 URB. NUEVA ESPERANZA", delete for security reasons
    "VILLA MARÍA DEL TRIUNFO - LIMA",
    "ventas@captustec.com",
  ],
  vendedor: "Sergio Gómez Cuadros",
  telefono: "934300161",
  pie: "954135990   ·   (01) 7556748   ·   ventas@captustec.com   ·   Captustec",
  banco: {
    titular: "A nombre de: CAPTUS SOLUCIONES TECNOLÓGICAS SAC",
    lineas: ["Cuenta Interbank: 200-3005505249", "CCI: 003-200-003005505249-39"],
  },
  validezDias: 5,
};

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

// ---------------------------------------------------------------------------
// MEDIDAS Y COLORES (mm). Colores tomados del logo.
// ---------------------------------------------------------------------------
const W = 210, H = 297;
const L = 15, R = 195;
const COL = { n: 15, desc: 24, cant: 128, unit: 142, tot: 168 }; // bordes de columna; el último es R
const FOOTER_SAFE_Y = 278;
const Y_CONTINUACION = 32;
const IGV = 1.18;
const C = {
  azul: [16, 134, 191],
  verde: [116, 175, 53],
  caja: [238, 244, 232],
  linea: [205, 210, 215],
  gris: [90, 90, 90],
};
const n2 = (n) => (Number(n) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const f2 = (d) => d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });

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

function nombreItem(item, cat, catalog) {
  if (item.name) return item.name;
  const p = (catalog[cat] || []).find((x) => x.id === item.pid);
  return p ? p.name : "Producto";
}

// ---------------------------------------------------------------------------
// FILAS. Todo sale de lo que ya existe en la cotización:
// Equipos principales, Accesorios, Mano de obra, Transporte y Certificado.
// ---------------------------------------------------------------------------
// Cada línea trae `incluye` si el producto del catálogo declara su contenido interno.
const lineasDe = (quote, cat, catalog) =>
  (quote.items[cat] || []).map((it) => {
    const prod = (catalog[cat] || []).find((x) => x.id === it.pid);
    return {
      t: "item", qty: it.qty, nombre: nombreItem(it, cat, catalog), pu: it.precio,
      deKit: !!it.deKit, incluye: prod?.incluye,
    };
  });
// Kit = equipos que cargó el kit. Lo agregado después = adicionales. Sin marcas, todo es kit.
const partirEquipos = (eq) => {
  const hayKit = eq.some((r) => r.deKit);
  return { kit: hayKit ? eq.filter((r) => r.deKit) : eq, adic: hayKit ? eq.filter((r) => !r.deKit) : [] };
};
const sumaFilas = (f) => f.reduce((a, r) => a + r.pu * r.qty, 0);
const cant = (r) => `${String(r.qty).padStart(2, "0")} ${r.nombre}`;
// Contenido del kit: si el producto declara `incluye`, se muestra eso (sin repetir el nombre del kit).
// Si no lo declara, se muestra el producto tal cual.
const detalleKit = (kit) =>
  kit
    .flatMap((r) => (r.incluye ? r.incluye.map(([q, n]) => ({ qty: q * r.qty, nombre: n })) : [r]))
    .map(cant);
const aprobado = (e) => e?.required && e?.approval === "approved" && e.value > 0;
const manoDeObra = (q) => (q.laborApproval === "approved" ? q.laborValue || 0 : 0);
const nombreKit = (q) => (q.proyecto || q.kitOrigen || "Kit").trim();
// Servicios adicionales y descuentos que escribió el usuario (solo líneas con monto > 0), más el ajuste
// heredado de cotizaciones antiguas. Estas filas deben sumar exactamente lo que entra en summary.ventaTotal.
const ajuste = (q, negrita) => {
  const servicios = (q.serviciosAdicionales || []).filter((l) => l.monto > 0);
  const descuentos = (q.descuentos || []).filter((l) => l.monto > 0);
  const rows = [];

  if (servicios.length) {
    const total = servicios.reduce((a, l) => a + l.monto, 0);
    rows.push(
      { t: "item", qty: 1, nombre: "OTRO SERVICIOS", pu: total, bold: negrita },
      ...servicios.map((l) => ({ t: "detalle", texto: (l.descripcion || "").trim() || "Servicio adicional" }))
    );
  }

  if (descuentos.length) {
    const total = descuentos.reduce((a, l) => a + l.monto, 0);
    if (rows.length) rows.push({ t: "vacio" });
    rows.push(
      { t: "item", qty: 1, nombre: "DESCUENTOS", pu: -total, bold: negrita },
      ...descuentos.map((l) => ({ t: "detalle", texto: (l.descripcion || "").trim() || "Descuento" }))
    );
  }

  if (q.ajusteGlobal) {
    if (rows.length) rows.push({ t: "vacio" });
    rows.push({ t: "item", qty: 1, nombre: q.ajusteGlobal < 0 ? "DESCUENTO" : "AJUSTE", pu: q.ajusteGlobal, bold: negrita });
  }

  return rows;
};

function extrasSueltos(quote, etiquetaMO, negrita) {
  const out = [];
  if (aprobado(quote.transporte)) out.push({ t: "item", qty: 1, nombre: "TRANSPORTE", pu: quote.transporte.value, bold: negrita });
  if (manoDeObra(quote) > 0) out.push({ t: "item", qty: 1, nombre: etiquetaMO, pu: manoDeObra(quote), bold: negrita });
  if (aprobado(quote.certificado)) out.push({ t: "item", qty: 1, nombre: "CERTIFICADO", pu: quote.certificado.value, bold: negrita });
  return [...out, ...ajuste(quote, negrita)];
}

// EQUIPO simple: equipos y accesorios en una sola lista. El IGV, si aplica, se desglosa debajo (como Shoctix).
// function filasSimple(quote, catalog) {
//   const rows = [...lineasDe(quote, "equipos", catalog), ...lineasDe(quote, "accesorios", catalog)];
//   const extras = extrasSueltos(quote, "MANO DE OBRA", false);
//   if (extras.length) rows.push({ t: "vacio" }, ...extras);
//   return rows;
// }
function filasSimple(quote, catalog) {
  const rows = [...lineasDe(quote, "equipos", catalog), ...lineasDe(quote, "accesorios", catalog)];
  const extras = extrasSueltos(quote, "MANO DE OBRA", true); // antes: false
  if (extras.length) rows.push({ t: "vacio" }, ...extras);
  return rows;
}
// KIT / ALARMA: lo que cargó el kit = KIT (precio fijo + incluye); lo agregado después y los accesorios = adicionales.
function filasAlarma(quote, catalog) {
  const { kit, adic } = partirEquipos(lineasDe(quote, "equipos", catalog));
  const rows = [{ t: "seccion", texto: "EQUIPOS ALARMA COMUNITARIA" }];
  if (kit.length) {
    const det = detalleKit(kit);
    rows.push({ t: "item", qty: 1, nombre: nombreKit(quote), pu: sumaFilas(kit) });
    if (det.length) rows.push(
      { t: "incluye", texto: "Incluye:" },
      ...det.map((texto) => ({ t: "incluye", texto }))
    );
  }
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
    ...detalleKit(kit).map((texto) => ({ t: "detalle", texto }))
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

// La garantía es controlable desde el editor (quote.garantia: { activa, texto }).
// Cotizaciones antiguas que no tienen ese campo mantienen el comportamiento previo:
// la línea fija solo aparecía en CACI y cerco eléctrico.
function garantiaLinea(quote, p) {
  const g = quote.garantia;
  if (g) return g.activa && g.texto?.trim() ? g.texto.trim() : null;
  return (p === "caci" || p === "cerco") ? "Garantía por servicio y equipos: 01 año" : null;
}

function condiciones(quote, p) {
  const base = (p === "caci" || p === "cerco") ? [
    "Pago a cuenta de banco al contado.",
    "Cotización válida por 05 días.",
    "Se confirma el servicio con adelanto del 60% del monto total.",
    "Por servicio se emite RRHH",
    "Por equipos y bienes se emite factura o boleta",
  ] : (p === "simple" && quote.mostrarIgv) ? [
    "Emitir orden de servicio/compra",
    "Pago a cuenta de banco con crédito de 15 días y anticipo del 60% del monto total.",
    "Se emite factura. El costo final incluye IGV.",
    "Validez de la cotización 05 días calendario.",
  ] : [
    "Pago a cuenta de banco. Se emite recibo o factura por los equipos y materiales.",
    "Validez de la cotización: 05 días calendario.",
  ];

  const g = garantiaLinea(quote, p);
  return g ? [...base, g] : base;
}

// ---------------------------------------------------------------------------
// DIBUJO
// ---------------------------------------------------------------------------
const numeroDe = (q) => q.numero || q.id.slice(-4);

// Cabecera de la primera hoja: logo + datos de la empresa + caja con el número.
function dibujarEncabezado(doc, logo, quote) {
  const lw = 50, lh = lw / logo.ratio, yTop = 9;
  doc.addImage(logo.data, "PNG", L, yTop, lw, lh);

  // Datos de la empresa, a la derecha del logo
  const xe = L + lw + 5, xCaja = 142, we = xCaja - xe - 4, alto = 3.7;
  doc.setLineHeightFactor(1.2);
  let ye = 13;
  [[EMPRESA.nombre, true], ...EMPRESA.lineas.map((s) => [s, false])].forEach(([txt, bold]) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 8.5 : 8);
    doc.setTextColor(...(bold ? [0, 0, 0] : C.gris));
    const ls = doc.splitTextToSize(txt, we);
    doc.text(ls, xe, ye);
    ye += ls.length * alto;
  });

  // Caja "COTIZACIÓN Nº"
  const num = String(numeroDe(quote));
  doc.setFillColor(...C.caja);
  doc.setDrawColor(...C.gris); doc.setLineWidth(0.3);
  doc.rect(xCaja, 10, R - xCaja, 26, "FD");
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text("COTIZACIÓN Nº", (xCaja + R) / 2, 18, { align: "center" });
  doc.setFontSize(num.length > 8 ? 14 : 18); // "0476-2026" (9 caracteres) entra a 14 pt
  doc.text(num, (xCaja + R) / 2, 29, { align: "center" });

  const yFin = Math.max(yTop + lh, ye, 36) + 3;
  doc.setDrawColor(...C.verde); doc.setLineWidth(0.7);
  doc.line(L, yFin, R, yFin);
  doc.setLineWidth(0.2);
  return yFin + 7;
}

// Cabecera reducida para las hojas siguientes.
function dibujarMini(doc, logo, quote) {
  const w = 30;
  doc.addImage(logo.data, "PNG", L, 8, w, w / logo.ratio);
  doc.setTextColor(0); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text("COTIZACIÓN N° " + numeroDe(quote), R, 17, { align: "right" });
  doc.setDrawColor(...C.verde); doc.setLineWidth(0.7);
  doc.line(L, 24, R, 24);
  doc.setLineWidth(0.2);
}

// Cliente (izquierda) y detalles (derecha). Los textos largos se parten en varias líneas:
// una dirección larga ya no se sale de la hoja.
function dibujarDatos(doc, quote, y0) {
  const fs = 9, lh = fs * 1.2 * 0.3528;
  doc.setLineHeightFactor(1.2);
  doc.setFontSize(fs);

  const emision = new Date(quote.fecha);
  const valida = new Date(emision);
  valida.setDate(valida.getDate() + EMPRESA.validezDias);

  const nro = (quote.ruc || "").trim();
  const izq = [["Cliente:", (quote.cliente || "").trim() || "—"]];
  if (nro) izq.push([nro.length === 8 ? "DNI:" : "RUC:", nro]);
  if (quote.direccion?.trim()) izq.push(["Dirección:", quote.direccion.trim()]);
  if (quote.atencion?.trim()) izq.push(["Atención:", quote.atencion.trim()]);
  const der = [
    ["Fecha emisión:", f2(emision)],
    ["Válida hasta:", f2(valida)],
    ["Vendedor:", EMPRESA.vendedor],
    ["Teléfono:", EMPRESA.telefono],
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
  const yi = bloque(izq, L, L + 22, 128 - (L + 22) - 3);
  const yd = bloque(der, 134, 134 + 24, R - (134 + 24));
  return Math.max(yi, yd) + 4;
}

const TAM = (c) => (c ? { fs: 8, fsInc: 7.5, lh: 3.8, vacio: 2, pad: 0.5 } : { fs: 9, fsInc: 8.5, lh: 4.6, vacio: 3, pad: 0.8 });

function dibujarTabla(doc, rows, total, conIgv, y0, logo, quote, t) {
  let y = y0, n = 0;
  doc.setLineHeightFactor(t.lh / (t.fs * 0.3528));

  const cabecera = () => {
    doc.setFillColor(...C.azul);
    doc.rect(L, y, R - L, 7, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(255);
    const ty = y + 4.7;
    doc.text("N°", (COL.n + COL.desc) / 2, ty, { align: "center" });
    doc.text("DESCRIPCIÓN", (COL.desc + COL.cant) / 2, ty, { align: "center" });
    doc.text("CANT.", (COL.cant + COL.unit) / 2, ty, { align: "center" });
    doc.text("P. UNIT. (S/)", (COL.unit + COL.tot) / 2, ty, { align: "center" });
    doc.text("TOTAL (S/)", (COL.tot + R) / 2, ty, { align: "center" });
    doc.setTextColor(0);
    y += 7;
  };
  const pagina = () => {
    doc.addPage();
    dibujarMini(doc, logo, quote);
    y = Y_CONTINUACION;
    cabecera();
  };
  const fuente = (r) => {
    const negrita = r.bold || r.t === "seccion";
    doc.setFont("helvetica", negrita ? "bold" : r.t === "incluye" ? "italic" : "normal");
    doc.setFontSize(r.t === "incluye" ? t.fsInc : t.fs);
    doc.setTextColor(r.t === "incluye" || r.t === "detalle" ? 70 : 0);
  };
  const linea = () => {
    doc.setDrawColor(...C.linea); doc.setLineWidth(0.2);
    doc.line(L, y, R, y);
  };

  cabecera();

  rows.forEach((r, i) => {
    if (r.t === "vacio") { y += t.vacio; return; }
    const sangria = r.sangria ?? (r.t === "incluye" ? 5 : r.t === "detalle" ? 3 : 0);
    fuente(r);
    const ls = doc.splitTextToSize(r.texto ?? r.nombre, COL.cant - COL.desc - 4 - sangria);
    const h = ls.length * t.lh + t.pad * 2;
    if (y + h > FOOTER_SAFE_Y - 10) { pagina(); fuente(r); }

    const by = y + t.pad + t.lh * 0.78;
    if (r.t === "item") {
      n += 1;
      doc.text(String(n), (COL.n + COL.desc) / 2, by, { align: "center" });
      doc.text(String(r.qty), (COL.cant + COL.unit) / 2, by, { align: "center" });
    }
    doc.text(ls, COL.desc + 2 + sangria, by);
    if (r.pu != null) {
      doc.text(n2(r.pu), COL.tot - 2, by, { align: "right" });
      doc.text(n2(r.pu * r.qty), R - 2, by, { align: "right" });
    }
    if (r.valor != null) doc.text(n2(r.valor), R - 2, by, { align: "right" });
    y += h;

    // Línea fina entre filas; el detalle de un ítem queda pegado a su ítem.
    const sig = rows[i + 1];
    const pegado = sig && (sig.t === "incluye" || sig.t === "detalle");
    if (!pegado && r.t !== "seccion") linea();
  });

  // Cierre de la tabla + totales (siempre)
  linea();
  y += 4;
  if (y + (conIgv ? 11 : 0) + 9 > FOOTER_SAFE_Y) { pagina(); y += 2; }

  doc.setTextColor(0);
  const xEt = COL.tot - 5;
  if (conIgv) {
    const sub = total / IGV;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    [["Subtotal sin IGV", sub], ["IGV (18%)", total - sub]].forEach(([et, v]) => {
      doc.text(et, xEt, y + 3.5, { align: "right" });
      doc.text("S/ " + n2(v), R - 2, y + 3.5, { align: "right" });
      y += 5.5;
    });
    y += 1;
  }
  doc.setFillColor(...C.azul);
  doc.rect(COL.cant - 8, y, R - (COL.cant - 8), 9, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("TOTAL", xEt, y + 6.2, { align: "right" });
  doc.text("S/ " + n2(total), R - 3, y + 6.2, { align: "right" });
  doc.setTextColor(0);
  return y + 9;
}

// NOTA libre del usuario (ej. "materiales según demanda"). Va después de la tabla
// y antes de Términos y condiciones; si está vacía, no ocupa espacio.
function dibujarNota(doc, y, logo, quote, c) {
  const texto = (quote.nota || "").trim();
  if (!texto) return y;

  const k = c ? { fs: 8, fc: 7.5, l: 3.5, t: 4 } : { fs: 9, fc: 8.5, l: 4.2, t: 5 };
  doc.setFont("helvetica", "normal"); doc.setFontSize(k.fc);
  const lineas = doc.splitTextToSize(texto, R - L - 2);
  const alto = k.t + lineas.length * k.l + 2;

  y += c ? 5 : 8;
  if (y + alto > FOOTER_SAFE_Y) { doc.addPage(); dibujarMini(doc, logo, quote); y = Y_CONTINUACION; }

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold"); doc.setFontSize(k.fs);
  doc.text("NOTA", L, y); y += k.t;
  doc.setFont("helvetica", "normal"); doc.setFontSize(k.fc);
  lineas.forEach((s) => { doc.text(s, L, y); y += k.l; });
  return y;
}

// Términos y condiciones + cuenta bancaria (caja, como en la referencia de Best Security).
function dibujarCierre(doc, y, logo, quote, p, c) {
  const k = c ? { fs: 8, fc: 7.5, l: 3.5, g: 4, t: 4 } : { fs: 9, fc: 8.5, l: 4.2, g: 6, t: 5 };
  doc.setFont("helvetica", "normal"); doc.setFontSize(k.fc);
  const conds = condiciones(quote, p).flatMap((s) => doc.splitTextToSize("-  " + s, R - L - 2));
  const bancoLineas = [EMPRESA.banco.titular, ...EMPRESA.banco.lineas];
  const altoBanco = 3 + k.t + bancoLineas.length * k.l + 2;
  const alto = k.t + conds.length * k.l + k.g + altoBanco;

  y += c ? 5 : 8;
  if (y + alto > FOOTER_SAFE_Y) { doc.addPage(); dibujarMini(doc, logo, quote); y = Y_CONTINUACION; }

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold"); doc.setFontSize(k.fs);
  doc.text("TÉRMINOS Y CONDICIONES", L, y); y += k.t;
  doc.setFont("helvetica", "normal"); doc.setFontSize(k.fc);
  conds.forEach((s) => { doc.text(s, L, y); y += k.l; });
  y += k.g - k.l + 1;

  doc.setFillColor(...C.caja);
  doc.setDrawColor(...C.linea); doc.setLineWidth(0.3);
  doc.rect(L, y, R - L, altoBanco, "FD");
  let yy = y + 3 + 3.2;
  doc.setFont("helvetica", "bold"); doc.setFontSize(k.fs);
  doc.text("CUENTA BANCARIA", L + 3, yy); yy += k.t;
  doc.setFont("helvetica", "normal"); doc.setFontSize(k.fc);
  bancoLineas.forEach((s) => { doc.text(s, L + 3, yy); yy += k.l; });
}

// Pie en todas las hojas: contacto y numeración.
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

function construir(quote, summary, catalog, logo, compacto) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const p = plantillaDe(quote);
  doc.setProperties({ title: nombreArchivoPDF(quote).replace(/\.pdf$/i, "") });

  let y = dibujarEncabezado(doc, logo, quote);
  y = dibujarDatos(doc, quote, y);

  const rows = p === "simple" ? filasSimple(quote, catalog)
    : p === "alarma" ? filasAlarma(quote, catalog)
    : filasProyecto(quote, catalog, p);
  const conIgv = p === "simple" && !!quote.mostrarIgv;

  // El total sale de summary: una sola fuente de verdad.
  const yFin = dibujarTabla(doc, rows, summary.ventaTotal, conIgv, y, logo, quote, TAM(compacto));
  const yNota = dibujarNota(doc, yFin, logo, quote, compacto);
  dibujarCierre(doc, yNota, logo, quote, p, compacto);
  dibujarPies(doc);
  return doc;
}

// ---------------------------------------------------------------------------
// NOMBRE DEL ARCHIVO: "<correlativo> - <nombre que escribe el usuario>.pdf"
// Ej.: "0476-2026 - Alarma comunitaria Surco.pdf". Sin nombre: "0476-2026.pdf".
// ---------------------------------------------------------------------------
export function nombreArchivoPDF(quote) {
  const limpio = (s) => String(s || "").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
  const num = limpio(numeroDe(quote));
  const nombre = limpio(quote.nombreArchivo);
  return (nombre ? `${num} - ${nombre}` : num) + ".pdf";
}

// ---------------------------------------------------------------------------
// API PÚBLICA
// ---------------------------------------------------------------------------
async function generarPDF(quote, summary, catalog) {
  const logo = await cargarLogo(logoUrl);
  let doc = construir(quote, summary, catalog, logo, false);
  if (doc.getNumberOfPages() > 1) {
    const compacto = construir(quote, summary, catalog, logo, true);
    if (compacto.getNumberOfPages() < doc.getNumberOfPages()) doc = compacto;
  }
  return doc;
}

export async function exportarPDF(quote, summary, catalog) {
  const doc = await generarPDF(quote, summary, catalog);
  doc.save(nombreArchivoPDF(quote));
}

// Igual que exportarPDF, pero si hay una carpeta compartida configurada (ver carpetaExport.js)
// y el permiso sigue vigente, el PDF se escribe directo ahí — sin el diálogo "Guardar como".
// Si la carpeta no está disponible (ej. la unidad de red se desconectó), cae de vuelta a la
// descarga normal del navegador y lo avisa en el resultado.
export async function exportarPDFConCarpeta(quote, summary, catalog) {
  const doc = await generarPDF(quote, summary, catalog);
  const nombre = nombreArchivoPDF(quote);
  const handle = await getCarpetaExport();
  if (handle) {
    try {
      await guardarEnCarpeta(handle, nombre, doc.output("blob"));
      return { guardadoEnCarpeta: true, nombre };
    } catch (e) {
      doc.save(nombre);
      return { guardadoEnCarpeta: false, nombre, error: e.message };
    }
  }
  doc.save(nombre);
  return { guardadoEnCarpeta: false, nombre };
}

// Devuelve una URL temporal del PDF (quien la use debe liberarla con URL.revokeObjectURL).
export async function previsualizarPDF(quote, summary, catalog) {
  const doc = await generarPDF(quote, summary, catalog);
  return URL.createObjectURL(doc.output("blob"));
}