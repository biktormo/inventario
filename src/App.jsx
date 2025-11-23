import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Contextos (Estado Global)
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Componentes de Estructura y Seguridad
import Layout from './components/Layout';
import CartSidebar from './components/CartSidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas y Vistas
import Dashboard from './pages/Dashboard';
import InventoryList from './components/InventoryList';
import DataImporter from './components/DataImporter';
import Movements from './pages/Movements';
import Login from './pages/Login';

function App() {
  return (
    <AuthProvider> {/* 1. Proveedor de Autenticación (El más externo) */}
      <CartProvider> {/* 2. Proveedor del Carrito de Compras */}
        <BrowserRouter>
          <Routes>
            
            {/* --- Ruta Pública (No requiere login) --- */}
            <Route path="/login" element={<Login />} />

            {/* --- Rutas Privadas (Requieren estar logueado) --- */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  {/* El Sidebar del carrito está aquí para ser accesible en todas las pantallas internas */}
                  <CartSidebar />
                  
                  <Routes>
                    {/* Pantalla Principal: Dashboard de Métricas */}
                    <Route path="/" element={<Dashboard />} />
                    
                    {/* Gestión de Inventario (Lista, Buscador, Stock) */}
                    <Route path="/inventory" element={<InventoryList />} />
                    
                    {/* Historial de Auditoría */}
                    <Route path="/history" element={<Movements />} />
                    
                    {/* Herramientas de Datos (Importar CSV / Exportar Backup) */}
                    <Route path="/upload" element={<DataImporter />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />

          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;