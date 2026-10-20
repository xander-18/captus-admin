import { useState, useCallback } from 'react';

export function fechaIso(d) {
  d = d || new Date();
  return d.toISOString().split('T')[0];
}

export function fechaDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function useFechas() {
  const [periodo, setPeriodo] = useState('hoy');
  const [rangoDesde, setRangoDesde] = useState('');
  const [rangoHasta, setRangoHasta] = useState('');

  // ── Antes: función normal → nueva referencia en CADA render →
  // rompía el useCallback/useEffect de quien la consumía y provocaba
  // un bucle de peticiones. Ahora: useCallback con las dependencias
  // reales (periodo, rangoDesde, rangoHasta), así solo cambia de
  // referencia cuando el rango realmente cambia. ──
  const calcRango = useCallback((p = periodo) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    let desde, hasta;
    switch (p) {
      case 'hoy':   desde = hasta = fechaIso(hoy); break;
      case 'ayer': {
        const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
        desde = hasta = fechaIso(ayer); break;
      }
      case 'semana': {
        const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
        desde = fechaIso(lunes); hasta = fechaIso(hoy); break;
      }
      case 'semana_pasada': {
        const lunesP = new Date(hoy); lunesP.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7) - 7);
        const domP = new Date(lunesP); domP.setDate(lunesP.getDate() + 6);
        desde = fechaIso(lunesP); hasta = fechaIso(domP); break;
      }
      case 'mes': {
        const p1 = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        desde = fechaIso(p1); hasta = fechaIso(hoy); break;
      }
      case 'mes_pasado': {
        const pm1 = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        const pmU = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        desde = fechaIso(pm1); hasta = fechaIso(pmU); break;
      }
      case 'custom': desde = rangoDesde; hasta = rangoHasta; break;
      default: desde = hasta = fechaIso(hoy);
    }
    return { desde, hasta };
  }, [periodo, rangoDesde, rangoHasta]);

  const labelPeriodo = useCallback((p = periodo) => {
    const labels = { hoy: 'Hoy', ayer: 'Ayer', semana: 'Esta semana', semana_pasada: 'Semana pasada', mes: 'Este mes', mes_pasado: 'Mes pasado' };
    if (p === 'custom') {
      return rangoDesde === rangoHasta ? fechaDisplay(rangoDesde) : `${fechaDisplay(rangoDesde)} — ${fechaDisplay(rangoHasta)}`;
    }
    return labels[p] || p;
  }, [periodo, rangoDesde, rangoHasta]);

  return { periodo, setPeriodo, rangoDesde, setRangoDesde, rangoHasta, setRangoHasta, calcRango, labelPeriodo };
}