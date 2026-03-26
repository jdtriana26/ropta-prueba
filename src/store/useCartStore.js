// src/store/useCartStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],

            addItem: (item) => {
                const existing = get().items.find(i => i.variantId === item.variantId)
                if (existing) {
                    set({
                        items: get().items.map(i =>
                            i.variantId === item.variantId
                                ? { ...i, quantity: i.quantity + item.quantity }
                                : i
                        )
                    })
                } else {
                    set({ items: [...get().items, item] })
                }
            },

            removeItem: (variantId) =>
                set({ items: get().items.filter(i => i.variantId !== variantId) }),

            updateQuantity: (variantId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(variantId)
                    return
                }
                set({
                    items: get().items.map(i =>
                        i.variantId === variantId ? { ...i, quantity } : i
                    )
                })
            },

            clearCart: () => set({ items: [] }),

            getTotal: () =>
                get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

            getItemCount: () =>
                get().items.reduce((sum, i) => sum + i.quantity, 0),
        }),
        { name: 'vybe-cart' }
    )
)