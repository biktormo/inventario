import { Home, Box, Upload, Menu } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { icon: Home, label: 'Inicio / Buscador', path: '/' },
    { icon: Box, label: 'Inventario & Ubicaciones', path: '/inventory' },
    { icon: Upload, label: 'Actualizar Lista', path: '/upload' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white">
        <div className="p-4 text-xl font-bold border-b border-slate-700">Victor Repuestos</div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition">
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center">
          <span className="font-bold">Victor Repuestos</span>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu /></button>
        </header>
        
        {/* Mobile Menu Overlay (simplificado) */}
        {isMobileMenuOpen && (
           <div className="md:hidden bg-slate-800 text-white p-4 absolute top-14 w-full z-50">
             {navItems.map(item => (
               <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)} className="block p-3 border-b border-slate-700">
                 {item.label}
               </Link>
             ))}
           </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}