// app/admin/orders/page.tsx
"use client"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Eye, ChevronDown, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"

type Order = {
  _id: string
  name: string
  email: string
  mobileNumber: string
  city: string
  totalAmount: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  paymentMethod: string
  products: { title: string; quantity: number; price: number; color?: string }[]
  createdAt: string
}

const statusColors: Record<string, string> = {
  pending: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
  processing: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  shipped: "text-purple-400 border-purple-500/40 bg-purple-500/10",
  delivered: "text-green-400 border-green-500/40 bg-green-500/10",
  cancelled: "text-red-400 border-red-500/40 bg-red-500/10",
}

const allStatuses = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [activeStatus, setActiveStatus] = useState("All")
  const [totalOrders, setTotalOrders] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const requestGeneration = useRef(0)

  useEffect(() => {
    const generation = ++requestGeneration.current

    const fetchFirstPage = async () => {
      setLoading(true)
      setLoadingMore(false)
      setError("")
      try {
        const params = {
          page: 1,
          limit: 20,
          ...(activeStatus !== "All" ? { status: activeStatus.toLowerCase() } : {}),
        }
        const res = appliedSearch
          ? await apiClient.adminSearchOrders({ ...params, query: appliedSearch })
          : await apiClient.adminGetOrders(params)

        if (generation !== requestGeneration.current) return
        if (!res.success) {
          setOrders([])
          setTotalOrders(0)
          setHasMore(false)
          setError(res.error || "Failed to fetch orders")
          return
        }

        setOrders(res.data || [])
        setTotalOrders(res.total)
        setPage(res.page)
        setHasMore(res.hasMore)
      } catch {
        if (generation === requestGeneration.current) {
          setOrders([])
          setTotalOrders(0)
          setHasMore(false)
          setError("Something went wrong")
        }
      } finally {
        if (generation === requestGeneration.current) setLoading(false)
      }
    }

    fetchFirstPage()
    return () => {
      requestGeneration.current += 1
    }
  }, [activeStatus, appliedSearch, refreshKey])

  const loadMoreOrders = async () => {
    const generation = requestGeneration.current
    setLoadingMore(true)
    setError("")
    try {
      const params = {
        page: page + 1,
        limit: 20,
        ...(activeStatus !== "All" ? { status: activeStatus.toLowerCase() } : {}),
      }
      const res = appliedSearch
        ? await apiClient.adminSearchOrders({ ...params, query: appliedSearch })
        : await apiClient.adminGetOrders(params)

      if (generation !== requestGeneration.current) return
      if (!res.success) {
        setError(res.error || "Failed to fetch more orders")
        return
      }

      setOrders(prev => [...prev, ...(res.data || [])])
      setTotalOrders(res.total)
      setPage(res.page)
      setHasMore(res.hasMore)
    } catch {
      if (generation === requestGeneration.current) setError("Something went wrong")
    } finally {
      if (generation === requestGeneration.current) setLoadingMore(false)
    }
  }

  const submitSearch = () => {
    setAppliedSearch(search.trim())
    setRefreshKey(key => key + 1)
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    setOpenDropdown(null)
    try {
      const res = await apiClient.updateOrderStatus(orderId, newStatus)
      if (res.success) {
        const shouldRemoveFromStatusFilter = activeStatus !== "All" &&
          activeStatus.toLowerCase() !== newStatus.toLowerCase()
        setOrders(prev => prev.flatMap(order => {
          if (order._id !== orderId) return [order]
          return shouldRemoveFromStatusFilter
            ? []
            : [{ ...order, status: newStatus as Order["status"] }]
        }))
        if (shouldRemoveFromStatusFilter) {
          const updatedTotal = Math.max(0, totalOrders - 1)
          setTotalOrders(updatedTotal)
          setHasMore(page * 20 < updatedTotal)
        }
      }
    } catch {
      console.error("Failed to update status")
    } finally {
      setUpdatingId(null)
    }
  }

  // loading
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-white/10 w-48 animate-pulse" />
        <div className="h-12 bg-white/10 animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-white/10 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* heading */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-cormorant-garamond">Orders</h1>
          <p className="text-sm text-(--muted-foreground) mt-1">
            {totalOrders} total orders
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setRefreshKey(key => key + 1)}
          className="flex items-center gap-2 px-4 py-2 border border-(--border) hover:border-(--primary) text-sm uppercase tracking-wider transition-colors">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </motion.button>
      </div>

      {/* error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/40 text-red-400 px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* filters */}
      <div className="flex flex-col sm:flex-row gap-4">

        {/* search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted-foreground)" />
          <input
            type="text"
            placeholder="Search by order ID, name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault()
                submitSearch()
              }
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors placeholder:text-(--muted-foreground)"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={submitSearch}
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-(--border) hover:border-(--primary) text-sm uppercase tracking-wider transition-colors">
          <Search className="w-4 h-4" />
          Search
        </motion.button>

        {/* status filter */}
        <div className="flex flex-wrap gap-2">
          {allStatuses.map(status => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`px-3 py-2 uppercase text-xs tracking-wider border transition-all ${
                activeStatus === status
                  ? "bg-(--primary) text-(--primary-foreground) border-(--primary)"
                  : "border-(--border) text-(--muted-foreground) hover:border-(--primary)"
              }`}>
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* results count */}
      <p className="text-xs text-(--muted-foreground) uppercase tracking-wider">
        Showing {orders.length} of {totalOrders} orders
      </p>

      {/* empty */}
      {orders.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <p className="text-2xl font-cormorant-garamond">No orders found</p>
          <p className="text-sm text-(--muted-foreground)">Try a different filter or search</p>
        </div>
      )}

      {/* orders table — desktop */}
      {orders.length > 0 && (
        <>
          {/* desktop table */}
          <div className="hidden lg:block border border-(--border) overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-(--border) bg-(--card)">
                  {["Order ID", "Customer", "Items", "Total", "Payment", "Status", "Date", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-(--muted-foreground)">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {orders.map((order, index) => (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-(--border) hover:bg-white/5 transition-colors">

                      {/* order id */}
                      <td className="px-4 py-3 font-mono text-xs">
                        #{order._id.slice(-8).toUpperCase()}
                      </td>

                      {/* customer */}
                      <td className="px-4 py-3">
                        <p className="font-medium line-clamp-1">{order.name}</p>
                        <p className="text-xs text-(--muted-foreground)">{order.city}</p>
                      </td>

                      {/* items */}
                      <td className="px-4 py-3 text-(--muted-foreground)">
                        <p>{order.products.length} {order.products.length === 1 ? "item" : "items"}</p>
                        <div className="mt-1 space-y-0.5">
                          {order.products.map((item, itemIndex) => (
                            <p key={`${item.title}-${itemIndex}`} className="text-xs">
                              {item.title}{item.color ? ` · ${item.color}` : ""}
                            </p>
                          ))}
                        </div>
                      </td>

                      {/* total */}
                      <td className="px-4 py-3 text-(--primary) font-cormorant-garamond text-base">
                        Rs. {order.totalAmount.toLocaleString()}
                      </td>

                      {/* payment */}
                      <td className="px-4 py-3 text-(--muted-foreground) text-xs uppercase">
                        {order.paymentMethod}
                      </td>

                      {/* status dropdown */}
                      <td className="px-4 py-3">
                        <div className="relative">
                          {updatingId === order._id ? (
                            <div className="flex items-center gap-2 text-xs text-(--muted-foreground)">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Updating...
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setOpenDropdown(
                                  openDropdown === order._id ? null : order._id
                                )}
                                className={`flex items-center gap-2 px-3 py-1.5 border text-xs uppercase tracking-wider transition-colors ${statusColors[order.status]}`}>
                                {order.status}
                                <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === order._id ? "rotate-180" : ""}`} />
                              </button>

                              {/* dropdown */}
                              <AnimatePresence>
                                {openDropdown === order._id && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 mt-1 bg-background border border-(--border) z-20 min-w-[140px] shadow-xl">
                                    {["pending", "processing", "shipped", "delivered", "cancelled"].map(status => (
                                      <button
                                        key={status}
                                        onClick={() => handleStatusUpdate(order._id, status)}
                                        className={`w-full text-left px-4 py-2.5 text-xs uppercase tracking-wider hover:bg-white/5 transition-colors ${
                                          order.status === status ? "text-(--primary)" : "text-(--muted-foreground)"
                                        }`}>
                                        {order.status === status && "✓ "}{status}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </>
                          )}
                        </div>
                      </td>

                      {/* date */}
                      <td className="px-4 py-3 text-xs text-(--muted-foreground)">
                        {new Date(order.createdAt).toLocaleDateString("en-PK", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </td>

                      {/* actions */}
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${order._id}`}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1 px-3 py-1.5 border border-(--border) hover:border-(--primary) text-xs uppercase tracking-wider transition-colors">
                            <Eye className="w-3 h-3" />
                            View
                          </motion.button>
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <div className="lg:hidden space-y-3">
            {orders.map((order, index) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-(--border) bg-(--card) p-4 space-y-3">

                {/* top row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs">#{order._id.slice(-8).toUpperCase()}</p>
                    <p className="font-medium mt-0.5">{order.name}</p>
                    <p className="text-xs text-(--muted-foreground)">{order.city}</p>
                  </div>
                  <span className={`text-xs uppercase tracking-wider px-2 py-1 border ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </div>

                {/* middle row */}
                <div className="border-t border-(--border) pt-3 space-y-1">
                  {order.products.map((item, itemIndex) => (
                    <p key={`${item.title}-${itemIndex}`} className="text-xs text-(--muted-foreground)">
                      {item.title}{item.color ? ` · Color: ${item.color}` : ""} × {item.quantity}
                    </p>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm border-t border-(--border) pt-3">
                  <span className="text-(--muted-foreground) text-xs">
                    {order.products.length} items · {order.paymentMethod}
                  </span>
                  <span className="text-(--primary) font-cormorant-garamond text-lg">
                    Rs. {order.totalAmount.toLocaleString()}
                  </span>
                </div>

                {/* actions */}
                <div className="flex gap-2 pt-1">
                  {/* status update */}
                  <select
                    value={order.status}
                    onChange={e => handleStatusUpdate(order._id, e.target.value)}
                    disabled={updatingId === order._id}
                    className="flex-1 px-3 py-2 bg-(--secondary) border border-(--border) focus:border-(--primary) outline-none text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50">
                    {["pending", "processing", "shipped", "delivered", "cancelled"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  <Link href={`/admin/orders/${order._id}`} className="flex-shrink-0">
                    <button className="px-4 py-2 border border-(--border) hover:border-(--primary) text-xs uppercase tracking-wider transition-colors flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                  </Link>
                </div>

              </motion.div>
            ))}
          </div>
        </>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={loadMoreOrders}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-3 border border-(--border) hover:border-(--primary) text-sm uppercase tracking-wider transition-colors disabled:opacity-50">
            {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
            {loadingMore ? "Loading..." : "Show more orders"}
          </motion.button>
        </div>
      )}
    </div>
  )
}