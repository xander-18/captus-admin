import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Calendar, LogOut, ShieldCheck, Menu, X,
  TrendingDown, Users, Package, Lock, FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Desde 1024px el menú queda acoplado a la izquierda; por debajo es un cajón.
const DESKTOP = '(min-width: 1024px)';
const isDesktop = () => window.matchMedia(DESKTOP).matches;

const NAV_ITEMS = [
  // { to: '/', icon: Wallet, label: 'Ventas' },
  { to: '/egresos',      icon: TrendingDown, label: 'Egresos' },
  { to: '/clientes',     icon: Users,        label: 'Clientes' },
  { to: '/productos',    icon: Package,      label: 'Productos' },
  { to: '/passwords',    icon: Lock,         label: 'Contraseñas' },
  { to: '/cotizaciones', icon: FileText,     label: 'Cotizaciones' },
];

export default function Layout({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

  // open = menú visible. Abierto por defecto solo en escritorio.
  const [open, setOpen] = useState(() => isDesktop());

  // Al cruzar el breakpoint (girar tablet, redimensionar) se reajusta
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const onChange = e => setOpen(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Cajón abierto en móvil/tablet: Escape lo cierra y se bloquea el scroll del fondo
  useEffect(() => {
    if (!open || isDesktop()) return;
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const closeIfDrawer = () => { if (!isDesktop()) setOpen(false); };

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={`app-shell${open ? ' menu-open' : ''}`}>
      <aside id="app-sidebar" className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <ShieldCheck size={20} color="#fff" />
          </div>
          <div className="sidebar-brand-text">
            <h2>Captus</h2>
            <p>Panel interno</p>
          </div>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Módulos</span>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeIfDrawer}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && <p className="sidebar-email">{user.email}</p>}

          <button type="button" className="nav-item sidebar-logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>

          <div className="nav-item sidebar-date">
            <Calendar size={14} />
            <span>{today}</span>
          </div>
        </div>
      </aside>

      {/* Fondo oscuro: solo visible con el cajón abierto en móvil/tablet */}
      <div className="sidebar-overlay" onClick={() => setOpen(false)} />

      <main className="main-content">
        <header className="app-topbar">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Ocultar menú' : 'Mostrar menú'}
            aria-expanded={open}
            aria-controls="app-sidebar"
          >
            <Menu size={20} />
          </button>
          <span className="app-topbar-title">Captus</span>
        </header>

        <div className="main-body">
          {children}
        </div>
      </main>
    </div>
  );
}