// src/pages/ProductPage.jsx
import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    ShoppingBag, ChevronLeft, ChevronRight,
    Truck, RefreshCw, Shield, Loader2, Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../store/useCartStore'

const PERKS = [
    { icon: Truck,     text: 'Envío gratis en compras mayores a $50' },
    { icon: RefreshCw, text: 'Devoluciones hasta 30 días' },
    { icon: Shield,    text: 'Pago 100% seguro' },
]

export default function ProductPage() {
    const { slug }     = useParams()
    const navigate     = useNavigate()
    const addItem      = useCartStore(s => s.addItem)

    const [selectedImage, setSelectedImage] = useState(0)
    const [selectedSize,  setSelectedSize]  = useState(null)
    const [selectedColor, setSelectedColor] = useState(null)
    const [quantity,      setQuantity]      = useState(1)
    const [adding,        setAdding]        = useState(false)

    // ── Cargar producto ──────────────────────────────────────────────────────
    const { data: product, isLoading } = useQuery({
        queryKey: ['product', slug],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select(`
          *,
          categories(name, slug),
          product_images(url, is_primary, position),
          product_variants(id, size, color, sku, stock)
        `)
                .eq('slug', slug)
                .eq('is_active', true)
                .single()
            if (error) throw error
            // Ordenar imágenes por posición
            data.product_images.sort((a, b) => a.position - b.position)
            return data
        },
    })

    // ── Lógica de variantes ──────────────────────────────────────────────────
    const sizes  = useMemo(() => [...new Set(product?.product_variants?.map(v => v.size))].filter(Boolean), [product])
    const colors = useMemo(() => [...new Set(product?.product_variants?.map(v => v.color))].filter(Boolean), [product])

    // Variante que coincide con talla+color seleccionados
    const selectedVariant = useMemo(() => {
        if (!product) return null
        return product.product_variants?.find(v =>
            (!selectedSize  || v.size  === selectedSize) &&
            (!selectedColor || v.color === selectedColor)
        ) ?? null
    }, [product, selectedSize, selectedColor])

    const stockAvailable = selectedVariant ? selectedVariant.stock : 0
    const isOutOfStock   = selectedVariant ? selectedVariant.stock <= 0 : false

    // ¿Está disponible una talla dado el color seleccionado (y viceversa)?
    const isSizeAvailable = (size) =>
        product?.product_variants?.some(v =>
            v.size === size &&
            (!selectedColor || v.color === selectedColor) &&
            v.stock > 0
        )

    const isColorAvailable = (color) =>
        product?.product_variants?.some(v =>
            v.color === color &&
            (!selectedSize || v.size === selectedSize) &&
            v.stock > 0
        )

    // ── Agregar al carrito ───────────────────────────────────────────────────
    const handleAddToCart = async () => {
        if (sizes.length > 0 && !selectedSize) {
            toast.error('Selecciona una talla')
            return
        }
        if (colors.length > 0 && !selectedColor) {
            toast.error('Selecciona un color')
            return
        }
        if (!selectedVariant) {
            toast.error('Selecciona una variante')
            return
        }
        if (isOutOfStock) {
            toast.error('Esta variante está agotada')
            return
        }

        setAdding(true)
        await new Promise(r => setTimeout(r, 400)) // feedback visual

        addItem({
            variantId:   selectedVariant.id,
            productName: product.name,
            size:        selectedVariant.size,
            color:       selectedVariant.color,
            price:       Number(product.price),
            image:       product.product_images?.[0]?.url ?? null,
            slug:        product.slug,
            quantity,
        })

        toast.success('¡Agregado al carrito!')
        setAdding(false)
    }

    // ── Navegación de imágenes ───────────────────────────────────────────────
    const images     = product?.product_images ?? []
    const prevImage  = () => setSelectedImage(i => (i - 1 + images.length) % images.length)
    const nextImage  = () => setSelectedImage(i => (i + 1) % images.length)

    const hasDiscount = product?.compare_at_price &&
        Number(product.compare_at_price) > Number(product.price)
    const discount    = hasDiscount
        ? Math.round((1 - product.price / product.compare_at_price) * 100)
        : null

    // ── Loading ──────────────────────────────────────────────────────────────
    if (isLoading) return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-2xl" />
                <div className="space-y-4 pt-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-8 bg-gray-200 rounded w-3/4" />
                    <div className="h-6 bg-gray-200 rounded w-1/4 mt-4" />
                    <div className="h-20 bg-gray-200 rounded mt-4" />
                    <div className="h-12 bg-gray-200 rounded-full mt-6" />
                </div>
            </div>
        </div>
    )

    if (!product) return (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
            <p className="text-5xl mb-4">🔍</p>
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h1>
            <Link to="/catalogo" className="btn-primary inline-block mt-4">Ver catálogo</Link>
        </div>
    )

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link to="/" className="hover:text-brand-500 transition-colors">Inicio</Link>
                <span>/</span>
                <Link to="/catalogo" className="hover:text-brand-500 transition-colors">Catálogo</Link>
                {product.categories && (
                    <>
                        <span>/</span>
                        <Link
                            to={`/catalogo/${product.categories.slug}`}
                            className="hover:text-brand-500 transition-colors"
                        >
                            {product.categories.name}
                        </Link>
                    </>
                )}
                <span>/</span>
                <span className="text-gray-700 line-clamp-1">{product.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">

                {/* ── Galería de imágenes ── */}
                <div className="space-y-3">
                    {/* Imagen principal */}
                    <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden group">
                        {images.length > 0 ? (
                            <img
                                src={images[selectedImage]?.url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-8xl text-gray-200">
                                👗
                            </div>
                        )}

                        {discount && (
                            <span className="absolute top-4 left-4 badge bg-brand-400 text-white font-semibold text-sm px-3 py-1">
                -{discount}%
              </span>
                        )}

                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Miniaturas */}
                    {images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedImage(i)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                                        selectedImage === i
                                            ? 'border-brand-400'
                                            : 'border-transparent hover:border-gray-300'
                                    }`}
                                >
                                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Info del producto ── */}
                <div className="flex flex-col gap-5">

                    {/* Categoría + nombre */}
                    <div>
                        <Link
                            to={`/catalogo/${product.categories?.slug}`}
                            className="text-sm text-brand-500 font-medium hover:text-brand-600 uppercase tracking-widest"
                        >
                            {product.categories?.name}
                        </Link>
                        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900 mt-1 leading-tight">
                            {product.name}
                        </h1>
                    </div>

                    {/* Precio */}
                    <div className="flex items-center gap-3">
            <span className="font-display text-3xl font-extrabold text-brand-500">
              ${Number(product.price).toFixed(2)}
            </span>
                        {hasDiscount && (
                            <span className="text-xl text-gray-400 line-through">
                ${Number(product.compare_at_price).toFixed(2)}
              </span>
                        )}
                        {hasDiscount && (
                            <span className="badge bg-brand-50 text-brand-600 font-semibold">
                Ahorras ${(Number(product.compare_at_price) - Number(product.price)).toFixed(2)}
              </span>
                        )}
                    </div>

                    {/* Descripción */}
                    {product.description && (
                        <p className="text-gray-500 leading-relaxed text-sm">
                            {product.description}
                        </p>
                    )}

                    {/* Selector de color */}
                    {colors.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-gray-700">
                                    Color {selectedColor && <span className="font-normal text-gray-400">— {selectedColor}</span>}
                                </p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {colors.map(color => {
                                    const available = isColorAvailable(color)
                                    return (
                                        <button
                                            key={color}
                                            onClick={() => available && setSelectedColor(c => c === color ? null : color)}
                                            disabled={!available}
                                            className={`px-4 py-2 rounded-xl border text-sm transition-all ${
                                                selectedColor === color
                                                    ? 'border-brand-400 bg-brand-50 text-brand-600 font-medium'
                                                    : available
                                                        ? 'border-gray-200 text-gray-600 hover:border-brand-300'
                                                        : 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                                            }`}
                                        >
                                            {color}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Selector de talla */}
                    {sizes.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-gray-700">
                                    Talla {selectedSize && <span className="font-normal text-gray-400">— {selectedSize}</span>}
                                </p>
                                <button className="text-xs text-brand-500 hover:text-brand-600 underline">
                                    Guía de tallas
                                </button>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {sizes.map(size => {
                                    const available = isSizeAvailable(size)
                                    return (
                                        <button
                                            key={size}
                                            onClick={() => available && setSelectedSize(s => s === size ? null : size)}
                                            disabled={!available}
                                            className={`w-12 h-12 rounded-xl border text-sm font-medium transition-all ${
                                                selectedSize === size
                                                    ? 'border-brand-400 bg-brand-400 text-white'
                                                    : available
                                                        ? 'border-gray-200 text-gray-700 hover:border-brand-400'
                                                        : 'border-gray-100 text-gray-300 cursor-not-allowed'
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Stock */}
                    {selectedVariant && (
                        <p className={`text-sm flex items-center gap-1.5 ${
                            isOutOfStock ? 'text-red-500' : stockAvailable <= 5 ? 'text-amber-500' : 'text-green-600'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                              isOutOfStock ? 'bg-red-500' : stockAvailable <= 5 ? 'bg-amber-400' : 'bg-green-500'
                          }`} />
                            {isOutOfStock
                                ? 'Agotado'
                                : stockAvailable <= 5
                                    ? `Solo quedan ${stockAvailable} unidades`
                                    : 'En stock'
                            }
                        </p>
                    )}

                    {/* Cantidad + agregar al carrito */}
                    <div className="flex gap-3 mt-2">
                        {/* Cantidad */}
                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                className="w-10 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg"
                            >
                                −
                            </button>
                            <span className="w-10 text-center font-medium text-gray-900">{quantity}</span>
                            <button
                                onClick={() => setQuantity(q => Math.min(stockAvailable || 10, q + 1))}
                                className="w-10 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg"
                            >
                                +
                            </button>
                        </div>

                        {/* Botón agregar */}
                        <button
                            onClick={handleAddToCart}
                            disabled={adding || isOutOfStock}
                            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {adding ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Agregando...
                                </>
                            ) : isOutOfStock ? (
                                'Agotado'
                            ) : (
                                <>
                                    <ShoppingBag size={16} />
                                    Agregar al carrito
                                </>
                            )}
                        </button>
                    </div>

                    {/* Ir al carrito directo */}
                    <button
                        onClick={async () => {
                            await handleAddToCart()
                            navigate('/carrito')
                        }}
                        disabled={adding || isOutOfStock}
                        className="btn-outline w-full text-sm py-2.5"
                    >
                        Comprar ahora
                    </button>

                    {/* Perks */}
                    <div className="border-t border-gray-100 pt-5 space-y-3">
                        {PERKS.map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-3 text-sm text-gray-500">
                                <Icon size={16} className="text-brand-400 flex-shrink-0" />
                                {text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}