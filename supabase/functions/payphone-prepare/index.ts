// supabase/functions/payphone-prepare/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PAYPHONE_BASE = 'https://pay.payphonetodoesposible.com'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

    try {
        // 1. Autenticar usuario
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) return json({ error: 'Unauthorized' }, 401)

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: authHeader } } },
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return json({ error: 'Unauthorized' }, 401)

        // 2. Leer parámetros (SIN precio, eso lo calcula el servidor)
        const { kind, id, returnPath } = await req.json()
        // kind: 'order' | 'membership'
        // id:   uuid de la orden o membresía

        // 3. Calcular monto real del lado servidor (service_role)
        const admin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        )

        let amountCents = 0
        let reference = ''

        if (kind === 'order') {
            const { data: order, error } = await admin
                .from('orders')
                .select('id, user_id, total, status')
                .eq('id', id)
                .single()
            if (error || !order) return json({ error: 'Order not found' }, 404)
            if (order.user_id !== user.id) return json({ error: 'Forbidden' }, 403)
            if (order.status !== 'pending') return json({ error: 'Invalid state' }, 400)
            amountCents = Math.round(Number(order.total) * 100)
            reference = `Multi Flash Order #${id.slice(0, 8).toUpperCase()}`

        } else if (kind === 'membership') {
            const { data: m, error } = await admin
                .from('memberships')
                .select('id, user_id, plan, status')
                .eq('id', id)
                .single()
            if (error || !m) return json({ error: 'Membership not found' }, 404)
            if (m.user_id !== user.id) return json({ error: 'Forbidden' }, 403)
            if (m.status !== 'pending') return json({ error: 'Invalid state' }, 400)
            // Precio CALCULADO EN SERVIDOR, no recibido del cliente
            const prices = { monthly: 499, annual: 3999 }   // en centavos
            amountCents = prices[m.plan as 'monthly' | 'annual']
            if (!amountCents) return json({ error: 'Invalid plan' }, 400)
            reference = `Multi Flash Membership #${id.slice(0, 8).toUpperCase()}`

        } else {
            return json({ error: 'Invalid kind' }, 400)
        }

        // 4. Llamar a PayPhone con token del servidor
        const resp = await fetch(`${PAYPHONE_BASE}/api/button/Prepare`, {
            method: 'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${Deno.env.get('PAYPHONE_TOKEN')}`,
            },
            body: JSON.stringify({
                amount:              amountCents,
                amountWithTax:       0,
                amountWithoutTax:    amountCents,
                tax: 0, service: 0, tip: 0,
                currency:            'USD',
                storeId:             Deno.env.get('PAYPHONE_APP_ID'),
                clientTransactionId: id,
                responseUrl:         `${returnPath}?kind=${kind}`,
                cancellationUrl:     `${returnPath.replace('/resultado', '/cancelado')}?kind=${kind}`,
                reference,
            }),
        })

        if (!resp.ok) {
            const text = await resp.text()
            return json({
                error: `PayPhone ${resp.status}`,
                sentToPayphone: payphoneBody,
                payphoneResponse: text.slice(0, 200),
            }, 502)
        }

        const data = await resp.json()
        return json({ payWithCard: data.payWithCard })

    } catch (err) {
        return json({ error: err.message }, 500)
    }
})

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
}