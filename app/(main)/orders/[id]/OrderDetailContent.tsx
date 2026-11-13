// app/(main)/orders/[id]/OrderDetailContent.tsx
"use client"
import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2, Package, MapPin, Phone, Mail, ArrowRight, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { getMetaPurchaseEventId } from "@/lib/metaEventIds"
import Link from "next/link"
import { Image } from "@imagekit/next"
import { IOrder } from "@/models/Order"

export default function OrderDetailContent() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<IOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const trackedRef = useRef(false) // guards against double-firing within this mount

  useEffect(() => {
    async function getOrder() {
      try {
        const res = await apiClient.getOrderById(id?.toString() || "")
        if (res.success) {
          setOrder(res.data)
        } else {
          setError("Order not found")
        }
      } catch {
        setError("Something went wrong")
      } finally {
        setLoading(false)
      }
    }
    getOrder()
  }, [id])

// Fire TikTok PlaceAnOrder + Facebook Purchase (both funnel-verified events)
useEffect(() => {
  if (!order || !order._id) return

  const orderId = order._id.toString()
  const storageKey = `pixel_tracked_${orderId}`
  const eventId = getMetaPurchaseEventId(orderId)

  if (trackedRef.current || sessionStorage.getItem(storageKey)) {
    console.info("[Meta Pixel] Purchase suppressed: already tracked", { eventId })
    return
  }

  trackedRef.current = true
  sessionStorage.setItem(storageKey, "1")

  const contents = order.products.map((item) => ({
    content_id: item.productId?.toString() || item.title,
    content_type: "product" as const,
    content_name: item.title,
  }))

  const eventParams = {
    value: order.totalAmount,
    currency: "PKR",
    contents,
  }

  if (typeof window !== "undefined" && window.ttq) {
    window.ttq.track("Purchase", eventParams, { event_id: `${eventId}_purchase` })
    window.ttq.track("PlaceAnOrder", eventParams, { event_id: `${eventId}_place` })
  }

  // ✅ Facebook Pixel Purchase
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq('track', 'Purchase', {
      value: order.totalAmount,
      currency: 'PKR',
      content_ids: contents.map(c => c.content_id),
      content_type: 'product',
      num_items: order.products.reduce((sum, p) => sum + p.quantity, 0),
    }, { eventID: eventId }) // event_id for CAPI dedup, note fbq uses "eventID" not "event_id"
  } else {
    console.warn("[Meta Pixel] Purchase not sent: fbq is unavailable", { eventId })
  }

  apiClient.trackTikTokEvent({
    event: "Purchase",
    eventId: `${eventId}_purchase`,
    value: order.totalAmount,
    currency: "PKR",
    contents,
    email: order.email,
    phone: order.mobileNumber,
    pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
  }).catch(() => {})

  apiClient.trackTikTokEvent({
    event: "PlaceAnOrder",
    eventId: `${eventId}_place`,
    value: order.totalAmount,
    currency: "PKR",
    contents,
    email: order.email,
    phone: order.mobileNumber,
    pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
  }).catch(() => {})

  // ⚠️ If you have a Facebook Conversions API endpoint, call it here too —
  // see note below on why this matters more for Facebook than TikTok.
}, [order])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-(--muted-foreground)" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-12 flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <p className="text-red-400 text-xl">Order not found</p>
        <Link href="/products">
          <button className="px-8 py-3 bg-(--primary) text-(--primary-foreground) uppercase text-sm tracking-wider">
            Continue Shopping
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 lg:px-12 py-12">

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12">

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-5xl lg:text-6xl font-cormorant-garamond mb-3">
          Order Placed!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-(--muted-foreground) text-sm mb-2">
          Thank you, {order.name}. Your order has been confirmed.
        </motion.p>

       <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-(--muted-foreground) uppercase tracking-widest">
          Order ID: <span className="text-foreground">{order._id?.toString() || "NaN"}</span>
        </motion.p>
      </motion.div>

      <div className="space-y-6">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border border-(--border) bg-(--card) p-6">

          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <h2 className="text-xl uppercase tracking-wider">Order Status</h2>
            <span className="text-xs uppercase tracking-widest px-3 py-1 border border-(--primary) text-(--primary)">
              {order.status}
            </span>
          </div>

