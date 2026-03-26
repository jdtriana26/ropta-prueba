// src/pages/MembershipPage.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
    Crown, Check, Loader2, Copy, CheckCircle2,
    Sparkles, Tag, RefreshCw, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { createTransaction } from '../lib/payphone'
import { useAuthStore } from '../store/useAuthStore'

const PLANS = {
    monthly: {
        label:    'Mensual',
        price:    4.99,
        period:   'mes',
        days:     30,
        savings:  null,
        popular:  false,
    },
    annual: {
        label:   'Anual',
        price:   39.99,
        period:  'año',
        days:    365,
        savings: 'Ahorras $19.89',
        popular: true,
    },
}

const BENEFITS = [
    { icon: Tag,      text: 'Cupón de 10% OFF cada mes' },
    { icon: Sparkles, text: 'Acceso anticipado a nuevas colecciones' },
    { icon: Crown,    text: 'Badge exclusivo de miembro VYBE' },
]

// ── Copiar al portapapeles ────────────────────────────────────────────────────
function CouponCard({ coupon }) {
    const [copied, setCopied] = useState(false)

    const copy = () => {
        navigator.clipboard.writeText(coupon.code)
        setCopied(true)
        toast.success('Código copiado')
        setTimeout(() => setCopied(false), 2000)
    }

    const expired   = new Date(coupon.expires_at) < new Date()
    const daysLeft  = Math.max(0, Math.ceil(
        (new Date(coupon.expires_at) - new Date()) / (1000 * 60 * 60 * 24)
    ))

    return (
        <div className={`relative rounded-2xl border-2 border-dashed p-5 ${
            coupon.used || expired
                ? 'border-gray-200 bg-gray-50 opacity-60'
                : 'border-brand-300 bg-brand-50'
        }`}>
            {/* Badge estado */}
            {coupon.used && (
                <span className="absolute top-3 right-3 badge bg-gray-200 text-gray-500 text-xs">Usado</span>
            )}
            {expired && !coupon.used && (
                <span className="absolute top-3 right-3 badge bg-red-100 text-red-500 text-xs">Expirado</span>
            )}
            {!coupon.used && !expired && (
                <span className="absolute top-3 right-3 badge bg-green-100 text-green-600 text-xs">
          {daysLeft}d restantes
        </span>
            )}

            <div className="flex items-center gap-2 mb-2">
                <Tag size={16} className="text-brand-400" />
                <span className="text-sm font-medium text-gray-600">{coupon.discount_pct}% de descuento</span>
            </div>

            <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-xl font-bold text-brand-500 tracking-widest">
                    {coupon.code}
                </code>
                {!coupon.used && !expired && (
                    <button
                        onClick={copy}
                        className="p-2 rounded-xl hover:bg-brand-100 transition-colors"
                    >
                        {copied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} className="text-brand-400" />}
                    </button>
                )}
            </div>

            <p className="text-xs text-gray-400 mt-2">
                Válido hasta {new Date(coupon.expires_at).toLocaleDateString('es-EC', {
                day: '2-digit', month: 'long', year: 'numeric'
            })}
            </p>
        </div>
    )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function MembershipPage() {
    const { user }    = useAuthStore()
    const navigate    = useNavigate()
    const qc          = useQueryClient()
    const [plan, setPlan]         = useState('annual')
    const [processing, setProcessing] = useState(false)

    // Membresía activa del usuario
    const { data: membership, isLoading: loadingMembership } = useQuery({
        queryKey: ['membership', user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('memberships')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .gte('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            return data
        },
        enabled: !!user,
    })

    // Cupones del usuario
    const { data: coupons = [] } = useQuery({
        queryKey: ['membership-coupons', user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('membership_coupons')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            return data
        },
        enabled: !!user && !!membership,
    })

    // Generar cupón del mes
    const generateCoupon = useMutation({
        mutationFn: async () => {
            if (!membership) throw new Error('No tienes membresía activa')

            // Verificar que no tenga ya un cupón activo este mes
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)

            const existing = coupons.find(c =>
                new Date(c.created_at) >= startOfMonth && !c.used
            )
            if (existing) {
                toast.error('Ya tienes un cupón activo este mes')
                return
            }

            // Generar código único
            const { data: code } = await supabase.rpc('generate_coupon_code', { prefix: 'VYBE' })

            // Expira al final del mes
            const expiresAt = new Date()
            expiresAt.setMonth(expiresAt.getMonth() + 1)
            expiresAt.setDate(0)
            expiresAt.setHours(23, 59, 59)

            const { error } = await supabase.from('membership_coupons').insert({
                user_id:       user.id,
                membership_id: membership.id,
                code,
                discount_pct:  10,
                expires_at:    expiresAt.toISOString(),
            })
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('¡Cupón generado!')
            qc.invalidateQueries(['membership-coupons'])
        },
        onError: (e) => toast.error(e.message),
    })

    // Suscribirse
    const handleSubscribe = async () => {
        if (!user) {
            navigate('/login', { state: { from: '/membresia' } })
            return
        }
        setProcessing(true)
        try {
            const selectedPlan = PLANS[plan]

            // Crear membresía pendiente
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + selectedPlan.days)

            const { data: newMembership, error } = await supabase
                .from('memberships')
                .insert({
                    user_id:    user.id,
                    plan,
                    status:     'pending',
                    price_paid: selectedPlan.price,
                    expires_at: expiresAt.toISOString(),
                })
                .select()
                .single()
            if (error) throw error

            // Guardar en sessionStorage para recuperar al volver
            sessionStorage.setItem('pendingMembershipId', newMembership.id)

            // Crear transacción en PayPhone
            const txData = await createTransaction({
                amount:     selectedPlan.price,
                orderId:    newMembership.id,
                clientTxId: newMembership.id,
            })

            if (!txData.payWithCard) throw new Error('No se obtuvo URL de pago')
            window.location.href = txData.payWithCard

        } catch (err) {
            toast.error('Error: ' + err.message)
            setProcessing(false)
        }
    }

    // Cancelar membresía
    const cancelMembership = async () => {
        if (!window.confirm('¿Cancelar tu membresía? Seguirá activa hasta su fecha de expiración.')) return
        await supabase.from('memberships').update({ status: 'cancelled' }).eq('id', membership.id)
        qc.invalidateQueries(['membership'])
        toast.success('Membresía cancelada. Sigue activa hasta ' + new Date(membership.expires_at).toLocaleDateString('es-EC'))
    }

    const isActive   = !!membership
    const expiryDate = membership
        ? new Date(membership.expires_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })
        : null

    // Cupón activo este mes
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)
    const activeCoupon = coupons.find(c => new Date(c.created_at) >= startOfMonth && !c.used && new Date(c.expires_at) > new Date())

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">

            {/* Header */}
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown size={32} className="text-brand-400" />
                </div>
                <h1 className="font-display text-4xl font-extrabold text-gray-900">VYBE Premium</h1>
                <p className="text-gray-400 mt-2">Accede a beneficios exclusivos cada mes</p>
            </div>

            {loadingMembership ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-brand-400" />
                </div>

            ) : isActive ? (
                /* ── USUARIO CON MEMBRESÍA ── */
                <div className="space-y-6">

                    {/* Estado membresía */}
                    <div className="bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl p-6 text-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Crown size={18} />
                                    <span className="font-display font-bold text-lg">Miembro Premium</span>
                                </div>
                                <p className="text-brand-100 text-sm">
                                    Plan {membership.plan === 'monthly' ? 'mensual' : 'anual'} · Activo hasta {expiryDate}
                                </p>
                            </div>
                            <span className="badge bg-white/20 text-white text-xs">Activo</span>
                        </div>

                        {/* Beneficios activos */}
                        <div className="mt-4 space-y-1.5">
                            {BENEFITS.map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-center gap-2 text-sm text-brand-100">
                                    <Check size={14} className="text-white flex-shrink-0" />
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cupón del mes */}
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-display font-bold text-gray-900 flex items-center gap-2">
                                <Tag size={16} className="text-brand-400" />
                                Tu cupón de este mes
                            </h2>
                            {!activeCoupon && (
                                <button
                                    onClick={() => generateCoupon.mutate()}
                                    disabled={generateCoupon.isPending}
                                    className="btn-primary text-sm py-1.5 flex items-center gap-1.5"
                                >
                                    {generateCoupon.isPending
                                        ? <Loader2 size={14} className="animate-spin" />
                                        : <Sparkles size={14} />
                                    }
                                    Generar cupón
                                </button>
                            )}
                        </div>

                        {activeCoupon ? (
                            <CouponCard coupon={activeCoupon} />
                        ) : (
                            <div className="text-center py-6 text-gray-400">
                                <Tag size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Genera tu cupón del mes para obtener 10% OFF en tu próxima compra.</p>
                            </div>
                        )}
                    </div>

                    {/* Historial de cupones */}
                    {coupons.filter(c => !activeCoupon || c.id !== activeCoupon.id).length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm p-5">
                            <h2 className="font-display font-bold text-gray-900 mb-4">Cupones anteriores</h2>
                            <div className="space-y-3">
                                {coupons
                                    .filter(c => !activeCoupon || c.id !== activeCoupon.id)
                                    .map(c => <CouponCard key={c.id} coupon={c} />)
                                }
                            </div>
                        </div>
                    )}

                    {/* Cancelar */}
                    {membership.status === 'active' && (
                        <div className="text-center">
                            <button
                                onClick={cancelMembership}
                                className="text-sm text-gray-400 hover:text-red-500 transition-colors underline"
                            >
                                Cancelar membresía
                            </button>
                        </div>
                    )}
                </div>

            ) : (
                /* ── USUARIO SIN MEMBRESÍA ── */
                <div className="space-y-6">

                    {/* Beneficios */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {BENEFITS.map(({ icon: Icon, text }) => (
                            <div key={text} className="bg-white rounded-2xl shadow-sm p-4 text-center">
                                <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Icon size={18} className="text-brand-400" />
                                </div>
                                <p className="text-sm text-gray-600">{text}</p>
                            </div>
                        ))}
                    </div>

                    {/* Planes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(PLANS).map(([key, p]) => (
                            <button
                                key={key}
                                onClick={() => setPlan(key)}
                                className={`relative text-left p-6 rounded-2xl border-2 transition-all ${
                                    plan === key
                                        ? 'border-brand-400 bg-brand-50'
                                        : 'border-gray-200 bg-white hover:border-brand-300'
                                }`}
                            >
                                {p.popular && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-brand-400 text-white text-xs px-3 py-1">
                    Más popular
                  </span>
                                )}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-display font-bold text-gray-900">{p.label}</p>
                                        {p.savings && (
                                            <p className="text-xs text-green-600 font-medium mt-0.5">{p.savings}</p>
                                        )}
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                        plan === key ? 'border-brand-400 bg-brand-400' : 'border-gray-300'
                                    }`}>
                                        {plan === key && <Check size={12} className="text-white" />}
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-extrabold text-brand-500">
                    ${p.price}
                  </span>
                                    <span className="text-gray-400 text-sm">/ {p.period}</span>
                                </div>
                                {key === 'annual' && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Equivale a ${(p.price / 12).toFixed(2)}/mes
                                    </p>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Botón suscribirse */}
                    <button
                        onClick={handleSubscribe}
                        disabled={processing}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
                    >
                        {processing
                            ? <><Loader2 size={18} className="animate-spin" /> Procesando...</>
                            : <><Crown size={18} /> Suscribirme por ${PLANS[plan].price}/{PLANS[plan].period}</>
                        }
                    </button>

                    <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
                        <AlertCircle size={12} />
                        El pago se procesa de forma segura vía PayPhone. Puedes cancelar cuando quieras.
                    </p>
                </div>
            )}
        </div>
    )
}