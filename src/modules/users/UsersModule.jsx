import React, { useState } from 'react';
import { User, Plus, Trash2, Edit2, Mail, Phone, Shield, Users } from 'lucide-react';
import { Card, Button, Input, Select, Modal, Badge, EmptyState, SectionHeader } from '../../components/ui';
import { useUsers, useGroups } from '../../hooks/useFirestore';
import { USER_ROLES } from '../../lib/constants';

export default function UsersModule() {
  const { data: users, loading, add, update, remove } = useUsers();
  const { data: groups } = useGroups();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const handleSave = async (userData) => {
    if (editingUser) {
      await update(editingUser.id, userData);
    } else {
      await add(userData);
    }
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este usuario?')) {
      await remove(id);
    }
  };

  const getUserGroups = (user) => {
    return groups.filter(g => user.groupIds?.includes(g.id));
  };

  // Agrupar usuarios por rol
  const usersByRole = USER_ROLES.map(role => ({
    ...role,
    users: users.filter(u => u.role === role.id)
  })).filter(r => r.users.length > 0);

  return (
    <div className="space-y-8 animate-in fade-in">
      <SectionHeader
        title="Personal"
        subtitle="Directorio de usuarios del sistema"
        action={
          <Button icon={Plus} onClick={() => { setEditingUser(null); setModalOpen(true); }}>
            Nuevo Usuario
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {USER_ROLES.map(role => {
          const count = users.filter(u => u.role === role.id).length;
          return (
            <Card key={role.id} className="p-4 text-center">
              <p className="text-3xl font-black">{count}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{role.label}s</p>
            </Card>
          );
        })}
      </div>

      {users.length > 0 ? (
        <div className="space-y-8">
          {usersByRole.map(roleGroup => (
            <div key={roleGroup.id} className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {roleGroup.label}s ({roleGroup.users.length})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roleGroup.users.map(user => (
                  <UserCard
                    key={user.id}
                    user={user}
                    groups={getUserGroups(user)}
                    onEdit={() => handleEdit(user)}
                    onDelete={() => handleDelete(user.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={User}
          title="Sin usuarios registrados"
          description="Agrega usuarios para asignarles tareas y responsabilidades"
          action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Agregar Primer Usuario</Button>}
        />
      )}

      <UserFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingUser(null); }}
        onSave={handleSave}
        user={editingUser}
        groups={groups}
      />
    </div>
  );
}

function UserCard({ user, groups, onEdit, onDelete }) {
  const roleConfig = USER_ROLES.find(r => r.id === user.role) || USER_ROLES[0];

  const roleColors = {
    operator: 'bg-slate-500',
    supervisor: 'bg-blue-500',
    manager: 'bg-purple-500',
    admin: 'bg-red-500',
  };

  return (
    <Card className="p-5 group relative">
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xl font-black">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${roleColors[user.role]} border-2 border-white dark:border-slate-900`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base uppercase tracking-tight truncate">{user.name}</h3>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onEdit} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <Edit2 size={14} className="text-slate-400" />
              </button>
              <button onClick={onDelete} className="p-1.5 hover:bg-red-50 rounded-lg">
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          </div>

          <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'manager' ? 'primary' : 'default'}>
            {roleConfig.label}
          </Badge>

          {user.email && (
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
              <Mail size={12} />
              <span className="truncate">{user.email}</span>
            </div>
          )}

          {user.phone && (
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
              <Phone size={12} />
              <span>{user.phone}</span>
            </div>
          )}
        </div>
      </div>

      {groups.length > 0 && (
        <div className="mt-4 pt-4 border-t dark:border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
            <Users size={10} /> Grupos
          </p>
          <div className="flex flex-wrap gap-1">
            {groups.map(g => (
              <Badge key={g.id} variant="default">{g.name}</Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function UserFormModal({ open, onClose, onSave, user, groups }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'operator',
    groupIds: [],
    pin: '',
  });

  React.useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'operator',
        groupIds: user.groupIds || [],
        pin: user.pin || '',
      });
    } else {
      setForm({
        name: '',
        email: '',
        phone: '',
        role: 'operator',
        groupIds: [],
        pin: '',
      });
    }
  }, [user, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  const toggleGroup = (groupId) => {
    setForm(prev => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter(id => id !== groupId)
        : [...prev.groupIds, groupId]
    }));
  };

  return (
    <Modal open={open} onClose={onClose} title={user ? 'Editar Usuario' : 'Nuevo Usuario'} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nombre Completo"
          placeholder="Ej: Juan Pérez"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="correo@empresa.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Teléfono"
            type="tel"
            placeholder="+1 234 567 8900"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Rol"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={USER_ROLES.map(r => ({ value: r.id, label: r.label }))}
          />
          <Input
            label="PIN de Acceso"
            type="password"
            placeholder="****"
            maxLength={6}
            value={form.pin}
            onChange={(e) => setForm({ ...form, pin: e.target.value })}
          />
        </div>

        {/* Asignación a Grupos */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grupos Asignados</p>
          <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl min-h-[60px]">
            {groups.length > 0 ? groups.map(group => (
              <button
                key={group.id}
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
                  ${form.groupIds.includes(group.id)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50'}`}
              >
                {group.name}
              </button>
            )) : (
              <span className="text-xs text-slate-400">No hay grupos creados</span>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            {user ? 'Guardar Cambios' : 'Crear Usuario'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
