// export const IGV = 0.18;
// export const neto = (v) => +(v / (1 + IGV)).toFixed(2);

// // `incluye` (opcional): contenido interno de un producto, como [cantidad, "texto"].
// // El PDF lo muestra en el bloque "Incluye:" en lugar de repetir el nombre del producto.
// // Si el producto está en un kit con qty > 1, la cantidad se multiplica.
// export const CATALOGO = {
//   equipos: [
//     // --- CACI / detección ---
//     { id: "pf5", name: "PROTEC FIRE 5 2.0 (5 zonas)", costo: 202.0, precio: 366.71, marca: "CACI" },
//     { id: "pf8", name: "PROTEC FIRE 8 2.0 (8 zonas)", costo: 514.13, precio: 932.71, marca: "CACI" },
//     {
//       id: "panel-firemax8", name: "PANEL CONVENCIONAL MOD. FIREMAX-8", costo: 629.53, precio: 990.46, marca: "CACI",
//       nota: "Alternativa de panel para proyectos de 8 zonas"
//     },
//     { id: "bat4", name: "BATERIA 12V 4AMP", costo: 40.0, precio: 72.62, marca: "CACI" },
//     {
//       id: "bat4-ad", name: "BATERIA 12V 4AMP (UNIDAD ADICIONAL)", costo: 40.0, precio: 65.0, marca: "CACI",
//       nota: "Precio por batería adicional más allá del kit base"
//     },
//     { id: "bat7", name: "BATERIA 12V 7AMP", costo: 52.04, precio: 90.0, marca: "CACI" },
//     { id: "humo", name: "DETECTOR DE HUMO", costo: 25.37, precio: 47.21, marca: "CACI" },
//     {
//       id: "humo-ad", name: "DETECTOR DE HUMO (UNIDAD ADICIONAL)", costo: 25.56, precio: 60.0, marca: "CACI",
//       nota: "Precio por zona adicional más allá del kit base"
//     },
//     { id: "manual", name: "ESTACION MANUAL", costo: 31.27, precio: 56.77, marca: "CACI" },
//     {
//       id: "manual-ad", name: "ESTACION MANUAL (UNIDAD ADICIONAL)", costo: 31.24, precio: 65.0, marca: "CACI",
//       nota: "Precio por zona adicional más allá del kit base"
//     },
//     { id: "base-manual", name: "BASE PARA ESTACION MANUAL", costo: 17.0, precio: 28.66, marca: "CACI" },
//     { id: "temp", name: "SENSOR DE TEMPERATURA", costo: 25.37, precio: 46.06, marca: "CACI" },
//     {
//       id: "temp-ad", name: "SENSOR DE TEMPERATURA (UNIDAD ADICIONAL)", costo: 30.63, precio: 70.0, marca: "CACI",
//       nota: "Precio por zona adicional más allá del kit base"
//     },
//     { id: "estrobo", name: "ESTROBO", costo: 30.68, precio: 55.7, marca: "CACI" },
//     {
//       id: "estrobo-ad", name: "ESTROBO (UNIDAD ADICIONAL)", costo: 30.63, precio: 65.0, marca: "CACI",
//       nota: "Precio por zona adicional más allá del kit base"
//     },

//     // --- SHOCTIX ---
//     {
//       id: "sx-rf3s", name: "KIT SHOCTIX RF3 SMART (Fuente 12V2A + PULSADOR RF 100m)", costo: 150.00, precio: 249.00, marca: "SHOCTIX",
//       incluye: [[1, "Fuente 12V 2A"], [1, "Pulsador RF 100m"]]
//     },
//     {
//       id: "sx-txvoz", name: "TX VOZ (NO INCLUYE FUENTE)", costo: 125.00, precio: 210.85, marca: "SHOCTIX",
//       incluye: [] // no trae nada adentro: no se dibuja "Incluye:"
//     },
//     {
//       id: "sx-doble", name: "SHOCTIX ALERT PRO SMART DOBLE (panel + pulsador)", costo: 227.49, precio: 364.86, marca: "SHOCTIX",
//       incluye: [[1, "Panel SHOCTIX ALERT PRO SMART DOBLE"], [1, "Pulsador"]]
//     },
//     {
//       id: "sx-triple", name: "SHOCTIX ALERT PRO TRIPLE (panel + pulsador)", costo: 262.49, precio: 465.72, marca: "SHOCTIX",
//       incluye: [[1, "Panel SHOCTIX ALERT PRO TRIPLE"], [1, "Pulsador"]]
//     },
//     {
//       id: "sx-4glite", name: "SHOCTIX ALERT PRO 4G LITE (panel + pulsador)", costo: 559.99, precio: 900.72, marca: "SHOCTIX",
//       incluye: [[1, "Panel SHOCTIX ALERT PRO 4G LITE"], [1, "Pulsador"]]
//     },
//     {
//       id: "sx-4gnet", name: "SHOCTIX ALERT PRO 4G NET (panel + pulsador)", costo: 874.99, precio: 1390.73, marca: "SHOCTIX",
//       incluye: [[1, "Panel SHOCTIX ALERT PRO 4G NET"], [1, "Pulsador"]]
//     },

//     // --- SHOCTIX · opcionales del RF3 SMART (nuevos, de la cotización de referencia) ---
//     {
//       id: "sx-sensormov", name: "SENSOR DE MOVIMIENTO", costo: 54.87, precio: 97.55, marca: "SHOCTIX",
//       nota: "Precio tomado del cuadro 'KIT RF3 SMART' (incluido por defecto); el cuadro de opcionales sueltos de la misma hoja mostraba 97.55 → 95.22 para este mismo producto. Confirmar cuál es el precio de venta correcto."
//     },
//     {
//       id: "sx-contactomag", name: "CONTACTO MAGNETICO", costo: 35.99, precio: 62.45, marca: "SHOCTIX"
//     },
//     {
//       id: "sx-costoservicio", name: "COSTO DE SERVICIO (RF3 SMART)", costo: 120.00, precio: 191.16, marca: "SHOCTIX",
//       nota: "En la hoja original el CU.NETO (64.00) y el IGV (11.52) de la columna de compra no cuadran con el CU.TOTAL (120.00) — 64 + 11.52 = 75.52, no 120. Se usó el CU.TOTAL tal cual venía. Verificar el costo real antes de usarlo en una cotización."
//     },

//     // --- HAGROY ---
//     { id: "hg-mpr3", name: "HAGROY MPR3", costo: 144.55, precio: 202.98, marca: "HAGROY" },
//     { id: "hg-alcom", name: "PANEL HAGROY ALCOM MAX 4G", costo: 937.51, precio: 1336.54, marca: "HAGROY" },
//     {
//       id: "hg-yanex", name: "KIT CERCO ELECTRICO YANEX 1600 HAGROY", costo: 244.26, precio: 430.0, marca: "HAGROY",
//       nota: "Incluye electrificador, sirena 30w, batería 4A, pulsador y letrero",
//       incluye: [
//         [1, "Electrificador YANEX 1600"], [1, "Sirena 30W"], [1, "Batería 4A"],
//         [1, "Pulsador"], [1, "Letrero de advertencia"],
//       ]
//     },

//     // --- IPVOZ (NUEVO) ---
//     {
//       id: "ipvoz-wifi", name: "KIT IPVOZ WIFI 60W (Fuente de 2AMP)", costo: 200.09, precio: 363.25, marca: "IPVOZ",
//       incluye: [[1, "Fuente 12V 2A"]]
//     },
//     {
//       id: "ipvoz-eth", name: "KIT IPVOZ ETHERNET 100W (Fuente de 2AMP)", costo: 500.25, precio: 908.14, marca: "IPVOZ",
//       incluye: [[1, "Fuente 12V 2A"]]
//     },

//     // --- Periféricos comunes ---
//     { id: "bocina30", name: "BOCINA 30W", costo: 37.76, precio: 72.05 },
//     { id: "conectorDc", name: "CONECTOR DC", costo: 2.5, precio: 5.00 },
//     { id: "caja10pvc", name: "CAJA PASE 10x100 PVC", costo: 3.00, precio: 7.50 },
//     { id: "sirena30", name: "SIRENA 30W", costo: 37.76, precio: 72.05 },
//     { id: "bat4a", name: "BATERIA 4A", costo: 47.2, precio: 65.0 },
//     { id: "fuente12", name: "FUENTE 12V 2AMP", costo: 14.4, precio: 23.22 },
//     { id: "puls500", name: "PULSADOR RF INALAMBRICO 500M", costo: 34.0, precio: 64.18 },
//     { id: "puls100", name: "PULSADOR RF INALAMBRICO 100M", costo: 17.5, precio: 37.17 },
//     // { id: "puls-alam", name: "PULSADOR ALAMBRICO HIKVISION", costo: 9.44, precio: 15.22 },
//     { id: "panico", name: "BOTON DE PANICO HIKVISION", costo: 5.31, precio: 9.64 },
//     { id: "sensorpir", name: "SENSOR INALAMBRICO PIR HAGROY", costo: 105.0, precio: 105.0 },
//     { id: "contactomag", name: "CONTACTO MAGNETICO INALAMBRICO PIR HAGROY", costo: 76.0, precio: 76.0 },
//   ],

//   accesorios: [
//     // --- Alarmas ---
//     { id: "conectorDc", name: "CONECTOR DC", costo: 2.5, precio: 5.00, marca: "Alarmas" },
//     { id: "caja10pvc", name: "CAJA PASE 10x100 PVC", costo: 3.00, precio: 7.50, marca: "Alarmas" },
//     { id: "cat6", name: "CABLE VULCANIZADO CAT6 (M)", costo: 1.06, precio: 1.71, unidad: "m", marca: "Alarmas" },
//     { id: "panico", name: "BOTON DE PANICO HIKVISION", costo: 5.31, precio: 9.64, marca: "Alarmas" },
//     { id: "fuente12", name: "FUENTE 12V 2AMP", costo: 14.4, precio: 23.22, marca: "Alarmas" },
//     { id: "puls500", name: "PULSADOR RF INALAMBRICO 500M", costo: 34.0, precio: 64.18, marca: "Alarmas" },
//     { id: "puls100", name: "PULSADOR RF INALAMBRICO 100M", costo: 17.5, precio: 37.17, marca: "Alarmas" },
//     { id: "sensorpir", name: "SENSOR INALAMBRICO PIR HAGROY", costo: 105.0, precio: 105.0, marca: "Alarmas" },
//     { id: "contactomag", name: "CONTACTO MAGNETICO INALAMBRICO PIR HAGROY", costo: 76.0, precio: 76.0, marca: "Alarmas" },

