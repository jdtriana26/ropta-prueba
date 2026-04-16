// src/pages/PaymentResultPage.jsx
import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { confirmTransaction } from '../lib/payphone'
import { useCartStore } from '../store/useCartStore'

export default function PaymentResultPage() {
    const [searchParams] = useSearchParams()
    const navigate       = useNavigate()
    const clearCart      = useCartStore(s => s.clearCart)

    const [status,  setStatus]  = useState('loading')
    const [type,    setType]    = useState('order')      // 'order' | 'membership'
    const [resultId, setResultId] = useState(null)
    const [message, setMessage] = useState('')

    useEffect(() => {
        const process = async () => {

            // ── Caso: pago contra entrega ──
            const directStatus  = searchParams.get('status')
            const directOrderId = searchParams.get('orderId')
            if (directStatus === 'success' && directOrderId) {
                setStatus('success')
                setType('order')
                setResultId(directOrderId)
                clearCart()
                return
            }

            const id                = searchParams.get('id')
            const clientTxId        = searchParams.get('clientTransactionId')
            const transactionStatus = searchParams.get('transactionStatus')

            console.log('PayPhone params:', { id, clientTxId, transactionStatus })

            // Detectar si es pago de membresía o de orden
            const pendingMembershipId = sessionStorage.getItem('pendingMembershipId')
            const isMembership = pendingMembershipId && pendingMembershipId === clientTxId

            // ── Pago aprobado ──
            if (transactionStatus === 'Approved' && clientTxId) {
                try {
                    if (isMembership) {
                        // Activar membresía
                        await supabase
                            .from('memberships')
                            .update({ status: 'active', payphone_tx_id: id })
                            .eq('id', clientTxId)

                        sessionStorage.removeItem('pendingMembershipId')
                        setType('membership')
                    } else {
                        // Confirmar orden
                        await supabase
                            .from('orders')
                            .update({ status: 'confirmed', payment_method: 'card' })
                            .eq('id', clientTxId)

                        const cartItems = JSON.parse(sessionStorage.getItem('pendingCartItems') || '[]')
                        for (const item of cartItems) {
                            await supabase.rpc('decrement_stock', {
                                variant_id: item.variantId,
                                qty:        item.quantity,
                            })
                        }
                        sessionStorage.removeItem('pendingOrderId')
                        sessionStorage.removeItem('pendingCartItems')
                        clearCart()
                        setType('order')
                    }

                    setStatus('success')
                    setResultId(clientTxId)
                    return
                } catch (err) {
                    setStatus('error')
                    setMessage(err.message)
                    return
                }
            }

            // ── Pago cancelado ──
            if (transactionStatus === 'Cancelled') {
                if (clientTxId) {
                    if (isMembership) {
                        await supabase.from('memberships').update({ status: 'cancelled' }).eq('id', clientTxId)
                        sessionStorage.removeItem('pendingMembershipId')
                        setType('membership')
                    } else {
                        await supabase.from('orders').update({ status: 'cancelled' }).eq('id', clientTxId)
                        setType('order')
                    }
                }
                setStatus('cancelled')
                setMessage('Cancelaste el pago.')
                return
            }

            // ── Confirmar con API si no hay transactionStatus en URL ──
            if (id && clientTxId) {
                try {
                    const result = await confirmTransaction({ id, clientTxId })
                    if (result.transactionStatus === 'Approved') {
                        if (isMembership) {
                            await supabase.from('memberships').update({ status: 'active', payphone_tx_id: id }).eq('id', clientTxId)
                            sessionStorage.removeItem('pendingMembershipId')
                            setType('membership')
                        } else {
                            await supabase.from('orders').update({ status: 'confirmed', payment_method: 'card' }).eq('id', clientTxId)
                            const cartItems = JSON.parse(sessionStorage.getItem('pendingCartItems') || '[]')
                            for (const item of cartItems) {
                                await supabase.rpc('decrement_stock', { variant_id: item.variantId, qty: item.quantity })
                            }
                            sessionStorage.removeItem('pendingCartItems')
                            clearCart()
                            setType('order')
                        }
                        setStatus('success')
                        setResultId(clientTxId)
                    } else {
                        setStatus('error')
                        setMessage(result.message ?? 'El pago no pudo ser procesado.')
                    }
                } catch (err) {
                    setStatus('error')
                    setMessage(err.message)
                }
                return
            }

            setStatus('error')
            setMessage('No se encontraron datos de la transacción.')
        }

        process()
    }, [])

    if (status === 'loading') return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 size={48} className="animate-spin text-brand-400 mx-auto mb-4" />
                <p className="font-display text-lg font-bold text-gray-700">Verificando tu pago...</p>
                <p className="text-gray-400 text-sm mt-1">Por favor no cierres esta ventana</p>
            </div>
        </div>
    )

    if (status === 'success') return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-3">
                {type === 'membership' ? '¡Bienvenido a Premium!' : '¡Pago exitoso!'}
            </h1>
            <p className="text-gray-500 mb-2">
                {type === 'membership'
                    ? '¡Compra realizada con éxito! Tu pedido está siendo procesado.'
                    : 'Tu pedido ha sido confirmado y está siendo procesado.'
                }
            </p>
            {resultId && (
                <p className="text-xs text-gray-400 font-mono mb-8">#{resultId.slice(0, 12).toUpperCase()}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {type === 'membership' ? (
                    <>
                        <Link to="/catalogo" className="btn-primary flex items-center justify-center gap-2">
                            Ver mi membresía
                        </Link>
                        <Link to="/catalogo" className="btn-outline flex items-center justify-center gap-2">
                            Ir al catálogo
                        </Link>
                    </>
                ) : (
                    <>
                        <Link to="/mis-pedidos" className="btn-primary flex items-center justify-center gap-2">
                            Ver mis pedidos
                        </Link>
                        <Link to="/catalogo" className="btn-outline flex items-center justify-center gap-2">
                            Seguir comprando
                        </Link>
                    </>
                )}
            </div>
        </div>
    )

    if (status === 'cancelled') return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
            <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={48} className="text-yellow-500" />
            </div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-3">Pago cancelado</h1>
            <p className="text-gray-500 mb-8">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => navigate(-1)} className="btn-primary">Intentar de nuevo</button>
                <Link to="/" className="btn-outline">Ir al inicio</Link>
            </div>
        </div>
    )

    return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={48} className="text-red-500" />
            </div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-3">Error en el pago</h1>
            <p className="text-gray-500 mb-8">{message || 'Ocurrió un error al procesar tu pago.'}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => navigate(-1)} className="btn-primary">Intentar de nuevo</button>
                <Link to="/" className="btn-outline">Ir al inicio</Link>
            </div>
        </div>
    )
}