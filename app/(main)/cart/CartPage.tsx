"use client";
import { useCartStore } from "@/app/store/cartStore";
import { ArrowLeft, ShoppingBag, X, Plus, Minus, Tag, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Image } from "@imagekit/next";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { getProductPrice } from "@/lib/product-pricing"
import { useSession } from "next-auth/react";

import CheckoutAuthModal from "@/app/components/checkout/CheckoutAuthModal";
export const dynamic = "force-dynamic"

const PROMO_CODES: Record<string, number> = {
  // "FASHION10": 10,
  // "WELCOME20": 20,
  // "SAVE15": 15,
}

type ItemValidation = {
  outOfStock: boolean
  priceChanged: boolean
  oldPrice?: number
  quantityReduced: boolean
  oldQuantity?: number
  unavailable: boolean
}

const CartPage = () => {
  const { items, removeItem, updateQuantity } = useCartStore();
  const router = useRouter();
  const { data: session } = useSession()

  const [promoCode, setPromoCode] = useState("")
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null)
  const [promoError, setPromoError] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [shippingCost, setShippingCost] = useState(0)

  const [validating, setValidating] = useState(false)
  const [validationMap, setValidationMap] = useState<Record<string, ItemValidation>>({})
  const [hasIssues, setHasIssues] = useState(false)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const discountAmount = appliedPromo ? Math.round(subtotal * appliedPromo.discount / 100) : 0
  const finalTotal = subtotal + shippingCost - discountAmount
  const getItemKey = (item: { id: string; color?: string }) => `${item.id}:${item.color || ""}`

