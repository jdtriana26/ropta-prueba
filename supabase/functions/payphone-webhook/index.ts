// supabase/functions/payphone-webhook/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
    try {
        // 1. Validar el webhook secret (viene como header o query param)
        const secret = req.headers.get('x-payphone-secret')
            ?? new URL(req.url).searchParams.get('secret')
        if (secret !== Deno.env.get('PAYPHONE_WEBHOOK_SECRET')) {
            return new Response('Forbidden', { status: 403 })
        }

        // 2. Leer payload
        const payload = await req.json()
        const { clientTransactionId, transactionId, transactionStatus } = payload

        if (!clientTransactionId) {
            return new Response('Missing clientTransactionId', { status: 400 })
        }

        const approved = transactionStatus === 'Approved'
        const admin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        )

        // 3. Actualizar la orden (solo si aún está pendiente - idempotente)
        const { data: order } = await admin
            .from('orders')
            .select('id, status')
            .eq('id', clientTransactionId)
            .maybeSingle()

        if (order && order.status === 'pending') {
            await admin.from('orders').update({
                status:           approved ? 'paid' : 'cancelled',
                payment_provider: 'payphone',
                payment_ref:      String(transactionId),
                paid_at:          approved ? new Date().toISOString() : null,
            }).eq('id', clientTransactionId)

            if (!approved) {
                await admin.rpc('restore_stock', { p_order_id: clientTransactionId })
            }

            // Disparar email (siguiente sección)
            if (approved) {
                await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-order-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                    },
                    body: JSON.stringify({ orderId: clientTransactionId }),
                })
            }
        }

        // Haz lo mismo para memberships si los usas
        // ...

        return new Response('ok', { status: 200 })
    } catch (err) {
        console.error(err)
        return new Response('error', { status: 500 })
    }
})