// src/pages/admin/AdminCategories.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Loader2, FolderOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

function CategoryModal({ category, onClose }) {
  const qc     = useQueryClient()
  const isEdit = !!category

  const [form, setForm] = useState({
    name:      category?.name      ?? '',
    slug:      category?.slug      ?? '',
    is_active: category?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleName = (val) =>
    setForm(f => ({
      ...f,
      name: val,
      slug: val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }))

  const save = async () => {
    if (!form.name || !form.slug) { toast.error('Nombre y slug requeridos'); return }
    setSaving(true)
    try {
      if (isEdit) {
        const { error } = await supabase.from('categories').update(form).eq('id', category.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('categories').insert(form)
        if (error) throw error

        // Crear carpeta en Storage automáticamente (subiendo un archivo placeholder vacío)
        await supabase.storage
          .from('product-images')
          .upload(`${form.slug}/.keep`, new Blob(['']), { upsert: true })
      }
      toast.success(isEdit ? 'Categoría actualizada ✓' : `Categoría creada y carpeta /${form.slug}/ lista ✓`)
      qc.invalidateQueries(['categories'])
      qc.invalidateQueries(['admin-categories'])
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-display text-xl font-bold text-gray-900">
            {isEdit ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              className="input"
              value={form.name}
              onChange={e => handleName(e.target.value)}
              placeholder="Camisetas"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (carpeta en Storage)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/</span>
              <input
                className="input pl-6"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="camisetas"
              />
            </div>
            {!isEdit && (
              <p className="text-xs text-brand-500 mt-1 flex items-center gap-1">
                <FolderOpen size={11} />
                Se creará la carpeta <strong>/{form.slug || 'slug'}/</strong> en Supabase Storage automáticamente.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox" id="cat_active"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 accent-brand-400"
            />
            <label htmlFor="cat_active" className="text-sm text-gray-700">Categoría activa</label>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-outline py-2 text-sm">Cancelar</button>
          <button onClick={save} disabled={saving} className="btn-primary py-2 text-sm flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Guardar' : 'Crear categoría'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCategories() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*, products(id)')
        .order('name')
      return data
    },
  })

  const deleteCategory = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Categoría eliminada')
      qc.invalidateQueries(['admin-categories'])
    },
    onError: (e) => toast.error(e.message),
  })

  const toggleActive = async (cat) => {
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    qc.invalidateQueries(['admin-categories'])
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-gray-900">Categorías</h1>
          <p className="text-gray-400 text-sm mt-1">
            Cada categoría crea automáticamente su carpeta en Supabase Storage
          </p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nueva categoría
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-brand-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-gray-900">{cat.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <FolderOpen size={12} className="text-brand-400" />
                    <span className="text-xs text-gray-400">/{cat.slug}/</span>
                  </div>
                </div>
                <span className={`badge ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {cat.is_active ? 'Activa' : 'Oculta'}
                </span>
              </div>

              <p className="text-sm text-gray-400">
                {cat.products?.length ?? 0} producto(s)
              </p>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => toggleActive(cat)}
                  className="flex-1 text-xs text-center py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-500 transition-colors"
                >
                  {cat.is_active ? 'Ocultar' : 'Activar'}
                </button>
                <button
                  onClick={() => setModal(cat)}
                  className="p-2 rounded-lg hover:bg-brand-50 hover:text-brand-500 transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`¿Eliminar "${cat.name}"?`)) deleteCategory.mutate(cat.id)
                  }}
                  className="p-2 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <CategoryModal
          category={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
