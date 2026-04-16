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
        if (!authHeader) return json({ error: 'No auth header' }, 401)

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: authHeader } } },
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return json({ error: 'User not authenticated' }, 401)

        // 2. Leer parámetros
        const { kind, id, returnPath } = await req.json()

        // 3. Calcular monto real del lado servidor
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
            if (error || !order) return json({ error: `Order not found: ${error?.message}` }, 404)
            if (order.user_id !== user.id) return json({ error: 'Forbidden' }, 403)
            if (order.status !== 'pending') return json({ error: `Invalid state: ${order.status}` }, 400)
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
            const prices: Record<string, number> = { monthly: 499, annual: 3999 }
            amountCents = prices[m.plan] ?? 0
            if (!amountCents) return json({ error: 'Invalid plan' }, 400)
            reference = `Multi Flash Membership #${id.slice(0, 8).toUpperCase()}`

        } else {
            return json({ error: `Invalid kind: ${kind}` }, 400)
        }

        // 4. Construir body para PayPhone
        const payphoneBody = {
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
        }

        // 5. Llamar a PayPhone
        const resp = await fetch(`${PAYPHONE_BASE}/api/button/Prepare`, {
            method: 'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${Deno.env.get('PAYPHONE_TOKEN')}`,
            },
            body: JSON.stringify(payphoneBody),
        })

        const responseText = await resp.text()

        if (!resp.ok) {
            return json({
                error: `PayPhone ${resp.status}`,
                sentToPayphone: payphoneBody,
                payphoneResponse: responseText.slice(0, 200),
            }, 502)
        }

        const data = JSON.parse(responseText)
        return json({ payWithCard: data.payWithCard })

    } catch (err) {
        return json({ error: `Server error: ${err.message}` }, 500)
    }
})

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
}