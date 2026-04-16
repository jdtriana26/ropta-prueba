// src/components/auth/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export default function ProtectedRoute({ adminOnly = false }) {
    const { user, profile, loading } = useAuthStore()
    const location = useLocation()

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
    )

    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />
    }

    if (adminOnly && profile?.role !== 'admin') {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}