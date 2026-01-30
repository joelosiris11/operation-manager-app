import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, Plus, Calendar, CheckSquare, Clock, Users, Sun, Moon, 
  Cloud, Bell, User, Menu, X, ClipboardList, Thermometer, Tags, 
  MessageSquare, Briefcase, Repeat, Trash2, Edit, Type, Star, Image, 
  CheckCircle2, Circle, Key, Mail, Phone, Home, ChevronLeft, 
  ChevronRight, AlertTriangle, GitCommit, ShieldCheck, LayoutGrid, 
  Settings, Save, PlusCircle, PenTool, Printer, Download, Hash,
  UserPlus, ListChecks, BookOpen, Layers, Play
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, onSnapshot, setDoc, addDoc, 
  updateDoc, deleteDoc, query, where, getDocs, writeBatch 
} from 'firebase/firestore';
import { 
  getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken 
} from 'firebase/auth';

// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-ops-app';

// --- Initialization ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- HACCP Standards: Day Colors ---
const DAY_COLORS = [
  { day: 'Domingo', color: 'bg-black', text: 'text-white' },
  { day: 'Lunes', color: 'bg-blue-600', text: 'text-white' },
  { day: 'Martes', color: 'bg-yellow-400', text: 'text-black' },
  { day: 'Miércoles', color: 'bg-red-600', text: 'text-white' },
  { day: 'Jueves', color: 'bg-amber-800', text: 'text-white' },
  { day: 'Viernes', color: 'bg-green-600', text: 'text-white' },
  { day: 'Sábado', color: 'bg-orange-500', text: 'text-white' },
];

