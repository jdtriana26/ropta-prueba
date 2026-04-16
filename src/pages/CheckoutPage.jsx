// src/pages/CheckoutPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    Loader2, CheckCircle2, ChevronDown, ChevronUp,
    MapPin, CreditCard, ShoppingBag, Banknote
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { createTransaction } from '../lib/payphone'
import { useCartStore } from '../store/useCartStore'
import { useAuthStore } from '../store/useAuthStore'

const SHIPPING_THRESHOLD = 50
const SHIPPING_COST      = 5.99

const EMPTY_ADDRESS = {
    full_name:   '',
    street:      '',
    city:        '',
    state:       '',
    country:     'Ecuador',
    postal_code: '',
}

// ── Indicador de pasos ────────────────────────────────────────────────────────
function Steps({ current }) {
    const steps = ['Dirección', 'Pago', 'Confirmación']
    return (
        <div className="flex items-center justify-center gap-0 mb-10">
            {steps.map((label, i) => (
                <div key={label} className="flex items-center">
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                            i < current  ? 'bg-brand-400 text-white'
                                : i === current ? 'bg-brand-400 text-white ring-4 ring-brand-100'
                                    : 'bg-gray-100 text-gray-400'
                        }`}>
                            {i < current ? <CheckCircle2 size={16} /> : i + 1}
                        </div>
                        <span className={`text-xs mt-1 font-medium ${i === current ? 'text-brand-400' : 'text-gray-400'}`}>
              {label}
            </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 transition-all ${i < current ? 'bg-brand-400' : 'bg-gray-200'}`} />
                    )}
                </div>
            ))}
        </div>
    )
}

