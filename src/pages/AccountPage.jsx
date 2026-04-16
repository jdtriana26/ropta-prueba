// src/pages/AccountPage.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, MapPin, Pencil, Trash2, Plus, Loader2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'

export default function AccountPage() {
  const { user, profile }  = useAuthStore()
  const qc                 = useQueryClient()
  const [tab, setTab]      = useState('profile') // 'profile' | 'addresses'

  // ── Perfil ───────────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name ?? '',
    phone:     profile?.phone     ?? '',
  })
  const [savingProfile, setSavingProfile] = useState(false)

  const saveProfile = async () => {
    setSavingProfile(true)
    const { error } = await supabase
        .from('profiles')
        .update(profileForm)
        .eq('id', user.id)
    if (error) toast.error(error.message)
    else toast.success('Perfil actualizado ✓')
    setSavingProfile(false)
  }

  // ── Direcciones ──────────────────────────────────────────────────────────
  const { data: addresses = [], isLoading: loadingAddr } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      const { data } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
      return data
    },
    enabled: !!user,
  })

  const [addrModal, setAddrModal] = useState(null) // null | 'new' | address

  const deleteAddr = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('addresses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Dirección eliminada')
      qc.invalidateQueries(['addresses'])
    },
    onError: (e) => toast.error(e.message),
  })

  const setDefault = async (id) => {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
    await supabase.from('addresses').update({ is_default: true }).eq('id', id)
    qc.invalidateQueries(['addresses'])
    toast.success('Dirección principal actualizada ✓')
  }

  const TABS = [
    { key: 'profile',   label: 'Mi perfil',    icon: User },
    { key: 'addresses', label: 'Mis direcciones', icon: MapPin },
  ]

  return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-8">Mi cuenta</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-100">
          {TABS.map(({ key, label, icon: Icon }) => (
              <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                      tab === key
                          ? 'border-brand-400 text-brand-400'
                          : 'border-transparent text-gray-400 hover:text-gray-700'
                  }`}
              >
                <Icon size={15} /> {label}
              </button>
          ))}
        </div>

        {/* ── PERFIL ── */}
        {tab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="font-display text-2xl font-bold text-brand-400">
                {profileForm.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase()}
              </span>
                </div>
                <div>
                  <p className="font-display font-bold text-gray-900">
                    {profileForm.full_name || 'Sin nombre'}
                  </p>
                  <p className="text-sm text-gray-400">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                  <input
                      className="input"
                      value={profileForm.full_name}
                      onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="Juan Pérez"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                      className="input bg-gray-50 text-gray-400 cursor-not-allowed"
                      value={user?.email}
                      disabled
                  />
                  <p className="text-xs text-gray-400 mt-1">El email no se puede cambiar desde aquí.</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                      className="input"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+593 99 999 9999"
                  />
                </div>
              </div>

              <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="btn-primary flex items-center gap-2"
              >
                {savingProfile
                    ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                    : <><Check size={14} /> Guardar cambios</>
                }
              </button>
            </div>
        )}

        {/* ── DIRECCIONES ── */}
        {tab === 'addresses' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-400">{addresses.length} dirección(es) guardada(s)</p>
                <button
                    onClick={() => setAddrModal('new')}
                    className="btn-primary text-sm py-2 flex items-center gap-1.5"
                >
                  <Plus size={14} /> Nueva dirección
                </button>
              </div>

              {loadingAddr ? (
                  <div className="flex justify-center py-12">
                    <Loader2 size={28} className="animate-spin text-brand-400" />
                  </div>
              ) : addresses.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                    <MapPin size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No tienes direcciones guardadas todavía.</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                    {addresses.map(addr => (
                        <div key={addr.id} className="bg-white rounded-2xl shadow-sm p-5 flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <MapPin size={16} className="text-brand-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-medium text-gray-900 text-sm">{addr.full_name}</p>
                                {addr.is_default && (
                                    <span className="badge bg-brand-50 text-brand-500 text-[10px]">Principal</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">
                                {addr.street}, {addr.city}{addr.state ? `, ${addr.state}` : ''}, {addr.country}
                                {addr.postal_code ? ` ${addr.postal_code}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!addr.is_default && (
                                <button
                                    onClick={() => setDefault(addr.id)}
                                    className="text-xs text-gray-400 hover:text-brand-400 transition-colors px-2 py-1 rounded-lg hover:bg-brand-50"
                                >
                                  Principal
                                </button>
                            )}
                            <button
                                onClick={() => setAddrModal(addr)}
                                className="p-2 rounded-lg hover:bg-brand-50 hover:text-brand-400 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                                onClick={() => {
                                  if (window.confirm('¿Eliminar esta dirección?'))
                                    deleteAddr.mutate(addr.id)
                                }}
                                className="p-2 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>
        )}

        {/* Modal nueva / editar dirección */}
        {addrModal && (
            <AddressModal
                address={addrModal === 'new' ? null : addrModal}
                userId={user.id}
                isFirst={addresses.length === 0}
                onClose={() => setAddrModal(null)}
                onSaved={() => {
                  qc.invalidateQueries(['addresses'])
                  setAddrModal(null)
                }}
            />
        )}
      </div>
  )
}

function AddressModal({ address, userId, isFirst, onClose, onSaved }) {
  const isEdit = !!address
  const [form, setForm] = useState({
    full_name:   address?.full_name   ?? '',
    street:      address?.street      ?? '',
    city:        address?.city        ?? '',
    state:       address?.state       ?? '',
    country:     address?.country     ?? 'Ecuador',
    postal_code: address?.postal_code ?? '',
    is_default:  address?.is_default  ?? isFirst,
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.full_name || !form.street || !form.city) {
      toast.error('Nombre, dirección y ciudad son obligatorios')
      return
    }
    setSaving(true)
    try {
      if (form.is_default) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId)
      }
      if (isEdit) {
        const { error } = await supabase.from('addresses').update(form).eq('id', address.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('addresses').insert({ ...form, user_id: userId })
        if (error) throw error
      }
      toast.success(isEdit ? 'Dirección actualizada ✓' : 'Dirección guardada ✓')
      onSaved()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-display text-xl font-bold text-gray-900">
              {isEdit ? 'Editar dirección' : 'Nueva dirección'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
              <input className="input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Juan Pérez" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
              <input className="input" value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} placeholder="Av. Principal 123" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
              <input className="input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Quito" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
              <input className="input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="Pichincha" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País *</label>
              <select className="input" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                {['Ecuador','Colombia','Perú','Venezuela','Chile','Argentina','México'].map(c => (
                    <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código postal</label>
              <input className="input" value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} placeholder="170102" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="is_default_modal" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} className="w-4 h-4 accent-brand-400" />
              <label htmlFor="is_default_modal" className="text-sm text-gray-600">Establecer como dirección principal</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button onClick={onClose} className="btn-outline py-2 text-sm">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary py-2 text-sm flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Guardar' : 'Añadir dirección'}
            </button>
          </div>
        </div>
      </div>
  )
}