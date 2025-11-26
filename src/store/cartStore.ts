import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
	id: string // Unique identifier: nombreEstandar_proveedor_precio
	nombreEstandar: string
	proveedor: string
	precio: number
	concepto: string
}

interface CartStore {
	items: CartItem[]
	addItem: (item: Omit<CartItem, 'id'>) => void
	removeItem: (id: string) => void
	clearCart: () => void
	getTotalPrice: () => number
	getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
	persist(
		(set, get) => ({
			items: [],

			addItem: (item) => {
				const id = `${item.nombreEstandar}_${item.proveedor}_${item.precio}`
				const existingItem = get().items.find((i) => i.id === id)

				// Si no existe, lo añade (no permite duplicados)
				if (!existingItem) {
					set((state) => ({
						items: [
							...state.items,
							{
								...item,
								id,
							},
						],
					}))
				}
			},

			removeItem: (id: string) => {
				set((state) => ({
					items: state.items.filter((item) => item.id !== id),
				}))
			},

			clearCart: () => {
				set({ items: [] })
			},

			getTotalPrice: () => {
				return get().items.reduce((total, item) => total + item.precio, 0)
			},

			getItemCount: () => {
				return get().items.length
			},
		}),
		{
			name: 'cart-storage', // Nombre del localStorage
		}
	)
)
