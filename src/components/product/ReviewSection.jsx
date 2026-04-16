// src/components/product/ReviewSection.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Loader2, MessageSquare, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'

// ── Estrellas clickeables ────────────────────────────────────────────────────
function StarRating({ rating, onRate, size = 20, interactive = false }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    disabled={!interactive}
                    onClick={() => interactive && onRate?.(star)}
                    className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
                >
                    <Star
                        size={size}
                        className={star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                        }
                    />
                </button>
            ))}
        </div>
    )
}

// ── Barra de distribución ────────────────────────────────────────────────────
function RatingBar({ stars, count, total }) {
    const pct = total > 0 ? (count / total) * 100 : 0
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="w-3 text-gray-500 text-right">{stars}</span>
            <Star size={10} className="fill-yellow-400 text-yellow-400 flex-shrink-0" />
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-6 text-gray-400 text-right">{count}</span>
        </div>
    )
}

// ── Formulario de review ─────────────────────────────────────────────────────
function ReviewForm({ productId, existingReview, onClose }) {
    const qc   = useQueryClient()
    const user = useAuthStore(s => s.user)
    const isEdit = !!existingReview

    const [rating, setRating] = useState(existingReview?.rating ?? 0)
    const [title,  setTitle]  = useState(existingReview?.title ?? '')
    const [body,   setBody]   = useState(existingReview?.body ?? '')

    const mutation = useMutation({
        mutationFn: async () => {
            if (rating === 0) throw new Error('Selecciona una calificación')

            const payload = { product_id: productId, user_id: user.id, rating, title: title.trim() || null, body: body.trim() || null }

            if (isEdit) {
                const { error } = await supabase.from('product_reviews').update(payload).eq('id', existingReview.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('product_reviews').insert(payload)
                if (error) {
                    if (error.code === '23505') throw new Error('Ya dejaste una reseña en este producto')
                    throw error
                }
            }
        },
        onSuccess: () => {
            toast.success(isEdit ? 'Reseña actualizada' : '¡Gracias por tu reseña!')
            qc.invalidateQueries({ queryKey: ['reviews', productId] })
            qc.invalidateQueries({ queryKey: ['rating-stats', productId] })
            onClose?.()
        },
        onError: (e) => toast.error(e.message),
    })

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="font-display font-bold text-gray-900 mb-4">
                {isEdit ? 'Editar tu reseña' : 'Escribir una reseña'}
            </h3>

            <div className="space-y-4">
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Calificación</p>
                    <StarRating rating={rating} onRate={setRating} size={28} interactive />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título (opcional)</label>
                    <input
                        className="input"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Resumen de tu experiencia"
                        maxLength={100}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tu reseña (opcional)</label>
                    <textarea
                        className="input min-h-[100px] resize-y"
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder="¿Qué te pareció el producto?"
                        maxLength={1000}
                    />
                </div>

                <div className="flex gap-3 justify-end">
                    {onClose && (
                        <button onClick={onClose} className="btn-outline py-2 text-sm">Cancelar</button>
                    )}
                    <button
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending || rating === 0}
                        className="btn-primary py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
                        {isEdit ? 'Actualizar' : 'Publicar reseña'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Tarjeta de review individual ─────────────────────────────────────────────
function ReviewCard({ review, isOwn, onEdit, onDelete }) {
    const date = new Date(review.created_at).toLocaleDateString('es-EC', {
        day: 'numeric', month: 'long', year: 'numeric'
    })

    return (
        <div className="py-5 border-b border-gray-100 last:border-0">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 text-sm font-semibold flex-shrink-0">
                        {(review.profiles?.full_name ?? review.profiles?.email ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            {review.profiles?.full_name ?? 'Cliente'}
                        </p>
                        <p className="text-xs text-gray-400">{date}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} size={14} />
                    {isOwn && (
                        <div className="flex gap-1 ml-2">
                            <button onClick={onEdit} className="p-1 rounded hover:bg-gray-100">
                                <Pencil size={12} className="text-gray-400" />
                            </button>
                            <button onClick={onDelete} className="p-1 rounded hover:bg-red-50">
                                <Trash2 size={12} className="text-gray-400 hover:text-red-500" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {review.title && (
                <p className="font-semibold text-gray-900 text-sm mt-3">{review.title}</p>
            )}
            {review.body && (
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">{review.body}</p>
            )}
        </div>
    )
}

// ── Sección completa ─────────────────────────────────────────────────────────
export default function ReviewSection({ productId }) {
    const qc   = useQueryClient()
    const user = useAuthStore(s => s.user)
    const [showForm,    setShowForm]    = useState(false)
    const [editReview,  setEditReview]  = useState(null)

    // Stats
    const { data: stats } = useQuery({
        queryKey: ['rating-stats', productId],
        queryFn: async () => {
            const { data } = await supabase
                .from('product_rating_stats')
                .select('*')
                .eq('product_id', productId)
                .maybeSingle()
            return data ?? { review_count: 0, avg_rating: 0, stars_5: 0, stars_4: 0, stars_3: 0, stars_2: 0, stars_1: 0 }
        },
    })

    // Reviews
    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ['reviews', productId],
        queryFn: async () => {
            const { data } = await supabase
                .from('product_reviews')
                .select('*, profiles:user_id(full_name, email)')
                .eq('product_id', productId)
                .order('created_at', { ascending: false })
            return data ?? []
        },
    })

    // Mi review
    const myReview = user ? reviews.find(r => r.user_id === user.id) : null

    // Borrar review
    const deleteMutation = useMutation({
        mutationFn: async (reviewId) => {
            const { error } = await supabase.from('product_reviews').delete().eq('id', reviewId)
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('Reseña eliminada')
            qc.invalidateQueries({ queryKey: ['reviews', productId] })
            qc.invalidateQueries({ queryKey: ['rating-stats', productId] })
        },
        onError: (e) => toast.error(e.message),
    })

    const handleDelete = (reviewId) => {
        if (window.confirm('¿Eliminar tu reseña?')) deleteMutation.mutate(reviewId)
    }

    return (
        <section className="mt-16 pt-12 border-t border-gray-100">
            <h2 className="font-display text-2xl font-extrabold text-gray-900 mb-8">
                Reseñas de clientes
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ── Stats panel ── */}
                <div className="bg-white rounded-2xl shadow-sm p-6 h-fit">
                    {stats && stats.review_count > 0 ? (
                        <div className="space-y-4">
                            <div className="text-center">
                                <p className="font-display text-5xl font-extrabold text-gray-900">
                                    {stats.avg_rating}
                                </p>
                                <StarRating rating={Math.round(stats.avg_rating)} size={20} />
                                <p className="text-sm text-gray-400 mt-1">
                                    {stats.review_count} reseña{stats.review_count !== 1 ? 's' : ''}
                                </p>
                            </div>

                            <div className="space-y-1.5 pt-3 border-t border-gray-100">
                                {[5, 4, 3, 2, 1].map(s => (
                                    <RatingBar
                                        key={s}
                                        stars={s}
                                        count={stats[`stars_${s}`] ?? 0}
                                        total={stats.review_count}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm text-gray-400">Aún no hay reseñas</p>
                            <p className="text-xs text-gray-300 mt-1">¡Sé el primero!</p>
                        </div>
                    )}

                    {/* Botón escribir review */}
                    {user && !myReview && !showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn-primary w-full mt-4 text-sm py-2"
                        >
                            Escribir reseña
                        </button>
                    )}
                    {!user && (
                        <p className="text-xs text-center text-gray-400 mt-4">
                            <a href="/login" className="text-brand-400 underline">Inicia sesión</a> para dejar una reseña
                        </p>
                    )}
                </div>

                {/* ── Reviews list ── */}
                <div className="lg:col-span-2">
                    {/* Formulario (crear o editar) */}
                    {(showForm || editReview) && (
                        <div className="mb-6">
                            <ReviewForm
                                productId={productId}
                                existingReview={editReview}
                                onClose={() => { setShowForm(false); setEditReview(null) }}
                            />
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 size={24} className="animate-spin text-brand-400" />
                        </div>
                    ) : reviews.length > 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm px-6">
                            {reviews.map(review => (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                    isOwn={user?.id === review.user_id}
                                    onEdit={() => { setEditReview(review); setShowForm(false) }}
                                    onDelete={() => handleDelete(review.id)}
                                />
                            ))}
                        </div>
                    ) : !showForm ? (
                        <div className="text-center py-16 text-gray-400">
                            <p className="text-sm">No hay reseñas todavía para este producto.</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    )
}

// Exportar StarRating para usar en otros lugares (catálogo, etc)
export { StarRating }