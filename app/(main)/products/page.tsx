"use client"
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Eye, Funnel, AlertCircle, Clock, Glasses, Wallet, ChevronRight } from 'lucide-react'
import { IProduct } from '@/models/Product'
import { useCartStore } from '@/app/store/cartStore'
import Link from 'next/link'
import { Image } from '@imagekit/next'
import CategorySection from '@/app/components/CategorySection'
import { apiClient } from '@/lib/api-client'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 }
}

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
}

// ✅ filter by category not subcategory
const filters = ["All", "Watches", "Glasses", "Wallets"]
const sortOptions = [
  { label: "Default", value: "default" },
  { label: "Price: Low to High", value: "asc" },
  { label: "Price: High to Low", value: "desc" },
]

// ✅ fixed featured pieces data
const featuredPieces = [
  {
    href: "/products/watches",
    icon: Clock,
    title: "Swiss Timepieces",
    description: "Precision engineering",
  },
  {
    href: "/products/wallets",
    icon: Wallet,
    title: "Leather Goods",
    description: "Artisan craftsmanship",
  },
  {
    href: "/products/glasses",
    icon: Glasses,
    title: "Designer Eyewear",
    description: "Refined vision",
  },
]

const Products = () => {
  const [products, setProducts] = useState<IProduct[]>([])
  const [filtered, setFiltered] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState("All") // ✅ renamed from activeSubcategory
  const [activeSort, setActiveSort] = useState("default")
  const { addItem } = useCartStore()

  useEffect(() => {
    async function getData() {
      try {
        setLoading(true)
        const res = await apiClient.getProducts()
        if (res.success) {
          setProducts(res.data || [])
          setFiltered(res.data || [])
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

  // ✅ filter by category not subcategory
  useEffect(() => {
    let result = [...products]

    if (activeFilter !== "All") {
      result = result.filter(p =>
        p.category.toLowerCase() === activeFilter.toLowerCase()
      )
    }

    if (activeSort === "asc") result.sort((a, b) => a.price - b.price)
    if (activeSort === "desc") result.sort((a, b) => b.price - a.price)

    setFiltered(result)
  }, [products, activeFilter, activeSort])

  return (
    <>
      {/* ── Hero ── */}
      <section className='relative min-h-[calc(100vh-75px)] flex items-center justify-center'>
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="w-full h-full">
            <Image
              src="home.jpg"
              urlEndpoint='https://ik.imagekit.io/fashionstylized'
              alt="Collection"
              fill={true}
              className="w-full h-full object-cover"
              priority
            />
          </motion.div>
          <div className="absolute inset-0 bg-black/40" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30"
          />
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 text-center w-full">

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-sm uppercase tracking-[0.3em] text-white/70 mb-6">
            Fashion Stylized
          </motion.p>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl sm:text-6xl lg:text-8xl tracking-tight leading-none font-cormorant-garamond text-white">
            Curated
          </motion.h1>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl sm:text-6xl lg:text-8xl tracking-tight leading-none font-cormorant-garamond mb-6">
            <span className="text-(--primary)">Collection</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-base sm:text-lg lg:text-xl text-white/80 mb-10 max-w-2xl mx-auto tracking-wide px-4">
            Discover our meticulously assembled collections, each telling a unique story of craftsmanship
          </motion.p>

          {/* ✅ fixed scroll indicator positioning */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="hidden sm:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-white/50">Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-px h-8 bg-white/50"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Category Section ── */}
      <CategorySection />

      {/* ── Filters + Products ── */}
      <section className="max-w-[1600px] mx-auto px-6 lg:px-12 py-12">

        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-12">
          <h2 className='text-5xl lg:text-6xl mb-4 font-cormorant-garamond'>All Products</h2>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: 96 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className='h-[1px] bg-(--primary)'
          />
        </motion.div>

        {/* filters row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 pb-6 border-b border-(--border) gap-4">

          <div className='flex flex-wrap items-center gap-3'>
            <Funnel className='w-4 h-4 text-(--muted-foreground)' />
            {filters.map((filter) => (
              <motion.button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`px-5 py-2 uppercase text-xs tracking-wider border transition-all duration-300 ${
                  activeFilter === filter
                    ? "bg-(--primary) text-(--primary-foreground) border-(--primary)"
                    : "border-(--border) text-(--muted-foreground) hover:border-(--primary) hover:text-foreground"
                }`}>
                {filter}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {!loading && !error && (
              <p className="text-xs uppercase tracking-widest text-(--muted-foreground)">
                {filtered.length} {filtered.length === 1 ? "item" : "items"}
              </p>
            )}
            <select
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value)}
              className='bg-(--secondary) px-4 py-2 border border-(--border) focus:border-(--primary) outline-none text-sm uppercase tracking-wider cursor-pointer'>
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* loading skeleton */}
        {loading && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-white/10 mb-4" />
                <div className="h-5 bg-white/10 mb-2 w-3/4" />
                <div className="h-4 bg-white/10 w-1/4" />
              </div>
            ))}
          </div>
        )}

        {/* error */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-red-400 text-xl">Failed to load products</p>
            <p className="text-(--muted-foreground) text-sm">{error}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => window.location.reload()}
              className="mt-2 px-8 py-3 border border-(--border) hover:border-(--primary) uppercase text-sm tracking-wider transition-colors">
              Try Again
            </motion.button>
          </motion.div>
        )}

        {/* empty state */}
        {!loading && !error && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 gap-3 text-center">
            <p className="text-3xl font-cormorant-garamond">No products found</p>
            <p className="text-(--muted-foreground) text-sm">Try a different filter</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveFilter("All"); setActiveSort("default") }}
              className="mt-4 px-8 py-3 border border-(--primary) text-(--primary) uppercase text-sm tracking-wider hover:bg-(--primary) hover:text-(--primary-foreground) transition-colors">
              Clear Filters
            </motion.button>
          </motion.div>
        )}

        {/* product grid */}
        {!loading && !error && filtered.length > 0 && (
          <motion.div layout className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            <AnimatePresence mode="popLayout">
              {filtered.map((item, index) => (
                <motion.div
                  key={item._id?.toString()}
                  layout
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
                  className="group cursor-pointer">

                  <Link href={`/products/${item._id}`}>
                    <div className="relative overflow-hidden aspect-[3/4] mb-6 bg-secondary">
                      <Image
                        urlEndpoint='https://ik.imagekit.io/fashionstylized'
                        alt={item.title}
                        fill={true}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                        src={item.images?.[0] || "home.jpg"}
                      />

                      {/* desktop hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex flex-col items-center justify-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.preventDefault()
                            addItem({
                              id: item._id?.toString() || '',
                              title: item.title,
                              price: item.price,
                              image: item.images?.[0] || "home.jpg",
                              category: item.category,
                              quantity: 1
                            })
                          }}
                          disabled={item.stock === 0}
                          className="bg-(--primary) text-(--primary-foreground) px-8 py-3 uppercase tracking-wider text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                          <ShoppingBag className="w-4 h-4" />
                          {item.stock === 0 ? "Out of Stock" : "Add to Cart"}
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-white/10 backdrop-blur-sm text-white px-8 py-3 uppercase tracking-wider text-sm flex items-center gap-2 border border-white/20">
                          <Eye className="w-4 h-4" />
                          View Details
                        </motion.button>
                      </div>

                      {/* badges */}
                      {item.stock === 0 && (
                        <div className="absolute top-4 left-4 bg-black/80 text-white text-xs uppercase tracking-wider px-3 py-1">
                          Out of Stock
                        </div>
                      )}
                      {item.isTrending && item.stock > 0 && (
                        <div className="absolute top-4 right-4 bg-(--primary) text-(--primary-foreground) text-xs uppercase tracking-wider px-3 py-1">
                          Trending
                        </div>
                      )}
                    </div>
                  </Link>

                  <Link href={`/products/${item._id}`}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.08 + 0.2 }}
                      className="space-y-2 mb-4">
                      <p className="text-xs uppercase tracking-widest text-(--muted-foreground)">
                        {(item as any).subcategory || item.category}
                      </p>
                      <h3 className="text-2xl font-cormorant-garamond group-hover:text-(--primary) transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-(--primary) tracking-wider">
                        Rs {item.price.toLocaleString()}
                      </p>
                    </motion.div>
                  </Link>

                  {/* mobile add to cart */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => addItem({
                      id: item._id?.toString() || '',
                      title: item.title,
                      price: item.price,
                      image: item.images?.[0] || "home.jpg",
                      category: item.category,
                      quantity: 1
                    })}
                    disabled={item.stock === 0}
                    className="sm:hidden w-full py-3 border border-(--primary) text-(--primary) uppercase text-xs tracking-wider hover:bg-(--primary) hover:text-(--primary-foreground) transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    {item.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </motion.button>

                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* ── Featured Pieces ── */}
      <section className='py-24 px-6 lg:px-12 bg-card/30'>
        <div className='max-w-[1600px] mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className='mb-16 text-center'>
            <h2 className='text-5xl lg:text-6xl mb-4 font-cormorant-garamond'>Featured Pieces</h2>
            <p className='text-(--muted-foreground) max-w-2xl mx-auto'>
              Handpicked selections from our most popular collections
            </p>
          </motion.div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {featuredPieces.map((piece, i) => (
              <motion.div
                key={piece.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}>
                <Link href={piece.href}>
                  <div className='bg-card p-12 border border-(--border) text-center group cursor-pointer hover:border-(--primary) transition-colors duration-300'>
                    <piece.icon className="w-16 h-16 text-(--primary) mb-6 mx-auto" />
                    <h3 className='text-3xl mb-3 font-cormorant-garamond'>{piece.title}</h3>
                    <p className='text-(--muted-foreground) mb-6'>{piece.description}</p>
                    <div className='flex items-center justify-center gap-2 text-(--primary) opacity-0 group-hover:opacity-100 transition-opacity'>
                      <span className="text-sm uppercase tracking-wider">Shop now</span>
                      <ChevronRight className='w-4 h-4' />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default Products