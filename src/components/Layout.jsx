import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, LogOut, ShieldCheck, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// import NAV_ITEMS from '../menu';
import getNavItems from '../menu';
// Desde 1024px el menú queda acoplado a la izquierda; por debajo es un cajón.
const DESKTOP = '(min-width: 1024px)';
const isDesktop = () => window.matchMedia(DESKTOP).matches;

// Un ítem con "children" se muestra como módulo desplegable.
// const NAV_ITEMS = [
//   // { to: '/', icon: Wallet, label: 'Ventas' },
//   { to: '/egresos',       icon: TrendingDown, label: 'Egresos' },
//   { to: '/clientes',      icon: Users,        label: 'Clientes' },
//   { to: '/productos',     icon: Package,      label: 'Productos' },
//   { to: '/passwords',     icon: Lock,         label: 'Contraseñas' },
//   { to: '/cotizaciones',  icon: FileText,     label: 'Cotizaciones' },
//   {
//     label: 'Seguridad',
//     icon: Shield,
//     children: [
//       { to: '/seguridad/modulos',         icon: LayoutGrid, label: 'Módulos' },
//       { to: '/seguridad/privilegios',     icon: KeyRound,   label: 'Privilegios' },
//       { to: '/seguridad/roles',           icon: UserCog,    label: 'Roles' },
//       { to: '/seguridad/rol-privilegios', icon: Link2,      label: 'Rol - Privilegios' },
//       { to: '/seguridad/usuario-roles',   icon: UserCheck,  label: 'Usuario - Roles' },
//       { to: '/seguridad/usuarios',        icon: User,       label: 'Usuarios' },
//     ],
//   },
// ];

const hasActiveChild = (item, pathname) =>
  !!item.children?.some(c => pathname === c.to || pathname.startsWith(c.to + '/'));

export default function Layout({ children }) {
  const { logout, user } = useAuth();
    const NAV_ITEMS = getNavItems();   // ← esta línea falta
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const today = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

  // open = menú visible. Abierto por defecto solo en escritorio.
  const [open, setOpen] = useState(() => isDesktop());

  // Módulos desplegables abiertos (por label). Si la ruta actual es de un hijo, arranca abierto.
  const [groupsOpen, setGroupsOpen] = useState(() => {
    const init = {};
    NAV_ITEMS.forEach(i => { if (hasActiveChild(i, pathname)) init[i.label] = true; });
    return init;
  });

  // Si navegas a una ruta hija (link directo, botón atrás), su módulo se abre solo
  useEffect(() => {
    NAV_ITEMS.forEach(i => {
      if (hasActiveChild(i, pathname)) {
        setGroupsOpen(g => (g[i.label] ? g : { ...g, [i.label]: true }));
      }
    });
  }, [pathname]);

  const toggleGroup = label => setGroupsOpen(g => ({ ...g, [label]: !g[label] }));

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
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;

            // ── Módulo desplegable ──
            if (item.children) {
              const isOpen = !!groupsOpen[item.label];
              const subId = `nav-sub-${item.label.toLowerCase()}`;
              return (
                <div key={item.label} className="nav-group">
                  <button
                    type="button"
                    className={`nav-item nav-group-toggle${hasActiveChild(item, pathname) ? ' has-active' : ''}`}
                    onClick={() => toggleGroup(item.label)}
                    aria-expanded={isOpen}
                    aria-controls={subId}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    <ChevronDown size={16} className={`nav-chevron${isOpen ? ' open' : ''}`} />
                  </button>

                  <div id={subId} className={`nav-submenu${isOpen ? ' open' : ''}`}>
                    <div className="nav-submenu-inner">
                      {item.children.map(({ to, icon: SubIcon, label }) => (
                        <NavLink
                          key={to}
                          to={to}
                          onClick={closeIfDrawer}
                          className={({ isActive }) => `nav-item nav-subitem${isActive ? ' active' : ''}`}
                        >
                          <SubIcon size={16} />
                          <span>{label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            // ── Ítem normal ──
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeIfDrawer}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
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