//     // --- CACI ---
//     { id: "caci4h", name: "CABLE 4 HILOS CACI (m)", costo: 1.7, precio: 4.2, unidad: "m", marca: "CACI" },
//     { id: "caja10", name: "CAJA PASE 10x100 EMT", costo: 5.9, precio: 9.2, marca: "CACI" },
//     // id "tuberia" se conserva (kits y cotizaciones guardadas); ahora es el modelo LIVIANO
//     { id: "tuberia", name: 'TUBERIA CONDUIT 1/2" LIVIANO', costo: 8.0, precio: 16.5, marca: "CACI" },
//     { id: "tuberia-pes", name: 'TUBERIA CONDUIT 1/2" PESADO', costo: 10.5, precio: 19.5, marca: "CACI" },
//     { id: "tubo-corr", name: 'METRO DE TUBO CORRUGADO EMT 1/2" (m)', costo: 3.0, precio: 6.0, unidad: "m", marca: "CACI" },
//     { id: "curva", name: 'CURVA 1/2" EMT', costo: 3.0, precio: 8.0, marca: "CACI" },
//     { id: "canast-oct", name: "CANASTILLA / CAJA OCTOGONAL EMT", costo: 2.5, precio: 7.0, marca: "CACI" },
//     { id: "tapa-oct", name: "TAPA OCTOGONAL EMT", costo: 1.18, precio: 3.0, marca: "CACI" },
//     { id: "canast-rec", name: "CANASTILLA RECTANGULAR EMT", costo: 4.72, precio: 8.57, marca: "CACI" },
//     { id: "caja-mod", name: "CAJA MODULAR EMT", costo: 16.52, precio: 29.99, marca: "CACI" },
//     { id: "conector", name: 'CONECTOR 1/2" EMT', costo: 1.3, precio: 3.8, marca: "CACI" },
//     { id: "conector-paq", name: "CONECTORES EMT X PAQUETE 50 UNIDS", costo: 55.0, precio: 94.0, marca: "CACI" },
//     { id: "union", name: 'UNION 1/2" EMT', costo: 1.3, precio: 3.8, marca: "CACI" },
//     { id: "union-paq", name: "UNIONES EMT X PAQUETE 50 UNIDS", costo: 55.0, precio: 94.0, marca: "CACI" },
//     { id: "gancho", name: 'GANCHO 1/2" EMT', costo: 2.36, precio: 4.285, marca: "CACI" },
//     { id: "abraz-emt-paq", name: "ABRAZADERAS X PAQUETE 100 UNIDS", costo: 25.0, precio: 44.7, marca: "CACI" },
//     { id: "acc-inst", name: "ACCESORIOS DE INSTALACION", costo: 24.59, precio: 50.0, marca: "CACI" },
//     { id: "senal-caci", name: "SEÑALETICA FOTOLUMINISCENTE - CACI", costo: 3.5, precio: 6.5, marca: "CACI" },
//     { id: "senal-estrobo", name: "SEÑALETICA FOTOLUMINISCENTE - ESTROBO", costo: 3.5, precio: 6.5, marca: "CACI" },
//     { id: "senal-manual", name: "SEÑALETICA FOTOLUMINISCENTE - ESTACION MANUAL", costo: 3.5, precio: 6.5, marca: "CACI" },
//     { id: "senal-humo", name: "SEÑALETICA FOTOLUMINISCENTE - DETECTOR DE HUMO", costo: 3.5, precio: 6.5, marca: "CACI" },
//     { id: "senal-temp", name: "SEÑALETICA FOTOLUMINISCENTE - DETECTOR DE TEMPERATURA", costo: 3.5, precio: 6.5, marca: "CACI" },

//     // --- Cerco eléctrico ---
//     { id: "poste-t", name: 'POSTE TEMPLADOR 4 HILOS 1 1/2" x 1.2mm', costo: 17.34, precio: 32.0, marca: "Cerco eléctrico" },
//     { id: "poste-i", name: 'POSTE INTERMEDIO 4 HILOS 1 1/2" x 1.2mm', costo: 17.34, precio: 32.0, marca: "Cerco eléctrico" },
//     { id: "ais-t", name: "AISLADOR TEMPLADOR CUADRADO", costo: 1.47, precio: 2.7, marca: "Cerco eléctrico" },
//     { id: "ais-i", name: "AISLADOR INTERMEDIO", costo: 0.81, precio: 1.5, marca: "Cerco eléctrico" },
//     { id: "aro-s", name: "ARO SIMPLE (TEMPLADOR)", costo: 1.1, precio: 2.0, marca: "Cerco eléctrico" },
//     { id: "aro-d", name: "ARO DOBLE (INTERMEDIO)", costo: 1.3, precio: 2.5, marca: "Cerco eléctrico" },
//     { id: "abraz", name: "ABRAZADERA DE ENLACE C/ARANDELA 5/16", costo: 0.59, precio: 1.55, marca: "Cerco eléctrico" },
//     { id: "bujia", name: "CABLE BUJIA (m)", costo: 2.44, precio: 4.5, unidad: "m", marca: "Cerco eléctrico" },
//     { id: "galv16", name: "KILO ALAMBRE GALVANIZADO 16mm", costo: 12.29, precio: 23.0, marca: "Cerco eléctrico" },
//     { id: "acerado", name: "ALAMBRE ACERADO 2.5mm", costo: 12.46, precio: 23.5, marca: "Cerco eléctrico" },
//     { id: "letrero", name: "LETRERO DE ADVERTENCIA ESTANDAR", costo: 3.09, precio: 6.0, marca: "Cerco eléctrico" },

//     // --- Servicios ---
//     // { id: "transporte", name: "TRANSPORTE (servicio)", costo: 20.0, precio: 30.0, marca: "Servicios" },
//     {
//       id: "mano-obra", name: "MANO DE OBRA (servicio)", costo: 600.0, precio: 600.0, marca: "Servicios",
//       nota: "Varía según uso de soldadura o concreto; se emite recibo por honorarios"
//     },
//     { id: "cert-caci", name: "CERTIFICADO CACI (servicio)", costo: 60.0, precio: 90.0, marca: "Servicios" },
//   ],
// };

