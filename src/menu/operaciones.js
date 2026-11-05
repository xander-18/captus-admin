import { Shield, UserCog,} from 'lucide-react';

const operaciones = {
  label: 'Operaciones',
  icon: Shield,
  children: [
    { to: '/herramientas',       icon: UserCog,    label: 'Herramientas' },
  ],
};

export default operaciones;