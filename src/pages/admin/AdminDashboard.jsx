// src/pages/admin/AdminDashboard.jsx
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, Tag, Package, DollarSign } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-display font-extrabold text-gray-900">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [products, categories, orders] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total'),
      ])
      const revenue = orders.data?.reduce((s, o) => s + Number(o.total), 0) ?? 0
      return {
        products:   products.count,
        categories: categories.count,
        orders:     orders.data?.length ?? 0,
        revenue,
      }
    },
  })

  const { data: recentOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, total, status, created_at, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5)
      return data
    },
  })

  const STATUS_LABEL = {
    pending:    { label: 'Pendiente',   cls: 'bg-yellow-100 text-yellow-700' },
    confirmed:  { label: 'Confirmado',  cls: 'bg-blue-100 text-blue-700' },
    processing: { label: 'Procesando',  cls: 'bg-purple-100 text-purple-700' },
    shipped:    { label: 'Enviado',     cls: 'bg-indigo-100 text-indigo-700' },
    delivered:  { label: 'Entregado',   cls: 'bg-green-100 text-green-700' },
    cancelled:  { label: 'Cancelado',   cls: 'bg-red-100 text-red-700' },
  }

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        <StatCard icon={ShoppingBag} label="Productos"   value={stats?.products}   color="bg-brand-400" />
        <StatCard icon={Tag}         label="Categorías"  value={stats?.categories} color="bg-emerald-500" />
        <StatCard icon={Package}     label="Pedidos"     value={stats?.orders}     color="bg-blue-500" />
        <StatCard icon={DollarSign}  label="Ingresos"    value={`$${Number(stats?.revenue ?? 0).toFixed(2)}`} color="bg-amber-500" />
      </div>

      {/* Pedidos recientes */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Pedidos recientes</h2>
        {recentOrders?.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">ID</th>
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map(order => {
                const s = STATUS_LABEL[order.status] ?? { label: order.status, cls: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={order.id}>
                    <td className="py-3 text-gray-400 font-mono text-xs">{order.id.slice(0, 8)}…</td>
                    <td className="py-3 text-gray-700">{order.profiles?.full_name ?? 'Sin nombre'}</td>
                    <td className="py-3 font-semibold text-gray-900">${Number(order.total).toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`badge ${s.cls}`}>{s.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400 text-center py-8">Aún no hay pedidos.</p>
        )}
      </div>
    </div>
  )
}
