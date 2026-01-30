import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit2, MapPin, UserPlus, Shield } from 'lucide-react';
import { Card, Button, Input, Select, Modal, Badge, EmptyState, SectionHeader, Toggle } from '../../components/ui';
import { useGroups, useZones, useUsers } from '../../hooks/useFirestore';
import { USER_ROLES } from '../../lib/constants';

export default function GroupsModule() {
  const { data: groups, loading, add, update, remove } = useGroups();
  const { data: zones } = useZones();
  const { data: users } = useUsers();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const handleSave = async (groupData) => {
    if (editingGroup) {
      await update(editingGroup.id, groupData);
    } else {
      await add(groupData);
    }
    setModalOpen(false);
    setEditingGroup(null);
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este grupo?')) {
      await remove(id);
    }
  };

  const getGroupMembers = (groupId) => {
    return users.filter(u => u.groupIds?.includes(groupId));
  };

  const getGroupZones = (group) => {
    return zones.filter(z => group.zoneIds?.includes(z.id));
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <SectionHeader
        title="Grupos"
        subtitle="Equipos de trabajo organizados"
        action={
          <Button icon={Plus} onClick={() => { setEditingGroup(null); setModalOpen(true); }}>
            Nuevo Grupo
          </Button>
        }
      />

      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              members={getGroupMembers(group.id)}
              zones={getGroupZones(group)}
              onEdit={() => handleEdit(group)}
              onDelete={() => handleDelete(group.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Sin grupos configurados"
          description="Los grupos organizan usuarios y los asocian a zonas de trabajo"
          action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Crear Primer Grupo</Button>}
        />
      )}

      <GroupFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingGroup(null); }}
        onSave={handleSave}
        group={editingGroup}
        zones={zones}
        users={users}
      />
    </div>
  );
}

function GroupCard({ group, members, zones, onEdit, onDelete }) {
  const roleConfig = USER_ROLES.find(r => r.id === group.role) || USER_ROLES[0];

  const roleColors = {
    operator: 'bg-slate-100 text-slate-700',
    supervisor: 'bg-blue-100 text-blue-700',
    manager: 'bg-purple-100 text-purple-700',
    admin: 'bg-red-100 text-red-700',
  };

  return (
    <Card className="p-6 group relative">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
            <Users size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg uppercase tracking-tight">{group.name}</h3>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${roleColors[group.role] || roleColors.operator}`}>
              {roleConfig.label}
            </span>
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

      {group.description && (
        <p className="text-sm text-slate-500 mb-4">{group.description}</p>
      )}

      {/* Zonas asignadas */}
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
          <MapPin size={12} /> Zonas
        </p>
        <div className="flex flex-wrap gap-1">
          {zones.length > 0 ? (
            zones.map(zone => (
              <Badge key={zone.id} variant={zone.critical ? 'danger' : 'default'}>
                {zone.name}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-slate-400">Sin zonas asignadas</span>
          )}
        </div>
      </div>

      {/* Miembros */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
          <UserPlus size={12} /> Miembros ({members.length})
        </p>
        <div className="flex -space-x-2">
          {members.slice(0, 5).map(member => (
            <div
              key={member.id}
              className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold border-2 border-white dark:border-slate-900"
              title={member.name}
            >
              {member.name?.charAt(0).toUpperCase()}
            </div>
          ))}
          {members.length > 5 && (
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold border-2 border-white dark:border-slate-900">
              +{members.length - 5}
            </div>
          )}
          {members.length === 0 && (
            <span className="text-xs text-slate-400">Sin miembros</span>
          )}
        </div>
      </div>
    </Card>
  );
}

function GroupFormModal({ open, onClose, onSave, group, zones, users }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    role: 'operator',
    zoneIds: [],
    userIds: [],
  });

  React.useEffect(() => {
    if (group) {
      setForm({
        name: group.name || '',
        description: group.description || '',
        role: group.role || 'operator',
        zoneIds: group.zoneIds || [],
        userIds: group.userIds || [],
      });
    } else {
      setForm({
        name: '',
        description: '',
        role: 'operator',
        zoneIds: [],
        userIds: [],
      });
    }
  }, [group, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  const toggleZone = (zoneId) => {
    setForm(prev => ({
      ...prev,
      zoneIds: prev.zoneIds.includes(zoneId)
        ? prev.zoneIds.filter(id => id !== zoneId)
        : [...prev.zoneIds, zoneId]
    }));
  };

  const toggleUser = (userId) => {
    setForm(prev => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter(id => id !== userId)
        : [...prev.userIds, userId]
    }));
  };

  return (
    <Modal open={open} onClose={onClose} title={group ? 'Editar Grupo' : 'Nuevo Grupo'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre del Grupo"
            placeholder="Ej: Equipo Cocina AM"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <Select
            label="Rol del Grupo"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={USER_ROLES.map(r => ({ value: r.id, label: r.label }))}
          />
        </div>

        <Input
          label="Descripción (opcional)"
          placeholder="Descripción del equipo..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        {/* Selección de Zonas */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zonas Asignadas</p>
          <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl min-h-[60px]">
            {zones.length > 0 ? zones.map(zone => (
              <button
                key={zone.id}
                type="button"
                onClick={() => toggleZone(zone.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all
                  ${form.zoneIds.includes(zone.id)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50'}`}
              >
                {zone.name}
              </button>
            )) : (
              <span className="text-xs text-slate-400">No hay zonas creadas</span>
            )}
          </div>
        </div>

        {/* Selección de Usuarios */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Miembros del Grupo</p>
          <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl min-h-[60px]">
            {users.length > 0 ? users.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => toggleUser(user.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2
                  ${form.userIds.includes(user.id)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50'}`}
              >
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
                {user.name}
              </button>
            )) : (
              <span className="text-xs text-slate-400">No hay usuarios creados</span>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            {group ? 'Guardar Cambios' : 'Crear Grupo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
