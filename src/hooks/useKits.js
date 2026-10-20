// src/hooks/useKits.js
import { useCallback, useEffect, useState } from "react";
import { KITS } from "../data/kits";

const LS_KEY = "captus_kits_custom";

/**
 * Devuelve los kits predefinidos + los que el usuario haya guardado.
 * Hoy persiste en localStorage; cuando tengas el endpoint, cambia
 * leer()/guardar() por llamadas a api.js (GET/POST /kits) sin tocar la UI.
 */
export function useKits() {
  const [custom, setCustom] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setCustom(JSON.parse(raw));
    } catch { /* ignorar */ }
  }, []);

  const persistir = (lista) => {
    setCustom(lista);
    try { localStorage.setItem(LS_KEY, JSON.stringify(lista)); } catch { /* ignorar */ }
  };

  const guardarKit = useCallback((kit) => {
    setCustom((prev) => {
      const i = prev.findIndex((k) => k.id === kit.id || k.name === kit.name);
      const lista = i >= 0 ? prev.map((k, idx) => (idx === i ? kit : k)) : [...prev, kit];
      try { localStorage.setItem(LS_KEY, JSON.stringify(lista)); } catch { /* ignorar */ }
      return lista;
    });
  }, []);

  const eliminarKit = useCallback(
    (id) => persistir(custom.filter((k) => k.id !== id)),
    [custom]
  );

  return { kits: [...KITS, ...custom], kitsCustom: custom, guardarKit, eliminarKit };
}