// // ---------------------------------------------------------------------------
// // KITS PREDEFINIDOS
// // items: los que se cargan siempre. opcionales: se ofrecen con checkbox.
// // ---------------------------------------------------------------------------
// export const KITS = [
//   {
//     id: "caci-5",
//     name: "Kit CACI Detección 5 zonas",
//     categoria: "Central de Alarma Contra Incendios",
//     laborValue: 180,
//     items: {
//       equipos: [
//         { pid: "pf5", qty: 1 }, { pid: "bat4", qty: 1 }, { pid: "humo", qty: 1 },
//         { pid: "manual", qty: 1 }, { pid: "estrobo", qty: 1 },
//       ],
//       accesorios: [
//         { pid: "caci4h", qty: 10 }, { pid: "tuberia", qty: 3 }, { pid: "curva", qty: 2 },
//         { pid: "caja10", qty: 1 }, { pid: "canast-oct", qty: 1 }, { pid: "canast-rec", qty: 2 },
//         { pid: "conector", qty: 5 }, { pid: "union", qty: 3 }, { pid: "gancho", qty: 6 },
//         { pid: "acc-inst", qty: 1 },
//       ],
//     },
//     opcionales: {
//       equipos: [
//         { pid: "temp", qty: 1 }, { pid: "bat7", qty: 1 }, { pid: "bat4-ad", qty: 1 },
//         { pid: "panel-firemax8", qty: 1 }, { pid: "base-manual", qty: 1 }, { pid: "humo-ad", qty: 1 },
//         { pid: "temp-ad", qty: 1 }, { pid: "estrobo-ad", qty: 1 }, { pid: "manual-ad", qty: 1 },
//       ],
//       accesorios: [
//         { pid: "tapa-oct", qty: 1 }, { pid: "tubo-corr", qty: 1 }, { pid: "tuberia-pes", qty: 1 },
//         { pid: "caja-mod", qty: 1 }, { pid: "conector-paq", qty: 1 }, { pid: "union-paq", qty: 1 },
//         { pid: "abraz-emt-paq", qty: 1 },
//         { pid: "senal-caci", qty: 1 }, { pid: "senal-estrobo", qty: 1 }, { pid: "senal-manual", qty: 1 },
//         { pid: "senal-humo", qty: 1 }, { pid: "senal-temp", qty: 1 },
//         { pid: "transporte", qty: 1 }, { pid: "cert-caci", qty: 1 }, { pid: "mano-obra", qty: 1 },
//       ],
//     },
//   },
//   {
//     id: "caci-8",
//     name: "Kit CACI Detección 8 zonas",
//     categoria: "Central de Alarma Contra Incendios",
//     laborValue: 250,
//     items: {
//       equipos: [
//         { pid: "pf8", qty: 1 }, { pid: "bat4", qty: 1 }, { pid: "humo", qty: 1 },
//         { pid: "manual", qty: 1 }, { pid: "estrobo", qty: 1 },
//       ],
//       accesorios: [
//         { pid: "caci4h", qty: 20 }, { pid: "tuberia", qty: 6 }, { pid: "curva", qty: 4 },
//         { pid: "caja10", qty: 2 }, { pid: "canast-oct", qty: 2 }, { pid: "canast-rec", qty: 3 },
//         { pid: "conector", qty: 8 }, { pid: "union", qty: 5 }, { pid: "gancho", qty: 10 },
//         { pid: "acc-inst", qty: 1 },
//       ],
//     },
//     opcionales: {
//       equipos: [
//         { pid: "temp", qty: 1 }, { pid: "bat7", qty: 1 }, { pid: "bat4-ad", qty: 1 },
//         { pid: "panel-firemax8", qty: 1 }, { pid: "base-manual", qty: 1 }, { pid: "humo-ad", qty: 1 },
//         { pid: "temp-ad", qty: 1 }, { pid: "estrobo-ad", qty: 1 }, { pid: "manual-ad", qty: 1 },
//       ],
//       accesorios: [
//         { pid: "tapa-oct", qty: 1 }, { pid: "tubo-corr", qty: 1 }, { pid: "tuberia-pes", qty: 1 },
//         { pid: "caja-mod", qty: 1 }, { pid: "conector-paq", qty: 1 }, { pid: "union-paq", qty: 1 },
//         { pid: "abraz-emt-paq", qty: 1 },
//         { pid: "senal-caci", qty: 1 }, { pid: "senal-estrobo", qty: 1 }, { pid: "senal-manual", qty: 1 },
//         { pid: "senal-humo", qty: 1 }, { pid: "senal-temp", qty: 1 },
//         { pid: "transporte", qty: 1 }, { pid: "cert-caci", qty: 1 }, { pid: "mano-obra", qty: 1 },
//       ],
//     },
//   },
//   {
//     id: "sx-rf3-smart",
//     name: "Kit SHOCTIX RF3 SMART",
//     categoria: "Alarmas / pánico",
//     precioReferencia: 390,
//     items: {
//       equipos: [
//         { pid: "sx-rf3s", qty: 1 },
//       ],
//       accesorios: [
//         // { pid: "cat6", qty: 10 },
//         { pid: "caja10pvc", qty: 1 },
//         { pid: "conectorDc", qty: 1 }
//       ],
//     },
//     opcionales: {
//       equipos: [
//         { pid: "fuente12", qty: 1 },
//         { pid: "panico", qty: 1 },
//         { pid: "puls100", qty: 1 },
//         { pid: "puls500", qty: 1 },
//         { pid: "sensorpir", qty: 1 },
//         { pid: "contactomag", qty: 1 },
//         // Opcionales nuevos (cuadro "ALARMA WIFI SMART" de la cotización de referencia)
//         { pid: "sx-sensormov", qty: 1 },
//         { pid: "sx-contactomag", qty: 1 },
//         { pid: "sx-costoservicio", qty: 1 },
//       ],
//       accesorios: []
//     },
//   },
//   {
//     id: "sx-rf3-smart-completo",
//     name: "Kit SHOCTIX RF3 SMART Completo (c/ sensor de movimiento y contacto magnético)",
//     categoria: "Alarmas / pánico",
//     precioReferencia: 409,
//     nota: "Corresponde al cuadro 'KIT RF3 SMART' de la cotización de referencia: trae el kit base más un sensor de movimiento y un contacto magnético incluidos.",
//     items: {
//       equipos: [
//         { pid: "sx-rf3s", qty: 1 },
//         { pid: "sx-sensormov", qty: 1 },
//         { pid: "sx-contactomag", qty: 1 },
//       ],
//       accesorios: [
//         { pid: "caja10pvc", qty: 1 },
//         { pid: "conectorDc", qty: 1 },
//       ],
//     },
//     opcionales: {
//       equipos: [
//         { pid: "panico", qty: 1 },
//         { pid: "sx-costoservicio", qty: 1 },
//         { pid: "fuente12", qty: 1 },
//         { pid: "puls100", qty: 1 },
//         { pid: "puls500", qty: 1 },
//       ],
//       accesorios: [],
//     },
//   },
//   {
//     id: "sx-txvoz",
//     name: "Kit TX VOZ",
//     categoria: "Alarmas / pánico",
//     precioReferencia: 169,
//     items: {
//       equipos: [
//         { pid: "sx-txvoz", qty: 1 }
//       ],
//       accesorios: []
//     },
//     opcionales: {
//       equipos: [
//         { pid: "puls100", qty: 1 },
//         { pid: "fuente12", qty: 1 },
//       ],
//       accesorios: [
//         { pid: "caja10pvc", qty: 1 },
//         { pid: "cat6", qty: 10 },
//       ],
//     },
//   },
//   {
//     id: "ipvoz-wifi",
//     name: "Kit IPVOZ WiFi 60W",
//     categoria: "Alarmas / pánico",
//     precioReferencia: 363,
//     items: {
//       equipos: [{ pid: "ipvoz-wifi", qty: 1 }],
//       accesorios: [],
//     },
//     opcionales: {
//       equipos: [
//         { pid: "fuente12", qty: 1 },
//         { pid: "puls100", qty: 1 },
//         { pid: "puls500", qty: 1 },
//         { pid: "sensorpir", qty: 1 },
//         { pid: "contactomag", qty: 1 }
//       ],
//       accesorios: [
//         { pid: "caja10pvc", qty: 1 },
//         { pid: "cat6", qty: 10 },
//       ]
//     },
//   },
//   {
//     id: "ipvoz-eth",
//     name: "Kit IPVOZ Ethernet 100W",
//     categoria: "Alarmas / pánico",
//     precioReferencia: 908,
//     items: {
//       equipos: [
//         { pid: "ipvoz-eth", qty: 1 }],
//       accesorios: [],
//     },
//     opcionales: {
//       equipos: [
//         { pid: "fuente12", qty: 1 },
//         { pid: "puls100", qty: 1 },
//         { pid: "puls500", qty: 1 },
//         { pid: "sensorpir", qty: 1 },
//         { pid: "contactomag", qty: 1 }
//       ],
//       accesorios: [
//         { pid: "caja10pvc", qty: 1 },
//         { pid: "cat6", qty: 10 }
//       ]
//     },
//   },
//   {
//     id: "sx-doble",
//     name: "Kit SHOCTIX ALERT PRO SMART DOBLE",
//     categoria: "Alarmas / pánico",
//     precioReferencia: 579,
//     items: {
//       equipos: [
//         { pid: "sx-doble", qty: 1 }, { pid: "bocina30", qty: 1 },
//         { pid: "sirena30", qty: 1 }, { pid: "bat4a", qty: 1 },
//       ],
//       accesorios: [{ pid: "cat6", qty: 10 }, { pid: "caja10", qty: 2 }],
//     },
//     opcionales: { equipos: [{ pid: "puls500", qty: 1 }, { pid: "puls100", qty: 1 }, { pid: "panico", qty: 1 }], accesorios: [] },
//   },
//   {
//     id: "sx-triple",
//     name: "Kit SHOCTIX ALERT PRO TRIPLE",
//     categoria: "Alarmas / pánico",
//     precioReferencia: 715,
//     items: {
//       equipos: [
//         { pid: "sx-triple", qty: 1 }, { pid: "bocina30", qty: 1 },
//         { pid: "sirena30", qty: 1 }, { pid: "bat4a", qty: 1 },
//       ],
//       accesorios: [{ pid: "cat6", qty: 10 }, { pid: "caja10", qty: 2 }],
//     },
//     opcionales: { equipos: [{ pid: "puls500", qty: 1 }, { pid: "puls-alam", qty: 1 }], accesorios: [] },
//   },
//   {
//     id: "sx-4g-lite",
//     name: "Kit SHOCTIX ALERT PRO 4G LITE",
//     categoria: "Alarmas / pánico",
//     precioReferencia: 1150,
//     items: {
//       equipos: [
//         { pid: "sx-4glite", qty: 1 }, { pid: "bocina30", qty: 1 },
//         { pid: "sirena30", qty: 1 }, { pid: "bat4a", qty: 1 },
//       ],
//       accesorios: [{ pid: "cat6", qty: 10 }, { pid: "caja10", qty: 2 }],
//     },
//     opcionales: { equipos: [{ pid: "puls500", qty: 1 }, { pid: "puls-alam", qty: 1 }], accesorios: [] },
//   },
//   {
//     id: "sx-4g-net",
//     name: "Kit SHOCTIX ALERT PRO 4G NET",
//     categoria: "Alarmas / pánico",
//     precioReferencia: 1640,
//     items: {
//       equipos: [
//         { pid: "sx-4gnet", qty: 1 }, { pid: "bocina30", qty: 1 },
//         { pid: "sirena30", qty: 1 }, { pid: "bat4a", qty: 1 },
//       ],
//       accesorios: [{ pid: "cat6", qty: 10 }, { pid: "caja10", qty: 2 }],
//     },
//     opcionales: { equipos: [{ pid: "puls500", qty: 1 }, { pid: "puls-alam", qty: 1 }], accesorios: [] },
//   },
//   {
//     id: "hg-mpr3",
//     name: "Kit HAGROY MPR3",
//     categoria: "Alarmas / pánico",
//     precioReferencia: 450,
//     items: {
//       equipos: [
//         { pid: "hg-mpr3", qty: 1 }, { pid: "sirena30", qty: 1 },
//         { pid: "bat4a", qty: 1 }, { pid: "puls500", qty: 1 },
//       ],
//       accesorios: [{ pid: "cat6", qty: 10 }, { pid: "caja10", qty: 2 }],
//     },
//     opcionales: { equipos: [{ pid: "bocina30", qty: 1 }], accesorios: [] },
//   },
//   {
//     id: "hg-alcom",
//     name: "Kit HAGROY ALCOM MAX 4G",
//     categoria: "Alarmas / pánico",
//     precioReferencia: 1650,
//     items: {
//       equipos: [
//         { pid: "hg-alcom", qty: 1 }, { pid: "bocina30", qty: 1 }, { pid: "sirena30", qty: 1 },
//         { pid: "bat4a", qty: 1 }, { pid: "puls500", qty: 1 },
//       ],
//       accesorios: [{ pid: "cat6", qty: 10 }, { pid: "caja10", qty: 2 }],
//     },
//     opcionales: { equipos: [], accesorios: [] },
//   },

//   {
//     id: "cerco-10",
//     name: "Kit Cerco Eléctrico 10 m (Yanex 1600)",
//     categoria: "Cerco eléctrico",
//     nota: "1kg de alambre acerado equivale a 3.5m x 4 líneas en los postes del cerco. " +
//       "La mano de obra depende exclusivamente del uso de soldadura o concreto (cotizar con el ítem 'MANO DE OBRA (servicio)'). " +
//       "El cable bujía se cotiza x 3 líneas, dependiendo también de la ubicación del panel, que no debe exceder los 10m de distancia del cerco. " +
//       "El panel YANEX es IP65, apto para exteriores.",
//     items: {
//       equipos: [{ pid: "hg-yanex", qty: 1 }],
//       accesorios: [
//         { pid: "poste-t", qty: 2 }, { pid: "poste-i", qty: 3 }, { pid: "ais-t", qty: 10 },
//         { pid: "ais-i", qty: 15 }, { pid: "aro-s", qty: 10 }, { pid: "aro-d", qty: 15 },
//         { pid: "abraz", qty: 15 }, { pid: "galv16", qty: 1 }, { pid: "acerado", qty: 3 },
//         { pid: "letrero", qty: 1 },
//       ],
//     },
//     opcionales: { equipos: [], accesorios: [{ pid: "bujia", qty: 5 }] },
//   },
// ];

// const ADIC_CACI = [
//   { pid: "humo-ad", qty: 1 },
//   { pid: "temp-ad", qty: 1 },
//   { pid: "estrobo-ad", qty: 1 },
//   { pid: "manual-ad", qty: 1 },
//   { pid: "base-manual", qty: 1 },
// ];
// const ADIC_ALARMA = [
//   { pid: "fuente12", qty: 1 },
//   { pid: "puls500", qty: 1 },
//   { pid: "puls100", qty: 1 },
//   { pid: "panico", qty: 1 },
//   { pid: "sensorpir", qty: 1 },
//   { pid: "contactomag", qty: 1 },
// ];

// // ---------------------------------------------------------------------------
// // HELPERS
// // ---------------------------------------------------------------------------
// const buscar = (catalogo, cat, pid) => catalogo[cat].find((p) => p.id === pid);

// export function adicionalesDe(kit) {
//   if (kit.adicionales) return kit.adicionales;
//   if (kit.categoria === "Central de Alarma Contra Incendios") return ADIC_CACI;
//   if (kit.categoria === "Alarmas / pánico") return ADIC_ALARMA;
//   return []; // cerco, personalizados, etc.
// }

// /** Opcionales sin los que ya salen como adicionales (evita duplicados en el modal). */
// export function opcionalesDe(kit) {
//   const adic = new Set(adicionalesDe(kit).map((l) => l.pid));
//   return {
//     equipos: (kit.opcionales?.equipos || []).filter((l) => !adic.has(l.pid)),
//     accesorios: kit.opcionales?.accesorios || [],
//   };
// }

// /** Convierte las líneas de un kit al formato de items de la cotización. */
// export function kitAItems(kit, catalogo = CATALOGO, opcionalesElegidos = []) {
//   const armar = (cat) => {
//     const base = kit.items?.[cat] || [];
//     const extra = (kit.opcionales?.[cat] || []).filter((l) => opcionalesElegidos.includes(l.pid));
//     return [...base, ...extra]
//       .map((linea) => {
//         const p = buscar(catalogo, cat, linea.pid);
//         if (!p) return null;
//         return { pid: p.id, qty: linea.qty, costo: p.costo, precio: p.precio };
//       })
//       .filter(Boolean);
//   };
//   return { equipos: armar("equipos"), accesorios: armar("accesorios") };
// }

// /** Suma cantidades cuando un mismo producto ya existe en la cotización. */
// export function fusionarItems(actuales, nuevos) {
//   const out = [...actuales];
//   nuevos.forEach((n) => {
//     const i = out.findIndex((x) => x.pid && x.pid === n.pid);
//     if (i >= 0) out[i] = { ...out[i], qty: out[i].qty + n.qty };
//     else out.push(n);
//   });
//   return out;
// }

