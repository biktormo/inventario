import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import InventoryList from './components/InventoryList';
import DataImporter from './components/DataImporter';
import Login from './pages/Login'; // <--- Importar Login
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext'; // <--- Importar Auth
import CartSidebar from './components/CartSidebar';
import ProtectedRoute from './components/ProtectedRoute'; // <--- Importar Protección
import Movements from './pages/Movements';

function App() {
  return (
    <AuthProvider> {/* 1. AuthProvider va PRIMERO que todo */}
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Ruta Pública: Login */}
            <Route path="/login" element={<Login />} />

            {/* Rutas Privadas: Todo lo demás */}
            <Route path="/*" element={
              <ProtectedRoute> {/* 2. Protegemos todo lo que está dentro */}
                <Layout>
                  <CartSidebar />
                  <Routes>
                    <Route path="/" element={<InventoryList />} />
                    <Route path="/inventory" element={<InventoryList />} />
                    <Route path="/upload" element={<DataImporter />} />
                    <Route path="/history" element={<Movements />} />
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