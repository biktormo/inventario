import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import InventoryList from './components/InventoryList';
import DataImporter from './components/DataImporter';
import { CartProvider } from './context/CartContext'; // <--- 1. Importar
import CartSidebar from './components/CartSidebar';   // <--- 2. Importar

function App() {
  return (
    <CartProvider> {/* <--- 3. Envolver TODO con el Provider */}
      <BrowserRouter>
        <Layout>
          <CartSidebar /> {/* <--- 4. Colocar el sidebar aquí para que esté en todas las páginas */}
          <Routes>
            <Route path="/" element={<InventoryList />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/upload" element={<DataImporter />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;