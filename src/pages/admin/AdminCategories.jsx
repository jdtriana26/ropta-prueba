// src/pages/admin/AdminCategories.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Pencil, Trash2, X, Loader2, FolderOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

function CategoryModal({ category, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!category

  const [form, setForm] = useState({
    name:          category?.name          ?? '',
    slug:          category?.slug          ?? '',
    image_url:     category?.image_url     ?? '',
    display_order: category?.display_order ?? 0,
    is_active:     category?.is_active     ?? true,
  })
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleName = (val) =>
      setForm(f => ({
        ...f,
        name: val,
        slug: val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }))

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!form.slug) { toast.error('Define el slug primero'); return }

    setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${form.slug}/_category-${Date.now()}.${ext}`
      const { error } = await supabase.storage
          .from('product-images')
          .upload(path, file, { upsert: true, cacheControl: '3600' })
      if (error) throw error

      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      setForm(f => ({ ...f, image_url: data.publicUrl }))
      toast.success('Imagen subida')
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

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
        await supabase.storage.from('product-images')
            .upload(`${form.slug}/.keep`, new Blob(['']), { upsert: true })
      }
      toast.success(isEdit ? 'Categoría actualizada ✓' : 'Categoría creada ✓')
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['categories-nav'] })
      qc.invalidateQueries({ queryKey: ['admin-categories'] })
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
            <h2 className="font-display text-xl font-bold text-gray-900">
              {isEdit ? 'Editar categoría' : 'Nueva categoría'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input className="input" value={form.name}
                     onChange={e => handleName(e.target.value)} placeholder="Hogar" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/</span>
                <input className="input pl-6" value={form.slug}
                       onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                       placeholder="hogar" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de categoría</label>
              {form.image_url ? (
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-100">
                    <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                    <button
                        onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80"
                    >
                      <X size={14} />
                    </button>
                  </div>
              ) : (
                  <label className="block aspect-video border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-brand-400 transition-colors">
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      {uploading ? <Loader2 size={24} className="animate-spin" /> : <ImagePlus size={24} />}
                      <span className="text-xs mt-2">{uploading ? 'Subiendo...' : 'Subir imagen'}</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
                  </label>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
              <input type="number" className="input" value={form.display_order}
                     onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))} />
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active}
                     onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                     className="w-4 h-4 accent-brand-400" />
              <span className="text-sm text-gray-700">Categoría activa</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
            <button onClick={onClose} className="btn-outline py-2 text-sm">Cancelar</button>
            <button onClick={save} disabled={saving || uploading}
                    className="btn-primary py-2 text-sm flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </div>
      </div>
  )
}