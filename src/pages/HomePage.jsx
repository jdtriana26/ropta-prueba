// src/pages/HomePage.jsx
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Truck, RefreshCw, Shield } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
    {
        label: 'Camisetas',
        slug: 'camisetas',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
        color: 'from-green-900/60',
    },
    {
        label: 'Pantalones',
        slug: 'pantalones',
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
        color: 'from-emerald-900/60',
    },
    {
        label: 'Vestidos',
        slug: 'vestidos',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80',
        color: 'from-teal-900/60',
    },
    {
        label: 'Chaquetas',
        slug: 'chaquetas',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
        color: 'from-green-950/60',
    },
]

const PERKS = [
    { icon: Truck,     title: 'Envío gratis',        desc: 'En compras mayores a $50' },
    { icon: RefreshCw, title: 'Devoluciones fáciles', desc: 'Hasta 30 días después' },
    { icon: Shield,    title: 'Pago seguro',          desc: '100% protegido' },
    { icon: Sparkles,  title: 'Calidad garantizada',  desc: 'Productos seleccionados' },
]

function ProductCard({ product }) {
    const image = product.product_images?.[0]?.url
    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price

    return (
        <Link to={`/producto/${product.slug}`} className="group card block">
            <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                {image ? (
                    <img
                        src={image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-gray-300 text-4xl">👗</span>
                    </div>
                )}
                {hasDiscount && (
                    <span className="absolute top-3 left-3 badge bg-brand-400 text-white font-semibold">
            Oferta
          </span>
                )}
            </div>
            <div className="p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    {product.categories?.name}
                </p>
                <h3 className="font-display font-semibold text-gray-900 group-hover:text-brand-500 transition-colors line-clamp-1">
                    {product.name}
                </h3>
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
                <div className="h-5 bg-gray-200 rounded w-1/4" />
            </div>
        </div>
    )
}

export default function HomePage() {
    const { data: products, isLoading } = useQuery({
        queryKey: ['featured-products'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select(`
          *,
          categories(name),
          product_images(url, is_primary, position)
        `)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(8)
            if (error) throw error
            return data
        },
    })

    return (
        <div className="animate-fade-in">

            {/* ── HERO ── */}
            <section className="relative min-h-[85vh] flex items-center overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80"
                    alt="Hero"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/50 to-transparent" />
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-400/20 border border-brand-400/40 rounded-full text-brand-300 text-xs font-medium mb-6 backdrop-blur-sm">
              <Sparkles size={12} /> Nueva colección 2026
            </span>
                        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
                            Tu estilo,<br />
                            <span className="text-brand-400">sin límites.</span>
                        </h1>
                        <p className="mt-6 text-lg text-gray-300 leading-relaxed">
                            Descubre piezas únicas que hablan por ti. Moda auténtica para cada momento de tu vida.
                        </p>
                        <div className="flex flex-wrap gap-4 mt-8">
                            <Link to="/catalogo" className="btn-primary flex items-center gap-2">
                                Ver colección <ArrowRight size={16} />
                            </Link>
                            <Link
                                to="/catalogo"
                                className="border-2 border-white text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-all duration-200"
                            >
                                Novedades
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PERKS ── */}
            <section className="bg-brand-400">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {PERKS.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex items-center gap-3 py-3">
                                <Icon size={20} className="text-white flex-shrink-0" />
                                <div>
                                    <p className="text-white text-sm font-semibold">{title}</p>
                                    <p className="text-brand-100 text-xs">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CATEGORÍAS ── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <p className="text-brand-400 text-sm font-medium uppercase tracking-widest mb-1">Explorar</p>
                        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900">Categorías</h2>
                    </div>
                    <Link to="/catalogo" className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand-500 hover:gap-2 transition-all">
                        Ver todo <ArrowRight size={14} />
                    </Link>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {CATEGORIES.map(cat => (
                        <Link
                            key={cat.slug}
                            to={`/catalogo/${cat.slug}`}
                            className="group relative aspect-[3/4] rounded-2xl overflow-hidden"
                        >
                            <img
                                src={cat.image}
                                alt={cat.label}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} to-transparent`} />
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 className="font-display text-xl font-bold text-white">{cat.label}</h3>
                                <span className="inline-flex items-center gap-1 text-xs text-white/80 mt-1 group-hover:gap-2 transition-all">
                  Ver más <ArrowRight size={10} />
                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── PRODUCTOS DESTACADOS ── */}
            <section className="bg-gray-50 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <p className="text-brand-400 text-sm font-medium uppercase tracking-widest mb-1">Lo más nuevo</p>
                            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900">Últimas llegadas</h2>
                        </div>
                        <Link to="/catalogo" className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand-500 hover:gap-2 transition-all">
                            Ver todo <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {isLoading
                            ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
                            : products?.length > 0
                                ? products.map(p => <ProductCard key={p.id} product={p} />)
                                : (
                                    <div className="col-span-full text-center py-16">
                                        <p className="text-4xl mb-3">👗</p>
                                        <p className="text-gray-400">
                                            Aún no hay productos. ¡Agrega los primeros desde el panel admin!
                                        </p>
                                        <Link to="/admin" className="btn-primary inline-block mt-4">
                                            Ir al admin
                                        </Link>
                                    </div>
                                )
                        }
                    </div>
                </div>
            </section>

            {/* ── BANNER PROMO ── */}
            <section className="relative overflow-hidden bg-gray-900 py-20">
                <img
                    src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1400&q=80"
                    alt="Promo"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-brand-400 text-sm font-medium uppercase tracking-widest mb-3">Oferta especial</p>
                    <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white mb-4">
                        20% OFF en tu primera compra
                    </h2>
                    <p className="text-gray-300 mb-8 max-w-md mx-auto">
                        Regístrate ahora y recibe tu código de descuento directamente en tu correo.
                    </p>
                    <Link to="/registro" className="btn-primary text-base px-8 py-4">
                        Quiero mi descuento
                    </Link>
                </div>
            </section>

        </div>
    )
}