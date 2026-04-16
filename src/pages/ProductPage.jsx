// src/pages/ProductPage.jsx
import { useState, useMemo, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    ShoppingBag, Check, ChevronLeft, ChevronRight,
    Truck, Shield, RotateCcw, BadgeCheck, Minus, Plus, Loader2, Heart
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../store/useCartStore'
import ReviewSection from '../components/product/ReviewSection'

// ── Galería de imágenes ───────────────────────────────────────────────────────
function ImageGallery({ images, productName }) {
    const [active, setActive] = useState(0)

    if (!images?.length) {
        return (
            <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                <span className="text-7xl">📦</span>
            </div>
        )
    }

    const prev = () => setActive(i => (i === 0 ? images.length - 1 : i - 1))
    const next = () => setActive(i => (i === images.length - 1 ? 0 : i + 1))

    return (
        <div className="space-y-3">
            {/* Imagen principal */}
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden group">
                <img
                    src={images[active].url}
                    alt={`${productName} - imagen ${active + 1}`}
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                />
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prev}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                            aria-label="Imagen anterior"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={next}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                            aria-label="Imagen siguiente"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </>
                )}
            </div>

            {/* Miniaturas */}
            {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setActive(i)}
                            className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                                active === i ? 'border-brand-400' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                        >
                            <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Selector de variantes (talla/color) ──────────────────────────────────────
