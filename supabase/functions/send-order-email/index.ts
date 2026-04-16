// supabase/functions/send-order-email/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
    try {
        const { orderId } = await req.json()

        const admin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        )

        // 1. Traer orden con items y datos del cliente
        const { data: order } = await admin
            .from('orders')
            .select(`
        id, total, subtotal, shipping_cost, shipping_info, created_at,
        profiles:user_id(email, full_name),
        order_items(
          quantity, unit_price,
          product_variants(
            size, color,
            products(name, slug)
          )
        )
      `)
            .eq('id', orderId)
            .single()

        if (!order) return json({ error: 'order not found' }, 404)

        const customerEmail = order.profiles?.email
        const customerName  = order.profiles?.full_name ?? 'Cliente'
        const shopEmail     = Deno.env.get('SHOP_EMAIL')!

        const itemsHtml = order.order_items.map((i: any) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">
          ${i.product_variants.products.name}
          <small style="color:#999">(${i.product_variants.size} / ${i.product_variants.color})</small>
        </td>
        <td align="center" style="padding:8px;border-bottom:1px solid #eee">${i.quantity}</td>
        <td align="right" style="padding:8px;border-bottom:1px solid #eee">$${(i.unit_price * i.quantity).toFixed(2)}</td>
      </tr>
    `).join('')

        const orderIdShort = order.id.slice(0, 8).toUpperCase()
        const shipping = order.shipping_info ?? {}

        const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
        <h1 style="color:#1e3a8a">¡Gracias por tu compra, ${customerName}!</h1>
        <p>Tu orden <strong>#${orderIdShort}</strong> fue confirmada y está siendo preparada.</p>

        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <thead>
            <tr style="background:#f5f5f5">
              <th align="left" style="padding:8px">Producto</th>
              <th style="padding:8px">Cant.</th>
              <th align="right" style="padding:8px">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr><td colspan="2" align="right" style="padding:8px">Subtotal</td>
                <td align="right" style="padding:8px">$${Number(order.subtotal).toFixed(2)}</td></tr>
            <tr><td colspan="2" align="right" style="padding:8px">Envío</td>
                <td align="right" style="padding:8px">$${Number(order.shipping_cost).toFixed(2)}</td></tr>
            <tr style="font-weight:bold;font-size:16px">
                <td colspan="2" align="right" style="padding:8px">Total</td>
                <td align="right" style="padding:8px;color:#1e3a8a">$${Number(order.total).toFixed(2)}</td></tr>
          </tfoot>
        </table>

        <h3>Envío a:</h3>
        <p>${shipping.address ?? ''}<br>${shipping.city ?? ''}<br>Tel: ${shipping.phone ?? ''}</p>

        <p style="color:#666;font-size:12px;margin-top:30px">
          Recibirás otro email cuando tu pedido salga a despacho.<br>
          Multi Flash · 6 meses de garantía en todos los productos.
        </p>
      </div>
    `

        // 2. Enviar al cliente
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
                'Content-Type':  'application/json',
            },
            body: JSON.stringify({
                from:    'Multi Flash <ventas@multiflash.ec>',   // tu dominio verificado
                to:      customerEmail,
                subject: `Confirmación de pedido #${orderIdShort}`,
                html,
            }),
        })

        // 3. Notificarte a ti (admin)
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
                'Content-Type':  'application/json',
            },
            body: JSON.stringify({
                from:    'Multi Flash <ventas@multiflash.ec>',
                to:      shopEmail,
                subject: `🛒 Nuevo pedido #${orderIdShort} - $${Number(order.total).toFixed(2)}`,
                html:    `<p>Cliente: ${customerName} (${customerEmail})</p>${html}`,
            }),
        })

        return json({ sent: true })
    } catch (err) {
        console.error(err)
        return json({ error: err.message }, 500)
    }
})

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })
}