"use client"
import { apiClient } from '@/lib/api-client'
import { Image } from '@imagekit/next'
import { motion, AnimatePresence } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { ShoppingBag, Eye } from 'lucide-react'

type Product = {
  _id: string
  title: string
  price: number
  category: string
  images?: string[]
  imageUrl?: string[]
  stock: number
  isTrending: boolean
}

const filters = ["All", "Watches", "Glasses", "Wallets"]

const NewArrival = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [activeFilter, setActiveFilter] = useState("All")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function getData() {
      try {
        setLoading(true)
        const res = await apiClient.getTrendingProducts()
        if (res.success) {
          setProducts(res.data)
          setFiltered(res.data)
        } else {
          setError(res.error || "Failed to fetch products")
        }
      } catch (err) {
        setError("Something went wrong. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    getData()
  }, [])

  // filter logic
  const handleFilter = (filter: string) => {
    setActiveFilter(filter)
    if (filter === "All") {
      setFiltered(products)
    } else {
      setFiltered(products.filter(p =>
        p.category.toLowerCase() === filter.toLowerCase()
      ))
    }
  }

  // get image url — handles both images[] and imageUrl[]
  const getImage = (product: Product) => {
    if (product.images && product.images.length > 0) return product.images[0]
    if (product.imageUrl && product.imageUrl.length > 0) return product.imageUrl[0]
    return "/home.jpg" // fallback
  }

  return (
    <section className='py-24 px-6 lg:px-12 max-w-[1600px] mx-auto'>

      {/* heading + filters */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className='mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-8'>

        <div>
          <h2 className='text-5xl lg:text-6xl mb-4 font-cormorant-garamond'>New Arrivals</h2>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: 96 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className='h-[1px] bg-(--primary)'
          />
        </div>

        {/* filter buttons */}
        <div className="flex flex-wrap gap-3">
          {filters.map((filter) => (
            <motion.button
              key={filter}
              onClick={() => handleFilter(filter)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`px-6 py-3 uppercase text-sm tracking-wider border transition-all duration-300 ${
                activeFilter === filter
                  ? "bg-(--primary) text-(--primary-foreground) border-(--primary)"      // ✅ selected
                  : "border-(--border) hover:border-(--primary) text-(--muted-foreground) hover:text-foreground" // unselected
              }`}>
              {filter}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* loading skeleton */}
      {loading && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-white/10 mb-6" />
              <div className="h-6 bg-white/10 mb-2 w-3/4" />
              <div className="h-4 bg-white/10 w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* error state */}
      {!loading && error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <p className="text-red-400 text-lg">Failed to load products</p>
          <p className="text-(--muted-foreground) text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-6 py-3 border border-(--border) hover:border-(--primary) uppercase text-sm tracking-wider transition-colors">
            Try Again
          </button>
        </motion.div>
      )}

      {/* empty state after filter */}
      {!loading && !error && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <p className="text-2xl font-cormorant-garamond">No products found</p>
          <p className="text-(--muted-foreground) text-sm">Try a different category</p>
        </motion.div>
      )}

      {/* product grid */}
      {!loading && !error && (
        <motion.div
          layout
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          <AnimatePresence mode="popLayout">
            {filtered.map((item, index) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                  ease: "easeOut"
                }}
                className="group cursor-pointer">

                {/* image wrapper */}
                <div className="relative overflow-hidden aspect-[3/4] mb-6 bg-secondary">
                  <Image
                    urlEndpoint='https://ik.imagekit.io/fashionstylized'
                    alt={item.title}
                    fill={true}
                    className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                    src="/home.jpg" // ✅ keeping as /home.jpg as requested, change later
                  />

                  {/* hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-(--primary) text-(--primary-foreground) px-8 py-3 uppercase tracking-wider text-sm flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/10 backdrop-blur-sm text-white px-8 py-3 uppercase tracking-wider text-sm flex items-center gap-2 border border-white/20">
                      <Eye className="w-4 h-4" />
                      Quick View
                    </motion.button>
                  </div>

                  {/* out of stock badge */}
                  {item.stock === 0 && (
                    <div className="absolute top-4 left-4 bg-black/80 text-white text-xs uppercase tracking-wider px-3 py-1">
                      Out of Stock
                    </div>
                  )}

                  {/* trending badge */}
                  {item.isTrending && (
                    <div className="absolute top-4 right-4 bg-(--primary) text-(--primary-foreground) text-xs uppercase tracking-wider px-3 py-1">
                      Trending
                    </div>
                  )}
                </div>

                {/* product info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.08 + 0.2 }}
                  className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-(--muted-foreground)">{item.category}</p>
                  <h3 className="text-2xl font-cormorant-garamond group-hover:text-(--primary) transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-(--primary) tracking-wider">Rs {item.price.toLocaleString()}</p>
                </motion.div>

              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

    </section>
  )
}

export default NewArrival