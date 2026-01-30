import React, { useState } from 'react';
import {
  FileText, Plus, Trash2, Edit2, Copy, GripVertical, ChevronDown, ChevronUp,
  ToggleLeft, Type, Sliders, CheckSquare, Hash, Thermometer, Camera, AlertCircle
} from 'lucide-react';
import { Card, Button, Input, Select, Modal, Badge, EmptyState, SectionHeader, Toggle } from '../../components/ui';
import { useTemplates, useGroups, useZones } from '../../hooks/useFirestore';
import { QUESTION_TYPES } from '../../lib/constants';

export default function TemplatesModule() {
  const { data: templates, add, update, remove } = useTemplates();
  const { data: groups } = useGroups();
  const { data: zones } = useZones();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const handleSave = async (templateData) => {
    if (editingTemplate) {
      await update(editingTemplate.id, templateData);
    } else {
      await add(templateData);
    }
    setEditorOpen(false);
    setEditingTemplate(null);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setEditorOpen(true);
  };

  const handleDuplicate = async (template) => {
    const { id, createdAt, updatedAt, ...rest } = template;
    await add({ ...rest, name: `${template.name} (Copia)` });
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta plantilla? Las rutinas que la usan dejarán de funcionar.')) {
      await remove(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <SectionHeader
        title="Plantillas"
        subtitle="Constructor de formularios reutilizables"
        action={
          <Button icon={Plus} onClick={() => { setEditingTemplate(null); setEditorOpen(true); }}>
            Nueva Plantilla
          </Button>
        }
      />

      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              groups={groups}
              zones={zones}
              onEdit={() => handleEdit(template)}
              onDuplicate={() => handleDuplicate(template)}
              onDelete={() => handleDelete(template.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="Sin plantillas"
          description="Crea plantillas con preguntas para generar formularios de inspección"
          action={<Button icon={Plus} onClick={() => setEditorOpen(true)}>Crear Primera Plantilla</Button>}
        />
      )}

      <TemplateEditor
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingTemplate(null); }}
        onSave={handleSave}
        template={editingTemplate}
        groups={groups}
        zones={zones}
      />
    </div>
  );
}