// /** Costo / venta / margen estimado de un kit, para mostrarlo en el selector. */
// export function resumenKit(kit, catalogo = CATALOGO, opcionalesElegidos = []) {
//   const items = kitAItems(kit, catalogo, opcionalesElegidos);
//   let costo = 0, venta = 0;
//   ["equipos", "accesorios"].forEach((c) =>
//     items[c].forEach((it) => { costo += it.costo * it.qty; venta += it.precio * it.qty; })
//   );
//   return { costo, venta, margen: venta - costo, margenPct: venta ? ((venta - costo) / venta) * 100 : 0 };
// }

// /** Crea un kit nuevo a partir de la cotización que está abierta. */
// export function kitDesdeCotizacion(nombre, quote, categoria = "Personalizados") {
//   const limpiar = (arr) => arr.filter((i) => i.pid).map((i) => ({ pid: i.pid, qty: i.qty }));
//   return {
//     id: `kit_${Date.now()}`,
//     name: nombre,
//     categoria,
//     laborValue: quote.laborValue || 0,
//     custom: true,
//     items: { equipos: limpiar(quote.items.equipos), accesorios: limpiar(quote.items.accesorios) },
//     opcionales: { equipos: [], accesorios: [] },
//   };
// }
export const IGV = 0.18;
export const neto = (v) => +(v / (1 + IGV)).toFixed(2);

