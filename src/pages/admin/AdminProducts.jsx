// src/pages/admin/AdminProducts.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Upload, Loader2, ImagePlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import imageCompression from 'browser-image-compression'


const SIZES   = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const COLORS   = ['Negro', 'Blanco', 'Gris', 'Azul', 'Rojo', 'Verde', 'Amarillo', 'Rosa', 'Beige', 'Café']
const EMPTY_VARIANT = { size: 'M', color: 'Negro', sku: '', stock: 0 }

// ── Subir imagen a Supabase Storage en carpeta de categoría ──────────────────
async function uploadImage(file, categorySlug) {
  // Comprimir antes de subir
  const compressed = await imageCompression(file, {
    maxSizeMB:      0.5,
    maxWidthOrHeight: 1600,
    useWebWorker:   true,
    fileType:       'image/webp',
  })

  const fileName = `${categorySlug}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
  const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, compressed, { cacheControl: '3600', upsert: false })
  if (error) throw error

  const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
  return data.publicUrl
}

// ── Modal de formulario ───────────────────────────────────────────────────────
function ProductModal({ product, categories, onClose }) {
  const qc = useQueryClient()

  const isEdit = !!product

  const [form, setForm] = useState({
    name:             product?.name             ?? '',
    slug:             product?.slug             ?? '',
    description:      product?.description      ?? '',
    price:            product?.price            ?? '',
    compare_at_price: product?.compare_at_price ?? '',
    category_id:      product?.category_id      ?? categories[0]?.id ?? '',
    is_active:        product?.is_active         ?? true,
  })

  const [variants,  setVariants]  = useState(
      product?.product_variants ?? [{ ...EMPTY_VARIANT }]
  )
  const [images,    setImages]    = useState(
      product?.product_images?.map(i => ({ url: i.url, uploading: false })) ?? []
  )
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)

  // Auto-slug desde el nombre
  const handleName = (val) => {
    setForm(f => ({
      ...f,
      name: val,
      slug: val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }))
  }

  // Subir imágenes al seleccionar archivos
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    const cat = categories.find(c => c.id === form.category_id)
    if (!cat) { toast.error('Selecciona una categoría primero'); return }

    setUploading(true)
    try {
      const urls = await Promise.all(files.map(f => uploadImage(f, cat.slug)))
      setImages(prev => [...prev, ...urls.map(url => ({ url, uploading: false }))])
      toast.success(`${urls.length} imagen(es) subida(s) a /${cat.slug}`)
    } catch (err) {
      toast.error('Error al subir imagen: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (idx) =>
      setImages(prev => prev.filter((_, i) => i !== idx))

  // Variantes
  const addVariant = () =>
      setVariants(v => [...v, { ...EMPTY_VARIANT }])

  const updateVariant = (idx, key, val) =>
      setVariants(v => v.map((row, i) => i === idx ? { ...row, [key]: val } : row))

  const removeVariant = (idx) =>
      setVariants(v => v.filter((_, i) => i !== idx))

  // Guardar
  const save = async () => {
    if (!form.name || !form.price || !form.category_id) {
      toast.error('Nombre, precio y categoría son obligatorios')
      return
    }
    setSaving(true)
    try {
      let productId = product?.id

      if (isEdit) {
        const { error } = await supabase
            .from('products')
            .update({ ...form, price: Number(form.price), compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null })
            .eq('id', productId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
            .from('products')
            .insert({ ...form, price: Number(form.price), compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null })
            .select()
            .single()
        if (error) throw error
        productId = data.id
      }

      // Imágenes — borrar las anteriores y reinsertar
      await supabase.from('product_images').delete().eq('product_id', productId)
      if (images.length > 0) {
        await supabase.from('product_images').insert(
            images.map((img, i) => ({
              product_id: productId,
              url:        img.url,
              position:   i,
              is_primary: i === 0,
            }))
        )
      }

      // Variantes — borrar las anteriores y reinsertar
      await supabase.from('product_variants').delete().eq('product_id', productId)
      if (variants.length > 0) {
        await supabase.from('product_variants').insert(
            variants.map(v => ({ ...v, product_id: productId, stock: Number(v.stock) }))
        )
      }

      toast.success(isEdit ? 'Producto actualizado ✓' : 'Producto creado ✓')
      qc.invalidateQueries(['admin-products'])
      qc.invalidateQueries(['featured-products'])
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedCat = categories.find(c => c.id === form.category_id)

  return (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 animate-slide-up">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-display text-xl font-bold text-gray-900">
              {isEdit ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6">

            {/* Info básica */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                    className="input"
                    value={form.name}
                    onChange={e => handleName(e.target.value)}
                    placeholder="Camiseta básica negra"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                <input
                    className="input bg-gray-50 text-gray-500"
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                <input
                    type="number" min="0" step="0.01"
                    className="input"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="29.99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio anterior (tachado)</label>
                <input
                    type="number" min="0" step="0.01"
                    className="input"
                    value={form.compare_at_price}
                    onChange={e => setForm(f => ({ ...f, compare_at_price: e.target.value }))}
                    placeholder="39.99"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select
                    className="input"
                    value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                >
                  {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                    rows={3}
                    className="input resize-none"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Descripción del producto..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 accent-brand-400"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Producto activo (visible en tienda)</label>
              </div>
            </div>

            {/* Imágenes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Imágenes
                  {selectedCat && (
                      <span className="ml-2 text-xs text-brand-400 font-normal">
                    → se subirán a /{selectedCat.slug}/
                  </span>
                  )}
                </label>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                          <span className="absolute top-1 left-1 bg-brand-400 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      Principal
                    </span>
                      )}
                      <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                ))}

                {/* Botón subir */}
                <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    uploading ? 'border-brand-300 bg-brand-50' : 'border-gray-200 hover:border-brand-400 hover:bg-brand-50'
                }`}>
                  {uploading
                      ? <Loader2 size={20} className="text-brand-400 animate-spin" />
                      : <>
                        <ImagePlus size={20} className="text-gray-400" />
                        <span className="text-[11px] text-gray-400 mt-1">Subir</span>
                      </>
                  }
                  <input
                      type="file" accept="image/*" multiple className="hidden"
                      onChange={handleFiles} disabled={uploading}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-2">La primera imagen es la principal. Puedes subir varias a la vez.</p>
            </div>

            {/* Variantes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Variantes (talla / color / stock)</label>
                <button
                    onClick={addVariant}
                    className="flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-400"
                >
                  <Plus size={14} /> Añadir variante
                </button>
              </div>
              <div className="space-y-2">
                {variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <select
                          className="input col-span-3 py-2 text-sm"
                          value={v.size}
                          onChange={e => updateVariant(i, 'size', e.target.value)}
                      >
                        {SIZES.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <select
                          className="input col-span-3 py-2 text-sm"
                          value={v.color}
                          onChange={e => updateVariant(i, 'color', e.target.value)}
                      >
                        {COLORS.map(c => <option key={c}>{c}</option>)}
                      </select>
                      <input
                          className="input col-span-3 py-2 text-sm"
                          placeholder="SKU"
                          value={v.sku}
                          onChange={e => updateVariant(i, 'sku', e.target.value)}
                      />
                      <input
                          type="number" min="0"
                          className="input col-span-2 py-2 text-sm"
                          placeholder="Stock"
                          value={v.stock}
                          onChange={e => updateVariant(i, 'stock', e.target.value)}
                      />
                      <button
                          onClick={() => removeVariant(i)}
                          disabled={variants.length === 1}
                          className="col-span-1 flex justify-center text-gray-300 hover:text-red-400 disabled:opacity-20 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button onClick={onClose} className="btn-outline py-2 text-sm">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary py-2 text-sm flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </div>
      </div>
  )
}

// ── Página principal de productos ─────────────────────────────────────────────
export default function AdminProducts() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)  // null | 'new' | product

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('name')
      return data
    },
  })

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase
          .from('products')
          .select(`
          *,
          categories(name, slug),
          product_images(url, is_primary, position),
          product_variants(id)
        `)
          .order('created_at', { ascending: false })
      return data
    },
  })

  const deleteProduct = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) {
        if (error.code === '23503') {
          throw new Error('No se puede eliminar: este producto tiene pedidos asociados. Desactívalo en su lugar.')
        }
        throw error
      }
    },
    onSuccess: () => {
      toast.success('Producto eliminado')
      qc.invalidateQueries({ queryKey: ['admin-products'] })
    },
    onError: (e) => toast.error(e.message),
  })

  const confirmDelete = (product) => {
    if (window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) {
      deleteProduct.mutate(product.id)
    }
  }

  const mainImage = (p) => p.product_images?.find(i => i.is_primary)?.url
      ?? p.product_images?.[0]?.url

  return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900">Productos</h1>
            <p className="text-gray-400 text-sm mt-1">{products.length} productos en total</p>
          </div>
          <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nuevo producto
          </button>
        </div>

        {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-brand-400" />
            </div>
        ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
              <p className="text-5xl mb-4">📦</p>
              <p className="text-gray-400 mb-4">No hay productos todavía.</p>
              <button onClick={() => setModal('new')} className="btn-primary">
                Crear primer producto
              </button>
            </div>
        ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Producto</th>
                  <th className="text-left px-4 py-4 text-gray-400 font-medium hidden md:table-cell">Categoría</th>
                  <th className="text-left px-4 py-4 text-gray-400 font-medium">Precio</th>
                  <th className="text-left px-4 py-4 text-gray-400 font-medium hidden sm:table-cell">Variantes</th>
                  <th className="text-left px-4 py-4 text-gray-400 font-medium">Estado</th>
                  <th className="px-4 py-4" />
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            {mainImage(p)
                                ? <img src={mainImage(p)} alt={p.name} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                            }
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="badge bg-brand-50 text-brand-500">{p.categories?.name}</span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-gray-900">
                        ${Number(p.price).toFixed(2)}
                        {p.compare_at_price && (
                            <span className="block text-xs text-gray-400 line-through font-normal">
                        ${Number(p.compare_at_price).toFixed(2)}
                      </span>
                        )}
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell text-gray-500">
                        {p.product_variants?.length ?? 0} variante(s)
                      </td>
                      <td className="px-4 py-4">
                    <span className={`badge ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_active ? 'Activo' : 'Oculto'}
                    </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                              onClick={() => setModal(p)}
                              className="p-2 rounded-lg hover:bg-brand-50 hover:text-brand-400 transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                              onClick={() => confirmDelete(p)}
                              className="p-2 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        )}

        {/* Modal */}
        {modal && (
            <ProductModal
                product={modal === 'new' ? null : modal}
                categories={categories}
                onClose={() => setModal(null)}
            />
        )}
      </div>
  )
}