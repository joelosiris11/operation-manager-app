// --- Colores HACCP por día ---
export const DAY_COLORS = [
  { day: 'Domingo', abbr: 'DOM', color: 'bg-black', text: 'text-white', hex: '#000000' },
  { day: 'Lunes', abbr: 'LUN', color: 'bg-blue-600', text: 'text-white', hex: '#2563eb' },
  { day: 'Martes', abbr: 'MAR', color: 'bg-yellow-400', text: 'text-black', hex: '#facc15' },
  { day: 'Miércoles', abbr: 'MIÉ', color: 'bg-red-600', text: 'text-white', hex: '#dc2626' },
  { day: 'Jueves', abbr: 'JUE', color: 'bg-amber-800', text: 'text-white', hex: '#92400e' },
  { day: 'Viernes', abbr: 'VIE', color: 'bg-green-600', text: 'text-white', hex: '#16a34a' },
  { day: 'Sábado', abbr: 'SÁB', color: 'bg-orange-500', text: 'text-white', hex: '#f97316' },
];

// --- Zonas predefinidas ---
export const DEFAULT_ZONES = [
  { name: 'Cocina', type: 'production', critical: false },
  { name: 'Planta', type: 'production', critical: false },
  { name: 'Producto Terminado', type: 'storage', critical: false },
  { name: 'Almacén', type: 'storage', critical: false },
  { name: 'Frío', type: 'cold', critical: true },
];

// --- Tipos de zona ---
export const ZONE_TYPES = [
  { id: 'production', label: 'Producción' },
  { id: 'storage', label: 'Almacenamiento' },
  { id: 'cold', label: 'Cadena de Frío' },
  { id: 'cleaning', label: 'Limpieza' },
  { id: 'other', label: 'Otro' },
];

// --- Roles de usuario ---
export const USER_ROLES = [
  { id: 'operator', label: 'Operador', level: 1 },
  { id: 'supervisor', label: 'Supervisor', level: 2 },
  { id: 'manager', label: 'Gerente', level: 3 },
  { id: 'admin', label: 'Administrador', level: 4 },
];

// --- Tipos de pregunta para plantillas ---
export const QUESTION_TYPES = [
  { id: 'yes_no', label: 'Sí / No', icon: 'ToggleLeft' },
  { id: 'text', label: 'Respuesta Abierta', icon: 'Type' },
  { id: 'scale', label: 'Escala (1-5)', icon: 'Sliders' },
  { id: 'checkbox', label: 'Checkbox', icon: 'CheckSquare' },
  { id: 'number', label: 'Numérica', icon: 'Hash' },
  { id: 'temperature', label: 'Temperatura', icon: 'Thermometer' },
  { id: 'photo', label: 'Foto Obligatoria', icon: 'Camera' },
];

// --- Frecuencias de rutinas ---
export const ROUTINE_FREQUENCIES = [
  { id: 'hourly', label: 'Cada X horas', icon: 'Clock' },
  { id: 'daily', label: 'Diario', icon: 'Calendar' },
  { id: 'weekly', label: 'Semanal', icon: 'CalendarDays' },
  { id: 'monthly', label: 'Mensual', icon: 'CalendarRange' },
];

// --- Estados de ejecución ---
export const EXECUTION_STATUS = {
  PENDING: { id: 'pending', label: 'Pendiente', color: 'bg-slate-400' },
  ON_TIME: { id: 'on_time', label: 'A tiempo', color: 'bg-emerald-500' },
  WARNING: { id: 'warning', label: 'Por vencer', color: 'bg-yellow-500' },
  OVERDUE: { id: 'overdue', label: 'Vencido', color: 'bg-red-500' },
  COMPLETED: { id: 'completed', label: 'Completado', color: 'bg-emerald-600' },
};

// --- Condiciones de almacenamiento ---
export const STORAGE_CONDITIONS = [
  { id: 'ambient', label: 'Ambiente', minTemp: 15, maxTemp: 25 },
  { id: 'refrigerated', label: 'Refrigerado', minTemp: 0, maxTemp: 4 },
  { id: 'frozen', label: 'Congelado', minTemp: -25, maxTemp: -18 },
];
