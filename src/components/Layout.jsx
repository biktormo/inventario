import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Box, Upload, Menu, X } from 'lucide-react';

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

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

  return (
    <div className="flex h-screen bg-gray-100">
      {/* --- Sidebar Desktop (Oculto en celular) --- */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white shadow-xl z-10">
        <div className="p-6 text-xl font-bold border-b border-slate-800 flex items-center gap-2">
          <Box className="text-blue-400" />
          <span>Victor Repuestos</span>
        </div>
        
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

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          v1.0 - Sistema de Stock
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
           <div className="md:hidden bg-slate-800 text-white absolute top-14 left-0 w-full z-50 shadow-xl border-t border-slate-700">
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
        )}

        {/* Contenido de la página */}
        <main className="flex-1 overflow-y-auto bg-gray-50 relative">
          {children}
        </main>
      </div>
    </div>
  );
}