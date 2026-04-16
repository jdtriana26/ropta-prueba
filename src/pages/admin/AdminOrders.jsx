// src/pages/admin/AdminOrders.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

const STATUSES = [
  { value: 'pending',    label: 'Pendiente',   cls: 'bg-yellow-100 text-yellow-700' },
  { value: 'confirmed',  label: 'Confirmado',  cls: 'bg-blue-100 text-blue-700' },
  { value: 'processing', label: 'Procesando',  cls: 'bg-purple-100 text-purple-700' },
  { value: 'shipped',    label: 'Enviado',     cls: 'bg-indigo-100 text-indigo-700' },
  { value: 'delivered',  label: 'Entregado',   cls: 'bg-green-100 text-green-700' },
  { value: 'cancelled',  label: 'Cancelado',   cls: 'bg-red-100 text-red-700' },
]

const statusInfo = (val) =>
    STATUSES.find(s => s.value === val) ?? { label: val, cls: 'bg-gray-100 text-gray-600' }

export default function AdminOrders() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', filter],
    queryFn: async () => {
      let q = supabase
          .from('orders')
          .select(`
          *,
          profiles(full_name),
          addresses(street, city, country),
          order_items(quantity, unit_price, product_variants(size, color, products(name)))
        `)
          .order('created_at', { ascending: false })

      if (filter !== 'all') q = q.eq('status', filter)

      const { data, error } = await q
      if (error) throw error
      return data
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Estado actualizado ✓')
      qc.invalidateQueries(['admin-orders'])
      qc.invalidateQueries(['admin-stats'])
    },
    onError: (e) => toast.error(e.message),
  })

  return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900">Pedidos</h1>
            <p className="text-gray-400 text-sm mt-1">{orders.length} pedidos</p>
          </div>

          {/* Filtro por estado */}
          <div className="flex flex-wrap gap-2">
            <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-brand-400 text-white' : 'bg-white text-gray-500 hover:text-brand-400'}`}
            >
              Todos
            </button>
            {STATUSES.map(s => (
                <button
                    key={s.value}
                    onClick={() => setFilter(s.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === s.value ? 'bg-brand-400 text-white' : 'bg-white text-gray-500 hover:text-brand-400'}`}
                >
                  {s.label}
                </button>
            ))}
          </div>
        </div>

        {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-brand-400" />
            </div>
        ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-gray-400">No hay pedidos con este estado.</p>
            </div>
        ) : (
            <div className="space-y-4">
              {orders.map(order => {
                const s = statusInfo(order.status)
                return (
                    <div key={order.id} className="bg-white rounded-2xl shadow-sm p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-gray-400">{order.id.slice(0, 12)}…</span>
                            <span className={`badge ${s.cls}`}>{s.label}</span>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {order.profiles?.full_name ?? 'Cliente sin nombre'}
                          </p>
                          {order.addresses && (
                              <p className="text-sm text-gray-400 mt-0.5">
                                {order.addresses.street}, {order.addresses.city}, {order.addresses.country}
                              </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(order.created_at).toLocaleDateString('es-EC', {
                              day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-display font-extrabold text-brand-400">
                            ${Number(order.total).toFixed(2)}
                          </p>
                          {/* Cambiar estado */}
                          <div className="relative mt-2">
                            <select
                                value={order.status}
                                onChange={e => updateStatus.mutate({ id: order.id, status: e.target.value })}
                                className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 cursor-pointer"
                            >
                              {STATUSES.map(st => (
                                  <option key={st.value} value={st.value}>{st.label}</option>
                              ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Items del pedido */}
                      {order.order_items?.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
                            {order.order_items.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.product_variants?.products?.name}
                          <span className="text-gray-400 ml-1">
                            · {item.product_variants?.size} / {item.product_variants?.color} × {item.quantity}
                          </span>
                        </span>
                                  <span className="font-medium text-gray-900">
                          ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                        </span>
                                </div>
                            ))}
                          </div>
                      )}
                    </div>
                )
              })}
            </div>
        )}
      </div>
  )
}