import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Edit2, Clock, Play, Pause, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, Button, Input, Select, Modal, Badge, EmptyState, SectionHeader, Toggle, StatusIndicator } from '../../components/ui';
import { useRoutines, useTemplates, useGroups, useZones } from '../../hooks/useFirestore';
import { ROUTINE_FREQUENCIES } from '../../lib/constants';

const DAYS_OF_WEEK = [
  { id: 0, label: 'Dom', full: 'Domingo' },
  { id: 1, label: 'Lun', full: 'Lunes' },
  { id: 2, label: 'Mar', full: 'Martes' },
  { id: 3, label: 'Mié', full: 'Miércoles' },
  { id: 4, label: 'Jue', full: 'Jueves' },
  { id: 5, label: 'Vie', full: 'Viernes' },
  { id: 6, label: 'Sáb', full: 'Sábado' },
];

export default function RoutinesModule() {
  const { data: routines, add, update, remove } = useRoutines();
  const { data: templates } = useTemplates();
  const { data: groups } = useGroups();
  const { data: zones } = useZones();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);

  const handleSave = async (routineData) => {
    if (editingRoutine) {
      await update(editingRoutine.id, routineData);
    } else {
      await add(routineData);
    }
    setModalOpen(false);
    setEditingRoutine(null);
  };

  const handleEdit = (routine) => {
    setEditingRoutine(routine);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta rutina programada?')) {
      await remove(id);
    }
  };

  const toggleActive = async (routine) => {
    await update(routine.id, { active: !routine.active });
  };

  const activeRoutines = routines.filter(r => r.active);
  const inactiveRoutines = routines.filter(r => !r.active);

  return (
    <div className="space-y-8 animate-in fade-in">
      <SectionHeader
        title="Rutinas"
        subtitle="Programación automática de tareas"
        action={
          <Button icon={Plus} onClick={() => { setEditingRoutine(null); setModalOpen(true); }}>
            Nueva Rutina
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-black text-emerald-600">{activeRoutines.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Activas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-black text-slate-400">{inactiveRoutines.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pausadas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-black">{routines.filter(r => r.frequency === 'daily').length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Diarias</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-black">{routines.filter(r => r.frequency === 'hourly').length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Por Hora</p>
        </Card>
      </div>

      {/* Rutinas Activas */}
      {activeRoutines.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <StatusIndicator status="active" pulse />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
              Rutinas Activas
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRoutines.map(routine => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                template={templates.find(t => t.id === routine.templateId)}
                groups={groups}
                zones={zones}
                onEdit={() => handleEdit(routine)}
                onDelete={() => handleDelete(routine.id)}
                onToggle={() => toggleActive(routine)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rutinas Pausadas */}
      {inactiveRoutines.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <StatusIndicator status="pending" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Rutinas Pausadas
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {inactiveRoutines.map(routine => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                template={templates.find(t => t.id === routine.templateId)}
                groups={groups}
                zones={zones}
                onEdit={() => handleEdit(routine)}
                onDelete={() => handleDelete(routine.id)}
                onToggle={() => toggleActive(routine)}
              />
            ))}
          </div>
        </div>
      )}

      {routines.length === 0 && (
        <EmptyState
          icon={Calendar}
          title="Sin rutinas programadas"
          description="Crea rutinas para automatizar la generación de tareas"
          action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Crear Primera Rutina</Button>}
        />
      )}

      <RoutineFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRoutine(null); }}
        onSave={handleSave}
        routine={editingRoutine}
        templates={templates}
        groups={groups}
        zones={zones}
      />
    </div>
  );
}

