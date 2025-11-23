import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Registra un movimiento de stock en la base de datos.
 * 
 * @param {Object} product - El objeto del producto completo
 * @param {number} quantityChange - La cantidad que cambió (ej: +1, -5)
 * @param {number} newStock - El stock final después del cambio
 * @param {string} userEmail - El email del usuario que hizo el cambio
 * @param {string} reason - (Opcional) Motivo (ej: "Venta", "Ajuste", "Ingreso")
 */
export const logMovement = async (product, quantityChange, newStock, userEmail, reason = 'Ajuste Manual') => {
  try {
    await addDoc(collection(db, 'movements'), {
      productId: product.id,
      productCode: product.codigo,
      productName: product.descripcion,
      change: quantityChange,      // +1 o -1
      type: quantityChange > 0 ? 'entrada' : 'salida',
      previousStock: product.stock || 0,
      newStock: newStock,
      user: userEmail,
      reason: reason,
      timestamp: serverTimestamp() // La hora exacta del servidor
    });
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    // No lanzamos error para no detener la app si falla el log
  }
};