function TemplateCard({ template, groups, zones, onEdit, onDuplicate, onDelete }) {
  const assignedGroups = groups.filter(g => template.groupIds?.includes(g.id));
  const assignedZones = zones.filter(z => template.zoneIds?.includes(z.id));

  return (
    <Card className="p-6 group relative overflow-hidden">
      {template.requiresValidation && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg uppercase tracking-tight">{template.name}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {template.questions?.length || 0} preguntas
            </p>
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onDuplicate} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl" title="Duplicar">
            <Copy size={16} className="text-slate-400" />
          </button>
          <button onClick={onEdit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <Edit2 size={16} className="text-slate-400" />
          </button>
          <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-xl">
            <Trash2 size={16} className="text-red-400" />
          </button>
        </div>
      </div>

      {template.description && (
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{template.description}</p>
      )}

      {/* Preview de tipos de preguntas */}
      <div className="flex flex-wrap gap-1 mb-4">
        {[...new Set(template.questions?.map(q => q.type) || [])].map(type => {
          const typeConfig = QUESTION_TYPES.find(t => t.id === type);
          return typeConfig && (
            <Badge key={type} variant="default">{typeConfig.label}</Badge>
          );
        })}
      </div>

      {/* Grupos y Zonas */}
      <div className="flex flex-wrap gap-2 pt-4 border-t dark:border-slate-800">
        {assignedGroups.map(g => (
          <Badge key={g.id} variant="primary">{g.name}</Badge>
        ))}
        {assignedZones.map(z => (
          <Badge key={z.id} variant={z.critical ? 'danger' : 'default'}>{z.name}</Badge>
        ))}
      </div>

      {template.requiresValidation && (
        <div className="mt-3 flex items-center gap-2 text-xs text-blue-600">
          <AlertCircle size={14} />
          <span className="font-bold">Requiere validación de supervisor</span>
        </div>
      )}
    </Card>
  );
}

function TemplateEditor({ open, onClose, onSave, template, groups, zones }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    groupIds: [],
    zoneIds: [],
    questions: [],
    requiresValidation: false,
    requiresPhoto: false,
  });

  const [expandedQuestion, setExpandedQuestion] = useState(null);

  React.useEffect(() => {
    if (template) {
      setForm({
        name: template.name || '',
        description: template.description || '',
        groupIds: template.groupIds || [],
        zoneIds: template.zoneIds || [],
        questions: template.questions || [],
        requiresValidation: template.requiresValidation || false,
        requiresPhoto: template.requiresPhoto || false,
      });
    } else {
      setForm({
        name: '',
        description: '',
        groupIds: [],
        zoneIds: [],
        questions: [],
        requiresValidation: false,
        requiresPhoto: false,
      });
    }
    setExpandedQuestion(null);
  }, [template, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.questions.length === 0) return;
    onSave(form);
  };

  const addQuestion = (type) => {
    const newQuestion = {
      id: `q_${Date.now()}`,
      type,
      text: '',
      required: true,
      options: type === 'scale' ? { min: 1, max: 5 } : null,
    };
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setExpandedQuestion(newQuestion.id);
  };

  const updateQuestion = (questionId, updates) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  const removeQuestion = (questionId) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const moveQuestion = (index, direction) => {
    const newQuestions = [...form.questions];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newQuestions.length) return;
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setForm(prev => ({ ...prev, questions: newQuestions }));
  };

  const getQuestionIcon = (type) => {
    const icons = {
      yes_no: ToggleLeft,
      text: Type,
      scale: Sliders,
      checkbox: CheckSquare,
      number: Hash,
      temperature: Thermometer,
      photo: Camera,
    };
    return icons[type] || Type;
  };

  return (
    <Modal open={open} onClose={onClose} title={template ? 'Editar Plantilla' : 'Nueva Plantilla'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre de la Plantilla"
            placeholder="Ej: Inspección de Apertura"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Descripción (opcional)"
            placeholder="Breve descripción..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
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

        {/* Opciones */}
        <div className="flex flex-wrap gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <Toggle
            checked={form.requiresValidation}
            onChange={(v) => setForm({ ...form, requiresValidation: v })}
            label="Requiere validación de supervisor"
          />
          <Toggle
            checked={form.requiresPhoto}
            onChange={(v) => setForm({ ...form, requiresPhoto: v })}
            label="Foto obligatoria al finalizar"
          />
        </div>

        {/* Constructor de preguntas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Preguntas ({form.questions.length})
            </p>
          </div>

          {/* Botones para agregar preguntas */}
          <div className="flex flex-wrap gap-2 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
            <span className="text-xs font-bold text-indigo-600 w-full mb-2">Agregar pregunta:</span>
            {QUESTION_TYPES.map(type => {
              const Icon = getQuestionIcon(type.id);
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => addQuestion(type.id)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors"
                >
                  <Icon size={14} />
                  {type.label}
                </button>
              );
            })}
          </div>

          {/* Lista de preguntas */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {form.questions.map((question, index) => {
              const Icon = getQuestionIcon(question.type);
              const isExpanded = expandedQuestion === question.id;
              const typeConfig = QUESTION_TYPES.find(t => t.id === question.type);

              return (
                <div
                  key={question.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                  >
                    <div className="flex gap-1 text-slate-300">
                      <button type="button" onClick={(e) => { e.stopPropagation(); moveQuestion(index, -1); }} disabled={index === 0}>
                        <ChevronUp size={16} className={index === 0 ? 'opacity-30' : 'hover:text-slate-500'} />
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); moveQuestion(index, 1); }} disabled={index === form.questions.length - 1}>
                        <ChevronDown size={16} className={index === form.questions.length - 1 ? 'opacity-30' : 'hover:text-slate-500'} />
                      </button>
                    </div>

                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">
                      <Icon size={16} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{question.text || 'Sin texto...'}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{typeConfig?.label}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {question.required && <Badge variant="danger">Requerida</Badge>}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeQuestion(question.id); }}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t dark:border-slate-700 space-y-4">
                      <Input
                        label="Texto de la pregunta"
                        placeholder="Ej: ¿El piso está limpio?"
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                      />

                      {question.type === 'scale' && (
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Valor mínimo"
                            type="number"
                            value={question.options?.min || 1}
                            onChange={(e) => updateQuestion(question.id, { options: { ...question.options, min: parseInt(e.target.value) } })}
                          />
                          <Input
                            label="Valor máximo"
                            type="number"
                            value={question.options?.max || 5}
                            onChange={(e) => updateQuestion(question.id, { options: { ...question.options, max: parseInt(e.target.value) } })}
                          />
                        </div>
                      )}

                      {question.type === 'temperature' && (
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Temp. Mínima Aceptable (°F)"
                            type="number"
                            placeholder="32"
                            value={question.options?.minTemp || ''}
                            onChange={(e) => updateQuestion(question.id, { options: { ...question.options, minTemp: e.target.value } })}
                          />
                          <Input
                            label="Temp. Máxima Aceptable (°F)"
                            type="number"
                            placeholder="40"
                            value={question.options?.maxTemp || ''}
                            onChange={(e) => updateQuestion(question.id, { options: { ...question.options, maxTemp: e.target.value } })}
                          />
                        </div>
                      )}

                      <Toggle
                        checked={question.required}
                        onChange={(v) => updateQuestion(question.id, { required: v })}
                        label="Respuesta obligatoria"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {form.questions.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <FileText size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Agrega preguntas usando los botones de arriba</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t dark:border-slate-800">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={form.questions.length === 0}>
            {template ? 'Guardar Cambios' : 'Crear Plantilla'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
