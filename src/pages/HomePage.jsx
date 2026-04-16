// src/pages/HomePage.jsx
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, Shield, RotateCcw, BadgeCheck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
    {
        label: 'Hogar',
        slug:  'hogar',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
        color: 'from-blue-950/65',
        emoji: '🏠',
    },
    {
        label: 'Cuidado Personal',
        slug:  'cuidado-personal',
        image: 'https://images.unsplash.com/photo-1621607512022-6aecc4fed814?w=600&q=80',
        color: 'from-slate-900/65',
        emoji: '✨',
    },
]

const PERKS = [
    { icon: Truck,       title: 'Envío gratis',       desc: 'En compras mayores a $50' },
    { icon: BadgeCheck,  title: '6 meses de garantía', desc: 'En todos los productos' },
    { icon: Shield,      title: 'Pago seguro',         desc: '100% protegido' },
    { icon: RotateCcw,   title: 'Devoluciones fáciles', desc: 'Hasta 30 días después' },
]

function ProductCard({ product }) {
    const image      = product.product_images?.[0]?.url
    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price

    return (
        <Link to={`/producto/${product.slug}`} className="group card block">
            <div className="relative aspect-square bg-gray-100 overflow-hidden rounded-t-2xl">
                {image ? (
                    <img
                        src={image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <span className="text-gray-300 text-5xl">📦</span>
                    </div>
                )}
                {hasDiscount && (
                    <span className="absolute top-3 left-3 badge bg-accent-400 text-white font-semibold">
            Oferta
          </span>
                )}
            </div>
            <div className="p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    {product.categories?.name}
                </p>
                <h3 className="font-display font-semibold text-gray-900 group-hover:text-brand-400 transition-colors line-clamp-1">
                    {product.name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
          <span className="font-display font-bold text-brand-400 text-lg">
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
            <div className="aspect-square bg-gray-200 rounded-t-2xl" />
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
                    src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&q=80"
                    alt="Multi Flash Hero"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-900/85 via-brand-800/60 to-transparent" />
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-highlight-400/20 border border-highlight-400/50 rounded-full text-highlight-400 text-xs font-semibold mb-6 backdrop-blur-sm">
              ⚡ Quito · Guayaquil · El Quinche
            </span>
                        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
                            Todo lo que<br />
                            <span className="text-highlight-400">necesitas,</span><br />
                            al instante.
                        </h1>
                        <p className="mt-6 text-lg text-gray-300 leading-relaxed">
                            Artículos para el hogar y cuidado personal con envío rápido y
                            <span className="text-white font-semibold"> 6 meses de garantía</span> en todos los productos.
                        </p>
                        <div className="flex flex-wrap gap-4 mt-8">
                            <Link to="/catalogo" className="btn-primary flex items-center gap-2">
                                Ver productos <ArrowRight size={16} />
                            </Link>
                            <Link
                                to="/catalogo/hogar"
                                className="border-2 border-white text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-all duration-200"
                            >
                                Explorar hogar
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
                                <Icon size={20} className="text-highlight-400 flex-shrink-0" />
                                <div>
                                    <p className="text-white text-sm font-semibold">{title}</p>
                                    <p className="text-blue-200 text-xs">{desc}</p>
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
                        <p className="text-accent-400 text-sm font-semibold uppercase tracking-widest mb-1">Explorar</p>
                        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900">Categorías</h2>
                    </div>
                    <Link to="/catalogo" className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand-400 hover:gap-2 transition-all">
                        Ver todo <ArrowRight size={14} />
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {CATEGORIES.map(cat => (
                        <Link
                            key={cat.slug}
                            to={`/catalogo/${cat.slug}`}
                            className="group relative aspect-video rounded-2xl overflow-hidden"
                        >
                            <img
                                src={cat.image}
                                alt={cat.label}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} to-transparent`} />
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <span className="text-3xl mb-2 block">{cat.emoji}</span>
                                <h3 className="font-display text-2xl font-bold text-white">{cat.label}</h3>
                                <span className="inline-flex items-center gap-1 text-sm text-white/80 mt-1 group-hover:gap-2 transition-all">
                  Ver productos <ArrowRight size={12} />
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
                            <p className="text-accent-400 text-sm font-semibold uppercase tracking-widest mb-1">Recién llegados</p>
                            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900">Últimos productos</h2>
                        </div>
                        <Link to="/catalogo" className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand-400 hover:gap-2 transition-all">
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
                                        <p className="text-5xl mb-3">📦</p>
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

            {/* ── BANNER GARANTÍA ── */}
            <section className="relative overflow-hidden bg-brand-400 py-20">
                <div className="absolute inset-0 opacity-10"
                     style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #FFCC00 0%, transparent 50%), radial-gradient(circle at 80% 50%, #E31E24 0%, transparent 50%)' }}
                />
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <span className="text-5xl mb-4 block">🛡️</span>
                    <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white mb-4">
                        6 meses de garantía
                    </h2>
                    <p className="text-blue-100 mb-8 max-w-lg mx-auto text-lg">
                        Todos nuestros productos tienen garantía de 6 meses contra defectos de fábrica.
                        Tu tranquilidad es nuestra prioridad.
                    </p>
                    <Link to="/catalogo" className="inline-flex items-center gap-2 bg-white text-brand-400 font-bold px-8 py-4 rounded-full hover:bg-highlight-400 hover:text-brand-800 transition-all duration-200 text-base">
                        Comprar con confianza <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

        </div>
    )
}