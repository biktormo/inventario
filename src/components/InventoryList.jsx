import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Search, MapPin, Package, PlusCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { logMovement } from '../services/auditService';

export default function InventoryList() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showLowStock, setShowLowStock] = useState(false); // Estado para el filtro de stock bajo
  
  // Estados para la edición rápida de ubicación
  const [editingLoc, setEditingLoc] = useState(null); 
  const [tempLoc, setTempLoc] = useState('');
  
  // Hooks de nuestros contextos
  const { addToCart } = useCart();
  const { currentUser } = useAuth();

  // Cargar productos al iniciar
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setProducts(items);
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Lógica de filtrado (Buscador + Filtro Stock Bajo)
  const filtered = products.filter(p => {
    const matchesSearch = p.codigo.toLowerCase().includes(filter.toLowerCase()) || 
                          p.descripcion.toLowerCase().includes(filter.toLowerCase());
    
    const matchesStock = showLowStock ? (p.stock || 0) <= 2 : true; // Umbral de 2 unidades para "Crítico"

    return matchesSearch && matchesStock;
  });

  // Función para actualizar stock y registrar movimiento
  const handleStockChange = async (id, currentStock, amount) => {
    const stockActual = currentStock || 0;
    const newStock = stockActual + amount;
    
    // 1. Actualización Optimista en UI
    setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
    
    // 2. Actualización en Firebase
    try {
      const ref = doc(db, "products", id);
      await updateDoc(ref, { stock: newStock });

      // 3. Registrar en el Historial de Auditoría
      const productData = products.find(p => p.id === id);
      if (productData && currentUser) {
          await logMovement(productData, amount, newStock, currentUser.email);
      }
    } catch (error) {
      console.error("Error actualizando stock:", error);
      // Revertir si falla
      setProducts(products.map(p => p.id === id ? { ...p, stock: stockActual } : p));
    }
  };

  // Función para guardar la ubicación editada
  const saveLocation = async (id) => {
    setProducts(products.map(p => p.id === id ? { ...p, location: tempLoc } : p));
    
    try {
      const ref = doc(db, "products", id);
      await updateDoc(ref, { location: tempLoc });
    } catch (error) {
      console.error("Error guardando ubicación:", error);
    }
    
    setEditingLoc(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto pb-24">
      
      {/* Controles Superiores: Buscador y Filtro */}
      <div className="mb-6 space-y-3">
        {/* Buscador */}
        <div className="relative shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-lg shadow-sm transition-shadow"
            placeholder="Buscar repuesto por código o descripción..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        {/* Interruptor de Stock Bajo */}
        <div className="flex items-center">
          <label className="inline-flex items-center cursor-pointer select-none group">
            <input 
              type="checkbox" 
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            <span className={`ms-3 text-sm font-medium transition-colors flex items-center gap-2 ${showLowStock ? 'text-red-600' : 'text-gray-600'}`}>
              <AlertTriangle size={16} className={showLowStock ? 'text-red-500' : 'text-gray-400'} />
              Mostrar solo stock crítico (≤ 2)
            </span>
          </label>
        </div>
      </div>

      {/* Estado de Carga */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          
          {/* Renderizado de Tarjetas */}
          {filtered.slice(0, 50).map((item) => (
            <div 
              key={item.id} 
              className={`bg-white rounded-lg shadow-md border-l-4 ${ (item.stock || 0) <= 2 ? 'border-red-500' : 'border-green-500'} p-4 flex flex-col justify-between hover:shadow-lg transition-shadow duration-200`}
            >
              
              {/* Cabecera de la Tarjeta */}
              <div className="flex justify-between items-start mb-3">
                <div className="pr-2 flex-1">
                  <span className="inline-block bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider mb-1 border border-slate-200">
                    {item.codigo}
                  </span>
                  <h3 className="font-medium text-gray-800 leading-tight text-sm md:text-base" title={item.descripcion}>
                    {item.descripcion}
                  </h3>
                </div>
                <div className="text-right min-w-fit ml-2">
                  <div className="text-xl font-bold text-slate-800">{formatCurrency(item.precio)}</div>
                  <div className="text-[10px] text-gray-400 text-right">+ IVA</div>
                  
                  {/* Botón Agregar al Presupuesto */}
                  <button 
                    onClick={() => addToCart(item)}
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded flex items-center justify-center gap-1 transition-colors shadow-sm active:scale-95 transform"
                  >
                    <PlusCircle size={14} /> AGREGAR
                  </button>
                </div>
              </div>

              {/* Controles Inferiores */}
              <div className="flex items-end justify-between mt-2 pt-3 border-t border-dashed border-gray-200">
                
                {/* Sección Ubicación */}
                <div className="flex-1 mr-2 min-w-0">
                  <div className="flex items-center text-gray-500 text-xs mb-1">
                    <MapPin size={12} className="mr-1" /> Ubicación
                  </div>
                  {editingLoc === item.id ? (
                    <div className="flex items-center">
                      <input 
                        autoFocus
                        className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={tempLoc}
                        onChange={e => setTempLoc(e.target.value)}
                        onBlur={() => saveLocation(item.id)}
                        onKeyDown={e => e.key === 'Enter' && saveLocation(item.id)}
                      />
                    </div>
                  ) : (
                    <div 
                      className="text-sm font-medium text-gray-600 cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-1 -ml-1 rounded truncate transition-colors"
                      onClick={() => { setEditingLoc(item.id); setTempLoc(item.location || ''); }}
                      title="Clic para editar ubicación"
                    >
                      {item.location || '---'}
                    </div>
                  )}
                </div>

                {/* Sección Stock */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center text-gray-500 text-xs mb-1">
                    <Package size={12} className="mr-1" /> Stock
                  </div>
                  <div className="flex items-center bg-slate-100 rounded border border-slate-200 overflow-hidden">
                    <button 
                      className="w-8 h-8 flex items-center justify-center hover:bg-red-100 text-slate-500 hover:text-red-600 transition active:bg-red-200"
                      onClick={() => handleStockChange(item.id, item.stock, -1)}
                    >
                      <span className="text-lg leading-none font-bold mb-0.5">-</span>
                    </button>
                    
                    <span className={`w-10 text-center font-bold text-sm bg-white border-x border-slate-200 h-8 flex items-center justify-center ${(item.stock || 0) <= 2 ? 'text-red-600' : 'text-slate-800'}`}>
                      {item.stock || 0}
                    </span>
                    
                    <button 
                      className="w-8 h-8 flex items-center justify-center hover:bg-green-100 text-slate-500 hover:text-green-600 transition active:bg-green-200"
                      onClick={() => handleStockChange(item.id, item.stock, 1)}
                    >
                      <span className="text-lg leading-none font-bold mb-0.5">+</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
          
          {/* Mensaje si no hay resultados */}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p className="text-lg font-medium">No se encontraron productos</p>
              <p className="text-sm">
                {showLowStock ? "No tienes productos con stock crítico." : "Intenta con otro código o descripción."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}