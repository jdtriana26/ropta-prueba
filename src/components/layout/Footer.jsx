// src/components/layout/Footer.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Twitter, Facebook, X, ChevronDown, ChevronUp, Send, Loader2 } from 'lucide-react'

// ── Modal base ────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 animate-slide-up">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
                    <h2 className="font-display text-xl font-bold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">
                    {children}
                </div>
            </div>
        </div>
    )
}

// ── Guía de tallas ────────────────────────────────────────────────────────────
function SizeGuideModal({ onClose }) {
    const [open, setOpen] = useState('tops')

    const TABLES = {
        tops: {
            label: 'Camisetas y Chaquetas',
            headers: ['Talla', 'Pecho (cm)', 'Cintura (cm)', 'Cadera (cm)'],
            rows: [
                ['XS', '80-84', '62-66', '86-90'],
                ['S',  '85-89', '67-71', '91-95'],
                ['M',  '90-94', '72-76', '96-100'],
                ['L',  '95-99', '77-81', '101-105'],
                ['XL', '100-104', '82-86', '106-110'],
                ['XXL','105-109', '87-91', '111-115'],
            ]
        },
        bottoms: {
            label: 'Pantalones',
            headers: ['Talla', 'Cintura (cm)', 'Cadera (cm)', 'Largo (cm)'],
            rows: [
                ['XS', '62-66', '86-90',   '98'],
                ['S',  '67-71', '91-95',   '99'],
                ['M',  '72-76', '96-100',  '100'],
                ['L',  '77-81', '101-105', '101'],
                ['XL', '82-86', '106-110', '102'],
                ['XXL','87-91', '111-115', '103'],
            ]
        },
    }

    return (
        <Modal title="Guía de tallas" onClose={onClose}>
            {/* Cómo medir */}
            <div className="bg-brand-50 rounded-xl p-4 mb-5">
                <h3 className="font-display font-bold text-brand-700 mb-2 text-sm">¿Cómo tomar tus medidas?</h3>
                <ul className="text-sm text-brand-600 space-y-1.5">
                    <li>📏 <strong>Pecho:</strong> Mide la parte más ancha de tu pecho, pasando la cinta por las axilas.</li>
                    <li>📏 <strong>Cintura:</strong> Mide la parte más estrecha de tu cintura, generalmente sobre el ombligo.</li>
                    <li>📏 <strong>Cadera:</strong> Mide la parte más ancha de tus caderas.</li>
                </ul>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
                {Object.entries(TABLES).map(([key, { label }]) => (
                    <button
                        key={key}
                        onClick={() => setOpen(key)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            open === key
                                ? 'bg-brand-400 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                    <tr>
                        {TABLES[open].headers.map(h => (
                            <th key={h} className="px-4 py-3 text-left text-gray-500 font-medium">{h}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {TABLES[open].rows.map(([size, ...vals]) => (
                        <tr key={size} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-display font-bold text-brand-500">{size}</td>
                            {vals.map((v, i) => (
                                <td key={i} className="px-4 py-3 text-gray-600">{v}</td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-gray-400 mt-4">
                * Las medidas pueden variar ±2 cm según el diseño del producto. En caso de duda, recomendamos elegir la talla mayor.
            </p>
        </Modal>
    )
}

// ── Envíos y devoluciones ─────────────────────────────────────────────────────
function ShippingModal({ onClose }) {
    const [openSection, setOpenSection] = useState(null)

    const toggle = (key) => setOpenSection(prev => prev === key ? null : key)

    const SECTIONS = [
        {
            key: 'shipping',
            title: '🚚 Envíos',
            content: (
                <div className="space-y-3 text-sm text-gray-600">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { type: 'Envío estándar', time: '3-5 días hábiles', price: '$4.99' },
                            { type: 'Envío express',  time: '2-3 días hábiles', price: '$9.99' },
                            { type: 'Envío gratis',   time: '3-5 días hábiles', price: 'En compras +$50' },
                        ].map(item => (
                            <div key={item.type} className="bg-gray-50 rounded-xl p-3">
                                <p className="font-semibold text-gray-800">{item.type}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{item.time}</p>
                                <p className="text-brand-500 font-medium mt-1">{item.price}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-gray-500 text-xs pt-2">
                        Los tiempos de entrega aplican para envíos dentro de Ecuador. Para envíos internacionales contáctanos.
                    </p>
                </div>
            )
        },
        {
            key: 'tracking',
            title: '📦 Seguimiento de pedido',
            content: (
                <div className="text-sm text-gray-600 space-y-2">
                    <p>Una vez confirmado tu pedido recibirás un email con el número de seguimiento.</p>
                    <p>Puedes revisar el estado de tu pedido en cualquier momento desde <strong>Mis pedidos</strong> en tu cuenta.</p>
                    <p>Los estados son: <span className="text-yellow-600 font-medium">Pendiente</span> → <span className="text-blue-600 font-medium">Confirmado</span> → <span className="text-purple-600 font-medium">Procesando</span> → <span className="text-indigo-600 font-medium">Enviado</span> → <span className="text-green-600 font-medium">Entregado</span></p>
                </div>
            )
        },
        {
            key: 'returns',
            title: '↩️ Devoluciones',
            content: (
                <div className="text-sm text-gray-600 space-y-3">
                    <p>Aceptamos devoluciones hasta <strong>30 días</strong> después de la fecha de entrega.</p>
                    <div>
                        <p className="font-semibold text-gray-800 mb-1">Para que aplique la devolución:</p>
                        <ul className="space-y-1 text-gray-500">
                            <li>✓ El producto debe estar sin usar y con etiquetas originales</li>
                            <li>✓ Debe estar en su empaque original</li>
                            <li>✓ No aplica para productos en liquidación</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800 mb-1">Proceso de devolución:</p>
                        <ol className="space-y-1 text-gray-500 list-decimal list-inside">
                            <li>Contáctanos por email indicando tu número de pedido</li>
                            <li>Te enviaremos las instrucciones de envío</li>
                            <li>Una vez recibido el producto, procesamos el reembolso en 3-5 días hábiles</li>
                        </ol>
                    </div>
                </div>
            )
        },
        {
            key: 'exchanges',
            title: '🔄 Cambios de talla',
            content: (
                <div className="text-sm text-gray-600 space-y-2">
                    <p>Puedes solicitar un cambio de talla dentro de los primeros <strong>15 días</strong> después de recibir tu pedido.</p>
                    <p>El cambio está sujeto a disponibilidad de stock. Si la talla no está disponible, procesamos un reembolso completo.</p>
                    <p>El costo del envío de cambio es cubierto por VYBE en tu primera solicitud.</p>
                </div>
            )
        },
    ]

    return (
        <Modal title="Envíos y devoluciones" onClose={onClose}>
            <div className="space-y-2">
                {SECTIONS.map(({ key, title, content }) => (
                    <div key={key} className="border border-gray-100 rounded-xl overflow-hidden">
                        <button
                            onClick={() => toggle(key)}
                            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className="font-display font-semibold text-gray-800">{title}</span>
                            {openSection === key
                                ? <ChevronUp size={16} className="text-gray-400" />
                                : <ChevronDown size={16} className="text-gray-400" />
                            }
                        </button>
                        {openSection === key && (
                            <div className="px-4 pb-4 animate-fade-in border-t border-gray-50 pt-3">
                                {content}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </Modal>
    )
}

// ── Contáctanos ───────────────────────────────────────────────────────────────
function ContactModal({ onClose }) {
    const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '' })
    const [sending, setSending] = useState(false)
    const [sent,    setSent]    = useState(false)

    const SUBJECTS = [
        'Consulta sobre un pedido',
        'Problema con un producto',
        'Cambio o devolución',
        'Consulta sobre tallas',
        'Otro',
    ]

    const handleSend = async (e) => {
        e.preventDefault()
        if (!form.name || !form.email || !form.message) return
        setSending(true)
        // Simular envío — aquí puedes conectar con EmailJS, Resend, etc.
        await new Promise(r => setTimeout(r, 1500))
        setSending(false)
        setSent(true)
    }

    if (sent) return (
        <Modal title="Contáctanos" onClose={onClose}>
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send size={28} className="text-brand-400" />
                </div>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">¡Mensaje enviado!</h3>
                <p className="text-gray-400 text-sm">
                    Nos pondremos en contacto contigo en un plazo de 24-48 horas hábiles.
                </p>
                <button onClick={onClose} className="btn-primary mt-6">Cerrar</button>
            </div>
        </Modal>
    )

    return (
        <Modal title="Contáctanos" onClose={onClose}>
            {/* Info de contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {[
                    { icon: '📧', label: 'Email', value: 'hola@vybe.ec' },
                    { icon: '📱', label: 'WhatsApp', value: '+593 99 999 9999' },
                    { icon: '🕐', label: 'Horario', value: 'Lun–Vie 9:00–18:00' },
                ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-2xl mb-1">{item.icon}</div>
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className="text-sm font-medium text-gray-700 mt-0.5">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Formulario */}
            <form onSubmit={handleSend} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input
                            className="input"
                            placeholder="Juan Pérez"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="tu@email.com"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                    <select
                        className="input"
                        value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    >
                        <option value="">Selecciona un asunto</option>
                        {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
                    <textarea
                        rows={4}
                        className="input resize-none"
                        placeholder="¿En qué podemos ayudarte?"
                        value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={sending}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                >
                    {sending
                        ? <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                        : <><Send size={16} /> Enviar mensaje</>
                    }
                </button>
            </form>
        </Modal>
    )
}

// ── Footer principal ──────────────────────────────────────────────────────────
export default function Footer() {
    const [modal, setModal] = useState(null) // null | 'sizes' | 'shipping' | 'contact'

    return (
        <>
            <footer className="bg-gray-900 text-gray-300 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                        {/* Marca */}
                        <div className="md:col-span-1">
                            <span className="font-display text-3xl font-extrabold text-brand-400">VYBE</span>
                            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                                Moda que habla por ti. Colecciones únicas para expresar tu estilo sin límites.
                            </p>
                            <div className="flex gap-3 mt-4">
                                <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-brand-400 hover:text-white transition-colors">
                                    <Instagram size={16} />
                                </a>
                                <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-brand-400 hover:text-white transition-colors">
                                    <Twitter size={16} />
                                </a>
                                <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-brand-400 hover:text-white transition-colors">
                                    <Facebook size={16} />
                                </a>
                            </div>
                        </div>

                        {/* Ayuda */}
                        <div>
                            <h4 className="font-display font-semibold text-white mb-4">Ayuda</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <button
                                        onClick={() => setModal('sizes')}
                                        className="hover:text-brand-400 transition-colors text-left"
                                    >
                                        Guía de tallas
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setModal('shipping')}
                                        className="hover:text-brand-400 transition-colors text-left"
                                    >
                                        Envíos y devoluciones
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setModal('contact')}
                                        className="hover:text-brand-400 transition-colors text-left"
                                    >
                                        Contáctanos
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Newsletter */}
                        <div>
                            <h4 className="font-display font-semibold text-white mb-4">Novedades</h4>
                            <p className="text-sm text-gray-400 mb-3">
                                Recibe las últimas colecciones y ofertas exclusivas.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="tu@email.com"
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-400"
                                />
                                <button className="px-4 py-2 bg-brand-400 text-white rounded-xl text-sm font-medium hover:bg-brand-500 transition-colors">
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
                        <p>© 2026 VYBE. Todos los derechos reservados.</p>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-gray-300 transition-colors">Privacidad</a>
                            <a href="#" className="hover:text-gray-300 transition-colors">Términos</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Modales */}
            {modal === 'sizes'    && <SizeGuideModal    onClose={() => setModal(null)} />}
            {modal === 'shipping' && <ShippingModal     onClose={() => setModal(null)} />}
            {modal === 'contact'  && <ContactModal      onClose={() => setModal(null)} />}
        </>
    )
}