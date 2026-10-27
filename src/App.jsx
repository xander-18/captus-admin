import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import Login from './pages/Seguridad/Login';
import Ventas from './pages/Ventas';
import Egresos from './pages/Egresos';
import Clientes from './pages/Clientes';
import Productos from './pages/Productos';
import Cotizaciones from './pages/Cotizaciones';
import Passwords from './pages/Password';

// Seguridad
import Modulos from './pages/Seguridad/Modulos';
import Privilegios from './pages/Seguridad/Privilegios';
import Roles from './pages/Seguridad/Roles';
import RolPrivilegios from './pages/Seguridad/RolPrivilegios';
import Usuarioroles from './pages/Seguridad/Usuarioroles';
import Usuarios from './pages/Seguridad/Usuarios';

import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Ventas />} />
                      <Route path="/egresos" element={<Egresos />} />
                      <Route path="/clientes" element={<Clientes />} />
                      <Route path="/productos" element={<Productos />} />
                      <Route path="/cotizaciones" element={<Cotizaciones />} />
                      <Route path="/passwords" element={<Passwords />} />

                      {/* Seguridad */}
                      {/* <Route path="/seguridad/modulos" element={<Modulos />} />
                      <Route path="/seguridad/privilegios" element={<Privilegios />} />
                      <Route path="/seguridad/roles" element={<Roles />} />
                      <Route path="/seguridad/rol-privilegios" element={<RolPrivilegios />} />
                      <Route path="/seguridad/usuario-roles" element={<Usuarioroles />} />
                      <Route path="/seguridad/usuarios" element={<Usuarios />} /> */}
                      {/* Seguridad */}
<Route path="/seguridad/modulos" element={<Modulos />} />
<Route path="/seguridad/privilegios" element={<Privilegios />} />

<Route path="/seguridad/roles" element={<Roles />} />
<Route path="/seguridad/roles/:id/privilegios" element={<RolPrivilegios />} />

<Route path="/seguridad/usuarios" element={<Usuarios />} />
<Route path="/seguridad/usuarios/:id/roles" element={<Usuarioroles />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}