function RoutineCard({ routine, template, groups, zones, onEdit, onDelete, onToggle }) {
  const frequency = ROUTINE_FREQUENCIES.find(f => f.id === routine.frequency);
  const assignedGroups = groups.filter(g => routine.groupIds?.includes(g.id));
  const assignedZones = zones.filter(z => routine.zoneIds?.includes(z.id));

  const getScheduleText = () => {
    if (routine.frequency === 'hourly') {
      return `Cada ${routine.hourInterval || 1} hora(s)`;
    }
    if (routine.frequency === 'daily') {
      return `Diario a las ${routine.time || '09:00'}`;
    }
    if (routine.frequency === 'weekly') {
      const days = (routine.weekDays || []).map(d => DAYS_OF_WEEK.find(day => day.id === d)?.label).join(', ');
      return `${days} a las ${routine.time || '09:00'}`;
    }
    return frequency?.label || 'Sin programar';
  };

  return (
    <Card className={`p-6 group relative ${!routine.active ? 'border-dashed' : ''}`}>
      {routine.active && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${routine.active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg uppercase tracking-tight">{routine.name}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {template?.name || 'Sin plantilla'}
            </p>
          </div>
        </div>

        <button
          onClick={onToggle}
          className={`p-2 rounded-xl transition-colors ${routine.active ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
        >
          {routine.active ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>

      {/* Schedule */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <Clock size={14} className="text-indigo-500" />
        <span className="font-medium">{getScheduleText()}</span>
      </div>

      {/* Ventana de ejecución */}
      {routine.windowStart && routine.windowEnd && (
        <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
          <AlertTriangle size={12} />
          <span>Ventana: {routine.windowStart} - {routine.windowEnd}</span>
        </div>
      )}

      {/* Grupos y Zonas */}
      <div className="flex flex-wrap gap-1 pt-4 border-t dark:border-slate-800">
        {assignedGroups.map(g => (
          <Badge key={g.id} variant="primary">{g.name}</Badge>
        ))}
        {assignedZones.map(z => (
          <Badge key={z.id} variant={z.critical ? 'danger' : 'default'}>{z.name}</Badge>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-1 mt-4 pt-4 border-t dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="flex-1 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-500 flex items-center justify-center gap-1">
          <Edit2 size={14} /> Editar
        </button>
        <button onClick={onDelete} className="flex-1 p-2 hover:bg-red-50 rounded-xl text-xs font-bold text-red-400 flex items-center justify-center gap-1">
          <Trash2 size={14} /> Eliminar
        </button>
      </div>
    </Card>
  );
}

function RoutineFormModal({ open, onClose, onSave, routine, templates, groups, zones }) {
  const [form, setForm] = useState({
    name: '',
    templateId: '',
    frequency: 'daily',
    time: '09:00',
    hourInterval: 2,
    weekDays: [],
    monthDay: 1,
    windowStart: '',
    windowEnd: '',
    groupIds: [],
    zoneIds: [],
    active: true,
  });

  React.useEffect(() => {
    if (routine) {
      setForm({
        name: routine.name || '',
        templateId: routine.templateId || '',
        frequency: routine.frequency || 'daily',
        time: routine.time || '09:00',
        hourInterval: routine.hourInterval || 2,
        weekDays: routine.weekDays || [],
        monthDay: routine.monthDay || 1,
        windowStart: routine.windowStart || '',
        windowEnd: routine.windowEnd || '',
        groupIds: routine.groupIds || [],
        zoneIds: routine.zoneIds || [],
        active: routine.active !== false,
      });
    } else {
      setForm({
        name: '',
        templateId: '',
        frequency: 'daily',
        time: '09:00',
        hourInterval: 2,
        weekDays: [],
        monthDay: 1,
        windowStart: '',
        windowEnd: '',
        groupIds: [],
        zoneIds: [],
        active: true,
      });
    }
  }, [routine, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  const toggleWeekDay = (dayId) => {
    setForm(prev => ({
      ...prev,
      weekDays: prev.weekDays.includes(dayId)
        ? prev.weekDays.filter(d => d !== dayId)
        : [...prev.weekDays, dayId]
    }));
  };

  return (
    <Modal open={open} onClose={onClose} title={routine ? 'Editar Rutina' : 'Nueva Rutina'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre de la Rutina"
            placeholder="Ej: Inspección Matutina"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            label="Plantilla Base"
            value={form.templateId}
            onChange={(e) => setForm({ ...form, templateId: e.target.value })}
            options={[
              { value: '', label: 'Seleccionar plantilla...' },
              ...templates.map(t => ({ value: t.id, label: t.name }))
            ]}
          />
        </div>

        {/* Frecuencia */}
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Frecuencia</p>

          <div className="flex flex-wrap gap-2">
            {ROUTINE_FREQUENCIES.map(freq => (
              <button
                key={freq.id}
                type="button"
                onClick={() => setForm({ ...form, frequency: freq.id })}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
                  ${form.frequency === freq.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 hover:bg-indigo-50'}`}
              >
                {freq.label}
              </button>
            ))}
          </div>

          {/* Config por frecuencia */}
          {form.frequency === 'hourly' && (
            <Input
              label="Cada cuántas horas"
              type="number"
              min="1"
              max="12"
              value={form.hourInterval}
              onChange={(e) => setForm({ ...form, hourInterval: parseInt(e.target.value) })}
            />
          )}

          {(form.frequency === 'daily' || form.frequency === 'weekly' || form.frequency === 'monthly') && (
            <Input
              label="Hora de ejecución"
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          )}

          {form.frequency === 'weekly' && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500">Días de la semana</p>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleWeekDay(day.id)}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all
                      ${form.weekDays.includes(day.id) ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 hover:bg-indigo-50'}`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.frequency === 'monthly' && (
            <Input
              label="Día del mes"
              type="number"
              min="1"
              max="31"
              value={form.monthDay}
              onChange={(e) => setForm({ ...form, monthDay: parseInt(e.target.value) })}
            />
          )}
        </div>

        {/* Ventana de ejecución */}
        <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-700">
            Ventana de Ejecución (opcional)
          </p>
          <p className="text-xs text-yellow-600">Define el rango horario aceptable para completar la tarea</p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Desde"
              type="time"
              value={form.windowStart}
              onChange={(e) => setForm({ ...form, windowStart: e.target.value })}
            />
            <Input
              label="Hasta"
              type="time"
              value={form.windowEnd}
              onChange={(e) => setForm({ ...form, windowEnd: e.target.value })}
            />
          </div>
        </div>

        {/* Asignaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grupos</p>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl min-h-[50px]">
              {groups.map(group => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setForm(prev => ({
                    ...prev,
                    groupIds: prev.groupIds.includes(group.id)
                      ? prev.groupIds.filter(id => id !== group.id)
                      : [...prev.groupIds, group.id]
                  }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                    ${form.groupIds.includes(group.id) ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 hover:bg-indigo-50'}`}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zonas</p>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl min-h-[50px]">
              {zones.map(zone => (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setForm(prev => ({
                    ...prev,
                    zoneIds: prev.zoneIds.includes(zone.id)
                      ? prev.zoneIds.filter(id => id !== zone.id)
                      : [...prev.zoneIds, zone.id]
                  }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                    ${form.zoneIds.includes(zone.id) ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-700 hover:bg-emerald-50'}`}
                >
                  {zone.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Toggle
          checked={form.active}
          onChange={(v) => setForm({ ...form, active: v })}
          label="Rutina activa"
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            {routine ? 'Guardar Cambios' : 'Crear Rutina'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
