// src/utils.js

// Convierte string argentino "1.218,62" a numero 1218.62
export const parseArgentinePrice = (priceString) => {
  if (!priceString) return 0;
  // Convertimos a string por seguridad
  let clean = priceString.toString();
  // Quitamos comillas si las hay
  clean = clean.replace(/['"]+/g, '');
  // Quitamos los puntos de mil (ej: 1.200 -> 1200)
  clean = clean.replace(/\./g, '');
  // Reemplazamos la coma decimal por punto (ej: 1200,50 -> 1200.50)
  clean = clean.replace(',', '.');
  
  const number = parseFloat(clean);
  return isNaN(number) ? 0 : number;
};

// Formatea numero 1218.62 a "$ 1.218,62"
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value);
};