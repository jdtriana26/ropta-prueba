// src/components/auth/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export default function ProtectedRoute({ adminOnly = false }) {
    const { user, loading } = useAuthStore()

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
    )

    if (!user) return <Navigate to="/login" replace />

    return <Outlet />
}