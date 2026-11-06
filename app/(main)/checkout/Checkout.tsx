"use client"
export const dynamic = "force-dynamic"
import { useSearchParams, useRouter } from "next/navigation"
import { useCartStore } from "@/app/store/cartStore"
import { useBuyNowStore } from "@/app/store/buyNowStore"
import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Image } from "@imagekit/next"
import { apiClient } from "@/lib/api-client"
import { getProductPrice } from "@/lib/product-pricing"
import { Loader2, AlertCircle, CheckCircle2, ShoppingBag, Shield } from "lucide-react"
import Link from "next/link"
import CheckoutAuthModal from "@/app/components/checkout/CheckoutAuthModal"
import { fbTrack } from '@/lib/fpixel';


type CheckoutItem = {
  id: string
  title: string
  price: number
  image: string
  category: string
  quantity: number
  color?: string
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function Checkout() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = searchParams.get("type")
  const { data: session, status } = useSession()

  const { items: cartItems, clearCart, removeItem, updateQuantity } = useCartStore()
  const { item: buyNowItem, clearItem: clearBuyNow } = useBuyNowStore()

  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([])
  const [isBuyNow, setIsBuyNow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])
  const [error, setError] = useState("")
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [shipping, setShipping] = useState(0)
  const trackedCheckoutRef = useRef(false)

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    mobileNumber: "",
    paymentMethod: "COD",
  })

  const isSubmittingRef = useRef(false)

  const fetchSettings = async () => {
    try {
      const res = await apiClient.getdeliveryFee()
      if (res.success) {
        setShipping(res.data.deliveryFee)
      }
    } catch (error) {
      console.error("Failed to fetch delivery fee")
      setShipping(300) // fallback to 300 if fetch fails
      }
  }
  useEffect(() => {
    fetchSettings()
  }, [])
  

  

  // fill name/email from session
  useEffect(() => {
    if (session?.user) {
      setForm(prev => ({
        ...prev,
        name: session.user?.name || "",
        email: session.user?.email || "",
      }))
    }
  }, [session])

  // ✅ hard validation on checkout load
  useEffect(() => {
    async function validateAndSetItems() {
      const sourceItems = type === "buynow" && buyNowItem
        ? [buyNowItem]
        : cartItems

      if (sourceItems.length === 0) {
        router.push("/products")
        return
      }

      setValidating(true)
      setValidationError("")
      setValidationWarnings([])

      const validatedItems: CheckoutItem[] = []
      const warnings: string[] = []

      for (const item of sourceItems) {
        try {
          const res = await apiClient.getProductById(item.id)

          // product deleted
          if (!res.success || !res.data) {
            warnings.push(`"${item.title}" is no longer available and was removed`)
            if (!isBuyNow) removeItem(item.id, item.color)
            continue
          }

          const liveProduct = res.data

          // out of stock
          if (liveProduct.stock === 0) {
            warnings.push(`"${liveProduct.title}" is out of stock and was removed`)
            if (!isBuyNow) removeItem(item.id, item.color)
            continue
          }

          // quantity more than stock
          let finalQuantity = item.quantity
          if (item.quantity > liveProduct.stock) {
            warnings.push(`"${liveProduct.title}" quantity reduced to ${liveProduct.stock} (max available)`)
            finalQuantity = liveProduct.stock
            if (!isBuyNow) updateQuantity(item.id, liveProduct.stock, item.color)
          }

          // price changed
          const livePrice = getProductPrice(liveProduct)
          if (livePrice !== item.price) {
            warnings.push(`"${liveProduct.title}" price updated from Rs.${item.price.toLocaleString()} to Rs.${livePrice.toLocaleString()}`)
          }

          validatedItems.push({
            ...item,
            price: livePrice,
            title: liveProduct.title,       // ✅ always live title
            image: liveProduct.images?.[0] || item.image,
            quantity: finalQuantity,
          })

        } catch {
          warnings.push(`"${item.title}" could not be verified and was removed`)
          continue
        }
      }

      setValidationWarnings(warnings)

      // nothing left to buy
      if (validatedItems.length === 0) {
        setValidationError("All items in your order are unavailable. Please go back and add available products.")
        setValidating(false)
        return
      }

      setCheckoutItems(validatedItems)
      setIsBuyNow(type === "buynow" && !!buyNowItem)
      setValidating(false)
    }

      if (status === "loading") return
  validateAndSetItems()
  }, [type, status])

  const subtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal + shipping

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
const handleSubmit = async () => {
  if (isSubmittingRef.current) return
  isSubmittingRef.current = true
  setError("")

  if (!form.name || !form.email || !form.address || !form.city || !form.mobileNumber) {
    setError("Please fill all required fields")
    isSubmittingRef.current = false
    return
  }
  if (!/^\d{11}$/.test(form.mobileNumber)) {
    setError("Please enter a valid 11-digit mobile number")
    isSubmittingRef.current = false
    return
  }

  setLoading(true)

  try {
    const res = await apiClient.createOrder({
      name: form.name,
      email: form.email,
      products: checkoutItems.map(item => ({
        productId: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
        category: item.category,
        quantity: item.quantity,
        color: item.color,
      })),
      address: form.address,
      city: form.city,
      postalCode: form.postalCode,
      mobileNumber: form.mobileNumber,
      paymentMethod: form.paymentMethod,
    })

    if (!res.success) {
      setError(res.error || "Failed to place order")
      return
    }

    // ✅ no Purchase event here — it fires on the confirmation page instead

    if (isBuyNow) {
      clearBuyNow()
    } else {
      clearCart()
    }

    setOrderSuccess(true)

    setTimeout(() => {
      router.push(`/orders/${res.orderId}`)
    }, 2000)

  } catch (err) {
    setError("Something went wrong. Please try again.")
  } finally {
    setLoading(false)
    isSubmittingRef.current = false
  }
}

