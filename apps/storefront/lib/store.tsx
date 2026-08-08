"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { CartItem, Product } from "./types"
import { resolveVariantId } from "./medusa"
import {
  addLineItem,
  cartShippingRupees,
  cartSubtotalRupees,
  cartTaxRupees,
  cartTotalRupees,
  clearStoredCartId,
  ensureCart,
  mapCartItems,
  removeLineItem,
  retrieveCart,
  setStoredCartId,
  updateLineItem,
  type MedusaCart,
} from "./medusa-cart"

interface AppContextType {
  cart: CartItem[]
  cartId: string | null
  cartSource: "medusa" | "local" | "loading"
  isCartLoading: boolean
  cartError: string | null
  addToCart: (
    product: Product,
    quantity: number,
    size?: string,
    color?: string
  ) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  /** Line items before tax (Medusa subtotal). */
  cartSubtotal: number
  /** GST / tax from Medusa cart (0 until address sets tax region). */
  cartTax: number
  cartShipping: number
  /** Grand total including tax + shipping. */
  cartTotal: number
  cartCount: number
  isCartOpen: boolean
  setIsCartOpen: (isOpen: boolean) => void
  refreshCart: () => Promise<void>
  /** Clear local + stored cart after a successful order. */
  clearCart: () => void

  wishlist: string[]
  toggleWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartId, setCartId] = useState<string | null>(null)
  const [medusaCart, setMedusaCart] = useState<MedusaCart | null>(null)
  const [cartSource, setCartSource] = useState<"medusa" | "local" | "loading">(
    "loading"
  )
  const [isCartLoading, setIsCartLoading] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const [wishlist, setWishlist] = useState<string[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const applyCart = useCallback((c: MedusaCart) => {
    setMedusaCart(c)
    setCartId(c.id)
    setStoredCartId(c.id)
    setCart(mapCartItems(c))
    setCartSource("medusa")
    setCartError(null)
  }, [])

  const refreshCart = useCallback(async () => {
    try {
      const c = await ensureCart()
      applyCart(c)
    } catch (e: any) {
      console.warn("[cart] refresh failed", e)
      setCartSource("local")
      setCartError(e?.message || "Could not load Medusa cart")
    }
  }, [applyCart])

  const clearCart = useCallback(() => {
    clearStoredCartId()
    setCart([])
    setCartId(null)
    setMedusaCart(null)
    setCartSource("medusa")
    setCartError(null)
    setIsCartOpen(false)
  }, [])

  useEffect(() => {
    const savedWishlist = localStorage.getItem("aura_wishlist")
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist))
      } catch {
        // ignore
      }
    }
    setIsHydrated(true)
    void refreshCart()
  }, [refreshCart])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("aura_wishlist", JSON.stringify(wishlist))
    }
  }, [wishlist, isHydrated])

  const addToCart = useCallback(
    async (
      product: Product,
      quantity: number,
      size?: string,
      color?: string
    ) => {
      const variantId = resolveVariantId(product, size, color)
      if (!variantId) {
        // Local-only product (mock without variants)
        setCart((prev) => {
          const existing = prev.findIndex(
            (item) =>
              item.productId === product.id &&
              item.size === size &&
              item.color === color
          )
          if (existing >= 0) {
            const next = [...prev]
            next[existing] = {
              ...next[existing],
              quantity: next[existing].quantity + quantity,
            }
            return next
          }
          return [
            ...prev,
            {
              id: `${product.id}-${size || "nosize"}-${color || "nocolor"}`,
              productId: product.id,
              name: product.name,
              price: product.price,
              image: product.images[0],
              quantity,
              size,
              color,
            },
          ]
        })
        setCartSource("local")
        setIsCartOpen(true)
        return
      }

      setIsCartLoading(true)
      setCartError(null)
      try {
        let c = await ensureCart()
        c = await addLineItem(c.id, variantId, quantity)
        applyCart(c)
        setIsCartOpen(true)
      } catch (e: any) {
        console.error("[cart] add failed", e)
        if (e?.message?.includes("completed") || e?.message?.includes("400")) {
          clearCart()
          try {
            let c = await ensureCart()
            c = await addLineItem(c.id, variantId, quantity)
            applyCart(c)
            setIsCartOpen(true)
            return
          } catch (retryErr: any) {
            setCartError(retryErr?.message || "Failed to add to cart after reset")
          }
        } else {
          setCartError(e?.message || "Failed to add to cart")
        }
        // Optimistic local fallback so UI still works offline
        setCart((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}`,
            productId: product.id,
            variantId,
            name: product.name,
            price: product.price,
            image: product.images[0],
            quantity,
            size,
            color,
          },
        ])
        setCartSource("local")
        setIsCartOpen(true)
      } finally {
        setIsCartLoading(false)
      }
    },
    [applyCart]
  )

  const removeFromCart = useCallback(
    async (itemId: string) => {
      if (!cartId || cartSource !== "medusa") {
        setCart((prev) => prev.filter((item) => item.id !== itemId))
        return
      }
      setIsCartLoading(true)
      setCartError(null)
      try {
        const c = await removeLineItem(cartId, itemId)
        applyCart(c)
      } catch (e: any) {
        setCartError(e?.message || "Failed to remove item")
        // If cart is gone, reset
        if (String(e?.message || "").includes("404")) {
          clearStoredCartId()
          setCartId(null)
          setCart([])
        }
      } finally {
        setIsCartLoading(false)
      }
    },
    [applyCart, cartId, cartSource]
  )

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeFromCart(itemId)
        return
      }
      if (!cartId || cartSource !== "medusa") {
        setCart((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          )
        )
        return
      }
      setIsCartLoading(true)
      setCartError(null)
      try {
        const c = await updateLineItem(cartId, itemId, quantity)
        applyCart(c)
      } catch (e: any) {
        setCartError(e?.message || "Failed to update quantity")
      } finally {
        setIsCartLoading(false)
      }
    },
    [applyCart, cartId, cartSource, removeFromCart]
  )

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  const isInWishlist = (productId: string) => wishlist.includes(productId)

  const cartSubtotal = useMemo(() => {
    if (cartSource === "medusa" && medusaCart) {
      return cartSubtotalRupees(medusaCart)
    }
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }, [cart, cartSource, medusaCart])

  const cartTax = useMemo(() => {
    if (cartSource === "medusa" && medusaCart) {
      return cartTaxRupees(medusaCart)
    }
    return 0
  }, [cartSource, medusaCart])

  const cartShipping = useMemo(() => {
    if (cartSource === "medusa" && medusaCart) {
      return cartShippingRupees(medusaCart)
    }
    return 0
  }, [cartSource, medusaCart])

  const cartTotal = useMemo(() => {
    if (cartSource === "medusa" && medusaCart) {
      return cartTotalRupees(medusaCart)
    }
    return cartSubtotal
  }, [cartSource, medusaCart, cartSubtotal])

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0)

  return (
    <AppContext.Provider
      value={{
        cart,
        cartId,
        cartSource,
        isCartLoading,
        cartError,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartSubtotal,
        cartTax,
        cartShipping,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        refreshCart,
        clearCart,
        wishlist,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
