// src/pages/CartPage.jsx
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useCartStore } from '../store/useCartStore'
import { useAuthStore } from '../store/useAuthStore'

const SHIPPING_THRESHOLD = 50
const SHIPPING_COST      = 5.99

export default function CartPage() {
    const navigate     = useNavigate()
    const { user }     = useAuthStore()
    const items        = useCartStore(s => s.items)
    const removeItem   = useCartStore(s => s.removeItem)
    const updateQty    = useCartStore(s => s.updateQuantity)
    const clearCart    = useCartStore(s => s.clearCart)
    const getTotal     = useCartStore(s => s.getTotal)

    const [coupon,      setCoupon]      = useState('')
    const [couponApplied, setCouponApplied] = useState(false)
    const [couponError,   setCouponError]   = useState('')

    const subtotal      = getTotal()
    const freeShipping  = subtotal >= SHIPPING_THRESHOLD
    const shipping      = freeShipping || subtotal === 0 ? 0 : SHIPPING_COST
    const discount      = couponApplied ? subtotal * 0.1 : 0
    const total         = subtotal + shipping - discount

    const progressToFree = Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100)

    const handleCoupon = () => {
        if (coupon.trim().toUpperCase() === 'VYBE10') {
            setCouponApplied(true)
            setCouponError('')
            toast.success('Cupón aplicado — 10% de descuento ✓')
        } else {
            setCouponError('Cupón inválido o expirado')
            setCouponApplied(false)
        }
    }

    const handleCheckout = () => {
        if (!user) {
            toast.error('Inicia sesión para continuar')
            navigate('/login', { state: { from: '/checkout' } })
            return
        }
        navigate('/checkout')
    }

    // ── Carrito vacío ────────────────────────────────────────────────────────
    if (items.length === 0) return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center max-w-md mx-auto animate-fade-in">
                <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag size={40} className="text-brand-400" />
                </div>
                <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-3">
                    Tu carrito está vacío
                </h1>
                <p className="text-gray-400 mb-8">
                    Explora nuestro catálogo y agrega los productos que te gusten.
                </p>
                <Link to="/catalogo" className="btn-primary inline-flex items-center gap-2">
                    <ShoppingBag size={16} /> Ir al catálogo
                </Link>
            </div>
        </div>
    )

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

            {/* Título */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-display text-3xl font-extrabold text-gray-900">Carrito</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {items.length} {items.length === 1 ? 'producto' : 'productos'}
                    </p>
                </div>
                <button
                    onClick={() => { clearCart(); toast.success('Carrito vaciado') }}
                    className="text-sm text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                    <Trash2 size={14} /> Vaciar
                </button>
            </div>

            {/* Barra progreso envío gratis */}
            {!freeShipping && (
                <div className="bg-brand-50 rounded-2xl px-5 py-4 mb-6">
                    <div className="flex justify-between text-sm mb-2">
            <span className="text-brand-700 font-medium">
              Te faltan <strong>${(SHIPPING_THRESHOLD - subtotal).toFixed(2)}</strong> para envío gratis
            </span>
                        <span className="text-brand-500 font-semibold">${SHIPPING_THRESHOLD}</span>
                    </div>
                    <div className="w-full bg-brand-200 rounded-full h-2">
                        <div
                            className="bg-brand-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressToFree}%` }}
                        />
                    </div>
                </div>
            )}

            {freeShipping && (
                <div className="bg-green-50 text-green-700 rounded-2xl px-5 py-3 mb-6 text-sm font-medium flex items-center gap-2">
                    🎉 ¡Tienes envío gratis!
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ── Lista de items ── */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map(item => (
                        <div
                            key={item.variantId}
                            className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm animate-fade-in"
                        >
                            {/* Imagen */}
                            <Link to={`/producto/${item.slug}`} className="flex-shrink-0">
                                <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden bg-gray-100">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.productName}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl text-gray-200">
                                            👗
                                        </div>
                                    )}
                                </div>
                            </Link>

                            {/* Info */}
                            <div className="flex-1 flex flex-col justify-between min-w-0">
                                <div>
                                    <Link
                                        to={`/producto/${item.slug}`}
                                        className="font-display font-semibold text-gray-900 hover:text-brand-500 transition-colors line-clamp-1"
                                    >
                                        {item.productName}
                                    </Link>
                                    <div className="flex gap-2 mt-1">
                                        {item.size && (
                                            <span className="text-xs border border-gray-200 text-gray-500 px-2 py-0.5 rounded-lg">
                        {item.size}
                      </span>
                                        )}
                                        {item.color && (
                                            <span className="text-xs border border-gray-200 text-gray-500 px-2 py-0.5 rounded-lg">
                        {item.color}
                      </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    {/* Cantidad */}
                                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => updateQty(item.variantId, item.quantity - 1)}
                                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                                        >
                                            <Minus size={12} />
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium text-gray-900">
                      {item.quantity}
                    </span>
                                        <button
                                            onClick={() => updateQty(item.variantId, item.quantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>

                                    {/* Precio + eliminar */}
                                    <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-brand-500">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                                        <button
                                            onClick={() => {
                                                removeItem(item.variantId)
                                                toast.success('Producto eliminado')
                                            }}
                                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Seguir comprando */}
                    <Link
                        to="/catalogo"
                        className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 font-medium pt-2"
                    >
                        ← Seguir comprando
                    </Link>
                </div>

                {/* ── Resumen del pedido ── */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                        <h2 className="font-display text-lg font-bold text-gray-900 mb-5">
                            Resumen del pedido
                        </h2>

                        {/* Líneas de precio */}
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Envío</span>
                                <span className={freeShipping ? 'text-green-600 font-medium' : 'font-medium text-gray-900'}>
                  {freeShipping ? 'Gratis' : `$${SHIPPING_COST.toFixed(2)}`}
                </span>
                            </div>
                            {couponApplied && (
                                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <Tag size={12} /> Cupón VYBE10
                  </span>
                                    <span className="font-medium">-${discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="border-t border-gray-100 pt-3 flex justify-between">
                                <span className="font-display font-bold text-gray-900">Total</span>
                                <span className="font-display font-extrabold text-brand-500 text-xl">
                  ${total.toFixed(2)}
                </span>
                            </div>
                        </div>

                        {/* Cupón */}
                        <div className="mt-5">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                                Código de descuento
                            </label>
                            <div className="flex gap-2">
                                <input
                                    className="input text-sm py-2 flex-1"
                                    placeholder="VYBE10"
                                    value={coupon}
                                    onChange={e => { setCoupon(e.target.value); setCouponError('') }}
                                    onKeyDown={e => e.key === 'Enter' && handleCoupon()}
                                    disabled={couponApplied}
                                />
                                <button
                                    onClick={handleCoupon}
                                    disabled={couponApplied || !coupon.trim()}
                                    className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40"
                                >
                                    {couponApplied ? '✓' : 'Aplicar'}
                                </button>
                            </div>
                            {couponError && (
                                <p className="text-xs text-red-500 mt-1">{couponError}</p>
                            )}
                            {couponApplied && (
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                    ✓ 10% de descuento aplicado
                                    <button
                                        onClick={() => { setCouponApplied(false); setCoupon('') }}
                                        className="ml-1 text-gray-400 hover:text-red-500 underline"
                                    >
                                        quitar
                                    </button>
                                </p>
                            )}
                        </div>

                        {/* Botón checkout */}
                        <button
                            onClick={handleCheckout}
                            className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
                        >
                            Finalizar compra <ArrowRight size={16} />
                        </button>

                        <p className="text-xs text-center text-gray-400 mt-3 flex items-center justify-center gap-1">
                            🔒 Pago seguro y encriptado
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}