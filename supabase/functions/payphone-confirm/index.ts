// supabase/functions/payphone-confirm/index.ts
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
        const { id, clientTxId, kind } = await req.json()

        // ── DEBUG ──
        const token = Deno.env.get('PAYPHONE_TOKEN')
        console.log('PAYPHONE_TOKEN exists:', !!token, 'length:', token?.length ?? 0)
        console.log('Confirm request:', JSON.stringify({ id, clientTxId, kind }))

        if (!token) {
            return json({ error: 'PAYPHONE_TOKEN not configured in Edge Function secrets' }, 500)
        }

        // 1. Confirmar en PayPhone (servidor -> servidor, token seguro)
        const resp = await fetch(`${PAYPHONE_BASE}/api/button/V2/Confirm`, {
            method: 'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ id: Number(id), clientTxId }),
        })

        const responseText = await resp.text()
        console.log('PayPhone confirm status:', resp.status)
        console.log('PayPhone confirm response:', responseText)

        if (!resp.ok) {
            return json({ error: `PayPhone ${resp.status}: ${responseText}` }, 502)
        }

        const tx = JSON.parse(responseText)
        const approved = tx.transactionStatus === 'Approved'

        // 2. Actualizar DB con service_role (las RLS no pueden bloquearnos)
        const admin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        )

        if (kind === 'order') {
            await admin.from('orders').update({
                status:           approved ? 'paid' : 'cancelled',
                payment_provider: 'payphone',
                payment_ref:      String(id),
                paid_at:          approved ? new Date().toISOString() : null,
            }).eq('id', clientTxId)

            // 🆕 Si no se aprobó, devuelve el stock
            if (!approved) {
                await admin.rpc('restore_stock', { p_order_id: clientTxId })
            }
        }

        return json({ approved, status: tx.transactionStatus })

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