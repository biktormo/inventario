import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { DollarSign, Package, AlertTriangle, Activity, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    totalValue: 0,
    lowStockCount: 0
  });
  const [recentMovements, setRecentMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Cargar Productos para calcular totales
        const productsSnapshot = await getDocs(collection(db, "products"));
        let prodCount = 0;
        let stockCount = 0;
        let valueCount = 0;
        let lowCount = 0;

        productsSnapshot.forEach(doc => {
          const data = doc.data();
          prodCount++;
          const stock = parseInt(data.stock || 0);
          const price = parseFloat(data.precio || 0);
          
          stockCount += stock;
          valueCount += (stock * price); // Valorización del stock
          
          if (stock <= 2) lowCount++;
        });

        setStats({
          totalProducts: prodCount,
          totalStock: stockCount,
          totalValue: valueCount,
          lowStockCount: lowCount
        });

        // 2. Cargar Últimos Movimientos
        const movQuery = query(collection(db, "movements"), orderBy("timestamp", "desc"), limit(5));
        const movSnapshot = await getDocs(movQuery);
        const movements = movSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentMovements(movements);

      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Calculando métricas...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Panel de Control</h1>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Valor del Inventario */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Valor del Inventario</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(stats.totalValue)}</p>
          </div>
        </div>

        {/* Total de Productos (Referencias) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Referencias</p>
            <p className="text-xl font-bold text-slate-800">{stats.totalProducts}</p>
          </div>
        </div>

        {/* Total Unidades Físicas */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Unidades Totales</p>
            <p className="text-xl font-bold text-slate-800">{stats.totalStock}</p>
          </div>
        </div>

        {/* Stock Crítico */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Stock Crítico</p>
            <p className="text-xl font-bold text-red-600">{stats.lowStockCount}</p>
          </div>
        </div>
      </div>

      {/* Sección Inferior */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Accesos Rápidos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500"/> Accesos Rápidos
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/inventory" className="p-4 bg-slate-50 hover:bg-blue-50 rounded-lg text-center border border-slate-100 hover:border-blue-200 transition">
              <span className="block font-semibold text-blue-600">Ver Inventario</span>
            </Link>
            <Link to="/upload" className="p-4 bg-slate-50 hover:bg-green-50 rounded-lg text-center border border-slate-100 hover:border-green-200 transition">
              <span className="block font-semibold text-green-600">Actualizar Precios</span>
            </Link>
            <Link to="/history" className="p-4 bg-slate-50 hover:bg-purple-50 rounded-lg text-center border border-slate-100 hover:border-purple-200 transition col-span-2">
              <span className="block font-semibold text-purple-600">Ver Auditoría Completa</span>
            </Link>
          </div>
        </div>

        {/* Últimos Movimientos (Mini lista) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4">Últimos Movimientos</h3>
          <div className="space-y-3">
            {recentMovements.length === 0 ? (
              <p className="text-sm text-gray-400">No hay movimientos recientes.</p>
            ) : (
              recentMovements.map(mov => (
                <div key={mov.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-slate-700">{mov.productCode}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(mov.timestamp?.seconds * 1000).toLocaleDateString()} - {mov.user.split('@')[0]}
                    </p>
                  </div>
                  <span className={`font-bold px-2 py-1 rounded text-xs ${mov.type === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {mov.change > 0 ? `+${mov.change}` : mov.change}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}