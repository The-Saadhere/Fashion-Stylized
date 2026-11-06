"use client"

import React from 'react'
import Link from 'next/link'
import { Image } from '@imagekit/next'
import { Eye, ShoppingBag, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { IProduct } from '@/models/Product'
import { useCartStore } from '@/app/store/cartStore'
import { getProductPrice, hasProductDiscount } from '@/lib/product-pricing'
import { showToast } from "@/lib/toast"


interface ProductCardProps {
  item: IProduct
  index?: number
  className?: string
}

const ProductCard = ({ item, index = 0, className = '' }: ProductCardProps) => {
  const { addItem } = useCartStore()
  const displayPrice = getProductPrice(item)
  const hasDiscount = hasProductDiscount(item)
  const href = item._id ? `/products/${item._id.toString()}` : '/products'

  const avgRating = (item as any).avgRating || 0
  const reviewCount = (item as any).reviewCount || 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      id: item._id?.toString() || '',
      title: item.title,
      price: displayPrice,
      image: item.images?.[0] || '/home.jpg',
      category: item.category,
      quantity: 1,
    })
    showToast.addedToCart()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
      className={`group cursor-pointer ${className}`.trim()}
    >
      <Link href={href}>
        <div className="relative overflow-hidden aspect-4/5 mb-4 bg-secondary">
          <Image
            urlEndpoint="https://ik.imagekit.io/fashionstylized"
            alt={item.title}
            fill={true}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={item.images?.[0] || '/home.jpg'}
          />

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex flex-col items-center justify-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              disabled={item.stock === 0}
              className="bg-(--primary) text-(--primary-foreground) px-6 py-2.5 uppercase tracking-wider text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/10 backdrop-blur-sm text-white px-6 py-2.5 uppercase tracking-wider text-xs flex items-center gap-2 border border-white/20"
            >
              <Eye className="w-3.5 h-3.5" />
              View Details
            </motion.button>
          </div>

          {item.stock === 0 && (
            <div className="absolute top-3 left-3 bg-black/80 text-white text-[10px] uppercase tracking-wider px-2.5 py-1">
              Out of Stock
            </div>
          )}

          {item.isTrending && item.stock > 0 && (
            <div className="absolute top-3 right-3 bg-(--primary) text-(--primary-foreground) text-[10px] uppercase tracking-wider px-2.5 py-1">
              Trending
            </div>
          )}

          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-amber-500/95 text-black text-[10px] uppercase tracking-wider px-2.5 py-1">
              Limited offer
            </div>
          )}
        </div>
      </Link>

      <Link href={href}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.08 + 0.2 }}
          className="space-y-1 mb-3"
        >
          <p className="text-[10px] uppercase tracking-widest text-(--muted-foreground)">
            {(item as any).subcategory || item.category}
          </p>
          <h3 className="text-lg font-cormorant-garamond leading-snug group-hover:text-(--primary) transition-colors line-clamp-1">
            {item.title}
          </h3>

          {/* rating */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    size={11}
                    className={
                      n <= Math.round(avgRating)
                        ? "fill-(--primary) text-(--primary)"
                        : "text-(--muted-foreground)"
                    }
                  />
                ))}
              </div>
              <span className="text-[11px] text-(--muted-foreground)">
                {avgRating.toFixed(1)} ({reviewCount})
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            {hasDiscount ? (
              <>
                <p className="text-(--primary) tracking-wider text-sm">
                  Rs {displayPrice.toLocaleString()}
                </p>
                <p className="text-xs text-(--muted-foreground) line-through">
                  Rs {item.price.toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-(--primary) tracking-wider text-sm">
                Rs {displayPrice.toLocaleString()}
              </p>
            )}
          </div>
        </motion.div>
      </Link>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleAddToCart}
        disabled={item.stock === 0}
        className="sm:hidden w-full py-2.5 border border-(--primary) text-(--primary) uppercase text-xs tracking-wider hover:bg-(--primary) hover:text-(--primary-foreground) transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        {item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
      </motion.button>
    </motion.div>
  )
}

export default ProductCard