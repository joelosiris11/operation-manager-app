import { useState, useEffect } from 'react';
import { localDB } from '../lib/localDB';

/**
 * Hook genérico para colecciones
 * Usa LocalDB (localStorage) para persistencia local
 */
export function useCollection(collectionName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Suscribirse a cambios
    const unsubscribe = localDB.onSnapshot(collectionName, (snapshot) => {
      const items = snapshot.docs.map(docData => ({
        id: docData.id,
        ...docData
      }));
      setData(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName]);

  // Función para agregar documento
  const add = async (item) => {
    try {
      const result = await localDB.addDoc(collectionName, item);
      return result.id;
    } catch (err) {
      console.error('Error adding document:', err);
      setError(err);
      throw err;
    }
  };

  // Función para actualizar documento
  const update = async (id, updates) => {
    try {
      await localDB.updateDoc(collectionName, id, updates);
    } catch (err) {
      console.error('Error updating document:', err);
      setError(err);
      throw err;
    }
  };

  // Función para eliminar documento
  const remove = async (id) => {
    try {
      await localDB.deleteDoc(collectionName, id);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err);
      throw err;
    }
  };

  return { data, loading, error, add, update, remove };
}

// Hooks específicos por entidad
export const useZones = () => useCollection('zones');
export const useGroups = () => useCollection('groups');
export const useUsers = () => useCollection('users');
export const useTemplates = () => useCollection('templates');
export const useForms = () => useCollection('forms');
export const useTasks = () => useCollection('tasks');
export const useRoutines = () => useCollection('routines');
export const useProducts = () => useCollection('products');
export const useLabels = () => useCollection('labels');
export const useShifts = () => useCollection('shifts');
export const useHistory = () => useCollection('history');
export const useEquipment = () => useCollection('equipment');

/**
 * Hook para gestionar la base de datos local
 */
export function useLocalDB() {
  const exportData = () => {
    const data = localDB.export();
    // Descargar como archivo
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opsflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return data;
  };

  const importData = (jsonString) => {
    const success = localDB.import(jsonString);
    if (success) {
      window.location.reload();
    }
    return success;
  };

  const clearData = () => {
    if (confirm('¿Eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
      localDB.clear();
      window.location.reload();
    }
  };

  const resetToSeed = async () => {
    if (confirm('¿Restaurar datos de ejemplo? Se perderán los datos actuales.')) {
      const { SEED_DATA } = await import('../lib/localDB');
      localDB.clear();
      localDB.seed(SEED_DATA);
      window.location.reload();
    }
  };

  return { exportData, importData, clearData, resetToSeed };
}
