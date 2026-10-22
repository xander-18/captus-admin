//src/components/Toast.jsx
import { fechaDisplay } from '../hooks/useFechas';

const PERIODOS = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'ayer', label: 'Ayer' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'semana_pasada', label: 'Semana pasada' },
  { key: 'mes', label: 'Este mes' },
  { key: 'mes_pasado', label: 'Mes pasado' },
  { key: 'custom', label: 'Personalizado', icon: 'ti-calendar-event' },
];

export default function FiltroFecha({ periodo, setPeriodo, rangoDesde, setRangoDesde, rangoHasta, setRangoHasta, calcRango, labelPeriodo, onAplicar, toast }) {
  const rango = calcRango();
  const showCustom = periodo === 'custom';

  function handlePeriodo(key) {
    setPeriodo(key);
    if (key !== 'custom') onAplicar();
  }

  function handleAplicarCustom() {
    if (!rangoDesde || !rangoHasta) { toast('Selecciona ambas fechas', 'warn'); return; }
    if (rangoDesde > rangoHasta) { toast('La fecha "desde" debe ser anterior o igual a "hasta"', 'warn'); return; }
    onAplicar();
  }

  const txt = labelPeriodo();
  const infoExtra = rango.desde && rango.hasta && rango.desde !== rango.hasta
    ? ` (${fechaDisplay(rango.desde)} al ${fechaDisplay(rango.hasta)})`
    : '';

  return (
    <div className="filtro-fecha-card">
      <div className="filtro-fecha-top">
        <span className="filtro-fecha-label">
          <i className="ti ti-calendar-search" style={{ fontSize: 13 }}></i> Período:
        </span>
        <div className="periodo-chips">
          {PERIODOS.map(p => (
            <button
              key={p.key}
              className={`periodo-chip${periodo === p.key ? ' active' : ''}`}
              onClick={() => handlePeriodo(p.key)}
            >
              {p.icon && <i className={`ti ${p.icon}`} style={{ fontSize: 12 }}></i>}
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {showCustom && (
        <div className="rango-custom visible">
          <label>Desde</label>
          <input type="date" value={rangoDesde} onChange={e => setRangoDesde(e.target.value)} />
          <span className="rango-sep">→</span>
          <label>Hasta</label>
          <input type="date" value={rangoHasta} onChange={e => setRangoHasta(e.target.value)} />
          <button className="btn-aplicar-rango" onClick={handleAplicarCustom}>
            <i className="ti ti-search" style={{ fontSize: 12 }}></i> Aplicar
          </button>
        </div>
      )}

      {txt && (
        <div className="filtro-activo-info">
          <i className="ti ti-info-circle" style={{ fontSize: 12 }}></i>
          Mostrando: <strong>{txt}</strong>{infoExtra}
        </div>
      )}
    </div>
  );
}
