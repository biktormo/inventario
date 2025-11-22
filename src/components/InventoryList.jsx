import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Search, MapPin, Package, Save } from 'lucide-react';
import { formatCurrency } from '../utils';

export default function InventoryList() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  // Estado para edición rápida de ubicación
  const [editingLoc, setEditingLoc] = useState(null); 
  const [tempLoc, setTempLoc] = useState('');

  // Cargar productos al inicio
  // NOTA: Para 5000 productos, idealmente esto se pagina, pero para empezar cargaremos todo en memoria para búsqueda instantánea.
  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, "products"));
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setProducts(items);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  // Función para filtrar
  const filtered = products.filter(p => 
    p.codigo.toLowerCase().includes(filter.toLowerCase()) || 
    p.descripcion.toLowerCase().includes(filter.toLowerCase())
  );

  // Actualizar Stock
  const handleStockChange = async (id, currentStock, amount) => {
    const newStock = (currentStock || 0) + amount;
    if (newStock < 0) return;

    // Actualizar UI optimísticamente
    setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
    
    // Actualizar Firebase
    const ref = doc(db, "products", id);
    await updateDoc(ref, { stock: newStock });
  };

  // Guardar Ubicación
  const saveLocation = async (id) => {
    setProducts(products.map(p => p.id === id ? { ...p, location: tempLoc } : p));
    const ref = doc(db, "products", id);
    await updateDoc(ref, { location: tempLoc });
    setEditingLoc(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Buscador */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-lg shadow-sm"
          placeholder="Buscar repuesto por código o descripción..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando inventario...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Renderizamos solo los primeros 50 resultados para no colgar el navegador si hay miles */}
          {filtered.slice(0, 50).map((item) => (
            <div key={item.id} className={`bg-white rounded-lg shadow border-l-4 ${ (item.stock || 0) <= 2 ? 'border-red-500' : 'border-green-500'} p-4 flex flex-col justify-between`}>
              
              {/* Cabecera Tarjeta */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">#{item.codigo}</span>
                  <h3 className="font-semibold text-gray-800 leading-tight">{item.descripcion}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">{formatCurrency(item.precio)}</div>
                  <div className="text-xs text-gray-400">+ IVA</div>
                </div>
              </div>

              {/* Controles Inferiores */}
              <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-100">
                
                {/* Control de Ubicación */}
                <div className="flex-1 mr-4">
                  <div className="flex items-center text-gray-600 text-sm mb-1">
                    <MapPin size={14} className="mr-1" />
                    <span className="text-xs">Ubicación</span>
                  </div>
                  {editingLoc === item.id ? (
                    <div className="flex items-center">
                      <input 
                        autoFocus
                        className="w-20 border rounded px-1 py-0.5 text-sm"
                        value={tempLoc}
                        onChange={e => setTempLoc(e.target.value)}
                        onBlur={() => saveLocation(item.id)}
                        onKeyDown={e => e.key === 'Enter' && saveLocation(item.id)}
                      />
                      <Save size={14} className="ml-1 text-blue-500 cursor-pointer" onClick={() => saveLocation(item.id)}/>
                    </div>
                  ) : (
                    <div 
                      className="text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded -ml-2 truncate"
                      onClick={() => { setEditingLoc(item.id); setTempLoc(item.location || ''); }}
                    >
                      {item.location || 'Sin asignar'}
                    </div>
                  )}
                </div>

                {/* Control de Stock */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center text-gray-600 text-sm mb-1">
                    <Package size={14} className="mr-1" />
                    <span className="text-xs">Stock</span>
                  </div>
                  <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <button 
                      className="px-3 py-1 hover:bg-gray-200 active:bg-gray-300 text-red-600 font-bold transition"
                      onClick={() => handleStockChange(item.id, item.stock, -1)}
                    >-</button>
                    <span className="px-3 py-1 font-bold min-w-[2.5rem] text-center bg-white">
                      {item.stock || 0}
                    </span>
                    <button 
                      className="px-3 py-1 hover:bg-gray-200 active:bg-gray-300 text-green-600 font-bold transition"
                      onClick={() => handleStockChange(item.id, item.stock, 1)}
                    >+</button>
                  </div>
                </div>

              </div>
            </div>
          ))}
          
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500">
              No se encontraron productos con ese criterio.
            </div>
          )}
        </div>
      )}
    </div>
  );
}