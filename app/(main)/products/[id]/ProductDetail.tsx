"use client"
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import Link from 'next/link'
import { IProduct } from '@/models/Product'
import { Image } from '@imagekit/next'
import { Minus, Plus, ShoppingBag, Heart, Share2, AlertCircle, Eye, CheckCircle2, Loader2, Truck, Check } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/app/store/cartStore'
import { useBuyNowStore } from '@/app/store/buyNowStore'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useWishlistStore } from '@/app/store/wishlistStore'
import { getProductDiscountPercent, getProductPrice, hasProductDiscount } from '@/lib/product-pricing'
import { showToast } from "@/lib/toast"
import ReviewList from '@/app/components/ReviewList'
import { ProductColor } from '@/models/Product'
import { fbTrack } from '@/lib/fpixel';

const getColorEntry = (color: ProductColor) => Object.entries(color)[0] || ["", ""]

const ProductDetail = () => {
  const [product, setProduct] = useState<IProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedImage, setSelectedImage] = useState("")
  const [recommendProducts, setRecommendProducts] = useState<IProduct[]>([])
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [showColorModal, setShowColorModal] = useState(false)

const { isInWishlist, addWishlistItem, removeItem } = useWishlistStore()
const { data: session } = useSession()
const [wishlistLoading, setWishlistLoading] = useState(false)
  const { id } = useParams()
  const { addItem } = useCartStore()
  const { setItem } = useBuyNowStore()
  const router = useRouter()

  // fetch product
  useEffect(() => {
    async function getData() {
      try {
        setLoading(true)
        const res = await apiClient.getProductById(id?.toString() || "")
        if (res.success) {
          setProduct(res.data ?? null)
          setSelectedImage(res.data?.images?.[0] || "")
        } else {
          setError(res.error || "Failed to fetch product")
        }
      } catch (err) {
        setError("Something went wrong. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    getData()
  }, [id])

  // fetch recommended products after product loads
  useEffect(() => {
    if (!product?.category) return
    async function getRecommendData() {
      try {
        const res = await apiClient.getProductsByCategoryAndLimit(product!.category)
        if (res.success && res.data) {
          // exclude current product from recommendations
          const filtered = res.data.filter((p: IProduct) => p._id?.toString() !== id?.toString())
          setRecommendProducts(filtered.slice(0, 3))
        }
      } catch (err) {
        console.error("Failed to fetch recommendations")
      }
    }
    getRecommendData()
  }, [product?.category])

  useEffect(() => {
  async function loadWishlist() {
    if (!session) return
    const res = await apiClient.getWishlist()
    if (res.success) {
      useWishlistStore.getState().setItems(
        res.data.map((p: any) => ({
          id: p._id.toString(),
          title: p.title,
          price: p.price,
          image: p.images?.[0] || "",
          category: p.category,
        }))
      )
    }
  }
  loadWishlist()
}, [session])

  useEffect(() => {
    fbTrack('ViewContent', {
      content_ids: [product?._id],
      content_name: product?.title,
      content_type: 'product',
      value: product?.price,
      currency: 'PKR',
    });
  }, [product?._id]);

const handleWishlist = async () => {
  if (!session) {
    // show auth modal or redirect to login
    router.push("/signIn")
    return
  }
  if (!product) return

  setWishlistLoading(true)
  try {
    const res = await apiClient.toggleWishlist(product._id?.toString() || "")
    if (res.success) {
      if (res.action === "added") {
        addWishlistItem({
          id: product._id?.toString() || "",
          title: product.title,
          price: getProductPrice(product),
          image: product.images?.[0] || "",
          category: product.category,
        })
      } else {
        removeItem(product._id?.toString() || "")
      }
    }
  } catch (err) {
    console.error("Wishlist error:", err)
  } finally {
    setWishlistLoading(false)
  }
}

  const handleAddToCart = () => {
    if (!product) return
    addItem({
      id: product._id?.toString() || '',
      title: product.title,
      price: getProductPrice(product),
      image: product.images?.[0] || "",
      category: product.category,
      quantity,
      ...(selectedColor && { color: selectedColor }),
    })
    showToast.addedToCart()
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2500)
  }

  const increment = () => {
    if (product && quantity < product.stock) {
      setQuantity(q => q + 1)
    }
  }

  const decrement = () => {
    if (quantity > 1) setQuantity(q => q - 1)
  }

    const handleBuyNow = (()=>{
      if(!product || !product._id) return
      if (product.colors?.length && !selectedColor) {
        setShowColorModal(true)
        return
      }
      setItem({
        id: product._id?.toString() || '',
    title: product.title,
    price: getProductPrice(product),
    image: product.images?.[0] || "",
    category: product.category,
    quantity,
    ...(selectedColor && { color: selectedColor }),
      })
      router.push("/checkout?type=buynow")
      
    })

    useEffect(() => {
  if (!product || !product._id) return
  const w = window as any
  if (w.ttq) {
    w.ttq.track("ViewContent", {
      contents: [
        {
          content_id: product._id.toString(),
          content_type: "product",
          content_name: product.title,
        },
      ],
      value: getProductPrice(product),
      currency: "PKR",
    })
  }
}, [product])

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-12">
        <div className="h-4 bg-white/10 w-48 mb-8 animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="aspect-square bg-white/10 animate-pulse" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-white/10 animate-pulse" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-4 bg-white/10 w-24 animate-pulse" />
            <div className="h-12 bg-white/10 w-3/4 animate-pulse" />
            <div className="h-8 bg-white/10 w-32 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-white/10 animate-pulse" />
              <div className="h-4 bg-white/10 animate-pulse" />
              <div className="h-4 bg-white/10 w-2/3 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <AlertCircle className="w-16 h-16 text-red-400" />
        <p className="text-red-400 text-2xl font-cormorant-garamond">Failed to load product</p>
        <p className="text-(--muted-foreground) text-sm">{error}</p>
        <div className="flex gap-4 mt-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.location.reload()}
            className="px-8 py-3 border border-(--border) hover:border-(--primary) uppercase text-sm tracking-wider transition-colors">
            Try Again
          </motion.button>
          <Link href="/products">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 bg-(--primary) text-(--primary-foreground) uppercase text-sm tracking-wider">
              Browse Products
            </motion.button>
          </Link>
        </div>
      </motion.div>
    )
  }

  if (!product) return null

  const displayPrice = getProductPrice(product)
  const hasDiscount = hasProductDiscount(product)

  return (
    <>
      {showColorModal && product.colors && product.colors.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="select-color-title"
          onClick={() => setShowColorModal(false)}>
          <div
            className="w-full max-w-md border border-(--border) bg-(--card) p-6 shadow-2xl"
            onClick={event => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 id="select-color-title" className="text-2xl font-cormorant-garamond">Choose a color</h2>
                <p className="text-xs text-(--muted-foreground) mt-1">Select a color before continuing.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowColorModal(false)}
                aria-label="Close color selection"
                className="text-(--muted-foreground) hover:text-(--foreground) text-xl leading-none">
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {product.colors.map(color => {
                const [colorName, colorHex] = getColorEntry(color)
                const isSelected = selectedColor === colorName
                return (
                  <button
                    key={colorName}
                    type="button"
                    onClick={() => setSelectedColor(colorName)}
                    aria-pressed={isSelected}
                    className={`flex items-center gap-3 border px-3 py-3 text-left text-sm transition-colors ${
                      isSelected
                        ? "border-(--primary) bg-(--primary)/10 text-(--primary)"
                        : "border-(--border) hover:border-(--primary)"
                    }`}>
                    <span
                      className="h-7 w-7 shrink-0 border border-white/20"
                      style={{ backgroundColor: colorHex }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{colorName}</span>
                    {isSelected && <Check className="ml-auto h-4 w-4 shrink-0" />}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              disabled={!selectedColor}
              onClick={() => {
                setShowColorModal(false)
                handleBuyNow()
              }}
              className="mt-6 w-full bg-(--primary) py-3 text-sm uppercase tracking-widest text-(--primary-foreground) transition-opacity disabled:cursor-not-allowed disabled:opacity-50">
              Continue to checkout
            </button>
          </div>
        </div>
      )}

      {/* ── Product section ── */}
      <section className='max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-6 pb-24 sm:pb-6'>

        {/* breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-(--muted-foreground) flex gap-2 capitalize py-3 sm:py-6 text-sm flex-wrap">
          <Link className='hover:text-(--foreground) transition-colors' href="/">Home</Link>
          <span>/</span>
          <Link className='hover:text-(--foreground) transition-colors' href="/products">Products</Link>
          <span>/</span>
          <Link className='hover:text-(--foreground) transition-colors' href={`/products/${product.category}`}>
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-(--foreground) line-clamp-1">{product.title}</span>
        </motion.div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>

          {/* ── Left — images ── */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className='space-y-4'>

            {/* main image */}
            <div className='aspect-square bg-(--secondary) overflow-hidden relative'>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full">
                  <Image
                    urlEndpoint='https://ik.imagekit.io/fashionstylized'
                    alt={product.title}
                    fill={true}
                    className='w-full h-full object-cover'
                    src={selectedImage}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* thumbnails */}
            <div className='grid grid-cols-4 gap-3'>
              {product.images?.map((image: string, index: number) => (
                <motion.button
                  key={index}
                  onClick={() => setSelectedImage(image)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={"View image " + (index + 1)}
                  // ✅ selected border
                  className={`relative aspect-square bg-(--secondary) overflow-hidden transition-all duration-300 ${
                    selectedImage === image
                      ? "border-2 border-(--primary)"      // selected
                      : "border-2 border-transparent hover:border-(--border)"  // not selected
                  }`}>
                  <Image
                    urlEndpoint='https://ik.imagekit.io/fashionstylized'
                    alt={`${product.title} ${index + 1}`}
                    fill={true}
                    className='w-full h-full object-cover'
                    src={image}
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* ── Right — product info ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-5 sm:space-y-8">

            {/* title + price */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}>
              <p className="text-xs uppercase tracking-widest text-(--muted-foreground) mb-2">
                {product.category}
              </p>
              <p className="mb-3 inline-flex border border-[#d4af37]/60 bg-[#d4af37]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#d4af37]">
                11.11 Sale · Up to 15% Off
              </p>
              <h1 className="text-4xl lg:text-5xl mb-4 font-cormorant-garamond leading-tight">
                {product.title}
              </h1>
              <div className='flex flex-wrap items-center gap-3 mb-2'>
                <p className='text-3xl text-(--primary)'>
                  Rs. {displayPrice.toLocaleString()}
                </p>
                {hasDiscount && (
                  <p className='text-sm text-(--muted-foreground) line-through'>
                    Rs. {product.price.toLocaleString()}
                  </p>
                )}
              </div>
              {hasDiscount && (
                <p className='text-sm text-amber-500 mb-3'>
                  {getProductDiscountPercent(product)}% off • Limited offer
                </p>
              )}

              {/* stock indicator */}
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm text-(--muted-foreground)">
                  {product.stock > 10
                    ? "In Stock"
                    : product.stock > 0
                    ? `Only ${product.stock} left`
                    : "Out of Stock"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-(--primary)/25 bg-(--primary)/10 px-3 py-2">
                  <Truck className="h-4 w-4 text-(--primary)" />
                  <span className="text-sm text-(--foreground)">Delivery in 3-5 days</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-(--primary)/25 bg-(--primary)/10 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-(--primary)" />
                  <span className="text-sm text-(--foreground)">Easy return policy</span>
                </div>
              </div>
            </motion.div>

            {/* description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-(--muted-foreground) leading-relaxed">
              {product.description}
            </motion.p>

            {/* color selection — only shown if the product has color options */}
            {product.colors && product.colors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}>
                <label className="block text-sm uppercase tracking-wider mb-3">
                  Color{selectedColor && <span className="text-(--muted-foreground) normal-case tracking-normal"> — {selectedColor}</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => {
                    const [colorName, colorHex] = getColorEntry(color)
                    return (
                    <motion.button
                      key={colorName}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedColor(colorName)}
                      aria-pressed={selectedColor === colorName}
                      className={`flex items-center gap-2 px-4 py-2.5 border text-sm uppercase tracking-wider transition-colors ${
                        selectedColor === colorName
                          ? "border-(--primary) bg-(--primary)/10 text-(--primary)"
                          : "border-(--border) text-(--muted-foreground) hover:border-(--primary)/50 hover:text-(--foreground)"
                      }`}>
                      <span
                        className="h-5 w-5 border border-white/20"
                        style={{ backgroundColor: colorHex }}
                        aria-hidden="true"
                      />
                      {selectedColor === colorName && <Check className="w-3.5 h-3.5" />}
                      {colorName}
                    </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* quantity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}>
              <label className="block text-sm uppercase tracking-wider mb-3">Quantity</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-(--border)">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={decrement}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="p-3 hover:bg-(--muted) transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <Minus className="h-4 w-4" />
                  </motion.button>
                  <span className="px-8 text-lg min-w-[60px] text-center">{quantity}</span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={increment}
                    disabled={quantity >= product.stock}
                    aria-label="Increase quantity"
                    className="p-3 hover:bg-(--muted) transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <Plus className="h-4 w-4" />
                  </motion.button>
                </div>
                <span className="text-xs text-(--muted-foreground) uppercase tracking-wider">
                  Max {product.stock}
                </span>
              </div>
            </motion.div>

            {/* action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4">

              <div className='hidden md:grid grid-cols-1 md:grid-cols-2 gap-4'>

                {/* add to cart */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`py-4 border-2 flex gap-3 uppercase tracking-widest transition-all justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed ${
                    addedToCart
                      ? "border-green-500 text-green-500"
                      : "border-(--primary) text-(--primary) hover:bg-(--primary) hover:text-black"
                  }`}>
                  {addedToCart ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </motion.button>

                {/* buy now */}
                <motion.button
                  onClick={handleBuyNow}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={product.stock === 0}
                  className="w-full py-4 bg-(--primary) text-(--primary-foreground) uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                  Buy Now
                </motion.button>
              </div>

              {/* wishlist + share */}
              <div className="hidden md:flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleWishlist}
                  disabled={wishlistLoading}
                  className={`flex-1 py-4 border transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider ${
                    isInWishlist(product._id?.toString() || "")
                      ? "border-red-500/60 text-red-400 bg-red-500/10"
                      : "border-(--border) hover:border-(--primary) transition-colors"
                  }`}>
                  {wishlistLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart className={`h-4 w-4 ${
                      isInWishlist(product._id?.toString() || "") ? "fill-red-400 text-red-400" : ""
                    }`} />
                  )}
                  {isInWishlist(product._id?.toString() || "") ? "Wishlisted" : "Wishlist"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigator.share && navigator.share({ title: product.title, url: window.location.href })}
                  className="flex-1 py-4 border border-(--border) hover:border-(--primary) transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                  <Share2 className="h-4 w-4" />
                  Share
                </motion.button>
              </div>
            </motion.div>

          {/* reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <ReviewList
                productId={product._id?.toString() || ""}
                avgRating={product.avgRating}
                reviewCount={product.reviewCount}
              />
            </motion.div>

            {/* key features */}
            {product.keyFeatures && product.keyFeatures.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="border-t border-(--border) pt-6">
                <h2 className="text-sm uppercase tracking-widest mb-4">Key Features</h2>
                <ul className="space-y-2">
                  {product.keyFeatures.map((feature: string, index: number) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      className="flex items-start gap-3 text-(--muted-foreground) text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-(--primary) mt-1.5 shrink-0" />
                      {feature}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

          </motion.div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-(--border) bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-3 py-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`flex-1 rounded-none border border-(--primary) px-4 py-3 text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              addedToCart
                ? "border-green-500 text-green-500"
                : "text-(--primary) hover:bg-(--primary) hover:text-black"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            {addedToCart ? "Added" : "Cart"}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleBuyNow}
            disabled={product.stock === 0}
            className="flex-1 rounded-none bg-(--primary) px-4 py-3 text-sm uppercase tracking-wider text-(--primary-foreground) transition-opacity disabled:opacity-50"
          >
            Buy Now
          </motion.button>
        </div>
      </div>

      {/* ── You May Also Like ── */}
      {recommendProducts.length > 0 && (
        <section className="py-24 px-6 lg:px-12 max-w-[1600px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-12">
            <h2 className='text-5xl lg:text-6xl mb-4 font-cormorant-garamond'>You May Also Like</h2>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className='h-px bg-(--primary)'
            />
          </motion.div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {recommendProducts.map((item, index) => (
              <motion.div
                key={item._id?.toString()}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group cursor-pointer">

                <Link href={`/products/${item._id}`}>
                  <div className="relative overflow-hidden aspect-[3/4] mb-4 bg-(--secondary)">
                    <Image
                      urlEndpoint='https://ik.imagekit.io/fashionstylized'
                      alt={item.title}
                      fill={true}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                      src={item.images?.[0] || "home.jpg"}
                    />

                    {/* hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center">
                      <div className="flex items-center gap-2 text-white text-sm uppercase tracking-wider">
                        <Eye className="w-4 h-4" />
                        View Details
                      </div>
                    </div>

                    {item.isTrending && (
                      <div className="absolute top-3 right-3 bg-(--primary) text-(--primary-foreground) text-xs uppercase tracking-wider px-3 py-1">
                        Trending
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-(--muted-foreground)">{item.category}</p>
                    <h3 className="text-xl font-cormorant-garamond group-hover:text-(--primary) transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {hasProductDiscount(item) ? (
                        <>
                          <p className="text-(--primary) tracking-wider text-sm">
                            Rs {getProductPrice(item).toLocaleString()}
                          </p>
                          <p className="text-xs text-(--muted-foreground) line-through">
                            Rs {item.price.toLocaleString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-(--primary) tracking-wider text-sm">
                          Rs {getProductPrice(item).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>

              </motion.div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

export default ProductDetail