// ── Resumen del pedido ────────────────────────────────────────────────────────
function OrderSummary({ items, subtotal, shipping, total, collapsed, onToggle }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-100"
            >
        <span className="font-display font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag size={16} className="text-brand-400" />
          Resumen ({items.length} productos)
        </span>
                <div className="flex items-center gap-2">
                    <span className="font-display font-extrabold text-brand-400">${total.toFixed(2)}</span>
                    <span className="lg:hidden text-gray-400">
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </span>
                </div>
            </button>

            <div className={`${collapsed ? 'hidden' : 'block'} lg:block`}>
                <div className="px-6 py-4 space-y-4 border-b border-gray-100">
                    {items.map(item => (
                        <div key={item.variantId} className="flex gap-3">
                            <div className="relative flex-shrink-0">
                                <div className="w-14 h-16 rounded-xl overflow-hidden bg-gray-100">
                                    {item.image
                                        ? <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                                    }
                                </div>
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.quantity}
                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.productName}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {[item.size, item.color].filter(Boolean).join(' / ')}
                                </p>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
                        </div>
                    ))}
                </div>
                <div className="px-6 py-4 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span className="text-gray-900 font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                        <span>Envío</span>
                        <span className={shipping === 0 ? 'text-green-600 font-medium' : 'text-gray-900 font-medium'}>
              {shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}
            </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-100">
                        <span className="font-display font-bold text-gray-900">Total</span>
                        <span className="font-display font-extrabold text-brand-400 text-lg">${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function CheckoutPage() {
    const navigate  = useNavigate()
    const { user }  = useAuthStore()
    const items     = useCartStore(s => s.items)
    const getTotal  = useCartStore(s => s.getTotal)
    const clearCart = useCartStore(s => s.clearCart)

    const [step,            setStep]            = useState(0)
    const [address,         setAddress]         = useState(EMPTY_ADDRESS)
    const [savedAddressId,  setSavedAddressId]  = useState(null)
    const [saveAddress,     setSaveAddress]     = useState(true)
    const [paymentMethod,   setPaymentMethod]   = useState('card') // 'card' | 'cash'
    const [processing,      setProcessing]      = useState(false)
    const [summaryOpen,     setSummaryOpen]     = useState(false)

    const subtotal = getTotal()
    const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
    const total    = subtotal + shipping

    useEffect(() => {
        if (items.length === 0 && step < 2) navigate('/carrito')
    }, [items])

    // Direcciones guardadas
    const { data: savedAddresses = [] } = useQuery({
        queryKey: ['addresses', user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('addresses')
                .select('*')
                .eq('user_id', user.id)
                .order('is_default', { ascending: false })
            return data
        },
        enabled: !!user,
    })

    useEffect(() => {
        const def = savedAddresses.find(a => a.is_default) ?? savedAddresses[0]
        if (def && !savedAddressId) {
            setSavedAddressId(def.id)
            setAddress({
                full_name:   def.full_name,
                street:      def.street,
                city:        def.city,
                state:       def.state ?? '',
                country:     def.country,
                postal_code: def.postal_code ?? '',
            })
        }
    }, [savedAddresses])

    const handleSelectSaved = (addr) => {
        setSavedAddressId(addr.id)
        setAddress({
            full_name:   addr.full_name,
            street:      addr.street,
            city:        addr.city,
            state:       addr.state ?? '',
            country:     addr.country,
            postal_code: addr.postal_code ?? '',
        })
    }

    const validateAddress = () => {
        const required = ['full_name', 'street', 'city', 'country']
        for (const field of required) {
            if (!address[field]?.trim()) {
                toast.error(`El campo "${field.replace('_', ' ')}" es obligatorio`)
                return false
            }
        }
        return true
    }

    // ── Crear orden pendiente en Supabase ─────────────────────────────────────
    const createPendingOrder = async () => {
        let addressId = savedAddressId

        if (!savedAddressId || saveAddress) {
            const { data: newAddr, error } = await supabase
                .from('addresses')
                .insert({ ...address, user_id: user.id, is_default: savedAddresses.length === 0 })
                .select()
                .single()
            if (error) throw error
            addressId = newAddr.id
        }

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id:    user.id,
                address_id: addressId,
                status:     'pending',
                total,
            })
            .select()
            .single()
        if (orderError) throw orderError

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(
                items.map(item => ({
                    order_id:   order.id,
                    variant_id: item.variantId,
                    quantity:   item.quantity,
                    unit_price: item.price,
                }))
            )
        if (itemsError) throw itemsError

        return order
    }

    // ── Procesar pago ─────────────────────────────────────────────────────────
    const handlePay = async () => {
        setProcessing(true)
        try {
            const order = await createPendingOrder()

            if (paymentMethod === 'cash') {
                // Pago contra entrega — confirmar directo
                await supabase.from('orders').update({ status: 'confirmed' }).eq('id', order.id)
                for (const item of items) {
                    await supabase.rpc('decrement_stock', { variant_id: item.variantId, qty: item.quantity })
                }
                clearCart()
                navigate(`/pago/resultado?status=success&orderId=${order.id}`)
                return
            }

            // Pago con tarjeta — redirigir a PayPhone
            // Guardamos el orderId en sessionStorage para recuperarlo al volver
            sessionStorage.setItem('pendingOrderId', order.id)
            sessionStorage.setItem('pendingCartItems', JSON.stringify(items))

            const txData = await createTransaction({
                amount:     total,
                orderId:    order.id,
                clientTxId: order.id,  // usamos el order ID como clientTransactionId
            })

            if (!txData.payWithCard) throw new Error('No se obtuvo URL de pago')

            // Redirigir al portal de pago de PayPhone
            window.location.href = txData.payWithCard

        } catch (err) {
            toast.error('Error al procesar el pago: ' + err.message)
            setProcessing(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <Steps current={step} />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-5">

                    {/* ── PASO 0: DIRECCIÓN ── */}
                    {step === 0 && (
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="font-display text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <MapPin size={18} className="text-brand-400" /> Dirección de envío
                            </h2>

                            {savedAddresses.length > 0 && (
                                <div className="mb-5 space-y-2">
                                    <p className="text-sm font-medium text-gray-500 mb-2">Direcciones guardadas</p>
                                    {savedAddresses.map(addr => (
                                        <label key={addr.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                            savedAddressId === addr.id ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                                        }`}>
                                            <input type="radio" name="saved_address" className="mt-1 accent-brand-400"
                                                   checked={savedAddressId === addr.id}
                                                   onChange={() => handleSelectSaved(addr)} />
                                            <div className="text-sm">
                                                <p className="font-medium text-gray-900">{addr.full_name}</p>
                                                <p className="text-gray-400">{addr.street}, {addr.city}, {addr.country}</p>
                                            </div>
                                        </label>
                                    ))}
                                    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                        savedAddressId === null ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                                    }`}>
                                        <input type="radio" name="saved_address" className="mt-1 accent-brand-400"
                                               checked={savedAddressId === null}
                                               onChange={() => { setSavedAddressId(null); setAddress(EMPTY_ADDRESS) }} />
                                        <span className="text-sm font-medium text-gray-700">+ Nueva dirección</span>
                                    </label>
                                </div>
                            )}

                            {(savedAddressId === null || savedAddresses.length === 0) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                                        <input className="input" placeholder="Juan Pérez" value={address.full_name}
                                               onChange={e => setAddress(a => ({ ...a, full_name: e.target.value }))} />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                                        <input className="input" placeholder="Av. Principal 123" value={address.street}
                                               onChange={e => setAddress(a => ({ ...a, street: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
                                        <input className="input" placeholder="Quito" value={address.city}
                                               onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                                        <input className="input" placeholder="Pichincha" value={address.state}
                                               onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">País *</label>
                                        <select className="input" value={address.country}
                                                onChange={e => setAddress(a => ({ ...a, country: e.target.value }))}>
                                            {['Ecuador','Colombia','Perú','Venezuela','Chile','Argentina','México'].map(c => (
                                                <option key={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Código postal</label>
                                        <input className="input" placeholder="170102" value={address.postal_code}
                                               onChange={e => setAddress(a => ({ ...a, postal_code: e.target.value }))} />
                                    </div>
                                    <div className="sm:col-span-2 flex items-center gap-2">
                                        <input type="checkbox" id="save_addr" checked={saveAddress}
                                               onChange={e => setSaveAddress(e.target.checked)} className="w-4 h-4 accent-brand-400" />
                                        <label htmlFor="save_addr" className="text-sm text-gray-600">
                                            Guardar esta dirección para futuras compras
                                        </label>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => { if (savedAddressId || validateAddress()) setStep(1) }}
                                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                            >
                                Continuar al pago →
                            </button>
                        </div>
                    )}

                    {/* ── PASO 1: MÉTODO DE PAGO ── */}
                    {step === 1 && (
                        <div className="space-y-4">

                            {/* Dirección confirmada */}
                            <div className="bg-white rounded-2xl shadow-sm p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-display font-bold text-gray-900 flex items-center gap-2">
                                        <MapPin size={16} className="text-brand-400" /> Enviar a
                                    </h3>
                                    <button onClick={() => setStep(0)} className="text-xs text-brand-400 font-medium">
                                        Cambiar
                                    </button>
                                </div>
                                <p className="text-sm font-medium text-gray-800">{address.full_name}</p>
                                <p className="text-sm text-gray-400">
                                    {address.street}, {address.city}{address.state ? `, ${address.state}` : ''}, {address.country}
                                </p>
                            </div>

                            {/* Método de pago */}
                            <div className="bg-white rounded-2xl shadow-sm p-5">
                                <h3 className="font-display font-bold text-gray-900 flex items-center gap-2 mb-4">
                                    <CreditCard size={16} className="text-brand-400" /> Método de pago
                                </h3>

                                <div className="space-y-3">
                                    {/* Tarjeta — PayPhone */}
                                    <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                                        paymentMethod === 'card'
                                            ? 'border-brand-400 bg-brand-50'
                                            : 'border-gray-200 hover:border-brand-300'
                                    }`}>
                                        <input type="radio" name="payment" className="accent-brand-400"
                                               checked={paymentMethod === 'card'}
                                               onChange={() => setPaymentMethod('card')} />
                                        <CreditCard size={20} className="text-brand-400 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-900">Tarjeta de crédito / débito</p>
                                            <p className="text-xs text-gray-400 mt-0.5">Visa, Mastercard, Amex — procesado por PayPhone</p>
                                        </div>
                                        <img
                                            src="https://www.payphone.app/assets/images/logo-payphone.svg"
                                            alt="PayPhone"
                                            className="h-5 opacity-70"
                                            onError={e => e.target.style.display = 'none'}
                                        />
                                    </label>

                                    {/* Contra entrega */}
                                    <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                                        paymentMethod === 'cash'
                                            ? 'border-brand-400 bg-brand-50'
                                            : 'border-gray-200 hover:border-brand-300'
                                    }`}>
                                        <input type="radio" name="payment" className="accent-brand-400"
                                               checked={paymentMethod === 'cash'}
                                               onChange={() => setPaymentMethod('cash')} />
                                        <Banknote size={20} className="text-green-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">Pago contra entrega</p>
                                            <p className="text-xs text-gray-400 mt-0.5">Paga en efectivo cuando recibas tu pedido</p>
                                        </div>
                                    </label>
                                </div>

                                {paymentMethod === 'card' && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-400 flex items-start gap-2">
                                        🔒 Serás redirigido al portal seguro de PayPhone para completar el pago.
                                        Tu pedido se confirmará automáticamente al finalizar.
                                    </div>
                                )}
                            </div>

                            {/* Botón pagar */}
                            <button
                                onClick={handlePay}
                                disabled={processing}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
                            >
                                {processing ? (
                                    <><Loader2 size={18} className="animate-spin" /> Procesando...</>
                                ) : paymentMethod === 'card' ? (
                                    <><CreditCard size={18} /> Pagar ${total.toFixed(2)} con PayPhone</>
                                ) : (
                                    <><CheckCircle2 size={18} /> Confirmar pedido — ${total.toFixed(2)}</>
                                )}
                            </button>

                            <p className="text-xs text-center text-gray-400">
                                Al confirmar aceptas nuestros{' '}
                                <Link to="#" className="underline">Términos y condiciones</Link>
                            </p>
                        </div>
                    )}
                </div>

                {/* Resumen */}
                <div className="lg:col-span-2">
                    <OrderSummary
                        items={items}
                        subtotal={subtotal}
                        shipping={shipping}
                        total={total}
                        collapsed={summaryOpen}
                        onToggle={() => setSummaryOpen(v => !v)}
                    />
                </div>
            </div>
        </div>
    )
}