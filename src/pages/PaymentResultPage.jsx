// src/pages/PaymentResultPage.jsx
import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { confirmTransaction } from '../lib/payphone'
import { useCartStore } from '../store/useCartStore'

export default function PaymentResultPage() {
    const [searchParams] = useSearchParams()
    const navigate       = useNavigate()
    const clearCart      = useCartStore(s => s.clearCart)

    const [status,   setStatus]   = useState('loading')
    const [resultId, setResultId] = useState(null)
    const [message,  setMessage]  = useState('')

    useEffect(() => {
        const process = async () => {

            // ── Caso 1: pago contra entrega (redirección interna desde checkout) ──
            const directStatus  = searchParams.get('status')
            const directOrderId = searchParams.get('orderId')
            if (directStatus === 'success' && directOrderId) {
                setStatus('success')
                setResultId(directOrderId)
                clearCart()
                return
            }

            // ── Caso 2: regreso desde PayPhone ──
            const id                = searchParams.get('id')
            const clientTxId        = searchParams.get('clientTransactionId')
            const transactionStatus = searchParams.get('transactionStatus')
            const kind              = searchParams.get('kind') ?? 'order'

            console.log('PayPhone params:', { id, clientTxId, transactionStatus, kind })

            // Si PayPhone ya nos dice "Cancelled" en la URL, no llamamos a confirm
            if (transactionStatus === 'Cancelled') {
                // El webhook o confirm de abajo harán el restore_stock
                // Pero como aquí sabemos que no va a aprobar, lo mostramos directo.
                // Aun así llamamos para que se registre en DB:
                if (id && clientTxId) {
                    try { await confirmTransaction({ id, clientTxId, kind }) } catch {}
                }
                setStatus('cancelled')
                setMessage('Cancelaste el pago.')
                sessionStorage.removeItem('pendingOrderId')
                return
            }

            // Si faltan datos, no hay nada que confirmar
            if (!id || !clientTxId) {
                setStatus('error')
                setMessage('No se encontraron datos de la transacción.')
                return
            }

            // ── Confirmar con la Edge Function (ella hace todo el trabajo) ──
            try {
                const result = await confirmTransaction({ id, clientTxId, kind })

                if (result.approved) {
                    setStatus('success')
                    setResultId(clientTxId)
                    sessionStorage.removeItem('pendingOrderId')
                    clearCart()
                } else {
                    setStatus('error')
                    setMessage(`El pago no pudo ser procesado (${result.status}).`)
                }
            } catch (err) {
                setStatus('error')
                setMessage(err.message)
            }
        }

        process()
    }, [])

    // ── Loading ──
    if (status === 'loading') return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 size={48} className="animate-spin text-brand-400 mx-auto mb-4" />
                <p className="font-display text-lg font-bold text-gray-700">Verificando tu pago...</p>
                <p className="text-gray-400 text-sm mt-1">Por favor no cierres esta ventana</p>
            </div>
        </div>
    )

    // ── Éxito ──
    if (status === 'success') return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-3">
                ¡Pago exitoso!
            </h1>
            <p className="text-gray-500 mb-2">
                Tu pedido ha sido confirmado y está siendo procesado. Te enviaremos un email con los detalles.
            </p>
            {resultId && (
                <p className="text-xs text-gray-400 font-mono mb-8">
                    #{resultId.slice(0, 12).toUpperCase()}
                </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/mis-pedidos" className="btn-primary flex items-center justify-center gap-2">
                    Ver mis pedidos
                </Link>
                <Link to="/catalogo" className="btn-outline flex items-center justify-center gap-2">
                    Seguir comprando
                </Link>
            </div>
        </div>
    )

    // ── Cancelado ──
    if (status === 'cancelled') return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
            <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={48} className="text-yellow-500" />
            </div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-3">Pago cancelado</h1>
            <p className="text-gray-500 mb-8">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => navigate('/carrito')} className="btn-primary">Volver al carrito</button>
                <Link to="/" className="btn-outline">Ir al inicio</Link>
            </div>
        </div>
    )

    // ── Error ──
    return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={48} className="text-red-500" />
            </div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-3">Error en el pago</h1>
            <p className="text-gray-500 mb-8">{message || 'Ocurrió un error al procesar tu pago.'}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => navigate('/carrito')} className="btn-primary">Volver al carrito</button>
                <Link to="/" className="btn-outline">Ir al inicio</Link>
            </div>
        </div>
    )
}