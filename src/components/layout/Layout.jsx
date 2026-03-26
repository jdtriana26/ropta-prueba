// src/components/layout/Layout.jsx
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { useAuthStore } from '../../store/useAuthStore'

export default function Layout() {
    const init = useAuthStore(s => s.init)

    useEffect(() => {
        init()
    }, [])

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}