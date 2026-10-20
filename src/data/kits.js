export const IGV = 0.18;
export const neto = (v) => +(v / (1 + IGV)).toFixed(2);

export const CATALOGO = {
  equipos: [
    // --- CACI / detección ---
    { id: "pf5", name: "PROTEC FIRE 5 2.0 (5 zonas)", costo: 202.0, precio: 366.71, marca: "CACI" },
    { id: "pf8", name: "PROTEC FIRE 8 2.0 (8 zonas)", costo: 514.13, precio: 932.71, marca: "CACI" },
    {
      id: "panel-firemax8", name: "PANEL CONVENCIONAL MOD. FIREMAX-8", costo: 629.53, precio: 990.46, marca: "CACI",
      nota: "Alternativa de panel para proyectos de 8 zonas"
    },
    { id: "bat4", name: "BATERIA 12V 4AMP", costo: 40.0, precio: 72.62, marca: "CACI" },
    { id: "bat7", name: "BATERIA 12V 7AMP", costo: 52.05, precio: 91.62, marca: "CACI" },
    { id: "humo", name: "DETECTOR DE HUMO", costo: 25.37, precio: 46.06, marca: "CACI" },
    {
      id: "humo-ad", name: "DETECTOR DE HUMO (UNIDAD ADICIONAL)", costo: 25.56, precio: 60.0, marca: "CACI",
      nota: "Precio por zona adicional más allá del kit base"
    },
    { id: "manual", name: "ESTACION MANUAL", costo: 31.27, precio: 56.77, marca: "CACI" },
    {
      id: "manual-ad", name: "ESTACION MANUAL (UNIDAD ADICIONAL)", costo: 31.24, precio: 65.0, marca: "CACI",
      nota: "Precio por zona adicional más allá del kit base"
    },
    { id: "base-manual", name: "BASE PARA ESTACION MANUAL", costo: 17.0, precio: 28.66, marca: "CACI" },
    { id: "temp", name: "SENSOR DE TEMPERATURA", costo: 25.37, precio: 46.06, marca: "CACI" },
    {
      id: "temp-ad", name: "SENSOR DE TEMPERATURA (UNIDAD ADICIONAL)", costo: 30.63, precio: 70.0, marca: "CACI",
      nota: "Precio por zona adicional más allá del kit base"
    },
    { id: "estrobo", name: "ESTROBO", costo: 30.68, precio: 55.7, marca: "CACI" },
    {
      id: "estrobo-ad", name: "ESTROBO (UNIDAD ADICIONAL)", costo: 30.63, precio: 70.0, marca: "CACI",
      nota: "Precio por zona adicional más allá del kit base"
    },

    // --- SHOCTIX ---
    { id: "sx-rf3s", name: "KIT SHOCTIX RF3 SMART (fuente + pulsador 100m)", costo: 148.35, precio: 269.31, marca: "SHOCTIX" },
    // { id: "sx-rf3l", name: "KIT SHOCTIX RF3 LITE (fuente + pulsador 100m)", costo: 112.1, precio: 178.58, marca: "SHOCTIX" },
    { id: "sx-txvoz", name: "TX VOZ (con fuente)", costo: 111.99, precio: 167.83, marca: "SHOCTIX" },
    { id: "sx-doble", name: "SHOCTIX ALERT PRO SMART DOBLE (panel + pulsador)", costo: 227.49, precio: 364.86, marca: "SHOCTIX" },
    { id: "sx-triple", name: "SHOCTIX ALERT PRO TRIPLE (panel + pulsador)", costo: 262.49, precio: 465.72, marca: "SHOCTIX" },
    { id: "sx-4glite", name: "SHOCTIX ALERT PRO 4G LITE (panel + pulsador)", costo: 559.99, precio: 900.72, marca: "SHOCTIX" },
    { id: "sx-4gnet", name: "SHOCTIX ALERT PRO 4G NET (panel + pulsador)", costo: 874.99, precio: 1390.73, marca: "SHOCTIX" },

    // --- HAGROY ---
    { id: "hg-mpr3", name: "HAGROY MPR3", costo: 144.55, precio: 202.98, marca: "HAGROY" },
    { id: "hg-alcom", name: "PANEL HAGROY ALCOM MAX 4G", costo: 937.51, precio: 1336.54, marca: "HAGROY" },
    {
      id: "hg-yanex", name: "KIT CERCO ELECTRICO YANEX 1600 HAGROY", costo: 244.26, precio: 430.0, marca: "HAGROY",
      nota: "Incluye electrificador, sirena 30w, batería 4A, pulsador y letrero"
    },

    // --- IPVOZ (NUEVO) ---
    { id: "ipvoz-wifi", name: "KIT IPVOZ WIFI 60W (fuente 2AMP)", costo: 200.09, precio: 363.25, marca: "IPVOZ" },
    { id: "ipvoz-eth", name: "KIT IPVOZ ETHERNET 100W (fuente 2AMP)", costo: 500.25, precio: 908.14, marca: "IPVOZ" },

    // --- Periféricos comunes ---
    { id: "bocina30", name: "BOCINA 30W", costo: 37.76, precio: 72.05 },
    { id: "sirena30", name: "SIRENA 30W", costo: 37.76, precio: 72.05 },
    { id: "bat4a", name: "BATERIA 4A", costo: 47.2, precio: 65.0 },
    { id: "fuente12", name: "FUENTE 12V 2AMP", costo: 14.4, precio: 23.22 },
    { id: "puls500", name: "PULSADOR INALAMBRICO 500M", costo: 34.0, precio: 64.18 },
    { id: "puls100", name: "PULSADOR INALAMBRICO 100M", costo: 17.5, precio: 37.17 },
    // { id: "puls-alam", name: "PULSADOR ALAMBRICO HIKVISION", costo: 9.44, precio: 15.22 },
    { id: "panico", name: "BOTON DE PANICO HIKVISION", costo: 5.31, precio: 9.64 },
    { id: "sensorpir", name: "SENSOR INALAMBRICO PIR HAGROY", costo: 105.0, precio: 105.0 },
    { id: "contactomag", name: "CONTACTO MAGNETICO INALAMBRICO PIR HAGROY", costo: 76.0, precio: 76.0 },
  ],

  accesorios: [
    // --- Cableado / canalización ---
    { id: "cat6", name: "CABLE VULCANIZADO CAT6 (m)", costo: 1.06, precio: 1.71, unidad: "m" },
    { id: "caci4h", name: "CABLE 4 HILOS CACI (m)", costo: 1.7, precio: 4.2, unidad: "m" },
    { id: "caja10", name: "CAJA PASE 10x100 EMT", costo: 5.9, precio: 9.2 },
    { id: "tuberia", name: 'TUBERIA CONDUIT 1/2" EMT', costo: 10.0, precio: 18.15 },
    { id: "tubo-corr", name: 'METRO DE TUBO CORRUGADO EMT 1/2" (m)', costo: 3.0, precio: 6.0, unidad: "m" },
    { id: "curva", name: 'CURVA 1/2" EMT', costo: 3.0, precio: 8.0 },
    { id: "canast-oct", name: "CANASTILLA / CAJA OCTOGONAL EMT", costo: 2.5, precio: 7.0 },
    { id: "tapa-oct", name: "TAPA OCTOGONAL EMT", costo: 1.18, precio: 3.0 },
    { id: "canast-rec", name: "CANASTILLA RECTANGULAR EMT", costo: 4.72, precio: 8.57 },
    { id: "caja-mod", name: "CAJA MODULAR EMT", costo: 16.52, precio: 29.99 },
    { id: "conector", name: 'CONECTOR 1/2" EMT', costo: 1.3, precio: 3.8 },
    { id: "union", name: 'UNION 1/2" EMT', costo: 1.3, precio: 3.8 },
    { id: "gancho", name: 'GANCHO 1/2" EMT', costo: 2.36, precio: 4.285 },
    { id: "acc-inst", name: "ACCESORIOS DE INSTALACION", costo: 29.5, precio: 60.0 },

    // --- Señalética fotoluminiscente (NUEVO) ---
    { id: "senal-caci", name: "SEÑALETICA FOTOLUMINISCENTE - CACI", costo: 4.13, precio: 6.5 },
    { id: "senal-estrobo", name: "SEÑALETICA FOTOLUMINISCENTE - ESTROBO", costo: 4.13, precio: 6.5 },
    { id: "senal-manual", name: "SEÑALETICA FOTOLUMINISCENTE - ESTACION MANUAL", costo: 4.13, precio: 6.5 },
    { id: "senal-humo", name: "SEÑALETICA FOTOLUMINISCENTE - DETECTOR DE HUMO", costo: 4.13, precio: 6.5 },
    { id: "senal-temp", name: "SEÑALETICA FOTOLUMINISCENTE - DETECTOR DE TEMPERATURA", costo: 4.13, precio: 6.5 },

    // --- Servicios (NUEVO) ---
    { id: "transporte", name: "TRANSPORTE (servicio)", costo: 20.0, precio: 30.0 },
    {
      id: "mano-obra", name: "MANO DE OBRA (servicio)", costo: 1200.0, precio: 1200.0,
      nota: "Varía según uso de soldadura o concreto; se emite recibo por honorarios"
    },
    { id: "cert-caci", name: "CERTIFICADO CACI (servicio)", costo: 60.0, precio: 90.0 },

    // --- Cerco eléctrico ---
    { id: "poste-t", name: 'POSTE TEMPLADOR 4 HILOS 1 1/2" x 1.2mm', costo: 17.34, precio: 32.0 },
    { id: "poste-i", name: 'POSTE INTERMEDIO 4 HILOS 1 1/2" x 1.2mm', costo: 17.34, precio: 32.0 },
    { id: "ais-t", name: "AISLADOR TEMPLADOR CUADRADO", costo: 1.47, precio: 2.7 },
    { id: "ais-i", name: "AISLADOR INTERMEDIO", costo: 0.81, precio: 1.5 },
    { id: "aro-s", name: "ARO SIMPLE (TEMPLADOR)", costo: 1.1, precio: 2.0 },
    { id: "aro-d", name: "ARO DOBLE (INTERMEDIO)", costo: 1.3, precio: 2.5 },
    { id: "abraz", name: "ABRAZADERA DE ENLACE C/ARANDELA 5/16", costo: 0.59, precio: 1.55 },
    { id: "bujia", name: "CABLE BUJIA (m)", costo: 2.44, precio: 4.5, unidad: "m" },
    { id: "galv16", name: "KILO ALAMBRE GALVANIZADO 16mm", costo: 12.29, precio: 23.0 },
    { id: "acerado", name: "ALAMBRE ACERADO 2.5mm", costo: 12.46, precio: 23.5 },
    { id: "letrero", name: "LETRERO DE ADVERTENCIA ESTANDAR", costo: 3.09, precio: 6.0 },
  ],
};

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
        { pid: "temp", qty: 1 }, { pid: "bat7", qty: 1 }, { pid: "panel-firemax8", qty: 1 },
        { pid: "base-manual", qty: 1 }, { pid: "humo-ad", qty: 1 }, { pid: "temp-ad", qty: 1 },
        { pid: "estrobo-ad", qty: 1 }, { pid: "manual-ad", qty: 1 },
      ],
      accesorios: [
        { pid: "tapa-oct", qty: 1 }, { pid: "tubo-corr", qty: 1 }, { pid: "caja-mod", qty: 1 },
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
        { pid: "temp", qty: 1 }, { pid: "bat7", qty: 1 }, { pid: "panel-firemax8", qty: 1 },
        { pid: "base-manual", qty: 1 }, { pid: "humo-ad", qty: 1 }, { pid: "temp-ad", qty: 1 },
        { pid: "estrobo-ad", qty: 1 }, { pid: "manual-ad", qty: 1 },
      ],
      accesorios: [
        { pid: "tapa-oct", qty: 1 }, { pid: "tubo-corr", qty: 1 }, { pid: "caja-mod", qty: 1 },
        { pid: "senal-caci", qty: 1 }, { pid: "senal-estrobo", qty: 1 }, { pid: "senal-manual", qty: 1 },
        { pid: "senal-humo", qty: 1 }, { pid: "senal-temp", qty: 1 },
        { pid: "transporte", qty: 1 }, { pid: "cert-caci", qty: 1 }, { pid: "mano-obra", qty: 1 },
      ],
    },
  },
  {
    id: "sx-rf3-smart",
    name: "Kit SHOCTIX RF3 SMART",
    categoria: "Alarmas / pánico",
    precioReferencia: 390,
    items: {
      equipos: [{ pid: "sx-rf3s", qty: 1 }, { pid: "panico", qty: 1 }],
      accesorios: [{ pid: "cat6", qty: 10 }, { pid: "caja10", qty: 1 }],
    },
    opcionales: { equipos: [
      { pid: "fuente12", qty: 1 }, 
      { pid: "puls100", qty: 1 },
      { pid: "puls500", qty: 1 },
      { pid: "sensorpir", qty: 1 },
      { pid: "contactomag", qty: 1 }
    ], 
      accesorios: [] },
  },





  
  // {
  //   id: "sx-rf3-lite",
  //   name: "Kit SHOCTIX RF3 LITE",
  //   categoria: "Alarmas / pánico",
  //   precioReferencia: 199,
  //   items: {
  //     equipos: [{ pid: "sx-rf3l", qty: 1 }, { pid: "panico", qty: 1 }],
  //     accesorios: [{ pid: "cat6", qty: 10 }, { pid: "caja10", qty: 1 }],
  //   },
  //   opcionales: { equipos: [{ pid: "fuente12", qty: 1 }], accesorios: [] },
  // },
  // --- IPVOZ (NUEVO: las dos alarmas solicitadas) ---
 
  {
    id: "sx-txvoz",
    name: "Kit TX VOZ",
    categoria: "Alarmas / pánico",
    precioReferencia: 169,
    items: { equipos: [{ pid: "sx-txvoz", qty: 1 }], accesorios: [] },
    opcionales: {
      equipos: [{ pid: "puls100", qty: 1 }, { pid: "puls-alam", qty: 1 }],
      accesorios: [{ pid: "cat6", qty: 10 }],
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
    opcionales: { equipos: [], accesorios: [{ pid: "cat6", qty: 10 }, { pid: "caja10", qty: 1 }] },
  },
  {
    id: "ipvoz-eth",
    name: "Kit IPVOZ Ethernet 100W",
    categoria: "Alarmas / pánico",
    precioReferencia: 908,
    items: {
      equipos: [{ pid: "ipvoz-eth", qty: 1 }],
      accesorios: [],
    },
    opcionales: { equipos: [], accesorios: [{ pid: "cat6", qty: 10 }, { pid: "caja10", qty: 1 }] },
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