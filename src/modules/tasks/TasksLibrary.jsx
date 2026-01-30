import React, { useState } from 'react';
import { ClipboardList, Plus, Trash2, Edit2, Tag, Search } from 'lucide-react';
import { Card, Button, Input, Select, Modal, Badge, EmptyState, SectionHeader } from '../../components/ui';
import { useTasks } from '../../hooks/useFirestore';

const TASK_CATEGORIES = [
  { id: 'cleaning', label: 'Limpieza' },
  { id: 'maintenance', label: 'Mantenimiento' },
  { id: 'inspection', label: 'Inspección' },
  { id: 'preparation', label: 'Preparación' },
  { id: 'safety', label: 'Seguridad' },
  { id: 'other', label: 'Otro' },
];

export default function TasksLibrary() {
  const { data: tasks, add, update, remove } = useTasks();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Solo mostrar tareas de la librería (no instancias)
  const libraryTasks = tasks.filter(t => t.isLibraryTask);

  const filteredTasks = libraryTasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSave = async (taskData) => {
    if (editingTask) {
      await update(editingTask.id, taskData);
    } else {
      await add({ ...taskData, isLibraryTask: true });
    }
    setModalOpen(false);
    setEditingTask(null);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta tarea de la librería?')) {
      await remove(id);
    }
  };

  const tasksByCategory = TASK_CATEGORIES.map(cat => ({
    ...cat,
    tasks: filteredTasks.filter(t => t.category === cat.id)
  })).filter(cat => cat.tasks.length > 0);

  return (
    <div className="space-y-8 animate-in fade-in">
      <SectionHeader
        title="Librería de Tareas"
        subtitle="Tareas genéricas reutilizables"
        action={
          <Button icon={Plus} onClick={() => { setEditingTask(null); setModalOpen(true); }}>
            Nueva Tarea
          </Button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar tareas..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          options={[{ value: 'all', label: 'Todas las categorías' }, ...TASK_CATEGORIES.map(c => ({ value: c.id, label: c.label }))]}
          className="min-w-[180px]"
        />
      </div>

      {/* Lista de tareas */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-8">
          {tasksByCategory.map(category => (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {category.label} ({category.tasks.length})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => handleEdit(task)}
                    onDelete={() => handleDelete(task.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={searchTerm ? 'Sin resultados' : 'Librería vacía'}
          description={searchTerm ? 'Intenta con otros términos de búsqueda' : 'Crea tareas genéricas para usar en formularios y rutinas'}
          action={!searchTerm && <Button icon={Plus} onClick={() => setModalOpen(true)}>Crear Primera Tarea</Button>}
        />
      )}

      <TaskFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSave={handleSave}
        task={editingTask}
      />
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete }) {
  const category = TASK_CATEGORIES.find(c => c.id === task.category);

  return (
    <Card className="p-5 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600">
            <ClipboardList size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-tight">{task.name}</h3>
            <Badge variant="default">{category?.label || 'General'}</Badge>
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <Edit2 size={14} className="text-slate-400" />
          </button>
          <button onClick={onDelete} className="p-1.5 hover:bg-red-50 rounded-lg">
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
      )}

      {task.estimatedMinutes && (
        <p className="text-[10px] text-slate-400 mt-2">⏱️ ~{task.estimatedMinutes} min</p>
      )}
    </Card>
  );
}

function TaskFormModal({ open, onClose, onSave, task }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'cleaning',
    estimatedMinutes: '',
    instructions: '',
  });

  React.useEffect(() => {
    if (task) {
      setForm({
        name: task.name || '',
        description: task.description || '',
        category: task.category || 'cleaning',
        estimatedMinutes: task.estimatedMinutes || '',
        instructions: task.instructions || '',
      });
    } else {
      setForm({
        name: '',
        description: '',
        category: 'cleaning',
        estimatedMinutes: '',
        instructions: '',
      });
    }
  }, [task, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Editar Tarea' : 'Nueva Tarea'} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nombre de la Tarea"
          placeholder="Ej: Limpiar piso de cocina"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Categoría"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={TASK_CATEGORIES.map(c => ({ value: c.id, label: c.label }))}
          />
          <Input
            label="Tiempo estimado (min)"
            type="number"
            placeholder="15"
            value={form.estimatedMinutes}
            onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
          />
        </div>

        <Input
          label="Descripción breve"
          placeholder="Descripción de la tarea..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            Instrucciones detalladas (opcional)
          </label>
          <textarea
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent font-medium min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Pasos detallados para realizar la tarea..."
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            {task ? 'Guardar Cambios' : 'Crear Tarea'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
