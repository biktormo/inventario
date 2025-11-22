import React, { useState } from 'react';
import Papa from 'papaparse';
import { db } from '../firebase'; // Asegúrate de configurar firebase.js
import { writeBatch, doc } from 'firebase/firestore';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { parseArgentinePrice } from '../utils';

export default function DataImporter() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, success: false });
  const [error, setError] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setStats({ total: 0, success: false });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          await processBatch(results.data);
        } catch (err) {
          setError('Error al procesar datos: ' + err.message);
          setLoading(false);
        }
      },
      error: (err) => {
        setError('Error leyendo archivo CSV: ' + err.message);
        setLoading(false);
      }
    });
  };

  const processBatch = async (data) => {
    // Firestore permite max 500 operaciones por lote (batch)
    const BATCH_SIZE = 450; 
    let batch = writeBatch(db);
    let count = 0;
    let totalProcessed = 0;

    for (const item of data) {
      // Validación básica: necesitamos CODIGO y PRECIO
      if (!item.CODIGO || !item['PRECIO S/IVA']) continue;

      const codigo = item.CODIGO.trim(); // El codigo será el ID del documento
      const precio = parseArgentinePrice(item['PRECIO S/IVA']);
      
      const docRef = doc(db, 'products', codigo);

      // Preparamos los datos a guardar
      const productData = {
        codigo: codigo,
        descripcion: item.DESCRIPCION || '',
        precio: precio,
        updatedAt: new Date()
        // NO incluimos stock ni ubicacion aquí para no sobreescribirlos si existen
        // Si el documento es nuevo, stock y ubicación no existirán (undefined)
      };

      // merge: true es la clave. Actualiza o Crea sin borrar campos extra
      batch.set(docRef, productData, { merge: true });

      count++;
      totalProcessed++;

      if (count >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    setLoading(false);
    setStats({ total: totalProcessed, success: true });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Upload className="text-blue-600" /> Actualizar Lista de Precios
      </h2>
      
      <div className="bg-blue-50 p-4 rounded-md mb-6 border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Instrucciones:</strong> Sube el archivo CSV exportado. 
          El sistema buscará por <strong>CÓDIGO</strong>. Si existe, actualizará precio y descripción 
          (manteniendo tu stock y ubicación). Si no existe, lo creará.
        </p>
      </div>

      <div className="mb-6">
        <label className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:bg-gray-50 transition">
          <input 
            type="file" 
            accept=".csv,.txt" 
            onChange={handleFileUpload} 
            disabled={loading}
            className="hidden" 
          />
          {loading ? (
            <div className="flex justify-center items-center gap-2 text-gray-500">
              <Loader2 className="animate-spin" /> Procesando... esto puede tardar unos segundos.
            </div>
          ) : (
            <span className="text-gray-600 font-medium">Haz clic para seleccionar el archivo CSV</span>
          )}
        </label>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {stats.success && (
        <div className="p-4 bg-green-100 text-green-700 rounded flex items-center gap-2">
          <CheckCircle size={20} />
          <span>¡Éxito! Se procesaron <strong>{stats.total}</strong> productos correctamente.</span>
        </div>
      )}
    </div>
  );
}