// `incluye` (opcional): contenido interno de un producto, como [cantidad, "texto"].
// El PDF lo muestra en el bloque "Incluye:" en lugar de repetir el nombre del producto.
// Si el producto está en un kit con qty > 1, la cantidad se multiplica.
export const CATALOGO = {
  equipos: [
    // --- CACI / detección ---
    { id: "pf5", name: "PROTEC FIRE 5 2.0 (5 zonas)", costo: 202.0, precio: 380.0, marca: "CACI" },
    { id: "pf8", name: "PROTEC FIRE 8 2.0 (8 zonas)", costo: 514.5, precio: 750.0, marca: "CACI" },
    {
      id: "panel-firemax8", name: "PANEL CONVENCIONAL MOD. FIREMAX-8", costo: 642.5, precio: 1050.0, marca: "CACI",
      nota: "Alternativa de panel para proyectos de 8 zonas"
    },
    {
      id: "panel-firemax16", name: "PANEL CONVENCIONAL MOD. FIREMAX-16", costo: 764.0, precio: 1240.0, marca: "CACI",
      nota: "Panel para proyectos de 16 zonas"
    },
    { id: "bat4", name: "BATERIA 12V 4AMP", costo: 40.0, precio: 60.0, marca: "CACI" },
    {
      id: "bat4-ad", name: "BATERIA 12V 4AMP (UNIDAD ADICIONAL)", costo: 40.0, precio: 65.0, marca: "CACI",
      nota: "Precio por batería adicional más allá del kit base"
    },
    { id: "bat7", name: "BATERIA 12V 7AMP", costo: 52.04, precio: 70.0, marca: "CACI" },
    {
      id: "bat7-ad", name: "BATERIA 12V 7AMP (UNIDAD ADICIONAL)", costo: 52.04, precio: 85.0, marca: "CACI",
      nota: "Precio por batería adicional más allá del kit base"
    },
    { id: "humo", name: "DETECTOR DE HUMO", costo: 25.37, precio: 50.0, marca: "CACI" },
    {
      id: "humo-ad", name: "DETECTOR DE HUMO (UNIDAD ADICIONAL)", costo: 25.56, precio: 60.0, marca: "CACI",
      nota: "Precio por zona adicional más allá del kit base"
    },
    { id: "manual", name: "ESTACION MANUAL", costo: 31.27, precio: 50.0, marca: "CACI" },
    {
      id: "manual-ad", name: "ESTACION MANUAL (UNIDAD ADICIONAL)", costo: 31.24, precio: 65.0, marca: "CACI",
      nota: "Precio por zona adicional más allá del kit base"
    },
    { id: "base-manual", name: "BASE PARA ESTACION MANUAL", costo: 17.0, precio: 26.0, marca: "CACI" },
    { id: "temp", name: "SENSOR DE TEMPERATURA", costo: 25.37, precio: 46.06, marca: "CACI" },
    {
      id: "temp-ad", name: "SENSOR DE TEMPERATURA (UNIDAD ADICIONAL)", costo: 30.63, precio: 70.0, marca: "CACI",
      nota: "Precio por zona adicional más allá del kit base"
    },
    { id: "estrobo", name: "ESTROBO", costo: 30.68, precio: 59.0, marca: "CACI" },
    {
      id: "estrobo-ad", name: "ESTROBO (UNIDAD ADICIONAL)", costo: 30.63, precio: 65.0, marca: "CACI",
      nota: "Precio por zona adicional más allá del kit base"
    },

    // --- SHOCTIX ---
    {
      id: "sx-rf3s", name: "KIT SHOCTIX RF3 SMART (Fuente 12V2A + PULSADOR RF 100m)", costo: 150.00, precio: 249.00, marca: "SHOCTIX",
      incluye: [[1, "Fuente 12V 2A"], [1, "Pulsador RF 100m"]]
    },
    {
      id: "sx-txvoz", name: "TX VOZ", costo: 125.08, precio: 210.00, marca: "SHOCTIX",
      incluye: [] // no trae nada adentro: no se dibuja "Incluye:"
    },
    // NUEVO: KIT TX VOZ SMART (hoja de cotización)
    {
      id: "sx-txvoz-smart", name: "KIT TX VOZ SMART (Fuente 12V2A + PULSADOR RF 100m)", costo: 171.10, precio: 309.00, marca: "SHOCTIX",
      incluye: [[1, "Fuente 12V 2A"], [1, "Pulsador RF 100m"]]
    },
    {
      id: "sx-doble", name: "SHOCTIX ALERT PRO SMART DOBLE (panel + pulsador)", costo: 227.49, precio: 364.86, marca: "SHOCTIX",
      incluye: [[1, "Panel SHOCTIX ALERT PRO SMART DOBLE"], [1, "Pulsador"]]
    },
    {
      id: "sx-triple", name: "SHOCTIX ALERT PRO TRIPLE (panel + pulsador)", costo: 262.49, precio: 465.72, marca: "SHOCTIX",
      incluye: [[1, "Panel SHOCTIX ALERT PRO TRIPLE"], [1, "Pulsador"]]
    },
    {
      id: "sx-4glite", name: "SHOCTIX ALERT PRO 4G LITE (panel + pulsador)", costo: 559.99, precio: 900.72, marca: "SHOCTIX",
      incluye: [[1, "Panel SHOCTIX ALERT PRO 4G LITE"], [1, "Pulsador"]]
    },
    {
      id: "sx-4gnet", name: "SHOCTIX ALERT PRO 4G NET (panel + pulsador)", costo: 874.99, precio: 1390.73, marca: "SHOCTIX",
      incluye: [[1, "Panel SHOCTIX ALERT PRO 4G NET"], [1, "Pulsador"]]
    },

    // --- SHOCTIX · opcionales del RF3 SMART (nuevos, de la cotización de referencia) ---
    {
      id: "sx-sensormov", name: "SENSOR DE MOVIMIENTO", costo: 54.87, precio: 90.00, marca: "SHOCTIX",
      nota: "Precio de venta actualizado según la hoja de cotización (90.00 con IGV)."
    },
    {
      id: "sx-contactomag", name: "CONTACTO MAGNETICO", costo: 35.99, precio: 70.00, marca: "SHOCTIX"
    },
    {
      id: "sx-costoservicio", name: "COSTO DE SERVICIO (RF3 SMART)", costo: 120.00, precio: 191.16, marca: "SHOCTIX",
      nota: "En la hoja original el CU.NETO (64.00) y el IGV (11.52) de la columna de compra no cuadran con el CU.TOTAL (120.00) — 64 + 11.52 = 75.52, no 120. Se usó el CU.TOTAL tal cual venía. Verificar el costo real antes de usarlo en una cotización."
    },

    // --- HAGROY ---
    { id: "hg-mpr3", name: "HAGROY MPR3", costo: 144.55, precio: 202.98, marca: "HAGROY" },
    { id: "hg-alcom", name: "PANEL HAGROY ALCOM MAX 4G", costo: 937.51, precio: 1336.54, marca: "HAGROY" },
    
    {
      id: "hg-yanex", name: "KIT CERCO ELECTRICO YANEX 1600 HAGROY", costo: 244.26, precio: 430.0, marca: "HAGROY",
      nota: "Incluye electrificador, sirena 30w, batería 4A, pulsador y letrero",
      incluye: [
        [1, "Electrificador YANEX 1600"], [1, "Sirena 30W"], [1, "Batería 12V 4AMP"],
        [1, "Pulsador"], [1, "Letrero de advertencia"],
      ]
    },

    {
  id: "hg-zoe", name: "KIT CERCO ELECTRICO 30 M (ZOE HAGROY)", costo: 0, precio: 593.90, marca: "HAGROY", // TODO: poner el costo real
  nota: "Incluye electrificador, sirena 30w, batería 4A, pulsador y letrero",
  incluye: [
    [1, "Electrificador ZOE HAGROY"], [1, "Sirena 30W"], [1, "Batería 12V 4AMP"],
    [1, "Pulsador"], [1, "Letrero de advertencia"],
  ]
},

    // --- IPVOZ (NUEVO) ---
    {
      id: "ipvoz-wifi", name: "KIT IPVOZ WIFI 60W (Fuente de 2AMP)", costo: 200.09, precio: 359.00, marca: "IPVOZ",
      incluye: [[1, "Fuente 12V 2A"]]
    },
    // NUEVO: mismo kit IPVOZ WiFi pero con el precio que lleva dentro del paquete completo
    // (llavero + sensor + contacto), según la hoja: 356.90 en lugar de 359.00.
    {
      id: "ipvoz-wifi-comp", name: "KIT IPVOZ WIFI 60W (Fuente de 2AMP) - PRECIO PAQUETE COMPLETO", costo: 200.09, precio: 356.90, marca: "IPVOZ",
      nota: "Precio del kit cuando se vende junto con llavero RF 500M, sensor de movimiento y contacto magnético.",
      incluye: [[1, "Fuente 12V 2A"]]
    },
    {
      id: "ipvoz-eth", name: "KIT IPVOZ ETHERNET 100W (Fuente de 2AMP)", costo: 500.25, precio: 799.00, marca: "IPVOZ",
      incluye: [[1, "Fuente 12V 2A"]]
    },

    // --- Periféricos comunes ---
    { id: "bocina30", name: "BOCINA 30W", costo: 37.76, precio: 72.05 },
    { id: "conectorDc", name: "CONECTOR DC", costo: 2.5, precio: 5.00 },
    { id: "caja10pvc", name: "CAJA PASE 10x100 PVC", costo: 3.50, precio: 7.50 },
    { id: "sirena30", name: "SIRENA 30W", costo: 38.0, precio: 72.0 },
    { id: "bat4a", name: "BATERIA 4A", costo: 47.2, precio: 65.0 },
    { id: "fuente12", name: "FUENTE 12V 2AMP", costo: 12.98, precio: 20.00 },
    { id: "puls500", name: "PULSADOR RF INALAMBRICO 500M", costo: 26.0, precio: 56.0 },
    { id: "puls100", name: "PULSADOR RF INALAMBRICO 100M", costo: 17.5, precio: 37.17 },
    // { id: "puls-alam", name: "PULSADOR ALAMBRICO HIKVISION", costo: 9.44, precio: 15.22 },
    { id: "panico", name: "BOTON DE PANICO HIKVISION", costo: 5.31, precio: 9.64 },
    { id: "sensorpir", name: "SENSOR INALAMBRICO PIR HAGROY", costo: 105.0, precio: 105.0 },
    { id: "contactomag", name: "CONTACTO MAGNETICO INALAMBRICO PIR HAGROY", costo: 76.0, precio: 76.0 },
    // --- Cámaras y memoria (NUEVO) ---
    { id: "cam-tubo-hik-20", name: "CAMARA TUBO 2MP IR 20M S/ AUDIO HIKVISION", costo: 59.50, precio: 96.00, marca: "HIKVISION" },
    { id: "cam-domo-hik-20", name: "CAMARA DOMO 2MP IR 20M S/ AUDIO HIKVISION", costo: 57.00, precio: 96.00, marca: "HIKVISION" },
    { id: "cam-tubo-hik-25a", name: "CAMARA TUBO 2MP IR 25M C/ AUDIO HIKVISION", costo: 73.80, precio: 136.00, marca: "HIKVISION" },
    { id: "cam-domo-hik-20a", name: "CAMARA DOMO 2MP IR 20M C/ AUDIO HIKVISION", costo: 70.50, precio: 136.00, marca: "HIKVISION" },
    { id: "cam-tubo-dahua-20", name: "CAMARA TUBO 2MP IR 20M S/ AUDIO DAHUA", costo: 59.00, precio: 96.00, marca: "DAHUA" },
    { id: "cam-domo-dahua-20", name: "CAMARA DOMO 2MP IR 20M S/ AUDIO DAHUA", costo: 55.00, precio: 96.00, marca: "DAHUA" },
    { id: "cam-tubo-dahua-30a", name: "CAMARA TUBO 2MP IR 30M C/ AUDIO DAHUA", costo: 78.00, precio: 136.00, marca: "DAHUA" },
    { id: "cam-domo-dahua-30a", name: "CAMARA DOMO 2MP IR 30M C/ AUDIO DAHUA", costo: 65.00, precio: 136.00, marca: "DAHUA" },
    { id: "microsd-64", name: "MEMORIA MICROSD 64GB HIKSEMI NEO LUX", costo: 50.00, precio: 80.00, marca: "HIKSEMI" },
  ],

  accesorios: [
    // --- Alarmas ---
    { id: "conectorDc", name: "CONECTOR DC", costo: 2.5, precio: 5.00, marca: "Alarmas" },
    { id: "caja10pvc", name: "CAJA PASE 10x100 PVC", costo: 3.50, precio: 7.50, marca: "Alarmas" },
    { id: "cat6", name: "CABLE VULCANIZADO CAT6 (M)", costo: 0.80, precio: 4.00, unidad: "m", marca: "Alarmas" },
    { id: "panico", name: "BOTON DE PANICO HIKVISION", costo: 5.31, precio: 9.64, marca: "Alarmas" },
    { id: "fuente12", name: "FUENTE 12V 2AMP", costo: 12.98, precio: 20.00, marca: "Alarmas" },
    { id: "puls500", name: "PULSADOR RF INALAMBRICO 500M", costo: 26.08, precio: 50.00, marca: "Alarmas" },
    { id: "puls100", name: "PULSADOR RF INALAMBRICO 100M", costo: 17.5, precio: 37.17, marca: "Alarmas" },
    { id: "sensorpir", name: "SENSOR INALAMBRICO PIR HAGROY", costo: 105.0, precio: 105.0, marca: "Alarmas" },
    { id: "contactomag", name: "CONTACTO MAGNETICO INALAMBRICO PIR HAGROY", costo: 76.0, precio: 76.0, marca: "Alarmas" },
    // NUEVOS (hoja de cotización)
    { id: "acc-inst-alarma", name: "ACCESORIOS DE INSTALACION (ALARMAS)", costo: 8.26, precio: 15.00, marca: "Alarmas" },
    { id: "rollo-cat6", name: "ROLLO DE CABLE VULCANIZADO CAT6 (100M)", costo: 80.0, precio: 145.0, marca: "Alarmas" },

    // --- CACI ---
    { id: "caci4h", name: "CABLE 4 HILOS CACI (m)", costo: 1.7, precio: 4.2, unidad: "m", marca: "CACI" },
    { id: "caja10", name: "CAJA PASE 10x100 EMT", costo: 5.9, precio: 9.2, marca: "CACI" },
    // id "tuberia" se conserva (kits y cotizaciones guardadas); ahora es el modelo LIVIANO
    { id: "tuberia", name: 'TUBERIA CONDUIT 1/2" LIVIANO', costo: 8.0, precio: 16.5, marca: "CACI" },
    { id: "tuberia-pes", name: 'TUBERIA CONDUIT 1/2" PESADO', costo: 10.5, precio: 19.5, marca: "CACI" },
    { id: "tubo-corr", name: 'METRO DE TUBO CORRUGADO EMT 1/2" (m)', costo: 3.0, precio: 6.0, unidad: "m", marca: "CACI" },
    { id: "curva", name: 'CURVA 1/2" EMT', costo: 3.0, precio: 8.0, marca: "CACI" },
    { id: "canast-oct", name: "CAJA OCTOGONAL EMT", costo: 2.5, precio: 7.0, marca: "CACI" },
    { id: "tapa-oct", name: "TAPA OCTOGONAL EMT", costo: 1.18, precio: 3.0, marca: "CACI" },
    { id: "canast-rec", name: "CANASTILLA RECTANGULAR EMT", costo: 4.72, precio: 8.57, marca: "CACI" },
    { id: "caja-mod", name: "CAJA MODULAR EMT", costo: 5.0, precio: 8.5, marca: "CACI" },
    { id: "conector", name: 'CONECTOR 1/2" EMT', costo: 1.3, precio: 3.8, marca: "CACI" },
    { id: "conector-paq", name: "CONECTORES EMT X PAQUETE 50 UNIDS", costo: 55.0, precio: 90.0, marca: "CACI" },
    { id: "union", name: 'UNION 1/2" EMT', costo: 1.3, precio: 3.8, marca: "CACI" },
    { id: "union-paq", name: "UNIONES EMT X PAQUETE 50 UNIDS", costo: 55.0, precio: 90.0, marca: "CACI" },
    { id: "gancho", name: 'GANCHO 1/2" EMT', costo: 1.3, precio: 3.8, marca: "CACI" },
    { id: "abraz-emt-paq", name: "ABRAZADERAS X PAQUETE 100 UNIDS", costo: 25.0, precio: 45.0, marca: "CACI" },
    { id: "acc-inst", name: "ACCESORIOS DE INSTALACION", costo: 24.59, precio: 50.0, marca: "CACI" },
    { id: "senal-caci", name: "SEÑALETICA FOTOLUMINISCENTE - CACI", costo: 3.5, precio: 6.5, marca: "CACI" },
    { id: "senal-estrobo", name: "SEÑALETICA FOTOLUMINISCENTE - ESTROBO", costo: 3.5, precio: 6.5, marca: "CACI" },
    { id: "senal-manual", name: "SEÑALETICA FOTOLUMINISCENTE - ESTACION MANUAL", costo: 3.5, precio: 6.5, marca: "CACI" },
    { id: "senal-humo", name: "SEÑALETICA FOTOLUMINISCENTE - DETECTOR DE HUMO", costo: 3.5, precio: 6.5, marca: "CACI" },
    { id: "senal-temp", name: "SEÑALETICA FOTOLUMINISCENTE - DETECTOR DE TEMPERATURA", costo: 3.5, precio: 6.5, marca: "CACI" },
    { id: "caja-cable-genesys", name: "CAJA DE CABLE 4 HILOS PARA CACI GENESYS", costo: 520.0, precio: 830.0, marca: "CACI" },
    { id: "caja-cable-generico", name: "CAJA DE CABLE 4 HILOS PARA CACI GENERICO", costo: 143.0, precio: 420.0, marca: "CACI" },

    // --- Eléctrico (NUEVO) ---
    { id: "rollo-cable-12", name: "ROLLO 100M CABLE ELECTRICO #12", costo: 230.0, precio: 420.0, marca: "Eléctrico" },
    { id: "cable-10", name: "METRO DE CABLE ELECTRICO #10 (m)", costo: 2.8, precio: 3.8, unidad: "m", marca: "Eléctrico" },
    { id: "cable-12", name: "METRO DE CABLE ELECTRICO #12 (m)", costo: 2.3, precio: 3.6, unidad: "m", marca: "Eléctrico" },
    { id: "cable-14", name: "METRO DE CABLE ELECTRICO #14 (m)", costo: 1.8, precio: 3.4, unidad: "m", marca: "Eléctrico" },
    { id: "toma-ados", name: "TOMACORRIENTE ADOSABLE", costo: 3.0, precio: 7.0, marca: "Eléctrico" },
    { id: "toma-empo", name: "TOMACORRIENTE EMPOTRABLE", costo: 5.0, precio: 10.0, marca: "Eléctrico" },
    { id: "llave-term20", name: "LLAVE TERMICA 20A", costo: 20.0, precio: 35.0, marca: "Eléctrico" },
    { id: "llave-dif25", name: "LLAVE DIFERENCIAL 25A", costo: 30.0, precio: 46.0, marca: "Eléctrico" },
    { id: "tablero2", name: "TABLERO 2 LLAVES", costo: 7.0, precio: 15.0, marca: "Eléctrico" },

    // --- Instalación / cableado estructurado (NUEVO, hoja "ACCESORIOS DE INSTALACION") ---
    // Cajas de pase PVC (tamaños adicionales a caja10pvc, que ya existía)
    { id: "cajapase-15x150", name: "CAJA PASE 15X150 PVC", costo: 5.0, precio: 12.5, marca: "Instalación" },
    { id: "cajapase-20x200", name: "CAJA PASE 20X200 PVC", costo: 12.0, precio: 24.0, marca: "Instalación" },
    { id: "cajapase-20x250", name: "CAJA PASE 20X250 PVC", costo: 18.0, precio: 26.0, marca: "Instalación" },
    { id: "cajapase-35x450", name: "CAJA PASE 35X450 PVC", costo: 59.0, precio: 85.0, marca: "Instalación" },
    // Cables / patch cords fijos
    { id: "cable-red-160", name: "CABLE DE RED 1.60M", costo: 11.8, precio: 18.0, marca: "Instalación" },
    { id: "cable-hdmi-160", name: "CABLE HDMI 1.60M", costo: 14.16, precio: 24.0, marca: "Instalación" },
    { id: "extender-usb", name: "EXTENDER USB", costo: 38.0, precio: 58.0, marca: "Instalación" },
    // Cable UTP CAT5E / CAT5 / CAT6 (cajas de 305m y por metro)
    { id: "utp-cat5e-aleacion-caja", name: "CAJA DE CABLE UTP CAT 5E CERTIFICADO ALEACION MARCA DIXON", costo: 160.0, precio: 250.0, marca: "Instalación" },
    { id: "utp-cat5e-cobre-caja", name: "CAJA DE CABLE UTP CAT 5E CERTIFICADO MARCA DIXON COBRE", costo: 400.0, precio: 574.36, marca: "Instalación" },
    { id: "utp-cat5e-cobre-m", name: "METRO DE CABLE UTP CAT 5E CERTIFICADO MARCA DIXON (m)", costo: 0.52, precio: 2.0, unidad: "m", marca: "Instalación" },
    { id: "utp-cat5-ext-cobre-caja", name: "CAJA DE CABLE UTP CAT5 EXTERIOR COBRE MARCA DIXON", costo: 450.0, precio: 620.0, marca: "Instalación" },
    { id: "utp-cat5-ext-cobre-m", name: "METRO DE CABLE UTP CAT5 EXTERIOR COBRE MARCA DIXON (m)", costo: 1.48, precio: 2.5, unidad: "m", marca: "Instalación" },
    { id: "utp-cat6-int-cobre-caja", name: "CAJA DE CABLE UTP CAT6 INTERIOR COBRE MARCA DIXON", costo: 550.0, precio: 750.0, marca: "Instalación" },
    { id: "utp-cat6-ext-cobre-caja", name: "CAJA DE CABLE UTP CAT6 EXTERIOR COBRE MARCA DIXON", costo: 630.0, precio: 870.0, marca: "Instalación" },
    { id: "utp-cat6-ext-aleacion-caja", name: "CAJA DE CABLE UTP CAT6 EXTERIOR ALEACION", costo: 150.0, precio: 240.0, marca: "Instalación" },
    { id: "utp-cat6-ext-aleacion-m", name: "METRO DE CABLE UTP CAT6 EXTERIOR ALEACION (m)", costo: 0.49, precio: 2.0, unidad: "m", marca: "Instalación" },
    { id: "utp-cat6-dahua-caja", name: "CAJA DE CABLE UTP CAT 6 DAHUA", costo: 390.0, precio: 580.0, marca: "Instalación" },
    { id: "utp-cat6-dahua-m", name: "METRO CABLE CAT6 DAHUA (m)", costo: 1.28, precio: 3.5, unidad: "m", marca: "Instalación" },
    { id: "utp-cat6-ext-dahua-caja", name: "CAJA DE CABLE UTP CAT 6 P/EXT DAHUA", costo: 430.0, precio: 639.0, marca: "Instalación" },
    // Cable coaxial RG6
    { id: "rg6-caja", name: "CAJA CABLE RG6", costo: 120.0, precio: 180.0, marca: "Instalación" },
    { id: "rg6-m", name: "METRO CABLE RG6 (m)", costo: 1.42, precio: 2.8, unidad: "m", marca: "Instalación" },
    // Conectores RJ45 (por caja)
    { id: "rj45-x12", name: "CAJA CONECTORES RJ45 X12UNIDS", costo: 12.0, precio: 28.0, marca: "Instalación" },
    { id: "rj45-x18", name: "CAJA CONECTORES RJ45 X18UNIDS", costo: 18.0, precio: 39.0, marca: "Instalación" },
    { id: "rj45-x25", name: "CAJA CONECTORES RJ45 X25UNIDS", costo: 25.0, precio: 50.0, marca: "Instalación" },
    { id: "rj45-x50", name: "CAJA CONECTORES RJ45 X50UNIDS", costo: 50.0, precio: 80.0, marca: "Instalación" },
    { id: "rj45-x100", name: "CAJA CONECTORES RJ45 X100UNIDS", costo: 100.0, precio: 140.0, marca: "Instalación" },
    // Cajas / canaletas genéricas (distintas de las específicas EMT)
    { id: "caja-mod-generica", name: "CAJA MODULAR GENERICA", costo: 3.0, precio: 5.0, marca: "Instalación" },
    { id: "canaleta-10x20", name: "CANALETA 10X20", costo: 2.0, precio: 4.0, marca: "Instalación" },
    { id: "canaleta-14x24", name: "CANALETA 14X24", costo: 4.0, precio: 6.5, marca: "Instalación" },
    { id: "canaleta-19x39", name: "CANALETA 19X39", costo: 6.0, precio: 9.0, marca: "Instalación" },
    { id: "splitter", name: "SPLITTER", costo: 60.0, precio: 125.0, marca: "Instalación" },
    // Tubo corrugado negro PVC (distinto del corrugado EMT)
    { id: "tubo-corr-negro-rollo", name: "ROLLO DE TUBO CORRUGADO NEGRO PVC", costo: 70.0, precio: 120.0, marca: "Instalación" },
    { id: "tubo-corr-negro-m", name: "METRO DE TUBO CORRUGADO NEGRO PVC (m)", costo: 0.7, precio: 1.8, unidad: "m", marca: "Instalación" },
    // Brazos metálicos (cámaras)
    { id: "brazo-30", name: "BRAZO METALICO 30CM", costo: 25.0, precio: 55.0, marca: "Instalación" },
    { id: "brazo-60", name: "BRAZO METALICO 60CM", costo: 35.0, precio: 79.0, marca: "Instalación" },
    { id: "brazo-120", name: "BRAZO METALICO 120CM", costo: 60.0, precio: 145.0, marca: "Instalación" },
    { id: "brazo-200-poste", name: "BRAZO METALICO 200CM TIPO POSTE", costo: 100.0, precio: 220.0, marca: "Instalación" },
    { id: "brazo-220x80", name: "BRAZO METALICO 220X80CM", costo: 120.0, precio: 260.0, marca: "Instalación" },
    // Mini gabinetes y gabinetes metálicos (rack)
    { id: "mini-gabinete", name: "MINI GABINETE", costo: 40.0, precio: 80.0, marca: "Instalación" },
    { id: "mini-gabinete-bandeja", name: "MINI GABINETE METALICO CON BANDEJA", costo: 123.0, precio: 190.0, marca: "Instalación" },
    { id: "gabinete-4ru", name: "GABINETE METALICO 4RU", costo: 140.0, precio: 220.0, marca: "Instalación" },
    { id: "gabinete-4ru-bandeja", name: "GABINETE METALICO 4RU CON BANDEJA", costo: 165.0, precio: 260.0, marca: "Instalación" },
    { id: "gabinete-6ru", name: "GABINETE METALICO 6RU", costo: 190.0, precio: 300.0, marca: "Instalación" },
    { id: "gabinete-6ru-bandeja", name: "GABINETE METALICO 6RU CON BANDEJA", costo: 215.0, precio: 339.0, marca: "Instalación" },
    { id: "gabinete-8ru", name: "GABINETE METALICO 8RU", costo: 230.0, precio: 369.0, marca: "Instalación" },
    { id: "gabinete-8ru-bandeja", name: "GABINETE METALICO 8RU CON BANDEJA", costo: 255.0, precio: 409.0, marca: "Instalación" },
    // Tubería PVC liviana (distinta de la tubería conduit EMT)
    { id: "tubo-pvc-12", name: 'TUBO PVC 1/2"', costo: 2.0, precio: 5.0, marca: "Instalación" },
    { id: "tubo-pvc-34", name: 'TUBO PVC 3/4"', costo: 2.0, precio: 5.0, marca: "Instalación" },
    { id: "codo-pvc-34", name: 'CODO PVC 3/4"', costo: 0.5, precio: 1.5, marca: "Instalación" },

    // --- Cerco eléctrico ---
    { id: "poste-t", name: 'POSTE TEMPLADOR 4 HILOS 1 1/2" x 1.2mm', costo: 17.34, precio: 32.0, marca: "Cerco eléctrico" },
    { id: "poste-i", name: 'POSTE INTERMEDIO 4 HILOS 1 1/2" x 1.2mm', costo: 17.34, precio: 32.0, marca: "Cerco eléctrico" },
    { id: "ais-t", name: "AISLADOR TEMPLADOR CUADRADO", costo: 1.47, precio: 2.7, marca: "Cerco eléctrico" },
    { id: "ais-i", name: "AISLADOR INTERMEDIO", costo: 0.81, precio: 1.5, marca: "Cerco eléctrico" },
    { id: "aro-s", name: "ARO SIMPLE (TEMPLADOR)", costo: 1.1, precio: 2.0, marca: "Cerco eléctrico" },
    { id: "aro-d", name: "ARO DOBLE (INTERMEDIO)", costo: 1.3, precio: 2.5, marca: "Cerco eléctrico" },
    { id: "abraz", name: "ABRAZADERA DE ENLACE C/ARANDELA 5/16", costo: 0.59, precio: 1.55, marca: "Cerco eléctrico" },
    { id: "bujia", name: "CABLE BUJIA (m)", costo: 2.44, precio: 4.5, unidad: "m", marca: "Cerco eléctrico" },
    { id: "galv16", name: "KILO ALAMBRE GALVANIZADO 16mm", costo: 12.29, precio: 23.0, marca: "Cerco eléctrico" },
    { id: "acerado", name: "ALAMBRE ACERADO 2.5mm", costo: 12.46, precio: 23.5, marca: "Cerco eléctrico" },
    { id: "letrero", name: "LETRERO DE ADVERTENCIA ESTANDAR", costo: 3.09, precio: 6.0, marca: "Cerco eléctrico" },

    // --- Servicios ---
    // { id: "transporte", name: "TRANSPORTE (servicio)", costo: 20.0, precio: 30.0, marca: "Servicios" },
    {
      id: "mano-obra", name: "MANO DE OBRA (servicio)", costo: 600.0, precio: 600.0, marca: "Servicios",
      nota: "Varía según uso de soldadura o concreto; se emite recibo por honorarios"
    },
    { id: "cert-caci", name: "CERTIFICADO CACI (servicio)", costo: 60.0, precio: 90.0, marca: "Servicios" },
  ],
};

