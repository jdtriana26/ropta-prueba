// src/pages/admin/AdminPage.jsx
import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Tag, Package, Users, LogOut, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import AdminDashboard  from './AdminDashboard'
import AdminProducts   from './AdminProducts'
import AdminCategories from './AdminCategories'
import AdminOrders     from './AdminOrders'
import AdminUsers from './AdminUsers'

const NAV = [
  { to: '/admin',            label: 'Dashboard',   icon: LayoutDashboard, end: true },
  { to: '/admin/productos',  label: 'Productos',   icon: ShoppingBag },
  { to: '/admin/categorias', label: 'Categorías',  icon: Tag },
  { to: '/admin/pedidos',    label: 'Pedidos',     icon: Package },
  { to: '/admin/usuarios',   label: 'Usuarios',   icon: Users },
]

export default function AdminPage() {
  const { user, logout } = useAuthStore()

  return (
      <div className="flex min-h-screen bg-gray-50">

        {/* ── Sidebar ── */}
        <aside className="w-64 bg-gray-900 flex flex-col flex-shrink-0">
          {/* Logo */}
          <div className="px-6 py-5 border-b border-gray-800">
            <span className="font-display text-2xl font-extrabold"><span className="text-brand-400">MULTI</span><span className="text-accent-400"> FLASH</span></span>
            <p className="text-gray-500 text-xs mt-0.5">Panel de administración</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isActive
                                ? 'bg-brand-400 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`
                    }
                >
                  <Icon size={18} />
                  {label}
                  <ChevronRight size={14} className="ml-auto opacity-40" />
                </NavLink>
            ))}
          </nav>

          {/* Usuario */}
          <div className="px-4 py-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 truncate mb-2 px-1">{user?.email}</p>
            <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-all"
            >
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
        </aside>

        {/* ── Contenido ── */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route index             element={<AdminDashboard />} />
            <Route path="productos"  element={<AdminProducts />} />
            <Route path="categorias" element={<AdminCategories />} />
            <Route path="pedidos"    element={<AdminOrders />} />
            <Route path="usuarios" element={<AdminUsers />} />
            <Route path="*"          element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
  )
}