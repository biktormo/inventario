import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Search, MapPin, Package, Save, PlusCircle } from 'lucide-react'; // Agregamos PlusCircle
import { formatCurrency } from '../utils';
import { useCart } from '../context/CartContext'; // <--- IMPORTANTE

export default function InventoryList() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingLoc, setEditingLoc] = useState(null); 
  const [tempLoc, setTempLoc] = useState('');
  
  const { addToCart } = useCart(); // <--- IMPORTANTE: Traemos la función del contexto

  useEffect(() => {
    const fetchProducts = async () => {
      // En producción real, aquí deberías usar paginación o querys de Firestore
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

  const filtered = products.filter(p => 
    p.codigo.toLowerCase().includes(filter.toLowerCase()) || 
    p.descripcion.toLowerCase().includes(filter.toLowerCase())
  );

  const handleStockChange = async (id, currentStock, amount) => {
    const newStock = (currentStock || 0) + amount;
    // Permitimos stock negativo temporalmente si es necesario, o lo bloqueamos con: if (newStock < 0) return;
    
    setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
    const ref = doc(db, "products", id);
    await updateDoc(ref, { stock: newStock });
  };

  const saveLocation = async (id) => {
    setProducts(products.map(p => p.id === id ? { ...p, location: tempLoc } : p));
    const ref = doc(db, "products", id);
    await updateDoc(ref, { location: tempLoc });
    setEditingLoc(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto pb-24"> {/* pb-24 para dar espacio al boton flotante si ponemos uno en movil */}
      
      {/* Buscador */}
      <div className="mb-6 relative shadow-sm">
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
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.slice(0, 50).map((item) => (
            <div key={item.id} className={`bg-white rounded-lg shadow-md border-l-4 ${ (item.stock || 0) <= 2 ? 'border-red-500' : 'border-green-500'} p-4 flex flex-col justify-between hover:shadow-lg transition-shadow`}>
              
              {/* Cabecera Tarjeta */}
              <div className="flex justify-between items-start mb-3">
                <div className="pr-2">
                  <span className="inline-block bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider mb-1">
                    {item.codigo}
                  </span>
                  <h3 className="font-medium text-gray-800 leading-tight text-sm md:text-base">{item.descripcion}</h3>
                </div>
                <div className="text-right min-w-fit">
                  <div className="text-xl font-bold text-slate-800">{formatCurrency(item.precio)}</div>
                  
                  {/* --- BOTÓN AGREGAR AL CARRITO --- */}
                  <button 
                    onClick={() => addToCart(item)}
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded flex items-center justify-center gap-1 transition-colors"
                  >
                    <PlusCircle size={14} /> AGREGAR
                  </button>
                </div>
              </div>

              {/* Controles Inferiores (Stock y Ubicación) */}
              <div className="flex items-end justify-between mt-2 pt-3 border-t border-dashed border-gray-200">
                
                {/* Ubicación */}
                <div className="flex-1 mr-2">
                  <div className="flex items-center text-gray-500 text-xs mb-1">
                    <MapPin size={12} className="mr-1" /> Ubicación
                  </div>
                  {editingLoc === item.id ? (
                    <div className="flex items-center">
                      <input 
                        autoFocus
                        className="w-full border border-blue-300 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={tempLoc}
                        onChange={e => setTempLoc(e.target.value)}
                        onBlur={() => saveLocation(item.id)}
                        onKeyDown={e => e.key === 'Enter' && saveLocation(item.id)}
                      />
                    </div>
                  ) : (
                    <div 
                      className="text-sm font-medium text-gray-600 cursor-pointer hover:text-blue-600 hover:underline truncate"
                      onClick={() => { setEditingLoc(item.id); setTempLoc(item.location || ''); }}
                      title="Clic para editar ubicación"
                    >
                      {item.location || '---'}
                    </div>
                  )}
                </div>

                {/* Stock */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center text-gray-500 text-xs mb-1">
                    <Package size={12} className="mr-1" /> Stock
                  </div>
                  <div className="flex items-center bg-slate-100 rounded border border-slate-200">
                    <button 
                      className="w-8 h-8 flex items-center justify-center hover:bg-red-100 text-slate-500 hover:text-red-600 transition"
                      onClick={() => handleStockChange(item.id, item.stock, -1)}
                    ><span className="text-lg leading-none mb-1">-</span></button>
                    <span className="w-8 text-center font-bold text-slate-800 text-sm">
                      {item.stock || 0}
                    </span>
                    <button 
                      className="w-8 h-8 flex items-center justify-center hover:bg-green-100 text-slate-500 hover:text-green-600 transition"
                      onClick={() => handleStockChange(item.id, item.stock, 1)}
                    ><span className="text-lg leading-none mb-1">+</span></button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}