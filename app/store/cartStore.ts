import { i } from "motion/react-client";
import { create } from "zustand"
import { persist,createJSONStorage  } from "zustand/middleware"

export type CartItem = {
    id: string;
    title: string;
    price: number
  image: string
  quantity: number
  category: string
}

type CartStore = {
    items: CartItem[];
    total: number;
    itemCount: number;
    addItem: (item: CartItem) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, quantity: number) => void
    clearCart: () => void
    isInCart: (id: string) => boolean
}

function calculateTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

function calculateItemCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,

      addItem: (item) => {
        const existing = get().items.find(i => i.id === item.id)
        let updatedItems

        if (existing) {
          updatedItems = get().items.map(i =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        } else {
          updatedItems = [...get().items, { ...item, quantity: 1 }]
        }

        set({
          items: updatedItems,
          total: calculateTotal(updatedItems),
          itemCount: calculateItemCount(updatedItems),
        })
      },

      removeItem: (id) => {
        const updatedItems = get().items.filter(i => i.id !== id)
        set({
          items: updatedItems,
          total: calculateTotal(updatedItems),
          itemCount: calculateItemCount(updatedItems),
        })
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          const updatedItems = get().items.filter(i => i.id !== id)
          set({
            items: updatedItems,
            total: calculateTotal(updatedItems),
            itemCount: calculateItemCount(updatedItems),
          })
          return
        }

        const updatedItems = get().items.map(i =>
          i.id === id ? { ...i, quantity } : i
        )
        set({
          items: updatedItems,
          total: calculateTotal(updatedItems),
          itemCount: calculateItemCount(updatedItems),
        })
      },

      clearCart: () => set({ items: [], total: 0, itemCount: 0 }),

      isInCart: (id) => get().items.some(i => i.id === id),
    }),
    {
      name: "cart-storage", // localStorage key
       storage: createJSONStorage(() => localStorage), // explicit localStorage
      skipHydration: true, // ✅ fixes Next.js hydration warning
    }
  )
)