// ---------------------------------------------------------------------------
// ACCESORIOS DE INSTALACIÓN POR DEFECTO (kits de alarmas nuevos)
// Caja pase PVC + 10 m de cable vulcanizado + tomacorriente adosable + accesorios de instalación.
// El rollo de cable de 100 m ("rollo-cat6") queda como opcional.
// ---------------------------------------------------------------------------
const ACC_INSTALACION_ALARMA = [
  { pid: "caja10pvc", qty: 1 },
  { pid: "cat6", qty: 10 },
  { pid: "toma-ados", qty: 1 },
  { pid: "acc-inst-alarma", qty: 1 },
];

// ---------------------------------------------------------------------------
// KITS PREDEFINIDOS
// items: los que se cargan siempre. opcionales: se ofrecen con checkbox.
// ---------------------------------------------------------------------------
export const KITS = [
  {
    id: "caci-5",
    name: "Kit CACI Detección 5 zonas",
    categoria: "Central de Alarma Contra Incendios",
    laborValue: 180,
    items: {
      equipos: [
        { pid: "pf5", qty: 1 }, { pid: "bat4", qty: 1 }, { pid: "humo", qty: 1 },
        { pid: "manual", qty: 1 }, { pid: "estrobo", qty: 1 },
      ],
      accesorios: [
        { pid: "caci4h", qty: 10 }, { pid: "tuberia", qty: 3 }, { pid: "curva", qty: 2 },
        { pid: "caja10", qty: 1 }, { pid: "canast-oct", qty: 1 }, { pid: "canast-rec", qty: 2 },
        { pid: "conector", qty: 5 }, { pid: "union", qty: 3 }, { pid: "gancho", qty: 6 },
        { pid: "acc-inst", qty: 1 },
      ],
    },
    opcionales: {
      equipos: [
        { pid: "temp", qty: 1 }, { pid: "bat7", qty: 1 }, { pid: "bat4-ad", qty: 1 },
        { pid: "panel-firemax8", qty: 1 }, { pid: "base-manual", qty: 1 }, { pid: "humo-ad", qty: 1 },
        { pid: "temp-ad", qty: 1 }, { pid: "estrobo-ad", qty: 1 }, { pid: "manual-ad", qty: 1 },
      ],
      accesorios: [
        { pid: "tapa-oct", qty: 1 }, { pid: "tubo-corr", qty: 1 }, { pid: "tuberia-pes", qty: 1 },
        { pid: "caja-mod", qty: 1 }, { pid: "conector-paq", qty: 1 }, { pid: "union-paq", qty: 1 },
        { pid: "abraz-emt-paq", qty: 1 },
        { pid: "senal-caci", qty: 1 }, { pid: "senal-estrobo", qty: 1 }, { pid: "senal-manual", qty: 1 },
        { pid: "senal-humo", qty: 1 }, { pid: "senal-temp", qty: 1 },
        { pid: "transporte", qty: 1 }, { pid: "cert-caci", qty: 1 }, { pid: "mano-obra", qty: 1 },
      ],
    },
  },
  {
    id: "caci-8",
    name: "Kit CACI Detección 8 zonas",
    categoria: "Central de Alarma Contra Incendios",
    laborValue: 250,
    items: {
      equipos: [
        { pid: "pf8", qty: 1 }, { pid: "bat4", qty: 1 }, { pid: "humo", qty: 1 },
        { pid: "manual", qty: 1 }, { pid: "estrobo", qty: 1 },
      ],
      accesorios: [
        { pid: "caci4h", qty: 20 }, { pid: "tuberia", qty: 6 }, { pid: "curva", qty: 4 },
        { pid: "caja10", qty: 2 }, { pid: "canast-oct", qty: 2 }, { pid: "canast-rec", qty: 3 },
        { pid: "conector", qty: 8 }, { pid: "union", qty: 5 }, { pid: "gancho", qty: 10 },
        { pid: "acc-inst", qty: 1 },
      ],
    },
    opcionales: {
      equipos: [
        { pid: "temp", qty: 1 }, { pid: "bat7", qty: 1 }, { pid: "bat4-ad", qty: 1 },
        { pid: "panel-firemax8", qty: 1 }, { pid: "base-manual", qty: 1 }, { pid: "humo-ad", qty: 1 },
        { pid: "temp-ad", qty: 1 }, { pid: "estrobo-ad", qty: 1 }, { pid: "manual-ad", qty: 1 },
      ],
      accesorios: [
        { pid: "tapa-oct", qty: 1 }, { pid: "tubo-corr", qty: 1 }, { pid: "tuberia-pes", qty: 1 },
        { pid: "caja-mod", qty: 1 }, { pid: "conector-paq", qty: 1 }, { pid: "union-paq", qty: 1 },
        { pid: "abraz-emt-paq", qty: 1 },
        { pid: "senal-caci", qty: 1 }, { pid: "senal-estrobo", qty: 1 }, { pid: "senal-manual", qty: 1 },
        { pid: "senal-humo", qty: 1 }, { pid: "senal-temp", qty: 1 },
        { pid: "transporte", qty: 1 }, { pid: "cert-caci", qty: 1 }, { pid: "mano-obra", qty: 1 },
      ],
    },
  },
  {
    id: "caci-fm8",
    name: "Kit CACI Detección 8 zonas (FIREMAX-8)",
    categoria: "Central de Alarma Contra Incendios",
    items: {
      equipos: [
        { pid: "panel-firemax8", qty: 1 }, { pid: "bat7", qty: 2 }, { pid: "humo", qty: 1 },
        { pid: "manual", qty: 1 }, { pid: "estrobo", qty: 1 },
      ],
      accesorios: [],
    },
    opcionales: {
      equipos: [
        { pid: "temp", qty: 1 }, { pid: "bat4-ad", qty: 1 }, { pid: "bat7-ad", qty: 1 },
        { pid: "base-manual", qty: 1 }, { pid: "humo-ad", qty: 1 }, { pid: "temp-ad", qty: 1 },
        { pid: "estrobo-ad", qty: 1 }, { pid: "manual-ad", qty: 1 },
      ],
      accesorios: [
        { pid: "tapa-oct", qty: 1 }, { pid: "tubo-corr", qty: 1 }, { pid: "tuberia-pes", qty: 1 },
        { pid: "caja-mod", qty: 1 }, { pid: "conector-paq", qty: 1 }, { pid: "union-paq", qty: 1 },
        { pid: "abraz-emt-paq", qty: 1 },
        { pid: "senal-caci", qty: 1 }, { pid: "senal-estrobo", qty: 1 }, { pid: "senal-manual", qty: 1 },
        { pid: "senal-humo", qty: 1 }, { pid: "senal-temp", qty: 1 },
        { pid: "cert-caci", qty: 1 }, { pid: "mano-obra", qty: 1 },
      ],
    },
  },
  {
    id: "caci-fm16",
    name: "Kit CACI Detección 16 zonas (FIREMAX-16)",
    categoria: "Central de Alarma Contra Incendios",
    items: {
      equipos: [
        { pid: "panel-firemax16", qty: 1 }, { pid: "bat7", qty: 2 }, { pid: "humo", qty: 1 },
        { pid: "manual", qty: 1 }, { pid: "estrobo", qty: 1 },
      ],
      accesorios: [],
    },
    opcionales: {
      equipos: [
        { pid: "temp", qty: 1 }, { pid: "bat4-ad", qty: 1 }, { pid: "bat7-ad", qty: 1 },
        { pid: "base-manual", qty: 1 }, { pid: "humo-ad", qty: 1 }, { pid: "temp-ad", qty: 1 },
        { pid: "estrobo-ad", qty: 1 }, { pid: "manual-ad", qty: 1 },
      ],
      accesorios: [
        { pid: "tapa-oct", qty: 1 }, { pid: "tubo-corr", qty: 1 }, { pid: "tuberia-pes", qty: 1 },
        { pid: "caja-mod", qty: 1 }, { pid: "conector-paq", qty: 1 }, { pid: "union-paq", qty: 1 },
        { pid: "abraz-emt-paq", qty: 1 },
        { pid: "senal-caci", qty: 1 }, { pid: "senal-estrobo", qty: 1 }, { pid: "senal-manual", qty: 1 },
        { pid: "senal-humo", qty: 1 }, { pid: "senal-temp", qty: 1 },
        { pid: "cert-caci", qty: 1 }, { pid: "mano-obra", qty: 1 },
      ],
    },
  },
  {
    id: "sx-rf3-smart",
    name: "Kit SHOCTIX RF3 SMART",
    categoria: "Alarmas / pánico",
    precioReferencia: 390,
    items: {
      equipos: [
        { pid: "sx-rf3s", qty: 1 },
      ],
      accesorios: [
        // { pid: "cat6", qty: 10 },
        { pid: "caja10pvc", qty: 1 },
        { pid: "conectorDc", qty: 1 }
      ],
    },
    opcionales: {
      equipos: [
        { pid: "fuente12", qty: 1 },
        { pid: "panico", qty: 1 },
        { pid: "puls100", qty: 1 },
        { pid: "puls500", qty: 1 },
        { pid: "sensorpir", qty: 1 },
        { pid: "contactomag", qty: 1 },
        // Opcionales nuevos (cuadro "ALARMA WIFI SMART" de la cotización de referencia)
        { pid: "sx-sensormov", qty: 1 },
        { pid: "sx-contactomag", qty: 1 },
        { pid: "sx-costoservicio", qty: 1 },
      ],
      accesorios: []
    },
  },
  {
    id: "sx-rf3-smart-completo",
    name: "Kit SHOCTIX RF3 SMART Completo (c/ sensor de movimiento y contacto magnético)",
    categoria: "Alarmas / pánico",
    precioReferencia: 409,
    nota: "Corresponde al cuadro 'KIT RF3 SMART' de la cotización de referencia: trae el kit base más un sensor de movimiento y un contacto magnético incluidos.",
    items: {
      equipos: [
        { pid: "sx-rf3s", qty: 1 },
        { pid: "sx-sensormov", qty: 1 },
        { pid: "sx-contactomag", qty: 1 },
      ],
      accesorios: [
        { pid: "caja10pvc", qty: 1 },
        { pid: "conectorDc", qty: 1 },
      ],
    },
    opcionales: {
      equipos: [
        { pid: "panico", qty: 1 },
        { pid: "sx-costoservicio", qty: 1 },
        { pid: "fuente12", qty: 1 },
        { pid: "puls100", qty: 1 },
        { pid: "puls500", qty: 1 },
      ],
      accesorios: [],
    },
  },
  {
    id: "sx-txvoz",
    name: "Kit TX VOZ",
    categoria: "Alarmas / pánico",
    precioReferencia: 169,
    items: {
      equipos: [
        { pid: "sx-txvoz", qty: 1 }
      ],
      accesorios: []
    },
    opcionales: {
      equipos: [
        { pid: "puls100", qty: 1 },
        { pid: "fuente12", qty: 1 },
      ],
      accesorios: [
        { pid: "caja10pvc", qty: 1 },
        { pid: "cat6", qty: 10 },
      ],
    },
  },
  // ----- NUEVOS: TX VOZ (hoja de cotización) -----
  {
    id: "sx-txvoz-fuente",
    name: "Kit TX VOZ + Fuente 12V",
    categoria: "Alarmas / pánico",
    precioReferencia: 230,
    nota: "Corresponde al cuadro 'EQUIPOS TXVOZ' de la cotización de referencia: kit TX VOZ más fuente 12V.",
    items: {
      equipos: [
        { pid: "sx-txvoz", qty: 1 },
        { pid: "fuente12", qty: 1 },
      ],
      accesorios: [...ACC_INSTALACION_ALARMA],
    },
    opcionales: {
      equipos: [
        { pid: "puls100", qty: 1 },
        { pid: "puls500", qty: 1 },
        { pid: "panico", qty: 1 },
      ],
      accesorios: [{ pid: "rollo-cat6", qty: 1 }],
    },
  },
  {
    id: "sx-txvoz-smart",
    name: "Kit TX VOZ SMART",
    categoria: "Alarmas / pánico",
    precioReferencia: 309,
    nota: "Corresponde al cuadro 'EQUIPOS TXVOZ SMART' de la cotización de referencia (fuente 12V2A + pulsador RF 100m incluidos).",
    items: {
      equipos: [
        { pid: "sx-txvoz-smart", qty: 1 },
      ],
      accesorios: [...ACC_INSTALACION_ALARMA],
    },
    opcionales: {
      equipos: [
        { pid: "puls500", qty: 1 },
        { pid: "panico", qty: 1 },
      ],
      accesorios: [{ pid: "rollo-cat6", qty: 1 }],
    },
  },
  {
    id: "ipvoz-wifi",
    name: "Kit IPVOZ WiFi 60W",
    categoria: "Alarmas / pánico",
    precioReferencia: 363,
    items: {
      equipos: [{ pid: "ipvoz-wifi", qty: 1 }],
      accesorios: [],
    },
    opcionales: {
      equipos: [
        { pid: "fuente12", qty: 1 },
        { pid: "puls100", qty: 1 },
        { pid: "puls500", qty: 1 },
        { pid: "sensorpir", qty: 1 },
        { pid: "contactomag", qty: 1 }
      ],
      accesorios: [
        { pid: "caja10pvc", qty: 1 },
        { pid: "cat6", qty: 10 },
      ]
    },
  },
  {
    id: "ipvoz-eth",
    name: "Kit IPVOZ Ethernet 100W",
    categoria: "Alarmas / pánico",
    precioReferencia: 908,
    items: {
      equipos: [
        { pid: "ipvoz-eth", qty: 1 }],
      accesorios: [],
    },
    opcionales: {
      equipos: [
        { pid: "fuente12", qty: 1 },
        { pid: "puls100", qty: 1 },
        { pid: "puls500", qty: 1 },
        { pid: "sensorpir", qty: 1 },
        { pid: "contactomag", qty: 1 }
      ],
      accesorios: [
        { pid: "caja10pvc", qty: 1 },
        { pid: "cat6", qty: 10 }
      ]
    },
  },
  // ----- NUEVOS: IPVOZ WiFi (hoja de cotización) -----
  {
    id: "ipvoz-wifi-llavero",
    name: "Kit IPVOZ WiFi 60W + Llavero RF 500M",
    categoria: "Alarmas / pánico",
    precioReferencia: 409,
    nota: "Corresponde al primer cuadro 'EQUIPOS IP VOZ WIFI' de la cotización de referencia.",
    items: {
      equipos: [
        { pid: "ipvoz-wifi", qty: 1 },
        { pid: "puls500", qty: 1 },
      ],
      accesorios: [...ACC_INSTALACION_ALARMA],
    },
    opcionales: {
      equipos: [
        { pid: "sx-sensormov", qty: 1 },
        { pid: "sx-contactomag", qty: 1 },
        { pid: "panico", qty: 1 },
      ],
      accesorios: [{ pid: "rollo-cat6", qty: 1 }],
    },
  },
  {
    id: "ipvoz-wifi-completo",
    name: "Kit IPVOZ WiFi 60W Completo (c/ llavero, sensor de movimiento y contacto magnético)",
    categoria: "Alarmas / pánico",
    precioReferencia: 566.9,
    nota: "Corresponde al segundo cuadro 'EQUIPOS IP VOZ WIFI' de la cotización de referencia. El kit IPVOZ lleva aquí precio de paquete (356.90).",
    items: {
      equipos: [
        { pid: "ipvoz-wifi-comp", qty: 1 },
        { pid: "puls500", qty: 1 },
        { pid: "sx-sensormov", qty: 1 },
        { pid: "sx-contactomag", qty: 1 },
      ],
      accesorios: [...ACC_INSTALACION_ALARMA],
    },
    opcionales: {
      equipos: [
        { pid: "panico", qty: 1 },
      ],
      accesorios: [{ pid: "rollo-cat6", qty: 1 }],
    },
  },
  {
    id: "sx-doble",
    name: "Kit SHOCTIX ALERT PRO SMART DOBLE",
    categoria: "Alarmas / pánico",
    precioReferencia: 579,
    items: {
      equipos: [
        { pid: "sx-doble", qty: 1 }, { pid: "bocina30", qty: 1 },
        { pid: "sirena30", qty: 1 }, { pid: "bat4a", qty: 1 },
      ],
      accesorios: [{ pid: "cat6", qty: 10 }, { pid: "caja10", qty: 2 }],
    },
    opcionales: { equipos: [{ pid: "puls500", qty: 1 }, { pid: "puls100", qty: 1 }, { pid: "panico", qty: 1 }], accesorios: [] },
  },
  {
    id: "sx-triple",
    name: "Kit SHOCTIX ALERT PRO TRIPLE",
    categoria: "Alarmas / pánico",
    precioReferencia: 715,
    items: {
      equipos: [
        { pid: "sx-triple", qty: 1 }, { pid: "bocina30", qty: 1 },
        { pid: "sirena30", qty: 1 }, { pid: "bat4a", qty: 1 },
      ],
      accesorios: [{ pid: "cat6", qty: 10 }, { pid: "caja10", qty: 2 }],
    },
    opcionales: { equipos: [{ pid: "puls500", qty: 1 }, { pid: "puls-alam", qty: 1 }], accesorios: [] },
  },
  {
    id: "sx-4g-lite",
    name: "Kit SHOCTIX ALERT PRO 4G LITE",
    categoria: "Alarmas / pánico",
    precioReferencia: 1150,
    items: {
      equipos: [
        { pid: "sx-4glite", qty: 1 }, { pid: "bocina30", qty: 1 },
        { pid: "sirena30", qty: 1 }, { pid: "bat4a", qty: 1 },
      ],
      accesorios: [{ pid: "cat6", qty: 10 }, { pid: "caja10", qty: 2 }],
    },
    opcionales: { equipos: [{ pid: "puls500", qty: 1 }, { pid: "puls-alam", qty: 1 }], accesorios: [] },
  },
  {
    id: "sx-4g-net",
    name: "Kit SHOCTIX ALERT PRO 4G NET",
    categoria: "Alarmas / pánico",
    precioReferencia: 1640,
    items: {
      equipos: [
        { pid: "sx-4gnet", qty: 1 }, { pid: "bocina30", qty: 1 },
        { pid: "sirena30", qty: 1 }, { pid: "bat4a", qty: 1 },
      ],
      accesorios: [{ pid: "cat6", qty: 10 }, { pid: "caja10", qty: 2 }],
    },
    opcionales: { equipos: [{ pid: "puls500", qty: 1 }, { pid: "puls-alam", qty: 1 }], accesorios: [] },
  },
  {
    id: "hg-mpr3",
    name: "Kit HAGROY MPR3",
    categoria: "Alarmas / pánico",
    precioReferencia: 450,
    items: {
      equipos: [
        { pid: "hg-mpr3", qty: 1 }, { pid: "sirena30", qty: 1 },
        { pid: "bat4a", qty: 1 }, { pid: "puls500", qty: 1 },
      ],
      accesorios: [{ pid: "cat6", qty: 10 }, { pid: "caja10", qty: 2 }],
    },
    opcionales: { equipos: [{ pid: "bocina30", qty: 1 }], accesorios: [] },
  },
  {
    id: "hg-alcom",
    name: "Kit HAGROY ALCOM MAX 4G",
    categoria: "Alarmas / pánico",
    precioReferencia: 1650,
    items: {
      equipos: [
        { pid: "hg-alcom", qty: 1 }, { pid: "bocina30", qty: 1 }, { pid: "sirena30", qty: 1 },
        { pid: "bat4a", qty: 1 }, { pid: "puls500", qty: 1 },
      ],
      accesorios: [{ pid: "cat6", qty: 10 }, { pid: "caja10", qty: 2 }],
    },
    opcionales: { equipos: [], accesorios: [] },
  },

  {
    id: "cerco-10",
    name: "Kit Cerco Eléctrico 10 m (Yanex 1600)",
    categoria: "Cerco eléctrico",
    nota: "1kg de alambre acerado equivale a 3.5m x 4 líneas en los postes del cerco. " +
      "La mano de obra depende exclusivamente del uso de soldadura o concreto (cotizar con el ítem 'MANO DE OBRA (servicio)'). " +
      "El cable bujía se cotiza x 3 líneas, dependiendo también de la ubicación del panel, que no debe exceder los 10m de distancia del cerco. " +
      "El panel YANEX es IP65, apto para exteriores.",
    items: {
      equipos: [{ pid: "hg-yanex", qty: 1 }],
      accesorios: [
        { pid: "poste-t", qty: 2 }, { pid: "poste-i", qty: 3 }, { pid: "ais-t", qty: 10 },
        { pid: "ais-i", qty: 15 }, { pid: "aro-s", qty: 10 }, { pid: "aro-d", qty: 15 },
        { pid: "abraz", qty: 15 }, { pid: "galv16", qty: 1 }, { pid: "acerado", qty: 3 },
        { pid: "letrero", qty: 1 },
      ],
    },
    opcionales: { equipos: [], accesorios: [{ pid: "bujia", qty: 5 }] },
  },
];

