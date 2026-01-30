import React, { useState } from 'react';
import { Package, Plus, Trash2, Edit2, Tag, Printer, Calendar, Thermometer } from 'lucide-react';
import { Card, Button, Input, Select, Modal, Badge, EmptyState, SectionHeader } from '../../components/ui';
import { useProducts, useLabels } from '../../hooks/useFirestore';
import { STORAGE_CONDITIONS, DAY_COLORS } from '../../lib/constants';

export default function ProductsModule() {
  const { data: products, add, update, remove } = useProducts();
  const { data: labels, add: addLabel } = useLabels();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [labelPreview, setLabelPreview] = useState(null);

  const handleSave = async (productData) => {
    if (editingProduct) {
      await update(editingProduct.id, productData);
    } else {
      await add(productData);
    }
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este producto del catálogo?')) {
      await remove(id);
    }
  };

  const generateLabel = async (product) => {
    const now = new Date();
    const expiry = new Date();
    expiry.setDate(now.getDate() + (product.shelfLife || 1));
    const dayConfig = DAY_COLORS[expiry.getDay()];

    const labelData = {
      productId: product.id,
      productName: product.name,
      prepDate: now.toISOString(),
      expiryDate: expiry.toISOString(),
      dayOfWeek: expiry.getDay(),
      lot: `LOT-${Date.now().toString(36).toUpperCase()}`,
      storageCondition: product.storageCondition,
    };

    await addLabel(labelData);

    setLabelPreview({
      ...labelData,
      dayConfig,
      prepDateFormatted: now.toLocaleDateString('es-ES'),
      expiryDateFormatted: expiry.toLocaleDateString('es-ES'),
    });
  };

  // Agrupar por condición de almacenamiento
  const productsByCondition = STORAGE_CONDITIONS.map(cond => ({
    ...cond,
    products: products.filter(p => p.storageCondition === cond.id)
  }));

  return (
    <div className="space-y-8 animate-in fade-in">
      <SectionHeader
        title="Productos"
        subtitle="Catálogo y sistema de etiquetado HACCP"
        action={
          <Button icon={Plus} onClick={() => { setEditingProduct(null); setModalOpen(true); }}>
            Nuevo Producto
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-black">{products.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Productos</p>
        </Card>
        {STORAGE_CONDITIONS.map(cond => (
          <Card key={cond.id} className="p-4 text-center">
            <p className="text-3xl font-black">{products.filter(p => p.storageCondition === cond.id).length}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{cond.label}</p>
          </Card>
        ))}
      </div>

      {/* Lista por categoría */}
      {products.length > 0 ? (
        <div className="space-y-8">
          {productsByCondition.filter(c => c.products.length > 0).map(category => (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center gap-2">
                <Thermometer size={14} className={category.id === 'frozen' ? 'text-blue-500' : category.id === 'refrigerated' ? 'text-cyan-500' : 'text-orange-500'} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {category.label} ({category.minTemp}°F - {category.maxTemp}°F)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={() => handleEdit(product)}
                    onDelete={() => handleDelete(product.id)}
                    onGenerateLabel={() => generateLabel(product)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="Catálogo vacío"
          description="Agrega productos para poder generar etiquetas HACCP"
          action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Agregar Primer Producto</Button>}
        />
      )}

      <ProductFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProduct(null); }}
        onSave={handleSave}
        product={editingProduct}
      />

      <LabelPreviewModal
        label={labelPreview}
        onClose={() => setLabelPreview(null)}
      />
    </div>
  );
}

function ProductCard({ product, onEdit, onDelete, onGenerateLabel }) {
  const condition = STORAGE_CONDITIONS.find(c => c.id === product.storageCondition);

  return (
    <Card className="p-5 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
            <Package size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-tight">{product.name}</h3>
            <div className="flex gap-2 mt-1">
              <Badge variant="primary">{product.shelfLife} días</Badge>
              <Badge variant={product.storageCondition === 'frozen' ? 'primary' : 'default'}>
                {condition?.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {product.description && (
        <p className="text-xs text-slate-500 mb-3">{product.description}</p>
      )}

      <div className="flex gap-2 pt-3 border-t dark:border-slate-800">
        <Button
          size="sm"
          variant="success"
          icon={Tag}
          className="flex-1"
          onClick={onGenerateLabel}
        >
          Etiquetar
        </Button>
        <button onClick={onEdit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
          <Edit2 size={16} className="text-slate-400" />
        </button>
        <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-xl">
          <Trash2 size={16} className="text-red-400" />
        </button>
      </div>
    </Card>
  );
}

function ProductFormModal({ open, onClose, onSave, product }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    shelfLife: 3,
    storageCondition: 'refrigerated',
    category: '',
  });

  React.useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        shelfLife: product.shelfLife || 3,
        storageCondition: product.storageCondition || 'refrigerated',
        category: product.category || '',
      });
    } else {
      setForm({
        name: '',
        description: '',
        shelfLife: 3,
        storageCondition: 'refrigerated',
        category: '',
      });
    }
  }, [product, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <Modal open={open} onClose={onClose} title={product ? 'Editar Producto' : 'Nuevo Producto'} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nombre del Producto"
          placeholder="Ej: Pollo Marinado"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <Input
          label="Descripción (opcional)"
          placeholder="Descripción del producto..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Vida Útil (días)"
            type="number"
            min="1"
            value={form.shelfLife}
            onChange={(e) => setForm({ ...form, shelfLife: parseInt(e.target.value) })}
          />
          <Select
            label="Condición de Almacenamiento"
            value={form.storageCondition}
            onChange={(e) => setForm({ ...form, storageCondition: e.target.value })}
            options={STORAGE_CONDITIONS.map(c => ({ value: c.id, label: `${c.label} (${c.minTemp}°F - ${c.maxTemp}°F)` }))}
          />
        </div>

        <Input
          label="Categoría (opcional)"
          placeholder="Ej: Carnes, Lácteos, Vegetales..."
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            {product ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function LabelPreviewModal({ label, onClose }) {
  if (!label) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal open={!!label} onClose={onClose} title="Etiqueta Generada" size="sm">
      <div className="space-y-6">
        {/* Preview de etiqueta */}
        <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-2xl print:shadow-none">
          <div className={`${label.dayConfig.color} ${label.dayConfig.text} p-6 text-center`}>
            <p className="text-5xl font-black uppercase">{label.dayConfig.day}</p>
          </div>
          <div className="p-6 text-center space-y-3">
            <h2 className="text-2xl font-black uppercase tracking-tight">{label.productName}</h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Preparado</p>
                <p className="font-bold">{label.prepDateFormatted}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Vence</p>
                <p className="font-bold text-red-600">{label.expiryDateFormatted}</p>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-[10px] font-bold uppercase text-slate-400">Lote</p>
              <p className="font-mono font-bold">{label.lot}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
          <Button icon={Printer} className="flex-1" onClick={handlePrint}>
            Imprimir
          </Button>
        </div>
      </div>
    </Modal>
  );
}
