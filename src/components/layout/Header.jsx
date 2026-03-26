// src/components/layout/Header.jsx
import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingBag, User, Menu, X, LogOut, Package } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useCartStore } from '../../store/useCartStore'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'



export default function Header() {
    const [menuOpen,    setMenuOpen]    = useState(false)
    const [userDropdown, setUserDropdown] = useState(false)
    const [scrolled,    setScrolled]    = useState(false)

    const { user, logout }  = useAuthStore()
    const getItemCount       = useCartStore(s => s.getItemCount)
    const navigate           = useNavigate()
    const cartCount          = getItemCount()

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const handleLogout = async () => {
        await logout()
        setUserDropdown(false)
        navigate('/')
    }

    const { data: CATEGORIES = [] } = useQuery({
        queryKey: ['categories-nav'],
        queryFn: async () => {
            const { data } = await supabase
                .from('categories')
                .select('name, slug')
                .eq('is_active', true)
                .order('name')
            return (data ?? []).map(c => ({ label: c.name, slug: c.slug }))
        },
        staleTime: 1000 * 60 * 5, // cache 5 minutos
    })

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-sm'
                    : 'bg-white'
            }`}
        >
            {/* Barra superior de anuncio */}
            <div className="bg-brand-400 text-white text-center text-xs font-body py-2 tracking-wide">
                🎉 Envío gratis en compras mayores a $50   —  Usa el código <span className="font-semibold">VYBE10</span> para 10% de descuento
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link
                        to="/"
                        className="font-display text-3xl font-800 text-brand-400 tracking-tight hover:text-brand-500 transition-colors"
                    >
                        VYBE
                    </Link>

                    {/* Nav escritorio */}
                    <nav className="hidden md:flex items-center gap-1">
                        {CATEGORIES.map(cat => (
                            <NavLink
                                key={cat.slug}
                                to={`/catalogo/${cat.slug}`}
                                className={({ isActive }) =>
                                    `px-4 py-2 rounded-full text-sm font-body font-500 transition-all duration-200 ${
                                        isActive
                                            ? 'bg-brand-50 text-brand-500'
                                            : 'text-gray-600 hover:text-brand-400 hover:bg-brand-50'
                                    }`
                                }
                            >
                                {cat.label}
                            </NavLink>
                        ))}
                        <Link to="/membresia">Premium 👑</Link>
                        <NavLink
                            to="/catalogo"
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-full text-sm font-body font-500 transition-all duration-200 ${
                                    isActive
                                        ? 'bg-brand-50 text-brand-500'
                                        : 'text-gray-600 hover:text-brand-400 hover:bg-brand-50'
                                }`
                            }
                        >
                            Todo
                        </NavLink>
                    </nav>

                    {/* Acciones */}
                    <div className="flex items-center gap-2">

                        {/* Carrito */}
                        <Link
                            to="/carrito"
                            className="relative p-2 rounded-full hover:bg-brand-50 transition-colors"
                        >
                            <ShoppingBag size={22} className="text-gray-700" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-400 text-white text-[10px] font-600 rounded-full flex items-center justify-center animate-fade-in">
                                  {cartCount > 9 ? '9+' : cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Usuario */}
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserDropdown(v => !v)}
                                    className="p-2 rounded-full hover:bg-brand-50 transition-colors"
                                >
                                    <User size={22} className="text-gray-700" />
                                </button>

                                {userDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-slide-up">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-xs text-gray-400">Conectado como</p>
                                            <p className="text-sm font-500 text-gray-700 truncate">{user.email}</p>
                                        </div>
                                        <Link
                                            to="/mi-cuenta"
                                            onClick={() => setUserDropdown(false)}
                                            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-500 transition-colors"
                                        >
                                            <User size={16} /> Mi cuenta
                                        </Link>
                                        <Link
                                            to="/mis-pedidos"
                                            onClick={() => setUserDropdown(false)}
                                            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-500 transition-colors"
                                        >
                                            <Package size={16} /> Mis pedidos
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut size={16} /> Cerrar sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-brand-400 text-white text-sm font-500 rounded-full hover:bg-brand-500 transition-colors"
                            >
                                <User size={15} /> Ingresar
                            </Link>
                        )}

                        {/* Hamburguesa móvil */}
                        <button
                            onClick={() => setMenuOpen(v => !v)}
                            className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            {menuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Menú móvil */}
            {menuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white animate-slide-up">
                    <div className="px-4 py-3 space-y-1">
                        <NavLink
                            to="/catalogo"
                            onClick={() => setMenuOpen(false)}
                            className="block px-4 py-3 rounded-xl text-sm font-500 text-gray-700 hover:bg-brand-50 hover:text-brand-500 transition-colors"
                        >
                            Todo
                        </NavLink>
                        {CATEGORIES.map(cat => (
                            <NavLink
                                key={cat.slug}
                                to={`/catalogo/${cat.slug}`}
                                onClick={() => setMenuOpen(false)}
                                className="block px-4 py-3 rounded-xl text-sm font-500 text-gray-700 hover:bg-brand-50 hover:text-brand-500 transition-colors"
                            >
                                {cat.label}
                            </NavLink>
                        ))}
                        {!user && (
                            <Link
                                to="/login"
                                onClick={() => setMenuOpen(false)}
                                className="block mt-2 text-center px-4 py-3 bg-brand-400 text-white rounded-xl text-sm font-500 hover:bg-brand-500 transition-colors"
                            >
                                Ingresar
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}