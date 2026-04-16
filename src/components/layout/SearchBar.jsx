// src/components/layout/SearchBar.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, X, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function SearchBar() {
    const navigate = useNavigate()
    const inputRef = useRef(null)
    const panelRef = useRef(null)

    const [open,    setOpen]    = useState(false)
    const [query,   setQuery]   = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)

    // Debounced search
    useEffect(() => {
        if (query.trim().length < 2) { setResults([]); return }

        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                const { data } = await supabase
                    .from('products')
                    .select('id, name, slug, price, compare_at_price, product_images(url, is_primary)')
                    .eq('is_active', true)
                    .ilike('name', `%${query.trim()}%`)
                    .limit(6)
                setResults(data ?? [])
            } catch { setResults([]) }
            finally { setLoading(false) }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    // Click outside → cerrar
    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Keyboard shortcut: Cmd/Ctrl + K
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setOpen(true)
                setTimeout(() => inputRef.current?.focus(), 100)
            }
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (query.trim()) {
            navigate(`/catalogo?q=${encodeURIComponent(query.trim())}`)
            setOpen(false)
            setQuery('')
        }
    }

    const handleSelect = (slug) => {
        setOpen(false)
        setQuery('')
        navigate(`/producto/${slug}`)
    }

    // Botón trigger (visible en header)
    if (!open) {
        return (
            <button
                onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 100) }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:bg-gray-50 transition-colors"
                aria-label="Buscar"
            >
                <Search size={18} />
                <span className="hidden sm:inline text-sm">Buscar...</span>
                <kbd className="hidden md:inline text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md font-mono">⌘K</kbd>
            </button>
        )
    }

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setOpen(false)} />

            {/* Panel */}
            <div ref={panelRef} className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-lg z-50 px-4">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                    <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                        <Search size={18} className="text-gray-400 flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar productos..."
                            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                            autoFocus
                        />
                        {query && (
                            <button type="button" onClick={() => setQuery('')} className="p-1 rounded-full hover:bg-gray-100">
                                <X size={14} className="text-gray-400" />
                            </button>
                        )}
                        <kbd className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md font-mono">Esc</kbd>
                    </form>

                    {/* Resultados */}
                    {query.trim().length >= 2 && (
                        <div className="max-h-80 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 size={20} className="animate-spin text-brand-400" />
                                </div>
                            ) : results.length > 0 ? (
                                <div className="py-2">
                                    {results.map(p => {
                                        const img = p.product_images?.find(i => i.is_primary)?.url ?? p.product_images?.[0]?.url
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => handleSelect(p.slug)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                            >
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                    {img ? (
                                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{p.name}</p>
                                                    <p className="text-sm font-bold text-brand-400">${Number(p.price).toFixed(2)}</p>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-gray-400 text-sm">
                                    No se encontraron productos para "{query}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}