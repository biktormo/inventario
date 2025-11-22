import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout'; // El layout del sidebar que te pasé antes
import InventoryList from './components/InventoryList';
import DataImporter from './components/DataImporter';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<InventoryList />} />
          <Route path="/inventory" element={<InventoryList />} />
          <Route path="/upload" element={<DataImporter />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;