import { useState, useRef, useEffect } from 'react';

export default function ProyectoCombobox({ proyectos, value, onChange }) {
  const [open, setOpen]     = useState(false);
  const [modo, setModo]     = useState('select'); // 'select' | 'manual'
  const [manual, setManual] = useState('');
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const esConocido = proyectos.some(p => p.nombre === value);
    if (!value || value === 'General' || esConocido) {
      setModo('select');
      setManual('');
    } else {
      setModo('manual');
      setManual(value);
    }
  }, [value, proyectos]);

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function select(nombre) {
    onChange(nombre);
    setModo('select');
    setManual('');
    setOpen(false);
  }

  function activarManual() {
    setModo('manual');
    setManual('');
    onChange('');
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function volverASelect() {
    setModo('select');
    setManual('');
    onChange('General');
  }

  return (
    <div className="combobox-wrap" ref={wrapRef} style={{ position: 'relative', width: '100%', fontFamily: 'inherit' }}>

      {/* VISTA: MODO SELECT (Cerrado) */}
      {modo === 'select' && (
        <div
          className="combobox-input"
          style={{ 
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', userSelect: 'none',
            background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '10px',
            padding: '14px 18px', minHeight: '56px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
          onClick={() => setOpen(o => !o)}
        >
          <i className="ti ti-folder" style={{ fontSize: 24, color: '#1a56db', flexShrink: 0 }}></i>
          <span style={{ flex: 1, fontSize: 17, color: '#111827', fontWeight: 500 }}>{value || 'General'}</span>
          <i className="ti ti-chevron-down" style={{ fontSize: 20, color: '#9ca3af', flexShrink: 0 }}></i>
        </div>
      )}

      {/* VISTA: MODO MANUAL (Escribiendo) */}
      {modo === 'manual' && (
        <div style={{ display: 'flex', gap: 10, height: '56px' }}>
          <input
            ref={inputRef}
            type="text"
            className="combobox-input"
            style={{ 
              flex: 1, padding: '12px 18px', fontSize: '17px', borderRadius: '10px', 
              border: '1.5px solid #3b82f6', outline: 'none', boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.15)' 
            }}
            placeholder="Nombre del proyecto..."
            value={manual}
            onChange={e => { setManual(e.target.value); onChange(e.target.value); }}
            onKeyDown={e => e.key === 'Escape' && volverASelect()}
            autoComplete="off"
          />
          <button
            type="button"
            onMouseDown={volverASelect}
            style={{ 
              background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '10px', 
              padding: '0 20px', cursor: 'pointer', color: '#4b5563', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' 
            }}
            title="Volver a la lista"
          >
            <i className="ti ti-x" style={{ fontSize: 22 }}></i>
          </button>
        </div>
      )}

      {/* MENÚ DESPLEGABLE (Dropdown / Modal interno) */}
      {open && modo === 'select' && (
        <div className="combobox-dropdown" style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#fff',
          border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
          zIndex: 50, maxHeight: '400px', overflowY: 'auto', padding: '8px'
        }}>
          {proyectos.map(p => (
            <div
              key={p.id}
              className={`combobox-option${p.nombre === value ? ' selected' : ''}`}
              onMouseDown={() => select(p.nombre)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', fontSize: '16px', 
                cursor: 'pointer', borderRadius: '8px', transition: 'background 0.15s',
                background: p.nombre === value ? '#eff6ff' : 'transparent',
                color: p.nombre === value ? '#1d4ed8' : '#374151',
                fontWeight: p.nombre === value ? 600 : 400
              }}
            >
              <i className="ti ti-folder" style={{ fontSize: 20, color: p.nombre === value ? '#1d4ed8' : '#9ca3af' }}></i>
              {p.nombre}
            </div>
          ))}
          <div style={{ borderTop: '1px solid #f3f4f6', margin: '8px 0' }}></div>
          <div
            className="combobox-option"
            onMouseDown={activarManual}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', 
              fontSize: '16px', cursor: 'pointer', borderRadius: '8px', color: '#6b7280', transition: 'background 0.15s' 
            }}
          >
            <i className="ti ti-pencil" style={{ fontSize: 20, color: '#9ca3af' }}></i>
            Escribir otro nuevo...
          </div>
        </div>
      )}
    </div>
  );
}