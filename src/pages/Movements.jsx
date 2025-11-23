import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { ArrowUpCircle, ArrowDownCircle, Clock, User, Package } from 'lucide-react';

export default function Movements() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        // Traemos los últimos 100 movimientos ordenados por fecha
        const q = query(
          collection(db, "movements"), 
          orderBy("timestamp", "desc"), 
          limit(100)
        );
        
        const querySnapshot = await getDocs(q);
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setMovements(items);
      } catch (error) {
        console.error("Error cargando historial:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, []);

  // Función para formatear la fecha de Firebase
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: '2-digit', 
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Clock className="text-blue-600" /> Historial de Movimientos
      </h2>

      {loading ? (
        <div className="text-center py-10">Cargando historial...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3">Fecha / Hora</th>
                  <th className="px-6 py-3">Producto</th>
                  <th className="px-6 py-3 text-center">Movimiento</th>
                  <th className="px-6 py-3 text-center">Stock Final</th>
                  <th className="px-6 py-3">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((mov) => (
                  <tr key={mov.id} className="bg-white border-b hover:bg-gray-50">
                    
                    {/* Fecha */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(mov.timestamp)}
                    </td>

                    {/* Producto */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{mov.productCode}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs" title={mov.productName}>
                        {mov.productName}
                      </div>
                    </td>

                    {/* Tipo de Movimiento (Entrada/Salida) */}
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${mov.type === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {mov.type === 'entrada' ? <ArrowUpCircle size={14}/> : <ArrowDownCircle size={14}/>}
                        {mov.change > 0 ? `+${mov.change}` : mov.change}
                      </div>
                    </td>

                    {/* Stock Resultante */}
                    <td className="px-6 py-4 text-center font-bold text-gray-700">
                      {mov.newStock}
                    </td>

                    {/* Usuario */}
                    <td className="px-6 py-4 flex items-center gap-2">
                      <User size={14} className="text-gray-400"/>
                      <span className="truncate max-w-[150px]" title={mov.user}>{mov.user}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {movements.length === 0 && (
            <div className="p-10 text-center text-gray-500">
              No hay movimientos registrados aún.
            </div>
          )}
        </div>
      )}
    </div>
  );
}