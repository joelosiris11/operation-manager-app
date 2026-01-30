import React from 'react';
import {
  CheckCircle2, Clock, AlertTriangle, Users, MapPin, Calendar,
  FileText, ClipboardList, TrendingUp, Activity
} from 'lucide-react';
import { Card, Badge, StatusIndicator } from '../../components/ui';
import { useZones, useGroups, useUsers, useTemplates, useRoutines, useForms } from '../../hooks/useFirestore';
import { EXECUTION_STATUS } from '../../lib/constants';

export default function Dashboard({ currentUser, onNavigate }) {
  const { data: zones } = useZones();
  const { data: groups } = useGroups();
  const { data: users } = useUsers();
  const { data: templates } = useTemplates();
  const { data: routines } = useRoutines();
  const { data: forms } = useForms();

  // Calcular estadísticas
  const activeRoutines = routines.filter(r => r.active);
  const criticalZones = zones.filter(z => z.critical);

  const today = new Date().toISOString().split('T')[0];
  const todayForms = forms.filter(f => f.createdAt?.startsWith(today));
  const completedToday = todayForms.filter(f => f.status === 'completed');
  const pendingToday = todayForms.filter(f => f.status === 'pending');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Dashboard</h1>
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-3 opacity-60">
          Centro de Control Operativo
        </p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle2}
          value={completedToday.length}
          label="Completadas Hoy"
          color="emerald"
        />
        <StatCard
          icon={Clock}
          value={pendingToday.length}
          label="Pendientes"
          color="yellow"
        />
        <StatCard
          icon={AlertTriangle}
          value={criticalZones.length}
          label="Zonas Críticas"
          color="red"
        />
        <StatCard
          icon={Activity}
          value={activeRoutines.length}
          label="Rutinas Activas"
          color="indigo"
        />
      </div>

      {/* Resumen de configuración */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Zonas */}
        <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate && onNavigate('zones')}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-tight">Zonas</h3>
              <p className="text-2xl font-black">{zones.length}</p>
            </div>
          </div>
          <div className="space-y-2">
            {zones.slice(0, 4).map(zone => (
              <div key={zone.id} className="flex items-center justify-between py-2 border-b dark:border-slate-800 last:border-0">
                <span className="text-sm font-medium">{zone.name}</span>
                {zone.critical && <Badge variant="critical">Crítica</Badge>}
              </div>
            ))}
            {zones.length > 4 && (
              <p className="text-xs text-slate-400 pt-2">+{zones.length - 4} más</p>
            )}
          </div>
        </Card>

        {/* Grupos */}
        <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate && onNavigate('groups')}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-tight">Grupos</h3>
              <p className="text-2xl font-black">{groups.length}</p>
            </div>
          </div>
          <div className="space-y-2">
            {groups.slice(0, 4).map(group => (
              <div key={group.id} className="flex items-center justify-between py-2 border-b dark:border-slate-800 last:border-0">
                <span className="text-sm font-medium">{group.name}</span>
                <Badge variant="default">{users.filter(u => u.groupIds?.includes(group.id)).length} miembros</Badge>
              </div>
            ))}
            {groups.length > 4 && (
              <p className="text-xs text-slate-400 pt-2">+{groups.length - 4} más</p>
            )}
          </div>
        </Card>

        {/* Plantillas */}
        <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate && onNavigate('templates')}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-tight">Plantillas</h3>
              <p className="text-2xl font-black">{templates.length}</p>
            </div>
          </div>
          <div className="space-y-2">
            {templates.slice(0, 4).map(template => {
              const taskCount = template.selectedTasks?.length || 0;
              const totalTime = (template.selectedTasks || []).reduce((sum, t) => sum + (parseInt(t.estimatedMinutes) || 0), 0);
              return (
                <div key={template.id} className="flex items-center justify-between py-2 border-b dark:border-slate-800 last:border-0">
                  <span className="text-sm font-medium">{template.name}</span>
                  <Badge variant="primary">{taskCount} tareas • {totalTime}min</Badge>
                </div>
              );
            })}
            {templates.length > 4 && (
              <p className="text-xs text-slate-400 pt-2">+{templates.length - 4} más</p>
            )}
          </div>
        </Card>
      </div>

      {/* Rutinas activas */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onNavigate && onNavigate('routines')}
          >
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600">
              <Calendar size={20} />
            </div>
            <h3 className="font-bold text-lg uppercase tracking-tight">Rutinas Programadas</h3>
          </div>
          <Badge variant="success">{activeRoutines.length} activas</Badge>
        </div>

        {activeRoutines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRoutines.slice(0, 6).map(routine => {
              // Soportar templateIds (nuevo) y templateId (legacy)
              const routineTemplateIds = routine.templateIds || (routine.templateId ? [routine.templateId] : []);
              const routineTemplates = templates.filter(t => routineTemplateIds.includes(t.id));
              const totalTasks = routineTemplates.reduce((acc, t) => acc + (t.selectedTasks?.length || 0), 0);
              const totalTime = routineTemplates.reduce((acc, t) => {
                return acc + (t.selectedTasks || []).reduce((sum, task) => sum + (parseInt(task.estimatedMinutes) || 0), 0);
              }, 0);

              return (
                <div
                  key={routine.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => onNavigate && onNavigate('routines')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <StatusIndicator status="active" pulse />
                    <span className="font-bold text-sm uppercase tracking-tight">{routine.name}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {routineTemplates.length > 0
                      ? routineTemplates.map(t => t.name).join(', ')
                      : 'Sin plantilla'}
                  </p>
                  {totalTasks > 0 && (
                    <p className="text-[10px] text-indigo-500 font-bold mt-1">
                      {totalTasks} tareas • {totalTime} min
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    {routine.frequency === 'daily' ? 'Diario' : routine.frequency === 'hourly' ? `Cada ${routine.hourInterval}h` : 'Semanal'}
                    {routine.time && ` • ${routine.time}`}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Calendar size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay rutinas activas</p>
          </div>
        )}
      </Card>

      {/* Quick stats del equipo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-black">{users.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Usuarios</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-black">{users.filter(u => u.role === 'operator').length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Operadores</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-black">{users.filter(u => u.role === 'supervisor').length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Supervisores</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-black">{users.filter(u => u.role === 'manager').length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gerentes</p>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color }) {
  const colors = {
    emerald: 'bg-emerald-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    red: 'bg-red-500 text-white',
    indigo: 'bg-indigo-500 text-white',
    slate: 'bg-slate-500 text-white',
  };

  return (
    <Card className={`p-6 ${colors[color]} relative overflow-hidden`}>
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <Icon size={60} />
      </div>
      <p className="text-5xl font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-2">{label}</p>
    </Card>
  );
}