{(() => {
  const steps = ["pending", "processing", "shipped", "delivered"]
  const currentIndex = steps.indexOf(order.status)
  return (
    <>
      <div className="flex flex-col gap-3 sm:hidden">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
              i <= currentIndex
                ? "border-(--primary) bg-(--primary) text-(--primary-foreground)"
                : "border-(--border) text-(--muted-foreground)"
            }`}>
              {i < currentIndex ? "\u2713" : i + 1}
            </div>

            <div className="flex-1">
              <p className={`text-xs uppercase tracking-wider ${
                i <= currentIndex ? "text-(--primary)" : "text-(--muted-foreground)"
              }`}>
                {step}
              </p>
              {i < steps.length - 1 && (
                <div className={`w-px h-4 ml-[14px] mt-1 ${
                  i < currentIndex ? "bg-(--primary)" : "bg-(--border)"
                }`} />
              )}
            </div>

            {i === currentIndex && (
              <span className="text-xs uppercase tracking-wider text-(--primary) border border-(--primary) px-2 py-0.5">
                Current
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="hidden sm:flex items-center">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                i <= currentIndex
                  ? "border-(--primary) bg-(--primary) text-(--primary-foreground)"
                  : "border-(--border) text-(--muted-foreground)"
              }`}>
                {i < currentIndex ? "\u2713" : i + 1}
              </div>
              <p className={`text-xs uppercase tracking-wider mt-2 text-center ${
                i <= currentIndex ? "text-(--primary)" : "text-(--muted-foreground)"
              }`}>
                {step}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px flex-1 mb-5 transition-colors ${
                i < currentIndex ? "bg-(--primary)" : "bg-(--border)"
              }`} />
            )}
          </div>
        ))}
      </div>
    </>
  )
})()}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="border border-(--border) bg-(--card) p-6">

          <h2 className="text-xl uppercase tracking-wider mb-6">
            Items Ordered ({order.products.length})
          </h2>

          <div className="space-y-4">
            {order.products.map((item, index) => (
              <div
                key={index}
                className="flex gap-4 pb-4 border-b border-(--border) last:border-0 last:pb-0">
                <div className="relative w-16 h-16 flex-shrink-0 bg-(--secondary)">
                  <Image
                    urlEndpoint="https://ik.imagekit.io/fashionstylized"
                    alt={item.title}
                    fill={true}
                    className="w-full h-full object-cover"
                    src={item.image || "home.jpg"}
                  />
                  <span className="absolute -top-2 -right-2 bg-(--primary) text-(--primary-foreground) text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-widest text-(--muted-foreground)">
                    {item.category}
                  </p>
                  <h3 className="text-base font-cormorant-garamond line-clamp-1">
                    {item.title}
                  </h3>
                  {item.color && (
                    <p className="text-xs text-(--muted-foreground)">Color: {item.color}</p>
                  )}
                  <p className="text-sm text-(--primary)">
  Rs. {item.price.toLocaleString()} {"\u00D7"} {item.quantity} = Rs.{" "}
  {(item.price * item.quantity).toLocaleString()}
</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-(--border) space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-(--muted-foreground)">Subtotal</span>
              <span>Rs. {(order.totalAmount - order.shippingFee).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-(--muted-foreground)">Shipping</span>
              <span>Rs. {order.shippingFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-(--border)">
              <span className="uppercase tracking-wider">Total</span>
              <span className="text-xl text-(--primary) font-cormorant-garamond">
                Rs. {order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          <div className="border border-(--border) bg-(--card) p-6">
            <h2 className="text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-(--primary)" />
              Shipping Address
            </h2>
            <div className="space-y-1 text-sm text-(--muted-foreground)">
              <p className="text-foreground font-medium">{order.name}</p>
              <p>{order.address}</p>
              <p>{order.city}{order.postalCode ? `, ${order.postalCode}` : ""}</p>
            </div>
          </div>

          <div className="border border-(--border) bg-(--card) p-6">
            <h2 className="text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-(--primary)" />
              Order Info
            </h2>
            <div className="space-y-2 text-sm text-(--muted-foreground)">
              <p className="flex items-center gap-2">
                <Mail className="w-3 h-3" /> {order.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3 h-3" /> {order.mobileNumber}
              </p>
              <p className="flex items-center gap-2 mt-2">
                <span className="text-xs uppercase tracking-wider">Payment:</span>
                <span className="text-foreground">{order.paymentMethod}</span>
              </p>
             <p className="flex items-center gap-2">
  <span className="text-xs uppercase tracking-wider">Date:</span>
  <span className="text-foreground">
    {order.createdAt
      ? new Date(order.createdAt).toLocaleDateString("en-PK", {
          day: "numeric",
          month: "long",
          year: "numeric"
        })
      : "N/A"
    }
  </span>
</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4">

          <Link href="/orders" className="flex-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 border border-(--primary) text-(--primary) uppercase tracking-widest text-sm hover:bg-(--primary) hover:text-(--primary-foreground) transition-colors flex items-center justify-center gap-2">
              <Package className="w-4 h-4" />
              View All Orders
            </motion.button>
          </Link>

          <Link href="/products" className="flex-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-(--primary) text-(--primary-foreground) uppercase tracking-widest text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </motion.div>

      </div>
    </div>
  )
}