const ADIC_CACI = [
  { pid: "humo-ad", qty: 1 },
  { pid: "temp-ad", qty: 1 },
  { pid: "estrobo-ad", qty: 1 },
  { pid: "manual-ad", qty: 1 },
  { pid: "base-manual", qty: 1 },
  { pid: "bat4-ad", qty: 1 },
  { pid: "bat7-ad", qty: 1 },
];
const ADIC_ALARMA = [
  { pid: "fuente12", qty: 1 },
  { pid: "puls500", qty: 1 },
  { pid: "puls100", qty: 1 },
  { pid: "panico", qty: 1 },
  { pid: "sensorpir", qty: 1 },
  { pid: "contactomag", qty: 1 },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
const buscar = (catalogo, cat, pid) => catalogo[cat].find((p) => p.id === pid);

export function adicionalesDe(kit) {
  if (kit.adicionales) return kit.adicionales;
  if (kit.categoria === "Central de Alarma Contra Incendios") return ADIC_CACI;
  if (kit.categoria === "Alarmas / pánico") return ADIC_ALARMA;
  return []; // cerco, personalizados, etc.
}

/** Opcionales sin los que ya salen como adicionales (evita duplicados en el modal). */
export function opcionalesDe(kit) {
  const adic = new Set(adicionalesDe(kit).map((l) => l.pid));
  return {
    equipos: (kit.opcionales?.equipos || []).filter((l) => !adic.has(l.pid)),
    accesorios: kit.opcionales?.accesorios || [],
  };
}

/** Convierte las líneas de un kit al formato de items de la cotización. */
export function kitAItems(kit, catalogo = CATALOGO, opcionalesElegidos = []) {
  const armar = (cat) => {
    const base = kit.items?.[cat] || [];
    const extra = (kit.opcionales?.[cat] || []).filter((l) => opcionalesElegidos.includes(l.pid));
    return [...base, ...extra]
      .map((linea) => {
        const p = buscar(catalogo, cat, linea.pid);
        if (!p) return null;
        return { pid: p.id, qty: linea.qty, costo: p.costo, precio: p.precio };
      })
      .filter(Boolean);
  };
  return { equipos: armar("equipos"), accesorios: armar("accesorios") };
}

/** Suma cantidades cuando un mismo producto ya existe en la cotización. */
export function fusionarItems(actuales, nuevos) {
  const out = [...actuales];
  nuevos.forEach((n) => {
    const i = out.findIndex((x) => x.pid && x.pid === n.pid);
    if (i >= 0) out[i] = { ...out[i], qty: out[i].qty + n.qty };
    else out.push(n);
  });
  return out;
}

/** Costo / venta / margen estimado de un kit, para mostrarlo en el selector. */
export function resumenKit(kit, catalogo = CATALOGO, opcionalesElegidos = []) {
  const items = kitAItems(kit, catalogo, opcionalesElegidos);
  let costo = 0, venta = 0;
  ["equipos", "accesorios"].forEach((c) =>
    items[c].forEach((it) => { costo += it.costo * it.qty; venta += it.precio * it.qty; })
  );
  return { costo, venta, margen: venta - costo, margenPct: venta ? ((venta - costo) / venta) * 100 : 0 };
}

/** Crea un kit nuevo a partir de la cotización que está abierta. */
export function kitDesdeCotizacion(nombre, quote, categoria = "Personalizados") {
  const limpiar = (arr) => arr.filter((i) => i.pid).map((i) => ({ pid: i.pid, qty: i.qty }));
  return {
    id: `kit_${Date.now()}`,
    name: nombre,
    categoria,
    laborValue: quote.laborValue || 0,
    custom: true,
    items: { equipos: limpiar(quote.items.equipos), accesorios: limpiar(quote.items.accesorios) },
    opcionales: { equipos: [], accesorios: [] },
  };
}