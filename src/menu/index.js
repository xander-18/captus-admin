import { TrendingDown, Users, Package, Lock, FileText } from 'lucide-react';
import seguridad from './seguridad';
import operaciones from './operaciones';

const egresos      = { to: '/egresos',      icon: TrendingDown, label: 'Egresos' };
const clientes     = { to: '/clientes',     icon: Users,        label: 'Clientes' };
const productos    = { to: '/productos',    icon: Package,      label: 'Productos' };
const passwords    = { to: '/passwords',    icon: Lock,         label: 'Contraseñas' };
const cotizaciones = { to: '/cotizaciones', icon: FileText,     label: 'Cotizaciones' };
// const herramientas = { to: '/herramientas', icon: FileText,     label: 'Herramientas' };
const ventas = {to: '/ventas', icon: TrendingDown, label: 'Ventas'};

export default function getNavItems() {
  let privilegios = [];
  try {
    privilegios = JSON.parse(localStorage.getItem('PRIVILEGIOS')) ?? [];
  } catch {
    privilegios = [];
  }

  const tiene = (code) => privilegios.some((item) => item.code === code);
  const items = [];
  items.push(ventas);
  // items.push(herramientas);

  if (tiene('PRIV_MOD_EGRESOS'))      items.push(egresos);
  if (tiene('PRIV_MOD_CLIENTES'))     items.push(clientes);
  if (tiene('PRIV_MOD_PRODUCTOS'))    items.push(productos);
  // if (tiene('PRIV_MOD_VENTAS'))       items.push(ventas);
  if (tiene('PRIV_MOD_PASSWORDS'))    items.push(passwords);
  if (tiene('PRIV_MOD_COTIZACIONES')) items.push(cotizaciones);
  if (tiene('PRIV_MOD_OPERACIONES'))  items.push(operaciones);
    if (tiene('PRIV_MOD_SEGURIDAD'))    items.push(seguridad);

  return items;
}