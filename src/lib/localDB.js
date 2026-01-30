/**
 * LocalDB - Sistema de almacenamiento local que imita Firebase Firestore
 * Migración a Firebase: solo cambiar USE_LOCAL_DB = false en firebase.js
 */

class LocalDatabase {
  constructor(dbName = 'opsflow-db') {
    this.dbName = dbName;
    this.listeners = new Map(); // Para simular onSnapshot
    this.data = this.loadFromStorage();
  }

  // Cargar datos de localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.dbName);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error loading from localStorage:', e);
      return {};
    }
  }

  // Guardar en localStorage
  saveToStorage() {
    try {
      localStorage.setItem(this.dbName, JSON.stringify(this.data));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  // Obtener colección (crea si no existe)
  getCollection(path) {
    if (!this.data[path]) {
      this.data[path] = {};
    }
    return this.data[path];
  }

  // Generar ID único
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Notificar a listeners
  notifyListeners(path) {
    const listeners = this.listeners.get(path) || [];
    const collection = this.getCollection(path);
    const docs = Object.entries(collection).map(([id, data]) => ({
      id,
      data: () => data,
      ...data
    }));

    listeners.forEach(callback => {
      callback({
        docs,
        forEach: (fn) => docs.forEach(fn),
        map: (fn) => docs.map(fn),
      });
    });
  }

  // === API que imita Firebase ===

  // Agregar documento
  async addDoc(path, data) {
    const id = this.generateId();
    const collection = this.getCollection(path);
    collection[id] = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    this.notifyListeners(path);
    return { id };
  }

  // Actualizar documento
  async updateDoc(path, id, data) {
    const collection = this.getCollection(path);
    if (collection[id]) {
      collection[id] = {
        ...collection[id],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      this.saveToStorage();
      this.notifyListeners(path);
    }
  }

  // Eliminar documento
  async deleteDoc(path, id) {
    const collection = this.getCollection(path);
    if (collection[id]) {
      delete collection[id];
      this.saveToStorage();
      this.notifyListeners(path);
    }
  }

  // Obtener documento
  async getDoc(path, id) {
    const collection = this.getCollection(path);
    const data = collection[id];
    return {
      exists: () => !!data,
      id,
      data: () => data,
    };
  }

  // Suscribirse a cambios (simula onSnapshot)
  onSnapshot(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, []);
    }
    this.listeners.get(path).push(callback);

    // Llamar inmediatamente con datos actuales
    const collection = this.getCollection(path);
    const docs = Object.entries(collection).map(([id, data]) => ({
      id,
      data: () => data,
      ...data
    }));

    callback({
      docs,
      forEach: (fn) => docs.forEach(fn),
      map: (fn) => docs.map(fn),
    });

    // Retornar función de unsubscribe
    return () => {
      const listeners = this.listeners.get(path) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  // Obtener todos los documentos
  async getDocs(path) {
    const collection = this.getCollection(path);
    const docs = Object.entries(collection).map(([id, data]) => ({
      id,
      data: () => data,
    }));
    return { docs };
  }

  // Limpiar base de datos
  clear() {
    this.data = {};
    this.saveToStorage();
    this.listeners.forEach((_, path) => this.notifyListeners(path));
  }

  // Exportar datos (para backup)
  export() {
    return JSON.stringify(this.data, null, 2);
  }

  // Importar datos
  import(jsonString) {
    try {
      this.data = JSON.parse(jsonString);
      this.saveToStorage();
      this.listeners.forEach((_, path) => this.notifyListeners(path));
      return true;
    } catch (e) {
      console.error('Error importing data:', e);
      return false;
    }
  }

  // Seed con datos iniciales
  seed(initialData) {
    Object.entries(initialData).forEach(([path, items]) => {
      items.forEach(item => {
        const id = item.id || this.generateId();
        const collection = this.getCollection(path);
        collection[id] = {
          ...item,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
    });
    this.saveToStorage();
    this.listeners.forEach((_, path) => this.notifyListeners(path));
  }
}

// Instancia singleton
export const localDB = new LocalDatabase();

// Datos iniciales de ejemplo
export const SEED_DATA = {
  zones: [
    { id: 'zone-1', name: 'Cocina', type: 'production', critical: false, description: 'Área de preparación principal' },
    { id: 'zone-2', name: 'Planta', type: 'production', critical: false, description: 'Línea de producción' },
    { id: 'zone-3', name: 'Almacén', type: 'storage', critical: false, description: 'Almacenamiento de insumos' },
    { id: 'zone-4', name: 'Frío', type: 'cold', critical: true, requiresTemp: true, tempMin: 32, tempMax: 40, description: 'Cámaras frigoríficas' },
    { id: 'zone-5', name: 'Producto Terminado', type: 'storage', critical: false, description: 'Área de despacho' },
  ],
  groups: [
    { id: 'group-1', name: 'Equipo Cocina AM', role: 'operator', zoneIds: ['zone-1'], description: 'Turno matutino cocina' },
    { id: 'group-2', name: 'Equipo Cocina PM', role: 'operator', zoneIds: ['zone-1'], description: 'Turno vespertino cocina' },
    { id: 'group-3', name: 'Supervisores', role: 'supervisor', zoneIds: ['zone-1', 'zone-2', 'zone-3', 'zone-4'], description: 'Equipo de supervisión' },
  ],
  users: [
    { id: 'user-1', name: 'Juan Pérez', email: 'juan@empresa.com', role: 'operator', groupIds: ['group-1'], pin: '1234' },
    { id: 'user-2', name: 'María García', email: 'maria@empresa.com', role: 'operator', groupIds: ['group-2'], pin: '1234' },
    { id: 'user-3', name: 'Carlos López', email: 'carlos@empresa.com', role: 'supervisor', groupIds: ['group-3'], pin: '5678' },
    { id: 'user-4', name: 'Ana Martínez', email: 'ana@empresa.com', role: 'manager', groupIds: [], pin: '9999' },
    { id: 'user-admin', name: 'Administrador', email: 'admin@empresa.com', role: 'admin', groupIds: [], pin: '0000' },
  ],
  tasks: [
    { id: 'task-1', name: 'Limpiar piso', category: 'cleaning', isLibraryTask: true, estimatedMinutes: 15 },
    { id: 'task-2', name: 'Sanitizar superficies', category: 'cleaning', isLibraryTask: true, estimatedMinutes: 10 },
    { id: 'task-3', name: 'Verificar temperaturas', category: 'inspection', isLibraryTask: true, estimatedMinutes: 5 },
    { id: 'task-4', name: 'Revisar fechas de vencimiento', category: 'inspection', isLibraryTask: true, estimatedMinutes: 20 },
    { id: 'task-5', name: 'Limpieza de filtros', category: 'maintenance', isLibraryTask: true, estimatedMinutes: 30 },
  ],
  products: [
    { id: 'prod-1', name: 'Pollo Marinado', shelfLife: 3, storageCondition: 'refrigerated', category: 'Carnes' },
    { id: 'prod-2', name: 'Ensalada Mixta', shelfLife: 2, storageCondition: 'refrigerated', category: 'Vegetales' },
    { id: 'prod-3', name: 'Salsa Base', shelfLife: 5, storageCondition: 'refrigerated', category: 'Salsas' },
    { id: 'prod-4', name: 'Carne Congelada', shelfLife: 30, storageCondition: 'frozen', category: 'Carnes' },
  ],
  equipment: [
    { id: 'equip-1', name: 'Cámara 1', min: 32, max: 40, zoneId: 'zone-4' },
    { id: 'equip-2', name: 'Cámara 2', min: 32, max: 40, zoneId: 'zone-4' },
    { id: 'equip-3', name: 'Freezer Principal', min: -10, max: 0, zoneId: 'zone-4' },
  ],
};

export default localDB;
