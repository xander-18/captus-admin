import { TrendingDown, Users, Package, Lock, FileText } from 'lucide-react';
import seguridad from './seguridad';

const NAV_ITEMS = [
  { to: '/egresos',      icon: TrendingDown, label: 'Egresos' },
  { to: '/clientes',     icon: Users,        label: 'Clientes' },
  { to: '/productos',    icon: Package,      label: 'Productos' },
  { to: '/passwords',    icon: Lock,         label: 'Contraseñas' },
  { to: '/cotizaciones', icon: FileText,     label: 'Cotizaciones' },
  seguridad,
];

export default NAV_ITEMS;