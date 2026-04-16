// src/pages/admin/AdminUsers.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Shield, User as UserIcon, Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'

export default function AdminUsers() {
    const qc = useQueryClient()
    const { user: currentUser } = useAuthStore()
    const [search, setSearch] = useState('')

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, full_name, role, created_at')
                .order('created_at', { ascending: false })
            if (error) throw error
            return data
        },
    })

    const updateRole = useMutation({
        mutationFn: async ({ id, role }) => {
            const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('Rol actualizado')
            qc.invalidateQueries({ queryKey: ['admin-users'] })
        },
        onError: (e) => toast.error(e.message),
    })

    const filtered = users.filter(u =>
        (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="font-display text-3xl font-extrabold text-gray-900">Usuarios</h1>
                <p className="text-gray-400 text-sm mt-1">Gestiona los roles de los usuarios registrados</p>
            </div>

            <div className="relative mb-6">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    className="input pl-9"
                    placeholder="Buscar por nombre o email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-brand-400" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Usuario</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Registrado</th>
                            <th className="px-6 py-3">Rol</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {filtered.map(u => {
                            const isSelf = u.id === currentUser?.id
                            return (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 text-sm font-semibold">
                                                {(u.full_name ?? u.email ?? '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{u.full_name ?? 'Sin nombre'}</p>
                                                {isSelf && <span className="text-xs text-brand-400">(tú)</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        {new Date(u.created_at).toLocaleDateString('es-EC')}
                                    </td>
                                    <td className="px-6 py-4">
                      <span className={`badge ${u.role === 'admin'
                          ? 'bg-brand-100 text-brand-500'
                          : 'bg-gray-100 text-gray-600'}`}>
                        {u.role === 'admin' ? <Shield size={10} /> : <UserIcon size={10} />}
                          {u.role}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <select
                                            value={u.role}
                                            disabled={isSelf || updateRole.isPending}
                                            onChange={e => {
                                                if (window.confirm(`¿Cambiar rol de ${u.email} a ${e.target.value}?`)) {
                                                    updateRole.mutate({ id: u.id, role: e.target.value })
                                                }
                                            }}
                                            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <option value="customer">customer</option>
                                            <option value="admin">admin</option>
                                        </select>
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-gray-400 text-sm">
                            <Users size={32} className="mx-auto mb-2 opacity-30" />
                            No se encontraron usuarios
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}