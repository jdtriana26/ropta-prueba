// src/pages/NotFoundPage.jsx
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center">
                <p className="font-display text-8xl font-800 text-brand-200">404</p>
                <h1 className="mt-2 font-display text-2xl font-700 text-gray-800">Página no encontrada</h1>
                <p className="mt-2 text-gray-400 font-body">La página que buscas no existe o fue movida.</p>
                <Link to="/" className="btn-primary inline-block mt-6">
                    Volver al inicio
                </Link>
            </div>
        </div>
    )
}