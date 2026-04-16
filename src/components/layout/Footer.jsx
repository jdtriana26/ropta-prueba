// src/components/layout/Footer.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Facebook, X, ChevronDown, ChevronUp, Send, Loader2, BadgeCheck, MapPin, Phone } from 'lucide-react'

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

// ── Garantía ──────────────────────────────────────────────────────────────────
function WarrantyModal({ onClose }) {
    const [open, setOpen] = useState(null)
    const toggle = (key) => setOpen(prev => prev === key ? null : key)

    const SECTIONS = [
        {
            key: 'coverage',
            title: '🛡️ ¿Qué cubre la garantía?',
            content: (
                <div className="text-sm text-gray-600 space-y-3">
                    <p>Todos los productos Multi Flash cuentan con <strong>6 meses de garantía</strong> contra defectos de fábrica a partir de la fecha de compra.</p>
                    <div>
                        <p className="font-semibold text-gray-800 mb-2">La garantía cubre:</p>
                        <ul className="space-y-1 text-gray-500">
                            <li>✅ Defectos de fabricación o materiales</li>
                            <li>✅ Fallas eléctricas o mecánicas sin uso indebido</li>
                            <li>✅ Piezas defectuosas de origen</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800 mb-2">La garantía NO cubre:</p>
                        <ul className="space-y-1 text-gray-500">
                            <li>❌ Daños por mal uso o accidentes</li>
                            <li>❌ Desgaste natural del producto</li>
                            <li>❌ Daños por caídas o golpes</li>
                            <li>❌ Reparaciones no autorizadas</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            key: 'process',
            title: '📋 ¿Cómo hacer válida la garantía?',
            content: (
                <div className="text-sm text-gray-600 space-y-2">
                    <ol className="space-y-2 list-decimal list-inside">
                        <li>Contáctanos por email a <strong>multireflash2026@gmail.com</strong> con tu número de pedido</li>
                        <li>Describe el problema y adjunta fotos o video del defecto</li>
                        <li>Nuestro equipo evaluará el caso en 24–48 horas hábiles</li>
                        <li>Si aplica, te enviaremos las instrucciones para la devolución</li>
                        <li>Recibido el producto, lo reemplazamos o reembolsamos en 5 días hábiles</li>
                    </ol>
                </div>
            )
        },
        {
            key: 'zones',
            title: '📍 Zonas de cobertura',
            content: (
                <div className="text-sm text-gray-600 space-y-2">
                    <p>Ofrecemos servicio de garantía en nuestras zonas de operación:</p>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                        {['Quito', 'Guayaquil', 'El Quinche'].map(city => (
                            <div key={city} className="bg-brand-50 rounded-xl p-3 text-center">
                                <MapPin size={18} className="text-brand-400 mx-auto mb-1" />
                                <p className="text-sm font-semibold text-brand-700">{city}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                        Para otras zonas, coordinaremos el retiro del producto a través de courier con costo compartido.
                    </p>
                </div>
            )
        },
        {
            key: 'legal',
            title: 'Informacion extra',
            content: (
                <Link to="/terminos" className="block hover:text-brand-400 transition-colors">Términos y condiciones</Link>,
                <Link to="/privacidad" className="block hover:text-brand-400 transition-colors">Política de privacidad</Link>,
                <Link to="/devoluciones" className="block hover:text-brand-400 transition-colors">Política de devoluciones</Link>,
            )
        },

    ]

    return (
        <Modal title="Garantía — 6 meses" onClose={onClose}>
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                <BadgeCheck size={24} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold text-brand-800 text-sm">Todos los productos incluyen 6 meses de garantía</p>
                    <p className="text-brand-600 text-xs mt-0.5">Válida desde la fecha de compra, contra defectos de fábrica.</p>
                </div>
            </div>
            <div className="space-y-2">
                {SECTIONS.map(({ key, title, content }) => (
                    <div key={key} className="border border-gray-100 rounded-xl overflow-hidden">
                        <button
                            onClick={() => toggle(key)}
                            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className="font-display font-semibold text-gray-800">{title}</span>
                            {open === key ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </button>
                        {open === key && (
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
                            { type: 'Envío estándar', time: '3–5 días hábiles', price: '$4.99' },
                            { type: 'Envío express',  time: '1–2 días hábiles', price: '$9.99' },
                            { type: 'Envío gratis',   time: '3–5 días hábiles', price: 'En compras +$50' },
                        ].map(item => (
                            <div key={item.type} className="bg-gray-50 rounded-xl p-3">
                                <p className="font-semibold text-gray-800">{item.type}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{item.time}</p>
                                <p className="text-brand-400 font-medium mt-1">{item.price}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-gray-400 text-xs pt-1">
                        Entrega en : Quito, Guayaquil y El Quinche. Para otras ciudades se realizara envio normal.
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
                    <p>Revisa el estado en cualquier momento desde <strong>Mis pedidos</strong> en tu cuenta.</p>
                    <p>Estados: <span className="text-yellow-600 font-medium">Pendiente</span> → <span className="text-blue-600 font-medium">Confirmado</span> → <span className="text-purple-600 font-medium">Procesando</span> → <span className="text-indigo-600 font-medium">Enviado</span> → <span className="text-green-600 font-medium">Entregado</span></p>
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
                        <p className="font-semibold text-gray-800 mb-1">Condiciones:</p>
                        <ul className="space-y-1 text-gray-500">
                            <li>✓ Producto sin usar y en su empaque original</li>
                            <li>✓ Con todos los accesorios incluidos</li>
                            <li>✗ No aplica para productos en liquidación</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800 mb-1">Proceso:</p>
                        <ol className="space-y-1 text-gray-500 list-decimal list-inside">
                            <li>Escríbenos a multireflash2026@gmail.com con tu número de pedido</li>
                            <li>Te enviamos instrucciones de devolución</li>
                            <li>Recibido el producto, reembolsamos en 3–5 días hábiles</li>
                        </ol>
                    </div>
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
                            {openSection === key ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
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
        'Garantía',
        'Cambio o devolución',
        'Otro',
    ]

    const handleSend = async (e) => {
        e.preventDefault()
        if (!form.name || !form.email || !form.message) return
        setSending(true)
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
                <p className="text-gray-400 text-sm">Te responderemos en un plazo de 24–48 horas hábiles.</p>
                <button onClick={onClose} className="btn-primary mt-6">Cerrar</button>
            </div>
        </Modal>
    )

    return (
        <Modal title="Contáctanos" onClose={onClose}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {[
                    { icon: '📧', label: 'Email',   value: 'multireflash2026@gmail.com' },
                    { icon: '📱', label: 'WhatsApp', value: '------' },
                    { icon: '🕐', label: 'Horario',  value: 'Lun–Sáb 9:00–18:00' },
                ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-2xl mb-1">{item.icon}</div>
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className="text-sm font-medium text-gray-700 mt-0.5 break-all">{item.value}</p>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSend} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input className="input" placeholder="Juan Pérez" value={form.name}
                               onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input type="email" className="input" placeholder="tu@email.com" value={form.email}
                               onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                    <select className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                        <option value="">Selecciona un asunto</option>
                        {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
                    <textarea rows={4} className="input resize-none" placeholder="¿En qué podemos ayudarte?"
                              value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
                </div>
                <button type="submit" disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2">
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
    const [modal, setModal] = useState(null)

    return (
        <>
            <footer className="bg-gray-900 text-gray-300 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                        {/* Marca */}
                        <div className="md:col-span-1">
                            <div className="font-display text-2xl font-extrabold">
                                <span className="text-white">MULTI</span>
                                <span className="text-accent-400"> FLASH</span>
                            </div>
                            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                                Artículos para el hogar y cuidado personal con envío rápido a Quito, Guayaquil y El Quinche.
                            </p>
                            {/* Garantía badge */}
                            <div className="mt-4 flex items-center gap-2 bg-brand-400/10 border border-brand-400/20 rounded-xl px-3 py-2">
                                <BadgeCheck size={16} className="text-highlight-400 flex-shrink-0" />
                                <span className="text-xs text-gray-300">6 meses de garantía en todos los productos</span>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-brand-400 hover:text-white transition-colors">
                                    <Instagram size={16} />
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
                                    <button onClick={() => setModal('warranty')}
                                            className="hover:text-highlight-400 transition-colors text-left flex items-center gap-1.5">
                                        <BadgeCheck size={13} /> Garantía 6 meses
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => setModal('shipping')}
                                            className="hover:text-highlight-400 transition-colors text-left">
                                        Envíos y devoluciones
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => setModal('contact')}
                                            className="hover:text-highlight-400 transition-colors text-left">
                                        Contáctanos
                                    </button>
                                </li>
                                <li>
                                    <Link to="/mis-pedidos" className="hover:text-highlight-400 transition-colors block">
                                        Mis pedidos
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Newsletter */}
                        <div>
                            <h4 className="font-display font-semibold text-white mb-4">Novedades</h4>
                            <p className="text-sm text-gray-400 mb-3">
                                Recibe ofertas exclusivas y nuevos productos.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="tu@email.com"
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-400"
                                />
                                <button className="px-4 py-2 bg-accent-400 text-white rounded-xl text-sm font-medium hover:bg-accent-500 transition-colors">
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
                        <p>© 2026 Multi Flash. Todos los derechos reservados.</p>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-gray-300 transition-colors">Privacidad</a>
                            <a href="#" className="hover:text-gray-300 transition-colors">Términos</a>
                        </div>
                    </div>
                </div>
            </footer>

            {modal === 'warranty' && <WarrantyModal  onClose={() => setModal(null)} />}
            {modal === 'shipping' && <ShippingModal  onClose={() => setModal(null)} />}
            {modal === 'contact'  && <ContactModal   onClose={() => setModal(null)} />}
        </>
    )
}