const fetchSettings = async () => {
    try {
      const res = await apiClient.getdeliveryFee()
      if (res.success) {
        setShippingCost(res.data.deliveryFee)
      } else {
        console.error("Failed to fetch settings:", res.error)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      setShippingCost(300) // Fallback to 300 if fetching fails
    }
  }
useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    async function validateCart() {
      if (items.length === 0) return

      setValidating(true)
      const newValidationMap: Record<string, ItemValidation> = {}
      let foundIssues = false

      for (const item of items) {
        const itemKey = getItemKey(item)
        try {
          const res = await apiClient.getProductById(item.id)

          if (!res.success || !res.data) {
            newValidationMap[itemKey] = {
              unavailable: true,
              outOfStock: false,
              priceChanged: false,
              quantityReduced: false,
            }
            foundIssues = true
            continue
          }

          const liveProduct = res.data
          const validation: ItemValidation = {
            unavailable: false,
            outOfStock: false,
            priceChanged: false,
            quantityReduced: false,
          }

          if (liveProduct.stock === 0) {
            validation.outOfStock = true
            foundIssues = true
          }

          const livePrice = getProductPrice(liveProduct)
          if (livePrice !== item.price) {
            validation.priceChanged = true
            validation.oldPrice = item.price
            foundIssues = true
            useCartStore.setState(state => {
              const updatedItems = state.items.map(i =>
                i.id === item.id && i.color === item.color ? { ...i, price: livePrice } : i
              )
              return {
                items: updatedItems,
                total: updatedItems.reduce((sum, cartItem) => sum + cartItem.price * cartItem.quantity, 0),
                itemCount: updatedItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0),
              }
            })
          }

          if (item.quantity > liveProduct.stock && liveProduct.stock > 0) {
            validation.quantityReduced = true
            validation.oldQuantity = item.quantity
            foundIssues = true
            updateQuantity(item.id, liveProduct.stock, item.color)
          }

          newValidationMap[itemKey] = validation

        } catch (err) {
          newValidationMap[itemKey] = {
            unavailable: true,
            outOfStock: false,
            priceChanged: false,
            quantityReduced: false,
          }
          foundIssues = true
        }
      }

      setValidationMap(newValidationMap)
      setHasIssues(foundIssues)
      setValidating(false)
    }

    validateCart()
  }, [])

  const handleRemoveUnavailable = () => {
    Object.entries(validationMap).forEach(([itemKey, validation]) => {
      if (validation.unavailable || validation.outOfStock) {
        const item = items.find(candidate => getItemKey(candidate) === itemKey)
        if (item) removeItem(item.id, item.color)
      }
    })
    setHasIssues(false)
  }

  // ✅ handle checkout click — check auth + issues
  const handleCheckout = () => {
    if (hasIssues) return
    if (!session) {
      setShowAuthModal(true)
      return
    }
    router.push("/checkout?type=cart")
  }

  const handleApplyPromo = () => {
    setPromoError("")
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code")
      return
    }
    setPromoLoading(true)
    setTimeout(() => {
      const discount = PROMO_CODES[promoCode.toUpperCase()]
      if (discount) {
        setAppliedPromo({ code: promoCode.toUpperCase(), discount })
        setPromoError("")
      } else {
        setPromoError("Invalid promo code")
        setAppliedPromo(null)
      }
      setPromoLoading(false)
    }, 600)
  }

  const removePromo = () => {
    setAppliedPromo(null)
    setPromoCode("")
    setPromoError("")
  }

  return (
    <>
      {/* ✅ auth modal */}
      <CheckoutAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false)
          router.push("/checkout?type=cart")
        }}
      />

      {/* header */}
      <div className="border-b border-(--border)">
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-[1600px] mx-auto px-6 lg:px-12 py-6">
          <button
            onClick={() => router.back()}
            className="flex text-(--muted-foreground) gap-3 items-center cursor-pointer hover:text-(--foreground) transition-colors mb-6">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm uppercase tracking-wider">Continue Shopping</span>
          </button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-5xl lg:text-6xl font-cormorant-garamond">Shopping Cart</h1>
            {items.length > 0 && (
              <span className="text-sm text-(--muted-foreground) uppercase tracking-wider">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            )}
          </div>
        </motion.section>
      </div>

      {/* empty state */}
      {items.length === 0 ? (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-[1600px] min-h-[calc(100vh-210px)] mx-auto px-6 lg:px-12 py-6 flex flex-col justify-center items-center gap-4 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}>
            <ShoppingBag className="h-24 w-24 mb-6 opacity-20 text-(--muted-foreground) mx-auto" />
          </motion.div>
          <h2 className="text-3xl mb-2 font-cormorant-garamond">Your Cart is Empty</h2>
          <p className="text-(--muted-foreground) mb-6 max-w-sm">
            Discover our curated collection of premium accessories
          </p>
          <Link href="/products">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-(--primary) tracking-widest text-(--primary-foreground) hover:opacity-90 px-12 py-4 uppercase text-sm transition-opacity">
              Start Shopping
            </motion.button>
          </Link>
        </motion.section>
      ) : (
        <section className="max-w-[1600px] mx-auto px-6 lg:px-12 py-8">

          {/* validating indicator */}
          {validating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 text-(--muted-foreground) mb-6 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking product availability...</span>
            </motion.div>
          )}

          {/* global warning banner */}
          {!validating && hasIssues && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-400 text-sm font-medium">Some items need attention</p>
                  <p className="text-yellow-400/70 text-xs mt-1">
                    Some products have changed since you added them. Please review before checkout.
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRemoveUnavailable}
                className="text-xs uppercase tracking-wider border border-yellow-500/40 text-yellow-400 px-4 py-2 hover:bg-yellow-500/10 transition-colors whitespace-nowrap">
                Remove Unavailable
              </motion.button>
            </motion.div>
          )}

          <div className="flex lg:flex-row flex-col gap-8">

            {/* left — cart items */}
            <div className="lg:w-2/3 w-full flex flex-col gap-4">
              <AnimatePresence>
                {items.map((item, index) => {
                  const validation = validationMap[item.id]
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className={`p-4 sm:p-6 border w-full bg-(--card) flex flex-row gap-3 sm:gap-6 transition-colors ${
                        validation?.unavailable || validation?.outOfStock
                          ? "border-red-500/40 opacity-75"
                          : validation?.priceChanged || validation?.quantityReduced
                          ? "border-yellow-500/40"
                          : "border-(--border)"
                      }`}>

                      {/* image */}
                      <div className="relative h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0">
                        <Image
                          urlEndpoint="https://ik.imagekit.io/fashionstylized"
                          alt={item.title}
                          fill={true}
                          className={`w-full h-full object-cover ${
                            validation?.unavailable || validation?.outOfStock ? "grayscale opacity-50" : ""
                          }`}
                          src={item.image}
                        />
                      </div>

                      {/* info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-xs uppercase tracking-widest text-(--muted-foreground)">
                            {item.category}
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeItem(item.id, item.color)}
                            aria-label={"Remove " + item.title}
                            className="text-(--muted-foreground) hover:text-red-400 transition-colors flex-shrink-0 p-2">
                            <X className="h-4 w-4" />
                          </motion.button>
                        </div>

                        <h2 className="text-lg sm:text-2xl font-cormorant-garamond mb-1 line-clamp-2">
                          {item.title}
                        </h2>

                        <div className="flex items-center gap-2 mb-2">
                          <p className="tracking-wider text-(--primary) text-sm sm:text-base">
                            Rs. {item.price.toLocaleString()}
                          </p>
                          {validation?.priceChanged && validation.oldPrice && (
                            <p className="text-xs text-(--muted-foreground) line-through">
                              Rs. {validation.oldPrice.toLocaleString()}
                            </p>
                          )}
                        </div>
                        {item.color && (
                          <p className="text-xs text-(--muted-foreground) mb-2">Color: {item.color}</p>
                        )}

                        {validation?.unavailable && (
                          <p className="text-red-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Product no longer available
                          </p>
                        )}
                        {validation?.outOfStock && (
                          <p className="text-red-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Out of stock
                          </p>
                        )}
                        {validation?.priceChanged && (
                          <p className="text-yellow-400 text-xs uppercase tracking-wider mb-2">
                            ⚠ Price updated
                          </p>
                        )}
                        {validation?.quantityReduced && (
                          <p className="text-yellow-400 text-xs uppercase tracking-wider mb-2">
                            ⚠ Quantity reduced to {item.quantity} (max available)
                          </p>
                        )}

                        {!validation?.unavailable && !validation?.outOfStock && (
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center border border-(--border)">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updateQuantity(item.id, item.quantity - 1, item.color)}
                                disabled={item.quantity <= 1}
                                aria-label="Decrease quantity"
                                className="p-2 sm:p-3 hover:bg-(--muted) transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center">
                                <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                              </motion.button>
                              <span className="px-4 sm:px-6 text-base sm:text-lg min-w-[40px] text-center">
                                {item.quantity}
                              </span>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.color)}
                                aria-label="Increase quantity"
                                className="p-2 sm:p-3 hover:bg-(--muted) transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                              </motion.button>
                            </div>
                            <p className="text-sm text-(--muted-foreground)">
                              Total: Rs. {(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        )}

                        {(validation?.unavailable || validation?.outOfStock) && (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => removeItem(item.id, item.color)}
                            className="text-xs uppercase tracking-wider text-red-400 border border-red-500/30 px-3 py-1 hover:bg-red-500/10 transition-colors mt-2">
                            Remove
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* right — order summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:w-1/3 w-full">
              <div className="p-6 border border-(--border) bg-(--card) sticky top-24">

                <h2 className="text-2xl font-cormorant-garamond mb-6">Order Summary</h2>

                <div className="space-y-3 mb-4 pb-4 border-b border-(--border)">
                  <div className="flex justify-between text-sm">
                    <span className="text-(--muted-foreground)">
                      Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                    </span>
                    <span>Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-(--muted-foreground)">Shipping</span>
                    <span>Rs. {shippingCost.toLocaleString()}</span>
                  </div>
                  {appliedPromo && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-between text-sm">
                      <span className="text-green-400">Discount ({appliedPromo.discount}% off)</span>
                      <span className="text-green-400">- Rs. {discountAmount.toLocaleString()}</span>
                    </motion.div>
                  )}
                </div>

                <div className="flex justify-between mb-6">
                  <span className="text-lg uppercase tracking-wider">Total</span>
                  <span className="text-2xl text-(--primary) font-cormorant-garamond">
                    Rs. {finalTotal.toLocaleString()}
                  </span>
                </div>

                {/* promo code */}
                <div className="mb-6 pb-6 border-b border-(--border)">
                  <p className="text-sm text-(--muted-foreground) mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Promo Code
                  </p>
                  {appliedPromo ? (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 border border-green-500/30 bg-green-500/10">
                      <div>
                        <p className="text-sm text-green-400 font-medium">{appliedPromo.code}</p>
                        <p className="text-xs text-green-400/70">{appliedPromo.discount}% discount applied</p>
                      </div>
                      <button onClick={removePromo} aria-label="Remove promo code" className="text-green-400/70 hover:text-green-400 transition-colors p-2">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col [@media(min-width:420px)]:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Enter code"
                        value={promoCode}
                        onChange={(e) => { setPromoCode(e.target.value); setPromoError("") }}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                        className="flex-1 w-full px-4 py-2 bg-transparent border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors placeholder:text-(--muted-foreground) uppercase"
                      />
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleApplyPromo}
                        disabled={promoLoading}
                        className="w-full [@media(min-width:420px)]:w-auto px-4 py-2 bg-(--primary) text-(--primary-foreground) text-sm uppercase tracking-wider disabled:opacity-60">
                        {promoLoading ? "..." : "Apply"}
                      </motion.button>
                    </div>
                  )}
                  {promoError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-xs mt-2">
                      {promoError}
                    </motion.p>
                  )}
                </div>

                {/* ✅ action buttons — no Link wrapping disabled button */}
                <div className="flex flex-col gap-3">
                  <motion.button
                    whileHover={{ scale: hasIssues ? 1 : 1.02 }}
                    whileTap={{ scale: hasIssues ? 1 : 0.98 }}
                    onClick={handleCheckout}
                    disabled={hasIssues || validating}
                    className="w-full bg-(--primary) text-(--primary-foreground) py-4 uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {validating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        Proceed to Checkout
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>

                  {/* not logged in hint */}
                  {!session && !hasIssues && (
                    <p className="text-xs text-(--muted-foreground) text-center">
                      You'll be asked to sign in to complete checkout
                    </p>
                  )}

                  {/* issues hint */}
                  {hasIssues && !validating && (
                    <p className="text-xs text-yellow-400 text-center">
                      Please remove unavailable items before checkout
                    </p>
                  )}

                  <Link href="/products">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full border border-(--border) py-4 uppercase tracking-wider text-sm hover:border-(--primary) transition-colors">
                      Continue Shopping
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </>
  );
};

export default CartPage;