// import { NavLink, useNavigate } from 'react-router-dom';
// import { fechaDisplay } from '../hooks/useFechas';
// import { useAuth } from '../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import { Calendar, FileText, Lock, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
const NAV_ITEMS = [
  // { to: '/',        icon: 'ti-cash',          label: 'Ventas' },
  { to: '/egresos', icon: 'ti-trending-down',  label: 'Egresos' },
  { to: '/clientes', icon: 'ti-users',         label: 'Clientes' },
  { to: '/productos', icon: 'ti-package',       label: 'Productos' },
  { to: '/passwords', icon: 'ti-lock', label: 'Contraseñas' },
  { to: '/cotizaciones', icon: 'ti-file-text', label: 'Cotizaciones' },
];

export default function Layout({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <ShieldCheck size={20} color="#fff" />
          </div>
          <div className="sidebar-brand-text">
            <h2>Captus</h2>
            <p>Panel interno</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Módulos</span>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
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

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}