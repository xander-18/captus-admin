// src/utils/carpetaExport.js
// -----------------------------------------------------------------------------
// Permite elegir UNA VEZ una carpeta de guardado (por ejemplo la unidad de red
// mapeada Z:\COTIZACIONES - NUEVA PLANTILLA) y, de ahí en adelante, exportar los
// PDF directo a esa carpeta sin el diálogo "Guardar como" de cada vez.
//
// Usa la File System Access API del navegador (showDirectoryPicker). Solo existe
// en Chrome / Edge y en un contexto seguro (https:// o localhost); si no está
// disponible, soportaCarpetas() devuelve false y la app cae de vuelta a la
// descarga normal del navegador (doc.save(...)).
// -----------------------------------------------------------------------------

const DB_NAME = "cotizaciones-fs";
const STORE = "handles";
const KEY = "carpetaExport";

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function guardarHandle(handle) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(handle, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function leerHandle() {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export const soportaCarpetas = () =>
  typeof window !== "undefined" && "showDirectoryPicker" in window;

// Abre el explorador de Windows para elegir la carpeta (ahí se navega hasta
// Z:\COTIZACIONES - NUEVA PLANTILLA) y guarda el acceso para no preguntar de nuevo.
export async function elegirCarpetaExport() {
  if (!soportaCarpetas()) {
    throw new Error("Este navegador no permite elegir una carpeta de guardado. Usa Chrome o Edge.");
  }
  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  await guardarHandle(handle);
  return handle;
}

export async function quitarCarpetaExport() {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Nombre de la carpeta guardada (o null si no se configuró ninguna). No pide permiso,
// solo mira si hay algo guardado — para no disparar el prompt del navegador al abrir el modal.
export async function getNombreCarpetaConfigurada() {
  if (!soportaCarpetas()) return null;
  const handle = await leerHandle();
  return handle ? handle.name : null;
}

// Devuelve el handle guardado si el permiso de escritura sigue vigente (pidiéndolo de
// nuevo con un prompt rápido si hace falta), o null si no hay carpeta o no se concede.
export async function getCarpetaExport() {
  if (!soportaCarpetas()) return null;
  const handle = await leerHandle();
  if (!handle) return null;
  const permiso = await handle.queryPermission({ mode: "readwrite" });
  if (permiso === "granted") return handle;
  if (permiso === "prompt") {
    const pedido = await handle.requestPermission({ mode: "readwrite" });
    if (pedido === "granted") return handle;
  }
  return null;
}

// Escribe el PDF (blob) directo en la carpeta elegida, con el nombre dado.
export async function guardarEnCarpeta(handle, nombreArchivo, blob) {
  const fileHandle = await handle.getFileHandle(nombreArchivo, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}