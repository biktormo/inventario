import React, { useState } from 'react';
import Papa from 'papaparse';
import { db } from '../firebase';
import { writeBatch, doc, collection, getDocs } from 'firebase/firestore'; // <--- Agregado collection, getDocs
import { Upload, CheckCircle, AlertCircle, Loader2, FileText, Download } from 'lucide-react'; // <--- Agregado Download
import { parseArgentinePrice } from '../utils';

export default function DataImporter() {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false); // <--- Estado para exportación
  const [stats, setStats] = useState({ total: 0, success: false });
  const [error, setError] = useState('');

  // --- FUNCIÓN NUEVA: EXPORTAR DATOS ---
  const handleExport = async () => {
    setExporting(true);
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const data = [];
      
      querySnapshot.forEach((doc) => {
        const item = doc.data();
        // Preparamos el objeto para el CSV
        data.push({
          CODIGO: item.codigo,
          DESCRIPCION: item.descripcion,
          "PRECIO S/IVA": item.precio, // Mantenemos formato original
          STOCK: item.stock || 0,      // Exportamos el stock actual
          UBICACION: item.location || '' // Exportamos la ubicación
        });
      });

      // Convertir a CSV usando PapaParse
      const csv = Papa.unparse(data, {
        quotes: false, // Opcional: poner comillas a todo
        delimiter: ",",
      });

      // Crear blob y descargar
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventario_backup_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Error exportando:", err);
      setError("Error al generar el archivo de exportación.");
    } finally {
      setExporting(false);
    }
  };
  // -------------------------------------

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setStats({ total: 0, success: false });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().replace(/^\ufeff/, ''), 
      complete: async (results) => {
        if (results.data.length === 0) {
          setError('El archivo parece estar vacío o no se pudo leer.');
          setLoading(false);
          return;
        }

        const primerFila = results.data[0];
        if (!primerFila.hasOwnProperty('CODIGO')) {
          setError('Error de formato: No se encuentra la columna "CODIGO".');
          setLoading(false);
          return;
        }

        try {
          await processBatch(results.data);
        } catch (err) {
          setError('Ocurrió un error al procesar los datos: ' + err.message);
          setLoading(false);
        }
      },
      error: (err) => {
        setError('Error leyendo el archivo CSV: ' + err.message);
        setLoading(false);
      }
    });
  };

  const processBatch = async (data) => {
    const BATCH_SIZE = 450; 
    let batch = writeBatch(db);
    let operationCount = 0;
    let totalProcessed = 0;

    for (const item of data) {
      if (!item.CODIGO || item.CODIGO.trim() === '') continue;

      const codigo = item.CODIGO.toString().trim(); 
      const precioRaw = item['PRECIO S/IVA'] || item['PRECIO'] || '0';
      const precio = parseArgentinePrice(precioRaw);
      const descripcion = item.DESCRIPCION ? item.DESCRIPCION.trim() : 'Sin descripción';

      const idSeguro = codigo.replace(/\//g, '_'); 
      const docRef = doc(db, 'products', idSeguro);

      const productData = {
        codigo: codigo,
        descripcion: descripcion,
        precio: precio,
        updatedAt: new Date()
      };

      batch.set(docRef, productData, { merge: true });

      operationCount++;
      totalProcessed++;

      if (operationCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    setLoading(false);
    setStats({ total: totalProcessed, success: true });
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <Upload className="text-blue-600" /> Gestión de Datos
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* --- SECCIÓN 1: IMPORTAR --- */}
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700">Actualizar Precios</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-bold flex items-center gap-2 mb-1"><FileText size={16}/> Formato CSV:</p>
                <p>CODIGO,DESCRIPCION,PRECIO S/IVA</p>
            </div>
            
            <label 
            className={`
                flex flex-col items-center justify-center w-full h-40
                border-2 border-dashed rounded-xl cursor-pointer 
                transition-colors duration-200
                ${loading ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-400'}
            `}
            >
            <div className="flex flex-col items-center justify-center">
                {loading ? (
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                ) : (
                <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500 font-medium">Subir archivo</span>
                </>
                )}
            </div>
            <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} disabled={loading} />
            </label>
        </div>

        {/* --- SECCIÓN 2: EXPORTAR (NUEVO) --- */}
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700">Copia de Seguridad</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                <p className="font-bold mb-1">Descargar Inventario</p>
                <p>Genera un archivo Excel/CSV con tus precios, <strong>stock actual y ubicaciones</strong>.</p>
            </div>

            <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full h-40 border-2 border-transparent bg-white shadow-sm hover:shadow-md rounded-xl flex flex-col items-center justify-center text-slate-600 hover:text-green-600 transition-all border-gray-200"
            >
                {exporting ? (
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                ) : (
                    <>
                        <Download className="w-8 h-8 mb-2" />
                        <span className="font-medium">Descargar Backup</span>
                    </>
                )}
            </button>
        </div>

      </div>

      {/* Mensajes de Estado */}
      <div className="mt-6">
        {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm flex items-center gap-3">
            <AlertCircle /> {error}
            </div>
        )}

        {stats.success && (
            <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded shadow-sm flex items-center gap-3">
            <CheckCircle /> 
            <span>Actualización completa: <strong>{stats.total}</strong> productos procesados.</span>
            </div>
        )}
      </div>
    </div>
  );
}