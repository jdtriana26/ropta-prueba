import { supabase } from './supabase'

const PAYPHONE_BASE = 'https://pay.payphonetodoesposible.com'
const PAYPHONE_TOKEN = import.meta.env.VITE_PAYPHONE_TOKEN
const PAYPHONE_APP_ID = import.meta.env.VITE_PAYPHONE_APP_ID

// Paso 1: Edge Function valida la orden y devuelve monto verificado
// Paso 2: El browser llama a PayPhone directamente
export async function createTransaction({ kind, id, returnPath }) {
    // 1. Validar orden en servidor
    const { data: verified, error } = await supabase.functions.invoke('payphone-prepare', {
        body: { kind, id },
    })
    if (error) throw new Error(error.message)
    if (verified?.error) throw new Error(verified.error)

    // 2. Llamar a PayPhone desde el browser (no desde Edge Function)
    const resp = await fetch(`${PAYPHONE_BASE}/api/button/Prepare`, {
        method: 'POST',
        headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${PAYPHONE_TOKEN}`,
        },
        body: JSON.stringify({
            amount:              verified.amountCents,
            amountWithTax:       0,
            amountWithoutTax:    verified.amountCents,
            tax: 0, service: 0, tip: 0,
            currency:            'USD',
            storeId:             PAYPHONE_APP_ID,
            clientTransactionId: verified.orderId,
            responseUrl:         `${returnPath}?kind=${verified.kind}`,
            cancellationUrl:     `${returnPath.replace('/resultado', '/cancelado')}?kind=${verified.kind}`,
            reference:           verified.reference,
        }),
    })

    if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`PayPhone error: ${text}`)
    }

    return await resp.json()
}

export async function confirmTransaction({ id, clientTxId, kind }) {
    const { data, error } = await supabase.functions.invoke('payphone-confirm', {
        body: { id, clientTxId, kind },
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    return data
}