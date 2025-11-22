// src/pages/Inventory.jsx
import { useState, useEffect } from 'react';
import { collection, query,  limit, getDocs, doc, updateDoc, where } from "firebase/firestore"; 
import { db } from '../firebase';
import { Search, MapPin } from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Función para buscar (simulada, idealmente se hace con índices de algolia o lectura completa si no son demasiados MB)
  const handleSearch = async () => {
    setLoading(true);
    // NOTA: Firestore no tiene búsqueda de texto completo nativa barata.
    // Estrategia PWA: Descargar todo el catálogo (tu archivo son ~500kb, es liviano) 
    // y filtrar en el cliente (memoria del navegador) para velocidad instantánea.
    
    const q = query(collection(db, "products")); 
    const querySnapshot = await getDocs(q);
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    setProducts(items);
    setLoading(false);
  };

  useEffect(() => { handleSearch(); }, []);

  const filteredProducts = products.filter(p => 
    p.CODIGO.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.DESCRIPCION.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateStock = async (id, newStock) => {
    const productRef = doc(db, "products", id);
    await updateDoc(productRef, { stock: parseInt(newStock) });
    // Actualizar estado local
    setProducts(prev => prev.map(p => p.id === id ? {...p, stock: parseInt(newStock)} : p));
  };

  return (
    <div>
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por código o descripción..." 
            className="w-full pl-10 p-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.slice(0, 50).map((product) => ( // Limitamos a 50 visibles para rendimiento
          <div key={product.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="font-bold text-blue-600 text-lg">{product.CODIGO}</span>
                <span className="text-green-700 font-bold">$ {product.PRECIO}</span>
              </div>
              <p className="text-gray-600 text-sm mt-1 mb-3">{product.DESCRIPCION}</p>
            </div>
            
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Ubicación</span>
                <div className="flex items-center gap-1">
                   <MapPin size={14} className="text-gray-400"/>
                   <input 
                     className="bg-transparent w-20 text-sm font-medium focus:bg-white"
                     defaultValue={product.location || ''}
                     onBlur={(e) => updateDoc(doc(db, "products", product.id), { location: e.target.value })}
                   />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  className="w-8 h-8 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  onClick={() => updateStock(product.id, (product.stock || 0) - 1)}
                >-</button>
                <span className="font-bold w-8 text-center">{product.stock || 0}</span>
                <button 
                  className="w-8 h-8 bg-green-100 text-green-600 rounded hover:bg-green-200"
                  onClick={() => updateStock(product.id, (product.stock || 0) + 1)}
                >+</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}