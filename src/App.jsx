import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
// import Login from './pages/Login';
import Login from './pages/Seguridad/Login';
import Ventas from './pages/Ventas';
import Egresos from './pages/Egresos';
import Clientes from './pages/Clientes';
import Productos from './pages/Productos';
import Cotizaciones from './pages/Cotizaciones';
import Passwords from './pages/Password';

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