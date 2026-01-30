/**
 * Database Configuration
 *
 * PARA PRUEBAS LOCALES: USE_LOCAL_DB = true
 * PARA FIREBASE:        USE_LOCAL_DB = false (y configura firebaseConfig)
 */

// ============================================================
// CAMBIAR ESTO PARA MIGRAR A FIREBASE
export const USE_LOCAL_DB = true;
// ============================================================

import { localDB, SEED_DATA } from './localDB';

// Placeholder para auth
export const auth = {
  currentUser: { uid: 'local-user-' + Date.now() }
};

// Placeholder para db
export const db = localDB;

export const APP_ID = 'opsflow-app';
export const BASE_PATH = `artifacts/${APP_ID}/public/data`;

// Inicializar con datos de ejemplo si está vacío
if (USE_LOCAL_DB) {
  console.log('💾 Usando base de datos local (localStorage)');
  const existingData = localStorage.getItem('opsflow-db');
  if (!existingData || existingData === '{}') {
    console.log('📦 Cargando datos de ejemplo...');
    localDB.seed(SEED_DATA);
  }
}

// Funciones de auth simuladas para LocalDB
export const onAuthStateChanged = (auth, callback) => {
  setTimeout(() => {
    callback({ uid: 'local-user-' + Date.now() });
  }, 100);
  return () => {};
};

export const signInAnonymously = async () => {
  return { user: { uid: 'local-user-' + Date.now() } };
};
