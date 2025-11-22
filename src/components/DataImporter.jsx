import React, { useState } from 'react';
import Papa from 'papaparse';
import { db } from '../firebase';
import { writeBatch, doc } from 'firebase/firestore';
import { Upload, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { parseArgentinePrice } from '../utils';

export default function DataImporter() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, success: false });
  const [error, setError] = useState('');

  // Manejador de la carga del archivo
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setStats({ total: 0, success: false });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true, // Salta líneas en blanco
      // Esta línea es vital: elimina espacios y el carácter invisible BOM de Windows
      transformHeader: (h) => h.trim().replace(/^\ufeff/, ''), 
      complete: async (results) => {
        
        // Validación de seguridad: Verificar si hay datos
        if (results.data.length === 0) {
          setError('El archivo parece estar vacío o no se pudo leer.');
          setLoading(false);
          return;
        }

        const primerFila = results.data[0];
        
        // Verificamos que exista la columna CODIGO
        if (!primerFila.hasOwnProperty('CODIGO')) {
          console.error("Encabezados encontrados:", Object.keys(primerFila));
          setError('Error de formato: No se encuentra la columna "CODIGO". Verifica que la fila 1 del archivo tenga los títulos exactos: CODIGO,DESCRIPCION,PRECIO S/IVA');
          setLoading(false);
          return;
        }

        // Si pasa la validación, procesamos
        try {
          await processBatch(results.data);
        } catch (err) {
          console.error(err);
          setError('Ocurrió un error al procesar los datos en Firebase: ' + err.message);
          setLoading(false);
        }
      },
      error: (err) => {
        setError('Error leyendo el archivo CSV: ' + err.message);
        setLoading(false);
      }
    });
  };

  // Procesamiento y subida a Firebase
  const processBatch = async (data) => {
    // Firestore permite escribir máximo 500 documentos a la vez. Usamos 450 por seguridad.
    const BATCH_SIZE = 450; 
    let batch = writeBatch(db);
    let operationCount = 0;
    let totalProcessed = 0;

    for (const item of data) {
      // Ignorar filas que no tengan código
      if (!item.CODIGO || item.CODIGO.trim() === '') continue;

      const codigo = item.CODIGO.toString().trim(); 
      
      // Buscamos el precio. Puede venir como 'PRECIO S/IVA' o 'PRECIO'
      const precioRaw = item['PRECIO S/IVA'] || item['PRECIO'] || '0';
      const precio = parseArgentinePrice(precioRaw);

      const descripcion = item.DESCRIPCION ? item.DESCRIPCION.trim() : 'Sin descripción';

      // --- CORRECCIÓN CRÍTICA DE FIREBASE ---
      // Las barras "/" (ej: D129/C) rompen la base de datos porque cree que son carpetas.
      // Reemplazamos "/" por "_" SOLO para el ID interno del documento.
      const idSeguro = codigo.replace(/\//g, '_'); 
      
      // Referencia al documento usando el ID seguro
      const docRef = doc(db, 'products', idSeguro);

      // Datos a guardar 
      // Aquí sí guardamos el 'codigo' original con la barra para mostrarlo bien en pantalla.
      const productData = {
        codigo: codigo,
        descripcion: descripcion,
        precio: precio,
        updatedAt: new Date() // Marca de tiempo de la actualización
      };

      // { merge: true } es VITAL. Si el producto existe, actualiza campos. Si no, lo crea.
      // Esto evita borrar el stock y la ubicación existentes.
      batch.set(docRef, productData, { merge: true });

      operationCount++;
      totalProcessed++;

      // Si llenamos el lote, lo enviamos y creamos uno nuevo
      if (operationCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db); // Nuevo batch
        operationCount = 0;
      }
    }

    // Enviar los restantes que no completaron un lote
    if (operationCount > 0) {
      await batch.commit();
    }

    setLoading(false);
    setStats({ total: totalProcessed, success: true });
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <Upload className="text-blue-600" /> Actualizar Lista de Precios
      </h2>
      
      {/* Tarjeta de Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-8 shadow-sm">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <FileText size={18}/> Instrucciones para el archivo:
        </h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 ml-2">
          <li>El archivo debe ser formato <strong>.CSV</strong> (separado por comas o punto y coma).</li>
          <li>La <strong>primera fila</strong> debe contener exactamente estos títulos:</li>
          <li className="font-mono bg-blue-100 inline-block px-2 rounded mt-1">CODIGO,DESCRIPCION,PRECIO S/IVA</li>
          <li className="mt-2">El sistema buscará por <strong>CÓDIGO</strong>. Si ya existe, actualizará el precio manteniendo tu stock.</li>
        </ul>
      </div>

      {/* Área de Carga */}
      <div className="mb-8">
        <label 
          className={`
            flex flex-col items-center justify-center w-full h-64 
            border-2 border-dashed rounded-xl cursor-pointer 
            transition-colors duration-200
            ${loading ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-400'}
          `}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {loading ? (
              <>
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-gray-500 font-medium">Procesando archivo...</p>
                <p className="text-xs text-gray-400">Esto puede tomar unos momentos</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Haz clic para subir</span> o arrastra el archivo aquí
                </p>
                <p className="text-xs text-gray-400">Formato CSV admitido</p>
              </>
            )}
          </div>
          <input 
            type="file" 
            accept=".csv,.txt" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={loading}
          />
        </label>
      </div>

      {/* Mensajes de Error */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Mensaje de Éxito */}
      {stats.success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded shadow-sm flex items-start gap-3 animate-fade-in">
          <CheckCircle className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold">¡Actualización Exitosa!</p>
            <p className="text-sm">
              Se han procesado y actualizado <strong>{stats.total}</strong> productos correctamente en la base de datos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}