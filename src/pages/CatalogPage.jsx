// src/pages/CatalogPage.jsx
import { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X, ChevronDown, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const SORT_OPTIONS = [
    { value: 'newest',     label: 'Más recientes' },
    { value: 'price_asc',  label: 'Precio: menor a mayor' },
    { value: 'price_desc', label: 'Precio: mayor a menor' },
]

// ── Tarjeta de producto ───────────────────────────────────────────────────────
function ProductCard({ product }) {
    const image      = product.product_images?.find(i => i.is_primary)?.url
        ?? product.product_images?.[0]?.url
    const hasDiscount = product.compare_at_price && Number(product.compare_at_price) > Number(product.price)
    const discount    = hasDiscount
        ? Math.round((1 - product.price / product.compare_at_price) * 100)
        : null

    return (
        <Link to={`/producto/${product.slug}`} className="group card block animate-fade-in">
            <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                {image ? (
                    <img
                        src={image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200">
                        👗
                    </div>
                )}
                {discount && (
                    <span className="absolute top-3 left-3 badge bg-brand-400 text-white font-semibold">
            -{discount}%
          </span>
                )}
                {!product.product_variants?.some(v => v.stock > 0) && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <span className="badge bg-gray-800 text-white text-xs">Agotado</span>
                    </div>
                )}
            </div>
            <div className="p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    {product.categories?.name}
                </p>
                <h3 className="font-display font-semibold text-gray-900 group-hover:text-brand-500 transition-colors line-clamp-1">
                    {product.name}
                </h3>
                {/* Tallas disponibles */}
                <div className="flex gap-1 mt-2 flex-wrap">
                    {[...new Set(product.product_variants?.filter(v => v.stock > 0).map(v => v.size))]
                        .slice(0, 4)
                        .map(size => (
                            <span key={size} className="text-[10px] border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                {size}
              </span>
                        ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
          <span className="font-display font-bold text-brand-500 text-lg">
            ${Number(product.price).toFixed(2)}
          </span>
                    {hasDiscount && (
                        <span className="text-sm text-gray-400 line-through">
              ${Number(product.compare_at_price).toFixed(2)}
            </span>
                    )}
                </div>
            </div>
        </Link>
    )
}

function ProductCardSkeleton() {
    return (
        <div className="card animate-pulse">
            <div className="aspect-[3/4] bg-gray-200" />
            <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-5 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4 mt-3" />
            </div>
        </div>
    )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function CatalogPage() {
    const { category } = useParams()

    const [sort,          setSort]          = useState('newest')
    const [filtersOpen,   setFiltersOpen]   = useState(false)
    const [selectedSizes, setSelectedSizes] = useState([])
    const [priceMax,      setPriceMax]      = useState(500)
    const [sortOpen,      setSortOpen]      = useState(false)

    // Categorías para el sidebar
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('name')
            return data
        },
    })

    // Productos
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['products', category],
        queryFn: async () => {
            let q = supabase
                .from('products')
                .select(`
          *,
          categories(name, slug),
          product_images(url, is_primary, position),
          product_variants(size, color, stock)
        `)
                .eq('is_active', true)

            if (category) {
                const cat = categories.find(c => c.slug === category)
                if (cat) q = q.eq('category_id', cat.id)
            }

            const { data, error } = await q
            if (error) throw error
            return data
        },
        enabled: !category || categories.length > 0,
    })

    // Tallas disponibles en los productos actuales
    const availableSizes = useMemo(() => {
        const sizes = new Set()
        products.forEach(p => p.product_variants?.forEach(v => { if (v.stock > 0) sizes.add(v.size) }))
        return [...sizes].sort()
    }, [products])

    // Filtrar y ordenar en el cliente
    const filtered = useMemo(() => {
        let result = [...products]

        if (selectedSizes.length > 0) {
            result = result.filter(p =>
                p.product_variants?.some(v => selectedSizes.includes(v.size) && v.stock > 0)
            )
        }

        result = result.filter(p => Number(p.price) <= priceMax)

        result.sort((a, b) => {
            if (sort === 'price_asc')  return Number(a.price) - Number(b.price)
            if (sort === 'price_desc') return Number(b.price) - Number(a.price)
            return new Date(b.created_at) - new Date(a.created_at)
        })

        return result
    }, [products, selectedSizes, priceMax, sort])

    const toggleSize = (size) =>
        setSelectedSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        )

    const clearFilters = () => {
        setSelectedSizes([])
        setPriceMax(500)
    }

    const hasFilters = selectedSizes.length > 0 || priceMax < 500
    const currentCat = categories.find(c => c.slug === category)

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link to="/" className="hover:text-brand-500 transition-colors">Inicio</Link>
                <span>/</span>
                <Link to="/catalogo" className="hover:text-brand-500 transition-colors">Catálogo</Link>
                {currentCat && (
                    <>
                        <span>/</span>
                        <span className="text-gray-700">{currentCat.name}</span>
                    </>
                )}
            </div>

            {/* Título */}
            <div className="flex items-end justify-between mb-6">
                <div>
                    <h1 className="font-display text-3xl font-extrabold text-gray-900">
                        {currentCat?.name ?? 'Todo'}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {isLoading ? '...' : `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Ordenar */}
                    <div className="relative">
                        <button
                            onClick={() => setSortOpen(v => !v)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-brand-300 transition-colors"
                        >
                            {SORT_OPTIONS.find(o => o.value === sort)?.label}
                            <ChevronDown size={14} />
                        </button>
                        {sortOpen && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20 animate-slide-up">
                                {SORT_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setSort(opt.value); setSortOpen(false) }}
                                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                            sort === opt.value
                                                ? 'bg-brand-50 text-brand-500 font-medium'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Filtros móvil */}
                    <button
                        onClick={() => setFiltersOpen(true)}
                        className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-brand-300 transition-colors"
                    >
                        <SlidersHorizontal size={14} />
                        Filtros
                        {hasFilters && (
                            <span className="w-2 h-2 bg-brand-400 rounded-full" />
                        )}
                    </button>
                </div>
            </div>

            <div className="flex gap-8">

                {/* ── Sidebar filtros escritorio ── */}
                <aside className="hidden lg:block w-56 flex-shrink-0">
                    <FiltersPanel
                        categories={categories}
                        currentCategory={category}
                        availableSizes={availableSizes}
                        selectedSizes={selectedSizes}
                        onToggleSize={toggleSize}
                        priceMax={priceMax}
                        onPriceMax={setPriceMax}
                        hasFilters={hasFilters}
                        onClear={clearFilters}
                    />
                </aside>

                {/* ── Grid de productos ── */}
                <div className="flex-1">
                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                            {Array(6).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-5xl mb-4">🔍</p>
                            <p className="text-gray-500 font-display text-lg font-bold">No hay productos</p>
                            <p className="text-gray-400 text-sm mt-1 mb-6">
                                {hasFilters ? 'Prueba con otros filtros' : 'Vuelve pronto, estamos añadiendo productos'}
                            </p>
                            {hasFilters && (
                                <button onClick={clearFilters} className="btn-outline text-sm py-2">
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Filtros móvil (drawer) ── */}
            {filtersOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl animate-slide-up overflow-y-auto">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h2 className="font-display font-bold text-gray-900">Filtros</h2>
                            <button onClick={() => setFiltersOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5">
                            <FiltersPanel
                                categories={categories}
                                currentCategory={category}
                                availableSizes={availableSizes}
                                selectedSizes={selectedSizes}
                                onToggleSize={toggleSize}
                                priceMax={priceMax}
                                onPriceMax={setPriceMax}
                                hasFilters={hasFilters}
                                onClear={clearFilters}
                                onClose={() => setFiltersOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Panel de filtros (reutilizable desktop/móvil) ─────────────────────────────
function FiltersPanel({
                          categories, currentCategory,
                          availableSizes, selectedSizes, onToggleSize,
                          priceMax, onPriceMax,
                          hasFilters, onClear, onClose,
                      }) {
    return (
        <div className="space-y-6">

            {hasFilters && (
                <button
                    onClick={onClear}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium"
                >
                    <X size={12} /> Limpiar filtros
                </button>
            )}

            {/* Categorías */}
            <div>
                <h3 className="font-display font-bold text-gray-900 text-sm mb-3">Categorías</h3>
                <div className="space-y-1">
                    <Link
                        to="/catalogo"
                        onClick={onClose}
                        className={`block px-3 py-2 rounded-xl text-sm transition-colors ${
                            !currentCategory
                                ? 'bg-brand-50 text-brand-500 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        Todas
                    </Link>
                    {categories.map(cat => (
                        <Link
                            key={cat.id}
                            to={`/catalogo/${cat.slug}`}
                            onClick={onClose}
                            className={`block px-3 py-2 rounded-xl text-sm transition-colors ${
                                currentCategory === cat.slug
                                    ? 'bg-brand-50 text-brand-500 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {cat.name}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Tallas */}
            {availableSizes.length > 0 && (
                <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm mb-3">Talla</h3>
                    <div className="flex flex-wrap gap-2">
                        {availableSizes.map(size => (
                            <button
                                key={size}
                                onClick={() => onToggleSize(size)}
                                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                                    selectedSizes.includes(size)
                                        ? 'bg-brand-400 text-white border-brand-400'
                                        : 'border-gray-200 text-gray-600 hover:border-brand-300'
                                }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Precio */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-display font-bold text-gray-900 text-sm">Precio máximo</h3>
                    <span className="text-brand-500 text-sm font-medium">${priceMax}</span>
                </div>
                <input
                    type="range"
                    min="0" max="500" step="10"
                    value={priceMax}
                    onChange={e => onPriceMax(Number(e.target.value))}
                    className="w-full accent-brand-400"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>$0</span>
                    <span>$500</span>
                </div>
            </div>
        </div>
    )
}