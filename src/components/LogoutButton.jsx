import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <Button
      onClick={handleLogout}
      color="inherit"
      startIcon={<LogOut size={18} />}
    >
      Cerrar sesión
    </Button>
  );
}