import { Shield, LayoutGrid, KeyRound, UserCog, User } from 'lucide-react';

const seguridad = {
  label: 'Seguridad',
  icon: Shield,
  children: [
    { to: '/seguridad/roles',       icon: UserCog,    label: 'Roles' },
    { to: '/seguridad/privilegios', icon: KeyRound,   label: 'Privilegios' },
    { to: '/seguridad/modulos',     icon: LayoutGrid, label: 'Módulos' },
    { to: '/seguridad/usuarios',    icon: User,       label: 'Usuarios' },
  ],
};

export default seguridad;