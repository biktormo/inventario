import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, ShoppingCart, Copy, Minus, Plus } from 'lucide-react';
import { formatCurrency } from '../utils';

export default function CartSidebar() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, total, clearCart } = useCart();

  if (!isCartOpen) return null;

  // Generar texto para WhatsApp
  const copyToClipboard = () => {
    let text = "*PRESUPUESTO - VICTOR REPUESTOS*\n\n";
    cart.forEach(item => {
      text += `${item.quantity}x ${item.descripcion.substring(0, 25)}... \n   $${new Intl.NumberFormat('es-AR').format(item.precio * item.quantity)}\n`;
    });
    text += `\n*TOTAL: ${formatCurrency(total)}*`;
    
    navigator.clipboard.writeText(text);
    alert("¡Presupuesto copiado! Pégalo en WhatsApp.");
  };

  return (
    <>
      {/* Fondo oscuro (Overlay) */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Panel Lateral */}
      <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">
        
        {/* Cabecera */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} />
            <h2 className="font-bold text-lg">Presupuesto</h2>
            <span className="bg-blue-600 text-xs px-2 py-0.5 rounded-full">{cart.length} items</span>
          </div>
          <button onClick={() => setIsCartOpen(false)} className="hover:text-red-400 transition">
            <X size={24} />
          </button>
        </div>

        {/* Lista de Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              <ShoppingCart size={48} className="mx-auto mb-2 opacity-20" />
              <p>El carrito está vacío.</p>
              <p className="text-sm">Agrega productos desde el inventario.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="text-xs font-bold text-gray-500">{item.codigo}</span>
                    <p className="text-sm text-gray-800 font-medium leading-tight line-clamp-2">{item.descripcion}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-1">
                  <div className="flex items-center border rounded-md">
                    <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 hover:bg-gray-100 text-gray-600"><Minus size={14}/></button>
                    <span className="px-2 text-sm font-bold w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1 hover:bg-gray-100 text-gray-600"><Plus size={14}/></button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{formatCurrency(item.precio)} c/u</p>
                    <p className="font-bold text-blue-700">{formatCurrency(item.precio * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pie de página (Totales y Botones) */}
        <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex justify-between items-end mb-4">
            <span className="text-gray-500">Total Estimado</span>
            <span className="text-2xl font-extrabold text-slate-900">{formatCurrency(total)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={clearCart}
              disabled={cart.length === 0}
              className="px-4 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition flex justify-center items-center gap-2"
            >
              <Trash2 size={18} /> Vaciar
            </button>
            <button 
              onClick={copyToClipboard}
              disabled={cart.length === 0}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex justify-center items-center gap-2 font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Copy size={18} /> Copiar TXT
            </button>
          </div>
        </div>
      </div>
    </>
  );
}