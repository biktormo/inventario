import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Box, Upload, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const navItems = [
    { icon: Home, label: 'Inicio / Buscador', path: '/' },
    { icon: Box, label: 'Inventario & Ubicaciones', path: '/inventory' },
    { icon: Upload, label: 'Actualizar Lista', path: '/upload' },
  ];

  // Función para saber si el link está activo
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Función para manejar el cierre de sesión
  const handleLogout = async () => {
    try {
      await logout();
      // El ProtectedRoute en App.jsx se encargará de redirigir al login
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* --- Sidebar Desktop (Oculto en celular) --- */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white shadow-xl z-10">
        <div className="p-6 text-xl font-bold border-b border-slate-800 flex items-center gap-2">
          <Box className="text-blue-400" />
          <span>Victor Repuestos</span>
        </div>
        
        {/* Navegación Principal */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                isActive(item.path) 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer del Sidebar (Info Usuario + Salir) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="mb-3 px-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Usuario</p>
            <p className="text-sm text-slate-300 truncate" title={currentUser?.email}>
              {currentUser?.email}
            </p>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 w-full p-2 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded transition text-sm font-medium"
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* --- Estructura Principal --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Mobile (Solo visible en celular) */}
        <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-20">
          <span className="font-bold text-lg flex items-center gap-2">
            <Box size={20} className="text-blue-400"/> Victor Repuestos
          </span>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 rounded hover:bg-slate-700 transition"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>
        
        {/* Menú Desplegable Mobile */}
        {isMobileMenuOpen && (
           <div className="md:hidden bg-slate-800 text-white absolute top-14 left-0 w-full z-50 shadow-xl border-t border-slate-700 flex flex-col h-[calc(100vh-3.5rem)]">
             <div className="flex-1 overflow-y-auto">
               {navItems.map(item => (
                 <Link 
                   key={item.path} 
                   to={item.path} 
                   onClick={() => setIsMobileMenuOpen(false)} 
                   className={`flex items-center gap-3 p-4 border-b border-slate-700 ${
                      isActive(item.path) ? 'bg-slate-700 text-blue-400' : ''
                   }`}
                 >
                   <item.icon size={20} />
                   {item.label}
                 </Link>
               ))}
             </div>
             
             {/* Footer Mobile */}
             <div className="p-4 border-t border-slate-700 bg-slate-900">
                <div className="text-sm text-slate-400 mb-3 truncate px-2">
                  {currentUser?.email}
                </div>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 w-full p-3 bg-red-600 text-white rounded justify-center font-medium"
                >
                  <LogOut size={20} /> Cerrar Sesión
                </button>
             </div>
           </div>
        )}

        {/* Contenido de la página */}
        <main className="flex-1 overflow-y-auto bg-gray-50 relative scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}