function VariantSelector({ variants, selectedSize, selectedColor, onSelectSize, onSelectColor }) {
    const sizes  = useMemo(() => [...new Set(variants.map(v => v.size).filter(Boolean))],  [variants])
    const colors = useMemo(() => [...new Set(variants.map(v => v.color).filter(Boolean))], [variants])

    // Auto-detectar labels según el contenido
    const sizeLabel = useMemo(() => {
        if (sizes.length === 0) return ''
        // Si todos parecen tallas de ropa
        if (sizes.every(s => ['XS','S','M','L','XL','XXL','2XL','3XL'].includes(s))) return 'Talla'
        // Si tienen unidades de medida
        if (sizes.some(s => /\d+(ml|l|g|kg|oz|cm|mm)/i.test(s))) return 'Presentación'
        return 'Opción'
    }, [sizes])

    const colorLabel = useMemo(() => {
        if (colors.length === 0) return ''
        const commonColors = ['negro','blanco','gris','azul','rojo','verde','amarillo','rosa','beige','café','dorado','plateado']
        if (colors.every(c => commonColors.includes(c.toLowerCase()))) return 'Color'
        if (colors.some(c => /\d+v/i.test(c))) return 'Voltaje'
        return 'Modelo'
    }, [colors])

    const isAvailable = (size, color) =>
        variants.some(v =>
            (!size  || v.size  === size) &&
            (!color || v.color === color) &&
            v.stock > 0
        )

    return (
        <div className="space-y-4">
            {sizes.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        {sizeLabel}: <span className="text-gray-900 font-semibold">{selectedSize ?? '—'}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map(size => {
                            const available = isAvailable(size, selectedColor)
                            return (
                                <button
                                    key={size}
                                    onClick={() => onSelectSize(size)}
                                    disabled={!available}
                                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                                        selectedSize === size
                                            ? 'border-brand-400 bg-brand-50 text-brand-500'
                                            : available
                                                ? 'border-gray-200 text-gray-700 hover:border-brand-300'
                                                : 'border-gray-100 text-gray-300 line-through cursor-not-allowed'
                                    }`}
                                >
                                    {size}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {colors.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        {colorLabel}: <span className="text-gray-900 font-semibold">{selectedColor ?? '—'}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {colors.map(color => {
                            const available = isAvailable(selectedSize, color)
                            return (
                                <button
                                    key={color}
                                    onClick={() => onSelectColor(color)}
                                    disabled={!available}
                                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                                        selectedColor === color
                                            ? 'border-brand-400 bg-brand-50 text-brand-500'
                                            : available
                                                ? 'border-gray-200 text-gray-700 hover:border-brand-300'
                                                : 'border-gray-100 text-gray-300 line-through cursor-not-allowed'
                                    }`}
                                >
                                    {color}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Beneficios ────────────────────────────────────────────────────────────────
const PERKS = [
    { icon: Truck,       text: 'Envío gratis en compras mayores a $50' },
    { icon: BadgeCheck,  text: '6 meses de garantía' },
    { icon: RotateCcw,   text: 'Devoluciones hasta 30 días' },
    { icon: Shield,      text: 'Pago seguro con PayPhone' },
]

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ProductPageSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="aspect-square bg-gray-200 rounded-2xl" />
                <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-8 bg-gray-200 rounded w-3/4" />
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                    <div className="h-20 bg-gray-200 rounded" />
                    <div className="h-12 bg-gray-200 rounded" />
                    <div className="h-12 bg-gray-200 rounded" />
                </div>
            </div>
        </div>
    )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ProductPage() {
    const { slug }  = useParams()
    const navigate  = useNavigate()
    const addItem   = useCartStore(s => s.addItem)

    const [selectedSize,  setSelectedSize]  = useState(null)
    const [selectedColor, setSelectedColor] = useState(null)
    const [quantity,      setQuantity]      = useState(1)
    const [adding,        setAdding]        = useState(false)

    // ── Producto ──
    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', slug],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    categories(id, name, slug),
                    product_images(url, is_primary, position),
                    product_variants(id, size, color, stock, sku)
                `)
                .eq('slug', slug)
                .eq('is_active', true)
                .single()
            if (error) throw error
            return data
        },
    })

    // ── Productos relacionados (misma categoría) ──
    const { data: related = [] } = useQuery({
        queryKey: ['related-products', product?.category_id, product?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('products')
                .select('id, name, slug, price, compare_at_price, product_images(url, is_primary)')
                .eq('category_id', product.category_id)
                .eq('is_active', true)
                .neq('id', product.id)
                .limit(4)
            return data ?? []
        },
        enabled: !!product?.category_id,
    })

    // Preseleccionar primera variante disponible
    useEffect(() => {
        if (!product?.product_variants?.length) return
        const firstAvailable = product.product_variants.find(v => v.stock > 0) ?? product.product_variants[0]
        setSelectedColor(firstAvailable.color ?? null)
        setSelectedSize(firstAvailable.size ?? null)
    }, [product])

    // Imágenes ordenadas (primaria primero, luego por position)
    const sortedImages = useMemo(() => {
        if (!product?.product_images) return []
        return [...product.product_images].sort((a, b) => {
            if (a.is_primary && !b.is_primary) return -1
            if (!a.is_primary && b.is_primary) return 1
            return (a.position ?? 0) - (b.position ?? 0)
        })
    }, [product])

    // Variante seleccionada en base a size + color
    const selectedVariant = useMemo(() => {
        if (!product?.product_variants) return null
        return product.product_variants.find(v =>
            (v.size  ?? null) === (selectedSize  ?? null) &&
            (v.color ?? null) === (selectedColor ?? null)
        )
    }, [product, selectedSize, selectedColor])

    const inStock = selectedVariant && selectedVariant.stock > 0
    const maxQty  = selectedVariant?.stock ?? 0

    // Clamp quantity si cambia la variante
    useEffect(() => {
        if (quantity > maxQty && maxQty > 0) setQuantity(maxQty)
        if (maxQty === 0) setQuantity(1)
    }, [maxQty])

    // ── Agregar al carrito ──
    const handleAddToCart = async () => {
        if (!selectedVariant) {
            toast.error('Selecciona una variante disponible')
            return
        }
        if (selectedVariant.stock < quantity) {
            toast.error(`Solo quedan ${selectedVariant.stock} unidades`)
            return
        }

        setAdding(true)
        addItem({
            variantId:   selectedVariant.id,
            productName: product.name,
            slug:        product.slug,
            image:       sortedImages[0]?.url ?? null,
            price:       Number(product.price),
            size:        selectedVariant.size,
            color:       selectedVariant.color,
            quantity,
        })

        toast.success('Agregado al carrito', {
            icon: '🛍️',
            duration: 2000,
        })
        setTimeout(() => setAdding(false), 600)
    }

    const handleBuyNow = async () => {
        await handleAddToCart()
        setTimeout(() => navigate('/checkout'), 300)
    }

    // ── Renders ──
    if (isLoading) return <ProductPageSkeleton />

    if (error || !product) return (
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
            <p className="text-5xl mb-4">🔍</p>
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h1>
            <p className="text-gray-400 text-sm mb-6">El producto que buscas no existe o ya no está disponible.</p>
            <Link to="/catalogo" className="btn-primary">Volver al catálogo</Link>
        </div>
    )

    const hasDiscount = product.compare_at_price && Number(product.compare_at_price) > Number(product.price)
    const discount    = hasDiscount
        ? Math.round((1 - product.price / product.compare_at_price) * 100)
        : null

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link to="/" className="hover:text-brand-400 transition-colors">Inicio</Link>
                <span>/</span>
                <Link to="/catalogo" className="hover:text-brand-400 transition-colors">Catálogo</Link>
                {product.categories && (
                    <>
                        <span>/</span>
                        <Link to={`/catalogo/${product.categories.slug}`} className="hover:text-brand-400 transition-colors">
                            {product.categories.name}
                        </Link>
                    </>
                )}
                <span>/</span>
                <span className="text-gray-700 line-clamp-1">{product.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* ── Galería ── */}
                <ImageGallery images={sortedImages} productName={product.name} />

                {/* ── Info y acciones ── */}
                <div className="space-y-6">

                    {/* Categoría */}
                    {product.categories && (
                        <Link
                            to={`/catalogo/${product.categories.slug}`}
                            className="text-xs text-accent-400 uppercase tracking-wider font-semibold hover:text-accent-500"
                        >
                            {product.categories.name}
                        </Link>
                    )}

                    {/* Nombre */}
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                        {product.name}
                    </h1>

                    {/* Precio */}
                    <div className="flex items-baseline gap-3">
                        <span className="font-display text-3xl font-extrabold text-brand-400">
                            ${Number(product.price).toFixed(2)}
                        </span>
                        {hasDiscount && (
                            <>
                                <span className="text-lg text-gray-400 line-through">
                                    ${Number(product.compare_at_price).toFixed(2)}
                                </span>
                                <span className="badge bg-accent-400 text-white font-semibold">
                                    -{discount}%
                                </span>
                            </>
                        )}
                    </div>

                    {/* Descripción */}
                    {product.description && (
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                            {product.description}
                        </p>
                    )}

                    {/* Variantes */}
                    {product.product_variants?.length > 0 && (
                        <VariantSelector
                            variants={product.product_variants}
                            selectedSize={selectedSize}
                            selectedColor={selectedColor}
                            onSelectSize={setSelectedSize}
                            onSelectColor={setSelectedColor}
                        />
                    )}

                    {/* Cantidad + stock */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                disabled={quantity <= 1}
                                className="px-3 py-2 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                                aria-label="Disminuir cantidad"
                            >
                                <Minus size={16} />
                            </button>
                            <span className="px-4 py-2 font-semibold text-gray-900 min-w-[3rem] text-center">
                                {quantity}
                            </span>
                            <button
                                onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                                disabled={quantity >= maxQty}
                                className="px-3 py-2 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                                aria-label="Aumentar cantidad"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {selectedVariant && (
                            inStock ? (
                                <span className="text-xs text-gray-500">
                                    {maxQty <= 5
                                        ? <span className="text-accent-500 font-medium">¡Solo {maxQty} disponibles!</span>
                                        : `${maxQty} en stock`
                                    }
                                </span>
                            ) : (
                                <span className="badge bg-gray-200 text-gray-500 text-xs">Agotado</span>
                            )
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            onClick={handleAddToCart}
                            disabled={!inStock || adding}
                            className="btn-outline flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {adding
                                ? <><Check size={18} /> Agregado</>
                                : <><ShoppingBag size={18} /> Agregar al carrito</>
                            }
                        </button>
                        <button
                            onClick={handleBuyNow}
                            disabled={!inStock}
                            className="btn-primary flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Comprar ahora
                        </button>
                    </div>

                    {/* Perks */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                        {PERKS.map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
                                <Icon size={14} className="text-brand-400 flex-shrink-0" />
                                <span>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Relacionados ── */}
            {related.length > 0 && (
                <section className="mt-20 pt-12 border-t border-gray-100">
                    <h2 className="font-display text-2xl font-extrabold text-gray-900 mb-6">
                        También te puede gustar
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {related.map(p => {
                            const img = p.product_images?.find(i => i.is_primary)?.url ?? p.product_images?.[0]?.url
                            const pDiscount = p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
                            return (
                                <Link key={p.id} to={`/producto/${p.slug}`} className="group card block">
                                    <div className="aspect-square bg-gray-100 overflow-hidden rounded-t-2xl">
                                        {img ? (
                                            <img src={img} alt={p.name}
                                                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                 loading="lazy" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200">📦</div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-display font-semibold text-gray-900 group-hover:text-brand-400 transition-colors line-clamp-1 text-sm">
                                            {p.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="font-display font-bold text-brand-400">
                                                ${Number(p.price).toFixed(2)}
                                            </span>
                                            {pDiscount && (
                                                <span className="text-xs text-gray-400 line-through">
                                                    ${Number(p.compare_at_price).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </section>
            )}
            <ReviewSection productId={product.id} />
        </div>
    )
}