// src/pages/OrdersPage.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, ChevronDown, ChevronUp, ShoppingBag, Loader2, CreditCard, Banknote } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'

const STATUS = {
    pending:    { label: 'Pendiente',   cls: 'bg-yellow-100 text-yellow-700' },
    confirmed:  { label: 'Confirmado',  cls: 'bg-blue-100 text-blue-700' },
    processing: { label: 'Procesando',  cls: 'bg-purple-100 text-purple-700' },
    shipped:    { label: 'Enviado',     cls: 'bg-indigo-100 text-indigo-700' },
    delivered:  { label: 'Entregado',   cls: 'bg-green-100 text-green-700' },
    cancelled:  { label: 'Cancelado',   cls: 'bg-red-100 text-red-700' },
}

const PAYMENT_METHOD = {
    card: { label: 'Tarjeta', icon: CreditCard, cls: 'text-blue-600 bg-blue-50' },
    cash: { label: 'Contra entrega', icon: Banknote, cls: 'text-green-600 bg-green-50' },
}

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

function StatusBar({ status }) {
    if (status === 'cancelled') return (
        <div className="flex items-center gap-2 text-sm text-red-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Pedido cancelado
        </div>
    )

    const currentIdx = STEPS.indexOf(status)
    return (
        <div className="flex items-center gap-1">
            {STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-1">
                    <div className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i <= currentIdx ? 'bg-brand-400' : 'bg-gray-200'
                    } ${i === currentIdx ? 'ring-2 ring-brand-200' : ''}`} />
                    {i < STEPS.length - 1 && (
                        <div className={`w-6 sm:w-10 h-0.5 ${i < currentIdx ? 'bg-brand-400' : 'bg-gray-200'}`} />
                    )}
                </div>
            ))}
            <span className={`ml-2 badge text-xs ${STATUS[status]?.cls}`}>
        {STATUS[status]?.label}
      </span>
        </div>
    )
}

function OrderCard({ order }) {
    const [open, setOpen] = useState(false)

    const pm = PAYMENT_METHOD[order.payment_method] ?? PAYMENT_METHOD.cash
    const PayIcon = pm.icon

    return (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-fade-in">
            {/* Header */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Package size={14} className="text-brand-400" />
                            <span className="font-mono text-xs text-gray-400">
                #{order.id.slice(0, 12).toUpperCase()}
              </span>
                            {/* Método de pago */}
                            <span className={`inline-flex items-center gap-1 badge text-[11px] ${pm.cls}`}>
                <PayIcon size={10} />
                                {pm.label}
              </span>
                        </div>
                        <p className="text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleDateString('es-EC', {
                                day: '2-digit', month: 'long', year: 'numeric'
                            })}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
            <span className="font-display font-extrabold text-brand-400 text-lg">
              ${Number(order.total).toFixed(2)}
            </span>
                        {open
                            ? <ChevronUp size={16} className="text-gray-400" />
                            : <ChevronDown size={16} className="text-gray-400" />
                        }
                    </div>
                </div>

                <div className="mt-3">
                    <StatusBar status={order.status} />
                </div>
            </button>

            {/* Detalle desplegable */}
            {open && (
                <div className="border-t border-gray-100 px-5 py-4 space-y-4 animate-fade-in">

                    {/* Dirección */}
                    {order.addresses && (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Enviar a</p>
                            <p className="text-sm text-gray-700 font-medium">{order.addresses.full_name}</p>
                            <p className="text-sm text-gray-400">
                                {order.addresses.street}, {order.addresses.city}, {order.addresses.country}
                            </p>
                        </div>
                    )}

                    {/* Método de pago detallado */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Método de pago</p>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium ${pm.cls}`}>
                            <PayIcon size={14} />
                            {pm.label}
                        </div>
                    </div>

                    {/* Productos */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Productos</p>
                        <div className="space-y-3">
                            {order.order_items?.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-12 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                        {item.product_variants?.products?.product_images?.[0]?.url ? (
                                            <img
                                                src={item.product_variants.products.product_images[0].url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                            {item.product_variants?.products?.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {[item.product_variants?.size, item.product_variants?.color]
                                                .filter(Boolean).join(' / ')} × {item.quantity}
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                    ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                  </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resumen de costos */}
                    <div className="border-t border-gray-50 pt-3 text-sm space-y-1">
                        <div className="flex justify-between text-gray-400">
                            <span>Subtotal</span>
                            <span>
                ${(Number(order.total) >= 50
                                    ? Number(order.total)
                                    : Number(order.total) - 5.99
                            ).toFixed(2)}
              </span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Envío</span>
                            <span>{Number(order.total) >= 50 ? 'Gratis' : '$5.99'}</span>
                        </div>
                        <div className="flex justify-between font-display font-bold text-gray-900 pt-1 border-t border-gray-100">
                            <span>Total</span>
                            <span className="text-brand-400">${Number(order.total).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Acciones */}
                    {order.status === 'delivered' && (
                        <Link to="/catalogo" className="btn-primary text-sm py-2 inline-flex items-center gap-1.5">
                            <ShoppingBag size={14} /> Volver a comprar
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}

export default function OrdersPage() {
    const { user } = useAuthStore()
    const [filter, setFilter] = useState('all')

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['my-orders', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          addresses(full_name, street, city, country),
          order_items(
            quantity, unit_price,
            product_variants(
              size, color,
              products(name, slug, product_images(url, is_primary, position))
            )
          )
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            if (error) throw error
            return data
        },
        enabled: !!user,
    })

    const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
            <div className="mb-8">
                <h1 className="font-display text-3xl font-extrabold text-gray-900">Mis pedidos</h1>
                <p className="text-gray-400 text-sm mt-1">
                    {orders.length} pedido{orders.length !== 1 ? 's' : ''} en total
                </p>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap mb-6">
                {[
                    { value: 'all',       label: 'Todos' },
                    { value: 'pending',   label: 'Pendientes' },
                    { value: 'confirmed', label: 'Confirmados' },
                    { value: 'shipped',   label: 'Enviados' },
                    { value: 'delivered', label: 'Entregados' },
                    { value: 'cancelled', label: 'Cancelados' },
                ].map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            filter === f.value
                                ? 'bg-brand-400 text-white'
                                : 'bg-white text-gray-500 border border-gray-200 hover:border-brand-300 hover:text-brand-400'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-brand-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package size={36} className="text-gray-300" />
                    </div>
                    <p className="font-display text-xl font-bold text-gray-700 mb-2">
                        {filter === 'all' ? 'Aún no tienes pedidos' : 'No hay pedidos en este estado'}
                    </p>
                    {filter === 'all' && (
                        <>
                            <p className="text-gray-400 text-sm mb-6">Cuando realices tu primera compra aparecerá aquí.</p>
                            <Link to="/catalogo" className="btn-primary inline-flex items-center gap-2">
                                <ShoppingBag size={16} /> Ir al catálogo
                            </Link>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(order => <OrderCard key={order.id} order={order} />)}
                </div>
            )}
        </div>
    )
}