// --- Notification Hook ---
const useNotificationTimer = (tasks, userId) => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!userId || !tasks || tasks.length === 0) return;

        const checkTasks = () => {
            const now = new Date();
            tasks.forEach(task => {
                if (task.status === 'completed' || !task.dueDate || !task.dueTime) return;

                const dueDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
                if (isNaN(dueDateTime.getTime())) return;
                
                const timeDiff = dueDateTime - now;
                // Notify if due within 15 mins (900000ms)
                if (timeDiff > 0 && timeDiff < 900000) {
                     setNotifications(prev => {
                        if (prev.some(n => n.id === `rem-${task.id}`)) return prev;
                        return [...prev, {
                            id: `rem-${task.id}`,
                            title: 'Recordatorio',
                            message: `"${task.title}" vence pronto.`,
                            type: 'info'
                        }];
                     });
                }
            });
        };

        const timer = setInterval(checkTasks, 60000); 
        return () => clearInterval(timer);
    }, [tasks, userId]);

    return [notifications, setNotifications];
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // App State
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [areas, setAreas] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [labelItems, setLabelItems] = useState([]);
  const [masterTasks, setMasterTasks] = useState([]);
  const [taskTemplates, setTaskTemplates] = useState([]); 
  const [scheduledRoutines, setScheduledRoutines] = useState([]); 
  const [schedule, setSchedule] = useState([]);
  const [taskToAssign, setTaskToAssign] = useState(null);
  
  const [timerNotifications, setTimerNotifications] = useNotificationTimer(tasks, userId);

  // --- Auth Lifecycle ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth error", e);
        await signInAnonymously(auth).catch(e => console.error("Anon auth failed", e));
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setUserId(u.uid);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // --- Firestore Sync (Public Path) ---
  useEffect(() => {
    if (!isAuthReady) return;
    const basePath = `artifacts/${appId}/public/data`;

    const unsubTasks = onSnapshot(collection(db, `${basePath}/tasks`), (s) => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubEmps = onSnapshot(collection(db, `${basePath}/employees`), (s) => setEmployees(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubAreas = onSnapshot(collection(db, `${basePath}/areas`), (s) => setAreas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubEquip = onSnapshot(collection(db, `${basePath}/equipment`), (s) => setEquipment(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubLabels = onSnapshot(collection(db, `${basePath}/labelItems`), (s) => setLabelItems(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMaster = onSnapshot(collection(db, `${basePath}/masterTasks`), (s) => setMasterTasks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTemplates = onSnapshot(collection(db, `${basePath}/taskTemplates`), (s) => setTaskTemplates(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubRoutines = onSnapshot(collection(db, `${basePath}/scheduledRoutines`), (s) => setScheduledRoutines(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSchedule = onSnapshot(collection(db, `${basePath}/schedule`), (s) => setSchedule(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => {
      unsubTasks(); unsubEmps(); unsubAreas(); unsubEquip(); unsubLabels(); unsubMaster(); unsubTemplates(); unsubRoutines(); unsubSchedule();
    };
  }, [isAuthReady]);

  // Demo Manager Logic
  const isManager = true; 
  const currentUserData = employees.find(e => e.authUid === userId);

  const handleAssignment = async (taskId, employeeId) => {
    await updateDoc(doc(db, `artifacts/${appId}/public/data/tasks`, taskId), { assignedTo: employeeId });
    setTaskToAssign(null);
  };

  // --- Core Logic: Generate Tasks from Group Routines ---
  const processTasksForDate = async (dateStr) => {
    console.log("Generando tareas para:", dateStr);
    
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateToProcess = new Date(y, m - 1, d);
    const dayOfWeek = dateToProcess.getDay(); // 0=Domingo
    const dayOfMonth = dateToProcess.getDate();

    const routinesToRun = scheduledRoutines.filter(routine => {
        if (!routine.active) return false;
        if (routine.recurrence === 'daily') return true;
        if (routine.recurrence === 'weekly' && routine.weeklyDays && routine.weeklyDays.includes(dayOfWeek.toString())) return true;
        if (routine.recurrence === 'monthly' && routine.monthlyDates && routine.monthlyDates.includes(dayOfMonth)) return true;
        return false;
    });

    for (const routine of routinesToRun) {
        const template = taskTemplates.find(t => t.id === routine.templateId);
        if (template && template.tasks && template.tasks.length > 0) {
            for (const subTask of template.tasks) {
                await addDoc(collection(db, `artifacts/${appId}/public/data/tasks`), {
                    title: subTask.title,
                    area: subTask.area || 'General',
                    role: subTask.role || 'General Staff',
                    priority: subTask.priority || 'Medium',
                    dueTime: routine.time || '09:00',
                    status: 'pending',
                    dueDate: dateStr,
                    isTemplate: false,
                    sourceRoutineId: routine.id,
                    sourceGroupName: template.name,
                    createdAt: new Date().toISOString()
                });
            }
        }
    }
  };

  const handleSimulateDay = async () => {
    const today = new Date().toISOString().split('T')[0];
    await processTasksForDate(today);
    alert(`Se han generado las tareas para el día ${today} basadas en las rutinas programadas.`);
  };

  const handleShiftChange = async (date) => {
     // Optional: Regenerate tasks logic
  };

  if (!isAuthReady) return <LoadingScreen />;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 leading-normal">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        isManager={isManager} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setIsSidebarOpen={setIsSidebarOpen} userId={userId} onSimulate={handleSimulateDay} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <NotificationToasts notifications={timerNotifications} setNotifications={setTimerNotifications} />
          {currentView === 'dashboard' && <DashboardView tasks={tasks} schedule={schedule} employees={employees} />}
          {currentView === 'tasks' && <OperationTasksView tasks={tasks} employees={employees} areas={areas} setTaskToAssign={setTaskToAssign} />}
          {currentView === 'schedule' && <SchedulingView schedule={schedule} employees={employees} userId={userId} onShiftChange={handleShiftChange} tasks={tasks} setTaskToAssign={setTaskToAssign}/>}
          {currentView === 'temperature' && <TemperatureLogsView equipment={equipment} />}
          {currentView === 'labeling' && <LabelingView items={labelItems} currentEmployee={currentUserData} />}
          {currentView === 'employees' && <TeamDirectoryView employees={employees} />}
          {currentView === 'admin' && isManager && (
            <AdminPanelView 
              areas={areas} 
              employees={employees}
              tasks={tasks}
              masterTasks={masterTasks}
              taskTemplates={taskTemplates}
              scheduledRoutines={scheduledRoutines}
              equipment={equipment} 
              labelItems={labelItems} 
            />
          )}
        </main>
      </div>

      <AssignmentModal 
        task={taskToAssign} 
        employees={employees} 
        schedule={schedule}
        onClose={() => setTaskToAssign(null)} 
        onAssign={handleAssignment} 
      />
    </div>
  );
}

// --- Layout Components ---

function LoadingScreen() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-slate-950">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-indigo-600 font-black animate-pulse uppercase tracking-[0.3em] text-[10px]">Cargando Sistema</p>
      </div>
    </div>
  );
}

function Sidebar({ currentView, setCurrentView, isSidebarOpen, setIsSidebarOpen, isManager }) {
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Inicio' },
    { id: 'tasks', icon: ListChecks, label: 'Operación' },
    { id: 'schedule', icon: Calendar, label: 'Turnos' },
    { id: 'temperature', icon: Thermometer, label: 'Temp Logs' },
    { id: 'labeling', icon: Tags, label: 'Etiquetado' },
    { id: 'employees', icon: Users, label: 'Directorio' },
  ];

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setIsSidebarOpen(false)}></div>
      <aside className={`bg-white dark:bg-slate-900 w-72 fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 z-40 flex flex-col border-r dark:border-slate-800 shadow-xl lg:shadow-none`}>
        <div className="p-8 flex items-center space-x-4">
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg"><Briefcase size={28} /></div>
          <span className="text-2xl font-black tracking-tighter">OpsFlow</span>
        </div>
        <nav className="flex-1 px-6 space-y-2 mt-4">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setCurrentView(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center p-4 rounded-[1.5rem] transition-all duration-200 ${currentView === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <item.icon size={22} className="mr-3" />
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          ))}
          
          {isManager && (
            <div className="pt-6 mt-6 border-t dark:border-slate-800">
              <p className="px-4 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Control</p>
              <button onClick={() => { setCurrentView('admin'); setIsSidebarOpen(false); }} className={`w-full flex items-center p-4 rounded-[1.5rem] transition-all ${currentView === 'admin' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <ShieldCheck size={22} className="mr-3" />
                <span className="font-bold text-sm">Administración</span>
              </button>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}

function Header({ setIsSidebarOpen, userId, onSimulate }) {
  return (
    <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-slate-800 flex items-center justify-between px-8 shrink-0 z-20">
      <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 hover:bg-slate-100 rounded-2xl"><Menu size={24} /></button>
      <div className="flex items-center space-x-6 ml-auto">
        <button onClick={onSimulate} className="hidden md:flex items-center px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200/50">
             <Play size={14} className="mr-2 fill-current"/> Generar Tareas Hoy
        </button>
        <div className="text-right hidden sm:block leading-tight">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-0.5">Estado Global</p>
          <p className="text-xs text-slate-400 font-bold font-mono">{userId?.substring(0, 16)}</p>
        </div>
        <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 ring-4 ring-slate-50 dark:ring-slate-900/50"><User size={24} /></div>
      </div>
    </header>
  );
}

function NotificationToasts({ notifications, setNotifications }) {
  const remove = (id) => setNotifications(prev => prev.filter(n => n.id !== id));
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 w-80 space-y-3 pointer-events-none">
      {notifications.map(n => (
        <div key={n.id} className="pointer-events-auto bg-indigo-600 text-white p-4 rounded-2xl shadow-xl flex items-start animate-in slide-in-from-right">
          <Bell size={20} className="mr-3 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm">{n.title}</p>
            <p className="text-xs opacity-90">{n.message}</p>
          </div>
          <button onClick={() => remove(n.id)}><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}

// --- Vista Operativa ---
function OperationTasksView({ tasks, employees, areas, setTaskToAssign }) {
  const [showQuickTask, setShowQuickTask] = useState(false);
  const activeTasks = tasks.filter(t => t.status === 'pending');
  
  const tasksByArea = activeTasks.reduce((acc, t) => {
    const area = t.area || 'General';
    if (!acc[area]) acc[area] = [];
    acc[area].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Operación Diaria</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-3 italic opacity-60">Lista de ejecución activa</p>
        </div>
        <button onClick={() => setShowQuickTask(true)} className="bg-slate-900 text-white px-6 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center hover:scale-105 transition-transform shadow-2xl">
          <PlusCircle size={18} className="mr-2" /> Tarea Express
        </button>
      </div>

      <div className="space-y-12">
        {Object.entries(tasksByArea).length > 0 ? Object.entries(tasksByArea).map(([area, areaTasks]) => (
          <div key={area} className="space-y-6">
            <div className="flex items-center space-x-3 border-b-2 dark:border-slate-800 pb-4">
              <div className="w-4 h-4 bg-indigo-600 rounded-full shadow-lg"></div>
              <h3 className="font-black text-lg uppercase tracking-[0.2em] text-slate-400">{area}</h3>
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-xl">{areaTasks.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {areaTasks.map(task => (
                <div key={task.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all group relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${task.priority === 'High' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{task.role || 'General'}</span>
                    <button onClick={() => setTaskToAssign(task)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-indigo-600 transition-colors">
                      <UserPlus size={18} />
                    </button>
                  </div>
                  <h4 className="font-bold text-xl mb-2 tracking-tight leading-tight uppercase">{task.title}</h4>
                  {task.sourceGroupName && <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest">Grupo: {task.sourceGroupName}</p>}
                  
                  <div className="flex items-center justify-between pt-6 border-t dark:border-slate-800">
                    <div className="flex items-center text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                      <Clock size={16} className="mr-2 text-indigo-500" /> {task.dueTime}
                    </div>
                    <span className="text-xs font-black uppercase tracking-tighter text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-1.5 rounded-2xl truncate max-w-[120px]">
                      {employees.find(e => e.id === task.assignedTo)?.name || 'POR ASIGNAR'}
                    </span>
                  </div>
                  
                  {/* Botón de completar rápido */}
                  <button 
                    onClick={() => updateDoc(doc(db, `artifacts/${appId}/public/data/tasks`, task.id), { status: 'completed' })}
                    className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500 text-white p-3 rounded-xl shadow-lg"
                  >
                    <CheckCircle2 size={20}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="py-40 text-center flex flex-col items-center justify-center space-y-6">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-300">
              <CheckCircle2 size={48} />
            </div>
            <p className="font-black uppercase text-sm tracking-[0.3em] text-slate-400 opacity-30">Nada pendiente hoy</p>
          </div>
        )}
      </div>

      {showQuickTask && <QuickTaskForm onClose={() => setShowQuickTask(false)} areas={areas} />}
    </div>
  );
}

// --- ADMIN PANEL ---

function AdminPanelView({ areas, employees, tasks, masterTasks, taskTemplates, scheduledRoutines, equipment, labelItems }) {
  const [activeTab, setActiveTab] = useState('plantillas');
  
  const sections = [
    { id: 'plantillas', label: 'Plantillas & Programación', icon: Layers },
    { id: 'master', label: 'Librería Tareas', icon: BookOpen },
    { id: 'personal', label: 'Personal', icon: UserPlus },
    { id: 'zonas', label: 'Zonas', icon: LayoutGrid },
    { id: 'frio', label: 'Control Frío', icon: Thermometer },
    { id: 'catalogo', label: 'Catálogo', icon: Tags },
  ];

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-40 animate-in slide-in-from-bottom-8 duration-700">
      <div>
        <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">Maestro</h2>
        <p className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.4em] mt-4 italic opacity-60">Consola Estratégica de Configuración</p>
      </div>

      <div className="flex flex-wrap gap-3 bg-slate-200/40 dark:bg-slate-800/40 p-3 rounded-[3rem] w-fit shadow-inner">
        {sections.map(s => (
          <button 
            key={s.id} 
            onClick={() => setActiveTab(s.id)} 
            className={`px-6 py-4 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest flex items-center transition-all ${activeTab === s.id ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <s.icon size={16} className="mr-2" /> {s.label}
          </button>
        ))}
      </div>

      <div className="mt-12">
        {activeTab === 'personal' && <AdminPersonalSection employees={employees} />}
        {activeTab === 'master' && <AdminMasterTasksSection masterTasks={masterTasks} />}
        {activeTab === 'plantillas' && <AdminTemplatesSection masterTasks={masterTasks} taskTemplates={taskTemplates} scheduledRoutines={scheduledRoutines} areas={areas} />}
        {activeTab === 'zonas' && <AdminAreasSection areas={areas} />}
        {activeTab === 'frio' && <AdminEquipmentSection equipment={equipment} />}
        {activeTab === 'catalogo' && <AdminLabelsSection labelItems={labelItems} />}
      </div>
    </div>
  );
}

// 1. Tareas Maestro (Librería)
function AdminMasterTasksSection({ masterTasks }) {
  const [name, setName] = useState('');
  const add = async () => {
    if (!name) return;
    await addDoc(collection(db, `artifacts/${appId}/public/data/masterTasks`), { name });
    setName('');
  };
  return (
    <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] border-2 dark:border-slate-800 animate-in fade-in">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-10">Librería de Tareas Maestro</h4>
      <div className="flex space-x-4 mb-10">
        <input type="text" placeholder="Ej: Limpieza de Filtros" className="flex-1 p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-600" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={add} className="px-10 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl">Guardar</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {masterTasks.map(t => (
          <div key={t.id} className="bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-[1.5rem] flex items-center justify-between border-2 dark:border-slate-700">
            <span className="font-bold text-sm uppercase">{t.name}</span>
            <button onClick={() => deleteDoc(doc(db, `artifacts/${appId}/public/data/masterTasks`, t.id))} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. Plantillas de Grupo y Programación
function AdminTemplatesSection({ masterTasks, taskTemplates, scheduledRoutines, areas }) {
  const [view, setView] = useState('templates'); // 'templates' or 'schedule'
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [newSchedule, setNewSchedule] = useState({ recurrence: 'daily', time: '09:00', weeklyDays: [] });
  const [templateTasks, setTemplateTasks] = useState([]); // Array of { title, area, role, priority }
  
  // -- Template Creation Logic --
  const addTemplate = async () => {
      if (!newTemplateName) return;
      await addDoc(collection(db, `artifacts/${appId}/public/data/taskTemplates`), {
          name: newTemplateName,
          tasks: templateTasks, // Array of task definitions inside the group
          createdAt: new Date().toISOString()
      });
      setNewTemplateName('');
      setTemplateTasks([]);
  };

  const addTaskToTemplate = (masterTaskName) => {
      setTemplateTasks([...templateTasks, { title: masterTaskName, area: 'General', role: 'General Staff', priority: 'Medium' }]);
  };

  const updateTemplateTask = (index, field, value) => {
      const updated = [...templateTasks];
      updated[index][field] = value;
      setTemplateTasks(updated);
  };
  
  const removeTaskFromTemplate = (index) => {
      const updated = [...templateTasks];
      updated.splice(index, 1);
      setTemplateTasks(updated);
  };

  // -- Scheduling Logic --
  const addSchedule = async () => {
      if (!selectedTemplateId) return;
      await addDoc(collection(db, `artifacts/${appId}/public/data/scheduledRoutines`), {
          templateId: selectedTemplateId,
          recurrence: newSchedule.recurrence,
          time: newSchedule.time,
          weeklyDays: newSchedule.weeklyDays,
          active: true
      });
  };

  const toggleDay = (dayIndex) => {
      const current = newSchedule.weeklyDays || [];
      const updated = current.includes(dayIndex) 
        ? current.filter(d => d !== dayIndex)
        : [...current, dayIndex];
      setNewSchedule({ ...newSchedule, weeklyDays: updated });
  };

  return (
    <div className="space-y-8 animate-in fade-in">
        <div className="flex space-x-2 mb-8 bg-slate-100 dark:bg-slate-900 p-2 rounded-[2rem] w-fit">
            <button onClick={() => setView('templates')} className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${view === 'templates' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>1. Definir Grupos</button>
            <button onClick={() => setView('schedule')} className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${view === 'schedule' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>2. Programar Rutinas</button>
        </div>

        {view === 'templates' && (
            <div className="space-y-8">
                <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] border-2 dark:border-slate-800 shadow-sm">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Nuevo Grupo de Tareas</h4>
                    <input type="text" placeholder="Nombre del Grupo (ej: Cierre Cocina)" className="w-full p-5 mb-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-600" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} />
                    
                    <div className="mb-8 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Seleccionar de Librería:</p>
                        <div className="flex flex-wrap gap-2 mb-8">
                            {masterTasks.length === 0 && <p className="text-sm text-slate-400">No hay tareas maestras. Crea algunas en la pestaña "Librería".</p>}
                            {masterTasks.map(mt => (
                                <button key={mt.id} onClick={() => addTaskToTemplate(mt.name)} className="px-5 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold hover:border-indigo-500 transition-colors uppercase tracking-tight">
                                    + {mt.name}
                                </button>
                            ))}
                        </div>
                        
                        <div className="space-y-3">
                            {templateTasks.map((t, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 dark:border-slate-700">
                                    <span className="font-bold text-sm flex-1 ml-2">{t.title}</span>
                                    <select className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold border-none" value={t.area} onChange={(e) => updateTemplateTask(idx, 'area', e.target.value)}>
                                        <option value="General">General</option>
                                        {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                                    </select>
                                    <select className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold border-none" value={t.role} onChange={(e) => updateTemplateTask(idx, 'role', e.target.value)}>
                                        <option value="General Staff">Staff</option>
                                        <option value="Chef">Chef</option>
                                        <option value="Manager">Manager</option>
                                    </select>
                                    <button onClick={() => removeTaskFromTemplate(idx)} className="text-red-500 p-2 hover:bg-red-50 rounded-xl"><X size={18}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <button onClick={addTemplate} className="w-full h-16 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-transform active:scale-95">Guardar Grupo</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {taskTemplates.map(tpl => (
                        <div key={tpl.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 dark:border-slate-800 flex justify-between items-center group shadow-sm">
                            <div className="flex items-center space-x-6">
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-[1.5rem]"><Layers size={24}/></div>
                                <div>
                                    <h5 className="font-black text-xl tracking-tighter uppercase">{tpl.name}</h5>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{tpl.tasks?.length || 0} tareas</p>
                                </div>
                            </div>
                            <button onClick={() => deleteDoc(doc(db, `artifacts/${appId}/public/data/taskTemplates`, tpl.id))} className="text-red-400 hover:text-red-600 p-4 rounded-2xl hover:bg-red-50 transition-all"><Trash2 size={20}/></button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {view === 'schedule' && (
             <div className="space-y-8">
                 <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] border-2 dark:border-slate-800 shadow-sm">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-10">Programar Ejecución</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <select className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none font-bold" value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)}>
                            <option value="">Seleccionar Grupo...</option>
                            {taskTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <select className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none font-bold uppercase text-xs" value={newSchedule.recurrence} onChange={e => setNewSchedule({...newSchedule, recurrence: e.target.value})}>
                            <option value="daily">Diaria</option>
                            <option value="weekly">Semanal</option>
                        </select>
                        <input type="time" className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-center" value={newSchedule.time} onChange={e => setNewSchedule({...newSchedule, time: e.target.value})} />
                    </div>

                    {newSchedule.recurrence === 'weekly' && (
                        <div className="flex justify-between gap-2 mb-8 bg-slate-50 p-4 rounded-3xl">
                            {['0','1','2','3','4','5','6'].map((d) => (
                                <button 
                                    key={d}
                                    onClick={() => toggleDay(d)}
                                    className={`w-10 h-10 rounded-full font-black text-xs ${newSchedule.weeklyDays.includes(d) ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}
                                >
                                    {['D','L','M','X','J','V','S'][parseInt(d)]}
                                </button>
                            ))}
                        </div>
                    )}

                    <button onClick={addSchedule} className="w-full h-16 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-transform active:scale-95">Activar Programación</button>
                 </div>

                 <div className="space-y-4">
                    {scheduledRoutines.map(r => {
                        const tpl = taskTemplates.find(t => t.id === r.templateId);
                        return (
                            <div key={r.id} className="bg-slate-100 dark:bg-slate-800 p-6 rounded-[2rem] flex justify-between items-center border-2 border-transparent hover:border-indigo-200 transition-all">
                                <div className="flex items-center space-x-4">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <div>
                                        <span className="font-black uppercase tracking-tight block">{tpl?.name || 'Grupo Eliminado'}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {r.recurrence === 'daily' ? 'Todos los días' : 'Semanal'} • {r.time}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => deleteDoc(doc(db, `artifacts/${appId}/public/data/scheduledRoutines`, r.id))} className="text-slate-400 hover:text-red-500 p-3 hover:bg-white rounded-xl transition-all"><X size={20}/></button>
                            </div>
                        );
                    })}
                 </div>
             </div>
        )}
    </div>
  );
}

// --- Other Admin Sections ---
function AdminPersonalSection({ employees }) {
    const [data, setData] = useState({ name: '', email: '', role: 'General Staff' });
    const add = async () => {
      if (!data.name) return;
      await addDoc(collection(db, `artifacts/${appId}/public/data/employees`), { ...data, roles: [data.role], authUid: `USR_${Date.now()}` });
      setData({ name: '', email: '', role: 'General Staff' });
    };
    return (
      <div className="space-y-8 animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] border-2 dark:border-slate-800 shadow-sm">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-10">Contratación de Staff</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <input type="text" placeholder="Nombre completo" className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
            <input type="email" placeholder="Email de contacto" className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
            <div className="flex space-x-4">
              <select className="flex-1 p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none font-black text-[11px] uppercase tracking-widest" value={data.role} onChange={e => setData({...data, role: e.target.value})}>
                <option value="General Staff">Staff</option>
                <option value="Chef">Chef</option>
                <option value="Manager">Manager</option>
              </select>
              <button onClick={add} className="px-8 bg-indigo-600 text-white rounded-3xl font-black shadow-xl"><Plus size={28} /></button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map(emp => (
            <div key={emp.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 dark:border-slate-800 flex justify-between items-center group">
              <div className="flex items-center space-x-5">
                <div className="h-14 w-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-3xl flex items-center justify-center font-black text-2xl uppercase shadow-inner">{emp.name[0]}</div>
                <div>
                  <p className="font-black uppercase text-lg tracking-tighter leading-none">{emp.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{emp.roles?.[0]}</p>
                </div>
              </div>
              <button onClick={() => deleteDoc(doc(db, `artifacts/${appId}/public/data/employees`, emp.id))} className="p-4 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-2xl"><Trash2 size={24}/></button>
            </div>
          ))}
        </div>
      </div>
    );
}

function AdminAreasSection({ areas }) {
    const [name, setName] = useState('');
    const add = async () => {
      if (!name) return;
      await addDoc(collection(db, `artifacts/${appId}/public/data/areas`), { name });
      setName('');
    };
    return (
      <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] border-2 dark:border-slate-800 shadow-sm max-w-2xl animate-in fade-in">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-10 leading-none">División Territorial</h4>
        <div className="flex space-x-4 mb-10">
          <input type="text" placeholder="Nueva Zona" className="flex-1 p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-lg" value={name} onChange={e => setName(e.target.value)} />
          <button onClick={add} className="px-12 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl">Crear</button>
        </div>
        <div className="flex flex-wrap gap-4">
          {areas.map(a => (
            <div key={a.id} className="bg-slate-100/50 dark:bg-slate-800 px-8 py-5 rounded-[2rem] border-2 dark:border-slate-700 flex items-center space-x-4 group shadow-sm transition-all hover:border-indigo-400">
              <span className="font-black text-xs uppercase tracking-widest opacity-80 leading-none">{a.name}</span>
              <button onClick={() => deleteDoc(doc(db, `artifacts/${appId}/public/data/areas`, a.id))} className="text-slate-300 hover:text-red-500 transition-colors leading-none"><X size={16}/></button>
            </div>
          ))}
        </div>
      </div>
    );
}

function AdminEquipmentSection({ equipment }) {
    const [data, setData] = useState({ name: '', min: 34, max: 40 });
    const add = async () => {
      if (!data.name) return;
      await addDoc(collection(db, `artifacts/${appId}/public/data/equipment`), data);
      setData({ name: '', min: 34, max: 40 });
    };
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in">
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-12 rounded-[4rem] border-2 dark:border-slate-800 shadow-sm h-fit">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10 italic">Monitor Frío</h4>
          <div className="space-y-8">
            <input type="text" placeholder="Nombre Equipo" className="w-full p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none font-bold" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest leading-none">Mín °F</span>
                <input type="number" className="w-full p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none font-bold" value={data.min} onChange={e => setData({...data, min: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest leading-none">Máx °F</span>
                <input type="number" className="w-full p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none font-bold" value={data.max} onChange={e => setData({...data, max: parseInt(e.target.value)})} />
              </div>
            </div>
            <button onClick={add} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700">Añadir Sensor</button>
          </div>
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
          {equipment.map(e => (
            <div key={e.id} className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border-2 dark:border-slate-800 flex justify-between items-center group relative overflow-hidden shadow-sm hover:border-blue-400 transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] rotate-12 transition-transform group-hover:scale-125 duration-1000"><Thermometer size={140}/></div>
              <div className="flex items-center space-x-6 relative z-10">
                <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-[1.75rem] flex items-center justify-center shadow-inner"><Thermometer size={32} /></div>
                <div>
                  <p className="font-black text-2xl tracking-tighter uppercase leading-tight">{e.name}</p>
                  <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1">{e.min}°F - {e.max}°F</p>
                </div>
              </div>
              <button onClick={() => deleteDoc(doc(db, `artifacts/${appId}/public/data/equipment`, e.id))} className="p-4 text-slate-200 hover:text-red-500 relative z-10 opacity-0 group-hover:opacity-100 transition-all rounded-2xl"><Trash2 size={26}/></button>
            </div>
          ))}
        </div>
      </div>
    );
}

function AdminLabelsSection({ labelItems }) {
    const [data, setData] = useState({ name: '', shelfLife: 3 });
    const add = async () => {
      if (!data.name) return;
      await addDoc(collection(db, `artifacts/${appId}/public/data/labelItems`), data);
      setData({ name: '', shelfLife: 3 });
    };
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in duration-300">
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-12 rounded-[4rem] border-2 dark:border-slate-800 shadow-sm h-fit">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10 italic">Insumos de Seguridad</h4>
          <div className="space-y-8">
            <input type="text" placeholder="Nombre Insumo" className="w-full p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest leading-none">Días de Vida Útil</span>
              <input type="number" className="w-full p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none font-bold" value={data.shelfLife} onChange={e => setData({...data, shelfLife: parseInt(e.target.value)})} />
            </div>
            <button onClick={add} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl">Añadir al Sistema</button>
          </div>
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {labelItems.map(item => (
            <div key={item.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 dark:border-slate-800 flex justify-between items-center group shadow-sm hover:border-indigo-600 transition-colors">
              <div>
                <p className="font-black text-base tracking-tight uppercase leading-tight">{item.name}</p>
                <p className="text-[10px] font-black uppercase text-indigo-500 tracking-tighter mt-1">{item.shelfLife} DÍAS VIDA</p>
              </div>
              <button onClick={() => deleteDoc(doc(db, `artifacts/${appId}/public/data/labelItems`, item.id))} className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-colors"><X size={20}/></button>
            </div>
          ))}
        </div>
      </div>
    );
}

function DashboardView({ tasks, employees }) {
    const pending = tasks.filter(t => t.status === 'pending');
    return (
      <div className="space-y-12 max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="bg-indigo-600 p-14 rounded-[4rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><ListChecks size={120}/></div>
            <p className="opacity-60 font-black uppercase text-[10px] tracking-[0.4em] mb-6">Tareas Pendientes</p>
            <h3 className="text-8xl font-black tracking-tighter">{pending.length}</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 p-14 rounded-[4rem] border-2 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] transition-transform group-hover:scale-125 duration-700"><Users size={120}/></div>
            <p className="text-slate-300 font-black uppercase text-[10px] tracking-[0.4em] mb-6">Staff</p>
            <h3 className="text-8xl font-black tracking-tighter text-slate-800 dark:text-slate-200">{employees.length}</h3>
          </div>
        </div>
      </div>
    );
}

function TemperatureLogsView({ equipment }) {
    return (
        <div className="max-w-4xl mx-auto py-10">
            <h2 className="text-3xl font-black mb-8">Registro de Temperaturas</h2>
            {equipment.length === 0 ? <p className="text-slate-400">No hay equipos configurados.</p> : (
                <div className="grid gap-4">
                    {equipment.map(e => (
                        <div key={e.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 dark:border-slate-800 flex justify-between items-center">
                            <span className="font-bold text-lg">{e.name}</span>
                            <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full font-bold">{e.min}° - {e.max}°</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function LabelingView({ items, currentEmployee }) {
    const [selectedItem, setSelectedItem] = useState(null);

    const generateLabel = (item) => {
        const now = new Date();
        const expiry = new Date();
        expiry.setDate(now.getDate() + (item.shelfLife || 1));
        const dayConfig = DAY_COLORS[expiry.getDay()];

        setSelectedItem({
          ...item,
          preparedBy: currentEmployee?.name || 'Admin',
          prodDate: now.toLocaleDateString('es-ES'),
          expDate: expiry.toLocaleDateString('es-ES'),
          dayConfig
        });
    };

    return (
        <div className="max-w-6xl mx-auto py-10">
            <h2 className="text-3xl font-black mb-8">Etiquetado</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {items.map(i => (
                    <button key={i.id} onClick={() => generateLabel(i)} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 dark:border-slate-800 hover:border-indigo-500 cursor-pointer transition-colors text-left">
                        <p className="font-black uppercase">{i.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{i.shelfLife} Días</p>
                    </button>
                ))}
            </div>

            {selectedItem && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden">
                        <div className={`${selectedItem.dayConfig.color} ${selectedItem.dayConfig.text} p-8 text-center`}>
                            <h3 className="text-4xl font-black uppercase">{selectedItem.dayConfig.day}</h3>
                        </div>
                        <div className="p-8 text-slate-900 text-center">
                            <h2 className="text-3xl font-black mb-4">{selectedItem.name}</h2>
                            <p>Vence: {selectedItem.expDate}</p>
                            <button onClick={() => setSelectedItem(null)} className="mt-8 w-full py-4 bg-slate-100 rounded-xl font-bold">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function TeamDirectoryView({ employees }) {
    return (
        <div className="max-w-4xl mx-auto py-10">
             <h2 className="text-3xl font-black mb-8">Directorio</h2>
             <div className="space-y-2">
                 {employees.map(e => (
                     <div key={e.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 dark:border-slate-800 flex justify-between">
                         <span className="font-bold">{e.name}</span>
                         <span className="text-slate-400 text-sm">{e.roles[0]}</span>
                     </div>
                 ))}
             </div>
        </div>
    )
}

function QuickTaskForm({ onClose, areas }) {
    const [title, setTitle] = useState('');
    const [area, setArea] = useState(areas[0]?.name || 'General');

    const save = async () => {
        if(!title) return;
        await addDoc(collection(db, `artifacts/${appId}/public/data/tasks`), {
            title, area, priority: 'Medium', dueTime: 'ASAP', status: 'pending', createdAt: new Date().toISOString()
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] w-full max-w-md text-center">
                <h3 className="text-2xl font-black mb-6">Tarea Express</h3>
                <input className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4 font-bold" placeholder="¿Qué pasa?" value={title} onChange={e => setTitle(e.target.value)} />
                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-bold">Cancelar</button>
                    <button onClick={save} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold">Crear</button>
                </div>
            </div>
        </div>
    )
}

function AssignmentModal({ task, employees, onClose, onAssign }) {
    if (!task) return null;
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-[4rem] w-full max-w-sm border-2 dark:border-slate-800 p-14 shadow-3xl text-center">
          <div className="h-24 w-24 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
            <Users size={48} />
          </div>
          <h3 className="text-3xl font-black tracking-tighter mb-4 uppercase leading-none">Delegar</h3>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-12 italic opacity-40 leading-relaxed max-w-[200px] mx-auto">"{task.title}"</p>
          <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {employees.map(emp => (
              <button 
                key={emp.id} 
                onClick={() => onAssign(task.id, emp.id)}
                className="w-full p-7 text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-600 hover:text-white rounded-[2rem] font-black transition-all flex items-center justify-between group shadow-sm active:scale-95"
              >
                <span className="uppercase text-xs tracking-[0.1em]">{emp.name}</span>
                <div className="h-10 w-10 bg-white/20 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><PlusCircle size={22} /></div>
              </button>
            ))}
          </div>
          <button onClick={onClose} className="w-full mt-12 py-2 text-slate-400 font-black uppercase text-[10px] tracking-[0.5em] hover:text-slate-600 transition-colors">Cancelar</button>
        </div>
      </div>
    );
}
```eof