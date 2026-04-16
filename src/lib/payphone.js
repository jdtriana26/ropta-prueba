// src/lib/payphone.js
// Documentación: https://www.docs.payphone.app

const TOKEN    = import.meta.env.VITE_PAYPHONE_TOKEN
const STORE_ID = import.meta.env.VITE_PAYPHONE_APP_ID  // En PayPhone se llama storeId

const BASE_URL = 'https://pay.payphonetodoesposible.com'

// ── Preparar transacción ──────────────────────────────────────────────────────
// Devuelve { payWithCard } — URL a la que redirigir al cliente
export async function createTransaction({ amount, orderId, clientTxId }) {
    const amountCents = Math.round(amount * 100)

    const response = await fetch(`${BASE_URL}/api/button/Prepare`, {
        method: 'POST',
        headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({
            amount:              amountCents,
            amountWithTax:       0,
            amountWithoutTax:    amountCents,
            tax:                 0,
            service:             0,
            tip:                 0,
            currency:            'USD',
            storeId:             STORE_ID,
            clientTransactionId: clientTxId,
            responseUrl:         `${window.location.origin}/pago/resultado`,
            cancellationUrl:     `${window.location.origin}/pago/cancelado`,
            reference:           `Multi Flash #${orderId.slice(0, 8).toUpperCase()}`,
        }),
    })

    if (!response.ok) {
        const err = await response.text()
        throw new Error(`PayPhone error ${response.status}: ${err}`)
    }

    return await response.json()
    // Retorna: { payWithCard, payWithCash, ... }
}

// ── Confirmar transacción ─────────────────────────────────────────────────────
// Debe llamarse dentro de los 5 minutos de completado el pago
// id y clientTxId vienen como params en la URL de retorno
export async function confirmTransaction({ id, clientTxId }) {
    const response = await fetch(`${BASE_URL}/api/button/V2/Confirm`, {
        method: 'POST',
        headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({
            id:        Number(id),   // PayPhone espera número, no string
            clientTxId,
        }),
    })

    if (!response.ok) {
        const err = await response.text()
        throw new Error(`PayPhone confirm error ${response.status}: ${err}`)
    }

    return await response.json()
    // transactionStatus: 'Approved' | 'Cancelled' | 'Error'
}