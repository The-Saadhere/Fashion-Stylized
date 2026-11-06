// app/admin/products/page.tsx
"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, Pencil, Trash2, Loader2, AlertCircle, RefreshCw, TrendingUp } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { Image } from "@imagekit/next"
import { IProduct } from "@/models/Product"


const categories = ["All", "watches", "glasses", "wallets"]

export default function AdminProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([])
  const [filtered, setFiltered] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError("")
      const res = await apiClient.getProducts()
      if (res.success) {
        setProducts(res.data || [])
        setFiltered(res.data || [])
      } else {
        setError(res.error || "Failed to fetch products")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // filter + search
  useEffect(() => {
    let result = [...products]
    if (activeCategory !== "All") {
      result = result.filter(p => p.category === activeCategory)
    }
    if (search.trim()) {
      result = result.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase())
      )
    }
    setFiltered(result)
  }, [products, activeCategory, search])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await apiClient.deleteProduct(id)
      if (res.success) {
        setProducts(prev => prev.filter(p => p?._id?.toString() !== id))
        setShowDeleteConfirm(null)
      }
    } catch {
      console.error("Failed to delete")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-white/10 w-48 animate-pulse" />
        <div className="h-12 bg-white/10 animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-white/10 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* heading */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-cormorant-garamond">Products</h1>
          <p className="text-sm text-(--muted-foreground) mt-1">
            {products.length} total products
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={fetchProducts}
            className="flex items-center gap-2 px-4 py-2 border border-(--border) hover:border-(--primary) text-sm uppercase tracking-wider transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </motion.button>
          <Link href="/admin/products/new">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2 bg-(--primary) text-(--primary-foreground) text-sm uppercase tracking-wider hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" />
              Add Product
            </motion.button>
          </Link>
        </div>
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted-foreground)" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors placeholder:text-(--muted-foreground)"
          />
        </div>
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-2 uppercase text-xs tracking-wider border transition-all ${
                activeCategory === cat
                  ? "bg-(--primary) text-(--primary-foreground) border-(--primary)"
                  : "border-(--border) text-(--muted-foreground) hover:border-(--primary)"
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* results count */}
      <p className="text-xs text-(--muted-foreground) uppercase tracking-wider">
        Showing {filtered.length} of {products.length} products
      </p>

      {/* empty */}
      {filtered.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <p className="text-2xl font-cormorant-garamond">No products found</p>
          <Link href="/admin/products/new">
            <button className="px-6 py-3 bg-(--primary) text-(--primary-foreground) uppercase text-sm tracking-wider">
              Add First Product
            </button>
          </Link>
        </div>
      )}

      {/* desktop table */}
      {filtered.length > 0 && (
        <>
          <div className="hidden lg:block border border-(--border) overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-(--border) bg-(--card)">
                  {["Image", "Title", "Category", "Price", "Stock", "Trending", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-(--muted-foreground)">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((product, index) => (
                    <motion.tr
                      key={product?._id?.toString() || index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-(--border) hover:bg-white/5 transition-colors">

                      {/* image */}
                      <td className="px-4 py-3">
                        <div className="relative w-12 h-12 bg-(--secondary) overflow-hidden">
                          {product.images?.[0] ? (
                            <Image
                              urlEndpoint="https://ik.imagekit.io/fashionstylized"
                              alt={product.title}
                              fill={true}
                              sizes="48px"
                              className="w-full h-full object-cover"
                              src={product.images[0]}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-(--muted-foreground) text-xs">
                              No img
                            </div>
                          )}
                        </div>
                      </td>

                      {/* title */}
                      <td className="px-4 py-3">
                        <p className="font-medium line-clamp-1 max-w-[200px]">{product.title}</p>
                      </td>

                      {/* category */}
                      <td className="px-4 py-3 text-(--muted-foreground) capitalize text-xs uppercase tracking-wider">
                        {product.category}
                      </td>

                      {/* price */}
                      <td className="px-4 py-3 text-(--primary) font-cormorant-garamond text-base">
                        {product.discountPrice && product.discountPrice < product.price ? (
                          <span className="flex flex-col">
                            <span>Rs. {product.discountPrice.toLocaleString()}</span>
                            <span className="text-xs text-(--muted-foreground) line-through">
                              Rs. {product.price.toLocaleString()}
                            </span>
                          </span>
                        ) : (
                          `Rs. ${product.price.toLocaleString()}`
                        )}
                      </td>

                      {/* stock */}
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 border ${
                          product.stock === 0
                            ? "text-red-400 border-red-500/40 bg-red-500/10"
                            : product.stock <= 5
                            ? "text-yellow-400 border-yellow-500/40 bg-yellow-500/10"
                            : "text-green-400 border-green-500/40 bg-green-500/10"
                        }`}>
                          {product.stock === 0 ? "Out of Stock" : `${product.stock} left`}
                        </span>
                      </td>

                      {/* trending */}
                      <td className="px-4 py-3">
                        {product.isTrending ? (
                          <span className="flex items-center gap-1 text-xs text-(--primary)">
                            <TrendingUp className="w-3 h-3" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-xs text-(--muted-foreground)">No</span>
                        )}
                      </td>

                      {/* actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/products/${product._id}`}>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-1 px-3 py-1.5 border border-(--border) hover:border-(--primary) text-xs uppercase tracking-wider transition-colors">
                              <Pencil className="w-3 h-3" />
                              Edit
                            </motion.button>
                          </Link>

                          {showDeleteConfirm === product?._id?.toString() ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(product?._id?.toString() || "")}
                                disabled={deletingId === product?._id?.toString()}
                                className="px-3 py-1.5 bg-red-500 text-white text-xs uppercase tracking-wider hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center gap-1">
                                {deletingId === product?._id?.toString()
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : "Confirm"
                                }
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-3 py-1.5 border border-(--border) text-xs uppercase tracking-wider hover:border-(--primary) transition-colors">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setShowDeleteConfirm(product?._id?.toString() || null)}
                              className="flex items-center gap-1 px-3 py-1.5 border border-(--border) hover:border-red-500/60 hover:text-red-400 text-xs uppercase tracking-wider transition-colors">
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map((product, index) => (
              <motion.div
                key={product._id?.toString() || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-(--border) bg-(--card) p-4 flex gap-4">

                {/* image */}
                <div className="relative w-16 h-16 flex-shrink-0 bg-(--secondary)">
                  {product.images?.[0] && (
                    <Image
                      urlEndpoint="https://ik.imagekit.io/fashionstylized"
                      alt={product.title}
                      fill={true}
                      sizes="64px"
                      className="w-full h-full object-cover"
                      src={product.images[0]}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium line-clamp-1">{product.title}</h3>
                  <p className="text-xs text-(--muted-foreground) uppercase mt-0.5">{product.category}</p>
                  <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                    <p className="text-(--primary) font-cormorant-garamond">
                      {product.discountPrice && product.discountPrice < product.price ? (
                        <>
                          Rs. {product.discountPrice.toLocaleString()}
                          <span className="ml-2 text-xs text-(--muted-foreground) line-through">
                            Rs. {product.price.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        `Rs. ${product.price.toLocaleString()}`
                      )}
                    </p>
                    <span className={`text-xs px-2 py-0.5 border ${
                      product.stock === 0
                        ? "text-red-400 border-red-500/40"
                        : product.stock <= 5
                        ? "text-yellow-400 border-yellow-500/40"
                        : "text-green-400 border-green-500/40"
                    }`}>
                      {product.stock === 0 ? "Out of Stock" : `${product.stock}`}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link href={`/admin/products/${product._id}`} className="flex-1">
                      <button className="w-full py-2 border border-(--border) hover:border-(--primary) text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1">
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    </Link>
                    <button
                      onClick={() => showDeleteConfirm === product?._id?.toString()
                        ? handleDelete(product?._id?.toString())
                        : setShowDeleteConfirm(product?._id?.toString() || null )
                      }
                      disabled={deletingId === product?._id?.toString()}
                      className={`flex-1 py-2 border text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1 disabled:opacity-60 ${
                        showDeleteConfirm === product?._id?.toString()
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-(--border) hover:border-red-500/60 hover:text-red-400"
                      }`}>
                      {deletingId === product._id?.toString()
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <><Trash2 className="w-3 h-3" />{showDeleteConfirm === product._id?.toString() ? "Confirm" : "Delete"}</>
                      }
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}