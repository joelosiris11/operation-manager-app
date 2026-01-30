import React, { useState, useEffect } from 'react';
import {
  Home, MapPin, Users, UserCircle, FileText, ClipboardList,
  Calendar, Package, Menu, X, Briefcase, ShieldCheck, Settings,
  Bell, User, ChevronRight, ChevronDown, Database, Download, Upload, Trash2, RefreshCw, LogOut
} from 'lucide-react';
import { USE_LOCAL_DB } from './lib/firebase';
import { useLocalDB, useUsers } from './hooks/useFirestore';
import Login from './components/Login';

// Modules
import Dashboard from './modules/dashboard/Dashboard';
import ZonesModule from './modules/zones/ZonesModule';
import GroupsModule from './modules/groups/GroupsModule';
import UsersModule from './modules/users/UsersModule';
import TemplatesModule from './modules/templates/TemplatesModule';
import TasksLibrary from './modules/tasks/TasksLibrary';
import RoutinesModule from './modules/routines/RoutinesModule';
import ProductsModule from './modules/products/ProductsModule';

const SESSION_KEY = 'opsflow-session';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { data: users } = useUsers();

  // Cargar sesión al iniciar
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        setCurrentUser(user);
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
    setCurrentView('dashboard');
  };

  // Loading inicial
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Si no hay usuario, mostrar login
  if (!currentUser) {
    return <Login users={users} onLogin={handleLogin} />;
  }

  // Verificar permisos para admin
  const canAccessAdmin = ['admin', 'manager'].includes(currentUser.role);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        currentUser={currentUser}
        canAccessAdmin={canAccessAdmin}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setIsSidebarOpen={setIsSidebarOpen} currentUser={currentUser} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentView === 'dashboard' && <Dashboard currentUser={currentUser} />}
          {currentView === 'zones' && canAccessAdmin && <ZonesModule />}
          {currentView === 'groups' && canAccessAdmin && <GroupsModule />}
          {currentView === 'users' && canAccessAdmin && <UsersModule />}
          {currentView === 'templates' && <TemplatesModule />}
          {currentView === 'tasks' && <TasksLibrary />}
          {currentView === 'routines' && <RoutinesModule />}
          {currentView === 'products' && <ProductsModule />}
        </main>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-slate-950">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-indigo-600 font-black animate-pulse uppercase tracking-[0.3em] text-[10px]">
          Cargando Sistema
        </p>
      </div>
    </div>
  );
}

function Sidebar({ currentView, setCurrentView, isSidebarOpen, setIsSidebarOpen, currentUser, canAccessAdmin, onLogout }) {
  const { exportData, clearData, resetToSeed } = useLocalDB();
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);

  const adminSubItems = [
    { id: 'zones', icon: MapPin, label: 'Zonas' },
    { id: 'groups', icon: Users, label: 'Grupos' },
    { id: 'users', icon: UserCircle, label: 'Personal' },
  ];

  const isAdminView = adminSubItems.some(item => item.id === currentView);

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'templates', icon: FileText, label: 'Plantillas' },
    { id: 'tasks', icon: ClipboardList, label: 'Librería Tareas' },
    { id: 'routines', icon: Calendar, label: 'Rutinas' },
    { id: 'products', icon: Package, label: 'Productos' },
  ];

  const roleLabels = {
    admin: 'Administrador',
    manager: 'Gerente',
    supervisor: 'Supervisor',
    operator: 'Operador',
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`
        bg-white dark:bg-slate-900 w-72 fixed inset-y-0 left-0 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 transition-transform duration-300 z-40
        flex flex-col border-r dark:border-slate-800 shadow-xl lg:shadow-none
      `}>
        {/* Logo */}
        <div className="p-6 flex items-center space-x-3 border-b dark:border-slate-800">
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg">
            <Briefcase size={24} />
          </div>
          <div>
            <span className="text-xl font-black tracking-tighter">OpsFlow</span>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sistema Operativo</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {/* Items principales */}
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                setIsSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200
                ${currentView === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 dark:shadow-none'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
              `}
            >
              <item.icon size={20} />
              <span className="font-bold text-sm">{item.label}</span>
              {currentView === item.id && (
                <ChevronRight size={16} className="ml-auto" />
              )}
            </button>
          ))}

          {/* Botón Administración con subitems - Solo visible para admin/manager */}
          {canAccessAdmin && (
            <div className="pt-4">
              <button
                onClick={() => setAdminExpanded(!adminExpanded)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200
                  ${isAdminView
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
                `}
              >
                <Settings size={20} />
                <span className="font-bold text-sm">Administración</span>
                <ChevronDown
                  size={16}
                  className={`ml-auto transition-transform duration-200 ${adminExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Subitems de Administración */}
              <div className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${adminExpanded ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'}
              `}>
                <div className="pl-4 space-y-1">
                  {adminSubItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                        ${currentView === item.id
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 dark:shadow-none'
                          : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
                      `}
                    >
                      <item.icon size={18} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Footer - Database Management */}
        <div className="p-4 border-t dark:border-slate-800 space-y-3">
          {USE_LOCAL_DB && (
            <div className="relative">
              <button
                onClick={() => setShowDataMenu(!showDataMenu)}
                className="w-full flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition-colors"
              >
                <Database size={18} />
                <span className="text-xs font-bold">Base de Datos Local</span>
              </button>

              {showDataMenu && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border dark:border-slate-700 p-2 space-y-1">
                  <button
                    onClick={() => { exportData(); setShowDataMenu(false); }}
                    className="w-full flex items-center gap-2 p-3 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <Download size={14} /> Exportar Datos
                  </button>
                  <button
                    onClick={() => { resetToSeed(); setShowDataMenu(false); }}
                    className="w-full flex items-center gap-2 p-3 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <RefreshCw size={14} /> Restaurar Ejemplo
                  </button>
                  <button
                    onClick={() => { clearData(); setShowDataMenu(false); }}
                    className="w-full flex items-center gap-2 p-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={14} /> Borrar Todo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Usuario actual */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
              {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{currentUser?.name || 'Usuario'}</p>
              <p className="text-[10px] text-slate-400">{roleLabels[currentUser?.role] || currentUser?.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({ setIsSidebarOpen, currentUser, onLogout }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  const roleLabels = {
    admin: 'Administrador',
    manager: 'Gerente',
    supervisor: 'Supervisor',
    operator: 'Operador',
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
      >
        <Menu size={24} />
      </button>

      {/* Reloj y fecha */}
      <div className="hidden md:flex items-center gap-4">
        <div className="text-right">
          <p className="text-2xl font-black tracking-tight">
            {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {currentTime.toLocaleDateString('es-ES', { weekday: 'long' })}
          </p>
          <p className="text-sm font-bold">
            {currentTime.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
          <Bell size={20} className="text-slate-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3 pl-3 border-l dark:border-slate-700">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold">{currentUser?.name || 'Usuario'}</p>
            <p className="text-[10px] text-slate-400">
              {roleLabels[currentUser?.role] || currentUser?.role}
            </p>
          </div>
          <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
