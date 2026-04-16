// src/pages/legal/PrivacyPage.jsx
export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-12 prose prose-sm">
            <h1 className="font-display text-3xl font-extrabold mb-2">Política de Privacidad</h1>
            <p className="text-gray-400 text-sm mb-8">Última actualización: abril de 2026</p>

            <p>Esta política explica cómo Multi Flash ([TU RAZÓN SOCIAL], RUC [TU RUC]) recopila y usa tus datos personales, en cumplimiento de la Ley Orgánica de Protección de Datos Personales (LOPDP) del Ecuador.</p>

            <h2>1. Responsable del tratamiento</h2>
            <p>[TU RAZÓN SOCIAL], domiciliada en [DIRECCIÓN]. Contacto para temas de privacidad: privacidad@multiflash.ec</p>

            <h2>2. Datos que recopilamos</h2>
            <ul>
                <li><strong>Datos de registro:</strong> nombre, email, contraseña (cifrada).</li>
                <li><strong>Datos de compra:</strong> dirección de envío, teléfono, historial de pedidos.</li>
                <li><strong>Datos de pago:</strong> NO almacenamos datos de tarjeta. El pago lo procesa directamente PayPhone.</li>
                <li><strong>Datos de navegación:</strong> páginas visitadas, IP, tipo de dispositivo (vía Vercel Analytics y cookies técnicas).</li>
            </ul>

            <h2>3. Finalidad del tratamiento</h2>
            <ul>
                <li>Procesar y enviar tus pedidos.</li>
                <li>Responder consultas y dar soporte post-venta.</li>
                <li>Enviar comunicaciones transaccionales (confirmación de pedido, estado de envío).</li>
                <li>Mejorar la experiencia del sitio mediante análisis agregado.</li>
            </ul>
            <p>No vendemos ni cedemos tus datos a terceros con fines comerciales.</p>

            <h2>4. Base legal</h2>
            <p>El tratamiento se basa en la ejecución del contrato de compraventa (art. 7 LOPDP) y en tu consentimiento expreso al momento de registrarte.</p>

            <h2>5. Terceros con los que compartimos datos</h2>
            <ul>
                <li><strong>Supabase Inc.</strong> — almacenamiento seguro de la base de datos.</li>
                <li><strong>PayPhone</strong> — procesamiento de pagos.</li>
                <li><strong>Vercel Inc.</strong> — hosting del sitio y analítica.</li>
                <li><strong>Resend Inc.</strong> — envío de emails transaccionales.</li>
                <li><strong>Couriers</strong> (Servientrega, Tramaco u otros) — entrega del pedido.</li>
            </ul>

            <h2>6. Tiempo de conservación</h2>
            <p>Conservamos tus datos mientras tengas cuenta activa y durante 7 años después del último pedido, por obligaciones tributarias (SRI).</p>

            <h2>7. Tus derechos (LOPDP)</h2>
            <p>Puedes ejercer tus derechos de acceso, rectificación, eliminación, oposición, portabilidad y limitación del tratamiento escribiendo a <strong>privacidad@multiflash.ec</strong>. Responderemos en máximo 15 días hábiles.</p>

            <h2>8. Cookies</h2>
            <p>Usamos cookies técnicas necesarias para el funcionamiento (sesión, carrito) y cookies analíticas de Vercel. No usamos cookies publicitarias ni de terceros con fines de marketing.</p>

            <h2>9. Seguridad</h2>
            <p>Tus contraseñas se almacenan cifradas (bcrypt). Las comunicaciones usan HTTPS. No obstante, ningún sistema es 100% seguro. Te recomendamos usar contraseñas únicas.</p>

            <h2>10. Menores de edad</h2>
            <p>No vendemos a menores de 18 años. Si detectamos un registro de un menor, eliminamos la cuenta.</p>

            <h2>11. Reclamos ante la autoridad</h2>
            <p>Puedes presentar un reclamo ante la Superintendencia de Protección de Datos Personales del Ecuador si consideras vulnerados tus derechos.</p>
        </div>
    )
}