useEffect(() => {
  if (checkoutItems.length === 0 || trackedCheckoutRef.current) return
  trackedCheckoutRef.current = true

  const w = window as any
  if (w.ttq) {
    w.ttq.track("InitiateCheckout", {
      contents: checkoutItems.map((item) => ({
        content_id: item.id,
        content_type: "product",
        content_name: item.title,
      })),
      value: total,
      currency: "PKR",
    })
  }

  fbTrack('InitiateCheckout', {
    content_ids: checkoutItems.map((item) => item.id),
    content_type: 'product',
    num_items: checkoutItems.reduce((sum, item) => sum + item.quantity, 0),
    value: total,
    currency: 'PKR',
  })
}, [checkoutItems, total])

  // ── Loading / validating state ──
  if (validating || status === "loading") {
    return (
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-12">
        <div className="h-12 bg-white/10 w-64 mb-10 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-white/10 w-24 animate-pulse" />
                <div className="h-12 bg-white/10 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="h-96 bg-white/10 animate-pulse" />
        </div>
      </div>
    )
  }

  // ── Hard validation error — nothing to buy ──
  if (validationError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1600px] mx-auto px-6 lg:px-12 py-12 flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <AlertCircle className="w-16 h-16 text-red-400" />
        <h1 className="text-3xl font-cormorant-garamond">Unable to Checkout</h1>
        <p className="text-(--muted-foreground) max-w-md text-sm">{validationError}</p>
        <div className="flex gap-4">
          <Link href="/products">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 bg-(--primary) text-(--primary-foreground) uppercase text-sm tracking-wider">
              Browse Products
            </motion.button>
          </Link>
          <Link href="/cart">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 border border-(--border) hover:border-(--primary) uppercase text-sm tracking-wider transition-colors">
              Back to Cart
            </motion.button>
          </Link>
        </div>
      </motion.div>
    )
  }

  if (checkoutItems.length === 0) return null

  return (
    <>
      {/* auth modal */}
      <CheckoutAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false)
          // session will update via useSession — form already filled
        }}
      />

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-12">

        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10">
          <h1 className="text-5xl lg:text-6xl font-cormorant-garamond mb-2">Checkout</h1>
          <p className="text-(--muted-foreground) text-sm uppercase tracking-wider">
            {isBuyNow ? "Direct Purchase" : `${checkoutItems.length} ${checkoutItems.length === 1 ? "item" : "items"} from your cart`}
          </p>
        </motion.div>

        {/* ✅ validation warnings — soft */}
        <AnimatePresence>
          {validationWarnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/40 space-y-2">
              <p className="text-yellow-400 text-sm font-medium uppercase tracking-wider">
                Order Updated
              </p>
              {validationWarnings.map((warning, i) => (
                <p key={i} className="text-yellow-400/80 text-xs flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">⚠</span>
                  {warning}
                </p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* ── Left — form ── */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            className="space-y-6">

            <motion.h2 variants={fadeUp} className="text-xl uppercase tracking-wider">
              Shipping Information
            </motion.h2>

            {/* ✅ session status hint */}
            {/* {!session && (
              <motion.div
                variants={fadeUp}
                className="flex items-center gap-3 p-3 border border-(--border) text-(--muted-foreground) text-sm">
                <Shield className="w-4 h-4 shrink-0 text-(--primary)" />
                <span>
                  You'll be asked to sign in when placing your order.{" "}
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="text-(--primary) hover:underline">
                    Sign in now
                  </button>
                </span>
              </motion.div>
            )} */}

            {/* ✅ session badge — logged in */}
             
              {/* <motion.div
                variants={fadeUp}
                className="flex items-center gap-3 p-3 border border-green-500/30 bg-green-500/10 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <span className="text-green-400">
                  
                </span>
              </motion.div> */}
            

            {/* error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-red-500/10 border border-red-500/40 text-red-400 px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* name */}
            <motion.div variants={fadeUp}>
              <label className="block text-sm uppercase tracking-wider mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-transparent border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors placeholder:text-(--muted-foreground)"
              />
            </motion.div>

            {/* email */}
            <motion.div variants={fadeUp}>
              <label className="block text-sm uppercase tracking-wider mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-transparent border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors placeholder:text-(--muted-foreground)"
              />
            </motion.div>

            {/* mobile */}
            <motion.div variants={fadeUp}>
              <label className="block text-sm uppercase tracking-wider mb-2">
                Mobile Number <span className="text-red-400">*</span>
              </label>
              <input
                name="mobileNumber"
                value={form.mobileNumber}
                onChange={handleChange}
                placeholder="03xxxxxxxxx"
                maxLength={11}
                className="w-full px-4 py-3 bg-transparent border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors placeholder:text-(--muted-foreground)"
              />
            </motion.div>

            {/* address */}
            <motion.div variants={fadeUp}>
              <label className="block text-sm uppercase tracking-wider mb-2">
                Street Address <span className="text-red-400">*</span>
              </label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="House #, Street, Area"
                className="w-full px-4 py-3 bg-transparent border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors placeholder:text-(--muted-foreground)"
              />
            </motion.div>

            {/* city + postal */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm uppercase tracking-wider mb-2">
                  City <span className="text-red-400">*</span>
                </label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Karachi"
                  className="w-full px-4 py-3 bg-transparent border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors placeholder:text-(--muted-foreground)"
                />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-wider mb-2">Postal Code</label>
                <input
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  placeholder="75500"
                  className="w-full px-4 py-3 bg-transparent border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors placeholder:text-(--muted-foreground)"
                />
              </div>
            </motion.div>

            {/* payment method */}
            <motion.div variants={fadeUp}>
              <label className="block text-sm uppercase tracking-wider mb-3">Payment Method</label>
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors ${
                  form.paymentMethod === "COD"
                    ? "border-(--primary) bg-(--primary)/5"
                    : "border-(--border) hover:border-(--primary)/50"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={form.paymentMethod === "COD"}
                    onChange={handleChange}
                    className="accent-(--primary)"
                  />
                  <div>
                    <p className="text-sm uppercase tracking-wider">Cash on Delivery</p>
                    <p className="text-xs text-(--muted-foreground) mt-1">Pay when you receive your order</p>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 border border-(--border) opacity-40 cursor-not-allowed">
                  <input type="radio" disabled />
                  <div>
                    <p className="text-sm uppercase tracking-wider">Online Payment</p>
                    <p className="text-xs text-(--muted-foreground) mt-1">Coming soon</p>
                  </div>
                </label>
              </div>
            </motion.div>

            {/* submit */}
            <motion.button
              variants={fadeUp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 bg-(--primary) text-(--primary-foreground) uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed text-sm">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Placing Order...
                </>
              ) : "Place Order"}
            </motion.button>

          </motion.div>

          {/* ── Right — order summary ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}>
            <div className="sticky top-24 border border-(--border) bg-(--card) p-6">

              <h2 className="text-xl uppercase tracking-wider mb-6">
                {isBuyNow ? "Your Item" : "Your Order"}
              </h2>

              {/* items list */}
              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-1 pt-2">
                {checkoutItems.map((item) => (
                  <div key={`${item.id}:${item.color || ""}`} className="flex gap-4 pb-4 border-b border-(--border) last:border-0">
                    <div className="relative w-16 h-16 flex-shrink-0 bg-(--secondary)">
                      <Image
                        urlEndpoint="https://ik.imagekit.io/fashionstylized"
                        alt={item.title}
                        fill={true}
                        className="w-full h-full object-cover"
                        src={item.image}
                      />
                      <span className="absolute -top-2 -right-2 bg-(--primary) text-(--primary-foreground) text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-(--muted-foreground) uppercase tracking-wider">{item.category}</p>
                      <h3 className="text-sm font-cormorant-garamond line-clamp-1">{item.title}</h3>
                      {item.color && (
                        <p className="text-xs text-(--muted-foreground)">Color: {item.color}</p>
                      )}
                      <p className="text-sm text-(--primary)">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* totals */}
              <div className="space-y-3 mb-4 pb-4 border-b border-(--border)">
                <div className="flex justify-between text-sm">
                  <span className="text-(--muted-foreground)">Subtotal</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-(--muted-foreground)">Shipping</span>
                  <span>Rs. {shipping.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-lg uppercase tracking-wider">Total</span>
                <span className="text-2xl text-(--primary) font-cormorant-garamond">
                  Rs. {total.toLocaleString()}
                </span>
              </div>

              {/* trust badges */}
              <div className="pt-4 border-t border-(--border) space-y-2">
                {[
                  "Cash on Delivery available",
                  "Free returns within 7 days",
                  "Secure checkout",
                ].map((badge) => (
                  <p key={badge} className="text-xs text-(--muted-foreground) flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                    {badge}
                  </p>
                ))}
              </div>

              {/* back to cart */}
              {!isBuyNow && (
                <Link href="/cart" className="block mt-6">
                  <button className="w-full py-3 border border-(--border) hover:border-(--primary) uppercase text-sm tracking-wider transition-colors flex items-center justify-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Back to Cart
                  </button>
                </Link>
              )}

            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}