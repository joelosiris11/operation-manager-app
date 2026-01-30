import React, { useState } from 'react';
import { MapPin, Plus, AlertTriangle, Trash2, Edit2, Thermometer, Package, Factory, Sparkles } from 'lucide-react';
import { Card, Button, Input, Select, Modal, Badge, EmptyState, SectionHeader, Toggle } from '../../components/ui';
import { useZones } from '../../hooks/useFirestore';
import { ZONE_TYPES } from '../../lib/constants';

export default function ZonesModule() {
  const { data: zones, loading, add, update, remove } = useZones();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);

  const handleSave = async (zoneData) => {
    if (editingZone) {
      await update(editingZone.id, zoneData);
    } else {
      await add(zoneData);
    }
    setModalOpen(false);
    setEditingZone(null);
  };

  const handleEdit = (zone) => {
    setEditingZone(zone);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta zona? Las tareas y rutinas asociadas quedarán huérfanas.')) {
      await remove(id);
    }
  };

  const getZoneIcon = (type) => {
    switch (type) {
      case 'cold': return Thermometer;
      case 'storage': return Package;
      case 'production': return Factory;
      case 'cleaning': return Sparkles;
      default: return MapPin;
    }
  };

  const criticalZones = zones.filter(z => z.critical);
  const regularZones = zones.filter(z => !z.critical);

  return (
    <div className="space-y-8 animate-in fade-in">
      <SectionHeader
        title="Zonas"
        subtitle="División territorial de operaciones"
        action={
          <Button icon={Plus} onClick={() => { setEditingZone(null); setModalOpen(true); }}>
            Nueva Zona
          </Button>
        }
      />

      {/* Zonas Críticas */}
      {criticalZones.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Zonas Críticas</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criticalZones.map(zone => (
              <ZoneCard
                key={zone.id}
                zone={zone}
                onEdit={() => handleEdit(zone)}
                onDelete={() => handleDelete(zone.id)}
                Icon={getZoneIcon(zone.type)}
                critical
              />
            ))}
          </div>
        </div>
      )}

      {/* Zonas Regulares */}
      <div className="space-y-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zonas Operativas</span>
        {regularZones.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularZones.map(zone => (
              <ZoneCard
                key={zone.id}
                zone={zone}
                onEdit={() => handleEdit(zone)}
                onDelete={() => handleDelete(zone.id)}
                Icon={getZoneIcon(zone.type)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MapPin}
            title="Sin zonas configuradas"
            description="Crea zonas para organizar tus operaciones por área física"
            action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Crear Primera Zona</Button>}
          />
        )}
      </div>

      <ZoneFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingZone(null); }}
        onSave={handleSave}
        zone={editingZone}
      />
    </div>
  );
}

function ZoneCard({ zone, onEdit, onDelete, Icon, critical }) {
  return (
    <Card className={`p-6 group relative overflow-hidden ${critical ? 'border-red-200 dark:border-red-900/50' : ''}`}>
      {critical && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${critical ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'}`}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg uppercase tracking-tight">{zone.name}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              {ZONE_TYPES.find(t => t.id === zone.type)?.label || 'General'}
            </p>
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <Edit2 size={16} className="text-slate-400" />
          </button>
          <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-xl">
            <Trash2 size={16} className="text-red-400" />
          </button>
        </div>
      </div>

      {zone.description && (
        <p className="text-sm text-slate-500 mt-4 line-clamp-2">{zone.description}</p>
      )}

      <div className="flex gap-2 mt-4">
        {critical && <Badge variant="critical">Crítica</Badge>}
        {zone.requiresPhoto && <Badge variant="warning">Requiere Foto</Badge>}
        {zone.requiresTemp && <Badge variant="primary">Control Temp</Badge>}
      </div>
    </Card>
  );
}

function ZoneFormModal({ open, onClose, onSave, zone }) {
  const [form, setForm] = useState({
    name: '',
    type: 'production',
    description: '',
    critical: false,
    requiresPhoto: false,
    requiresTemp: false,
    tempMin: '',
    tempMax: '',
  });

  React.useEffect(() => {
    if (zone) {
      setForm({
        name: zone.name || '',
        type: zone.type || 'production',
        description: zone.description || '',
        critical: zone.critical || false,
        requiresPhoto: zone.requiresPhoto || false,
        requiresTemp: zone.requiresTemp || false,
        tempMin: zone.tempMin || '',
        tempMax: zone.tempMax || '',
      });
    } else {
      setForm({
        name: '',
        type: 'production',
        description: '',
        critical: false,
        requiresPhoto: false,
        requiresTemp: false,
        tempMin: '',
        tempMax: '',
      });
    }
  }, [zone, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <Modal open={open} onClose={onClose} title={zone ? 'Editar Zona' : 'Nueva Zona'} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nombre de la Zona"
          placeholder="Ej: Cocina Principal"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <Select
          label="Tipo de Zona"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          options={ZONE_TYPES.map(t => ({ value: t.id, label: t.label }))}
        />

        <Input
          label="Descripción (opcional)"
          placeholder="Descripción de la zona..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Configuración</p>

          <Toggle
            checked={form.critical}
            onChange={(v) => setForm({ ...form, critical: v })}
            label="Zona Crítica (requiere atención especial)"
          />

          <Toggle
            checked={form.requiresPhoto}
            onChange={(v) => setForm({ ...form, requiresPhoto: v })}
            label="Requiere foto obligatoria"
          />

          <Toggle
            checked={form.requiresTemp}
            onChange={(v) => setForm({ ...form, requiresTemp: v })}
            label="Control de temperatura"
          />

          {form.requiresTemp && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                label="Temp. Mínima (°F)"
                type="number"
                placeholder="32"
                value={form.tempMin}
                onChange={(e) => setForm({ ...form, tempMin: e.target.value })}
              />
              <Input
                label="Temp. Máxima (°F)"
                type="number"
                placeholder="40"
                value={form.tempMax}
                onChange={(e) => setForm({ ...form, tempMax: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            {zone ? 'Guardar Cambios' : 'Crear Zona'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
