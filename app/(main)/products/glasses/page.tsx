"use client"
import { apiClient } from '@/lib/api-client'
import { Image } from '@imagekit/next'
import { Funnel, Eye, ShoppingBag, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { IProduct } from '@/models/Product'
import { useCartStore } from '@/app/store/cartStore'
import Link from 'next/link'

const subcategories = ["All", "Round", "Square", "SunGlasses"]
const sortOptions = [
  { label: "Default", value: "default" },
  { label: "Price: Low to High", value: "asc" },
  { label: "Price: High to Low", value: "desc" },
]

const Glass = () => {
  const [glasses, setGlasses] = useState<IProduct[]>([])
  const [filtered, setFiltered] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSubcategory, setActiveSubcategory] = useState("All")
  const [activeSort, setActiveSort] = useState("default")
  const { addItem } = useCartStore()

  useEffect(() => {
    async function getData() {
      try {
        setLoading(true)
        const res = await apiClient.getProductsByCategory("glasses")
        if (res.success) {
          setGlasses(res.data || [])
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

  // filter + sort
  useEffect(() => {
    let result = [...glasses]

    // subcategory filter
    if (activeSubcategory !== "All") {
      result = result.filter(p =>
        (p as any).subcategory?.toLowerCase() === activeSubcategory.toLowerCase()
      )
    }

    // sort
    if (activeSort === "asc") result.sort((a, b) => a.price - b.price)
    if (activeSort === "desc") result.sort((a, b) => b.price - a.price)

    setFiltered(result)
  }, [glasses, activeSubcategory, activeSort])

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="w-full h-full">
            <Image
              urlEndpoint='https://ik.imagekit.io/fashionstylized'
              alt="Glasses bg"
              fill={true}
              className='w-full h-full object-cover opacity-40'
              src="/glass.jpg"
            />
          </motion.div>
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className='relative z-10 text-center px-6'>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-sm uppercase tracking-[0.3em] text-(--muted-foreground) mb-4">
            Our Collection
          </motion.p>
          <h2 className='text-6xl lg:text-7xl mb-4 font-cormorant-garamond'>
            Eyewear
          </h2>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="h-px bg-(--primary) mx-auto mb-4"
          />
          <p className="text-lg text-(--muted-foreground) max-w-2xl mx-auto tracking-wide">
            Refined vision for the modern individual
          </p>
        </motion.div>
      </section>

      {/* ── Filters ── */}
      <section className="max-w-400 mx-auto px-6 lg:px-12 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 pb-6 border-b border-(--border) gap-4">

          {/* subcategory pills */}
          <div className='flex flex-wrap items-center gap-3'>
            <Funnel className='w-4 h-4 text-(--muted-foreground)' />
            {subcategories.map((sub) => (
              <motion.button
                key={sub}
                onClick={() => setActiveSubcategory(sub)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`px-5 py-2 uppercase text-xs tracking-wider border transition-all duration-300 ${
                  activeSubcategory === sub
                    ? "bg-(--primary) text-(--primary-foreground) border-(--primary)"
                    : "border-(--border) text-(--muted-foreground) hover:border-(--primary) hover:text-foreground"
                }`}>
                {sub}
              </motion.button>
            ))}
          </div>

          {/* sort + results count */}
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

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-3/4 bg-white/10 mb-4" />
                <div className="h-5 bg-white/10 mb-2 w-3/4" />
                <div className="h-4 bg-white/10 w-1/4" />
              </div>
            ))}
          </div>
        )}

        {/* ── Error ── */}
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

        {/* ── Empty state ── */}
        {!loading && !error && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 gap-3 text-center">
            <p className="text-3xl font-cormorant-garamond">No eyewear found</p>
            <p className="text-(--muted-foreground) text-sm">Try a different filter</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveSubcategory("All"); setActiveSort("default") }}
              className="mt-4 px-8 py-3 border border-(--primary) text-(--primary) uppercase text-sm tracking-wider hover:bg-(--primary) hover:text-(--primary-foreground) transition-colors">
              Clear Filters
            </motion.button>
          </motion.div>
        )}

        {/* ── Product grid ── */}
        {!loading && !error && filtered.length > 0 && (
          <motion.div
            layout
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            <AnimatePresence mode="popLayout">
             // replace your product card with this
{filtered.map((item, index) => (
  <motion.div
   key={item._id?.toString()} // ✅ use _id not index
    layout
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
    className="group cursor-pointer">

    {/* image wrapper — whole thing is a link on mobile */}
    <Link href={`/products/${item._id}`}>
      <div className="relative overflow-hidden aspect-3/4 mb-6 bg-secondary">
        <Image
          urlEndpoint='https://ik.imagekit.io/fashionstylized'
          alt={item.title}
          fill={true}
          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
          src={item.images?.[0] || "/home.jpg"}
        />

        {/* desktop hover overlay — hidden on mobile */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex flex-col items-center justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault() // ✅ prevent link navigation when clicking button
              addItem({
                id: item._id ? item._id.toString() : '',
                title: item.title,
                price: item.price,
                image: item.images?.[0] || "/home.jpg",
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

    {/* info + mobile add to cart button */}
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

    {/* ✅ mobile only — add to cart button below product info */}
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => addItem({
       id: item._id ? item._id.toString() : '',
        title: item.title,
        price: item.price,
        image: item.images?.[0] || "/home.jpg",
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
    </>
  )
}

export default Glass