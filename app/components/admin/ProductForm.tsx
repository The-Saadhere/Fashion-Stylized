// components/admin/ProductForm.tsx
"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, X, Loader2, AlertCircle, CheckCircle2, TrendingUp, Palette } from "lucide-react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import ImageUpload from "./UploadImage"
import { ProductColor } from "@/models/Product"

type ProductData = {
  title: string
  description: string
  price: number | ""
  discountPrice: number | ""
  category: string
  stock: number | ""
  isTrending: boolean
  keyFeatures: string[]
  images: string[]
  colors: ProductColor[]
}

type Props = {
  initialData?: ProductData & { _id?: string }
  mode: "create" | "edit"
}

const defaultData: ProductData = {
  title: "",
  description: "",
  price: "",
  discountPrice: "",
  category: "watches",
  stock: "",
  isTrending: false,
  keyFeatures: [],
  images: [],
  colors: [],
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function ProductForm({ initialData, mode }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ProductData>(initialData || defaultData)
  const [featureInput, setFeatureInput] = useState("")
  const [colorNameInput, setColorNameInput] = useState("")
  const [colorHexInput, setColorHexInput] = useState("#000000")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : value
    }))
  }

  const addFeature = () => {
    if (!featureInput.trim()) return
    if (form.keyFeatures.includes(featureInput.trim())) return
    setForm(prev => ({ ...prev, keyFeatures: [...prev.keyFeatures, featureInput.trim()] }))
    setFeatureInput("")
  }

  const removeFeature = (index: number) => {
    setForm(prev => ({
      ...prev,
      keyFeatures: prev.keyFeatures.filter((_, i) => i !== index)
    }))
  }

  const addColor = () => {
    const name = colorNameInput.trim()
    const hex = colorHexInput.trim()
    if (!name || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return
    // avoid case-insensitive duplicates (e.g. "Brown" and "brown")
    if (form.colors.some(c => Object.keys(c)[0]?.toLowerCase() === name.toLowerCase())) return
    setForm(prev => ({ ...prev, colors: [...prev.colors, { [name]: hex.toUpperCase() }] }))
    setColorNameInput("")
    setColorHexInput("#000000")
  }

  const removeColor = (index: number) => {
    setForm(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }))
  }

  const validate = () => {
    if (!form.title.trim()) return "Title is required"
    if (!form.description.trim()) return "Description is required"
    if (!form.price || Number(form.price) <= 0) return "Valid price is required"
    if (form.discountPrice !== "" && (
      Number(form.discountPrice) <= 0 ||
      Number(form.discountPrice) >= Number(form.price)
    )) return "Discount price must be greater than 0 and less than the regular price"
    if (!form.category) return "Category is required"
    if (form.stock === "" || Number(form.stock) < 0) return "Valid stock is required"
    if (form.images.length === 0) return "At least one image is required"
    return null
  }

  const handleSubmit = async () => {
    setError("")
    setSuccess("")

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        discountPrice: form.discountPrice === "" ? null : Number(form.discountPrice),
        category: form.category,
        stock: Number(form.stock),
        isTrending: form.isTrending,
        keyFeatures: form.keyFeatures,
        images: form.images,
        colors: form.colors, // optional — empty array means single-color product
      }

      let res
      if (mode === "create") {
        res = await apiClient.createProduct(payload)
      } else {
        res = await apiClient.updateProduct(initialData?._id || "", payload)
      }

      if (!res.success) {
        setError(res.error || "Something went wrong")
        return
      }

      setSuccess(mode === "create" ? "Product created successfully!" : "Product updated successfully!")
      setTimeout(() => router.push("/admin/products"), 1500)

    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      className="max-w-[800px] space-y-6">

      {/* error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-red-500/10 border border-red-500/40 text-red-400 px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {/* success */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-green-500/10 border border-green-500/40 text-green-400 px-4 py-3 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left column ── */}
        <div className="space-y-5">

          {/* title */}
          <motion.div variants={fadeUp}>
            <label className="block text-sm uppercase tracking-wider mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Premium Leather Wallet"
              className="w-full px-4 py-3 bg-transparent border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors placeholder:text-(--muted-foreground)"
            />
          </motion.div>

          {/* description */}
          <motion.div variants={fadeUp}>
            <label className="block text-sm uppercase tracking-wider mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the product..."
              className="w-full px-4 py-3 bg-transparent border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors placeholder:text-(--muted-foreground) resize-none"
            />
          </motion.div>

          {/* regular price + discount price */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm uppercase tracking-wider mb-2">
                Regular Price (Rs.) <span className="text-red-400">*</span>
              </label>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="1499"
                min={0}
                className="w-full px-4 py-3 bg-transparent border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors placeholder:text-(--muted-foreground)"
              />
            </div>
            <div>
              <label className="block text-sm uppercase tracking-wider mb-2">
                Discount Price (Rs.)
              </label>
              <input
                name="discountPrice"
                type="number"
                value={form.discountPrice}
                onChange={handleChange}
                placeholder="Optional"
                min={0}
                className="w-full px-4 py-3 bg-transparent border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors placeholder:text-(--muted-foreground)"
              />
            </div>
          </motion.div>

          {/* stock */}
          <motion.div variants={fadeUp}>
            <div>
              <label className="block text-sm uppercase tracking-wider mb-2">
                Stock <span className="text-red-400">*</span>
              </label>
              <input
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                placeholder="10"
                min={0}
                className="w-full px-4 py-3 bg-transparent border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors placeholder:text-(--muted-foreground)"
              />
            </div>
          </motion.div>

          {/* category */}
          <motion.div variants={fadeUp}>
            <label className="block text-sm uppercase tracking-wider mb-2">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-(--secondary) border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors cursor-pointer">
              <option value="watches">Watches</option>
              <option value="glasses">Glasses</option>
              <option value="wallets">Wallets</option>
            </select>
          </motion.div>

          {/* isTrending toggle */}
          <motion.div variants={fadeUp}>
            <label className="flex items-center gap-4 p-4 border border-(--border) hover:border-(--primary) transition-colors cursor-pointer">
              <div className={`w-10 h-6 rounded-full transition-colors relative ${
                form.isTrending ? "bg-(--primary)" : "bg-white/20"
              }`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  form.isTrending ? "translate-x-5" : "translate-x-1"
                }`} />
                <input
                  type="checkbox"
                  name="isTrending"
                  checked={form.isTrending}
                  onChange={handleChange}
                  className="hidden"
                />
              </div>
              <div>
                <p className="text-sm uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-(--primary)" />
                  Mark as Trending
                </p>
                <p className="text-xs text-(--muted-foreground) mt-0.5">
                  Shows on homepage and marked with trending badge
                </p>
              </div>
            </label>
          </motion.div>

          {/* colors */}
          <motion.div variants={fadeUp}>
            <label className="block text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
              <Palette className="w-4 h-4 text-(--primary)" />
              Colors (optional)
            </label>
            <p className="text-xs text-(--muted-foreground) mb-3">
              Leave empty if this product only comes in one color
            </p>
            <div className="flex gap-2 mb-3">
              <input
                value={colorNameInput}
                onChange={e => setColorNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addColor())}
                placeholder="Color name, e.g. Brown"
                className="flex-1 px-4 py-2 bg-transparent border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors placeholder:text-(--muted-foreground)"
              />
              <input
                type="color"
                value={colorHexInput}
                onChange={e => setColorHexInput(e.target.value)}
                aria-label="Color hex value"
                className="h-10 w-14 cursor-pointer border border-(--border) bg-transparent p-1"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addColor}
                type="button"
                className="px-4 py-2 bg-(--primary) text-(--primary-foreground) text-sm uppercase tracking-wider">
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>

            {/* color chips */}
            {form.colors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.colors.map((color, i) => {
                  const [name, hex] = Object.entries(color)[0] || []
                  return (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-(--secondary) border border-(--border) text-xs">
                    <span className="h-4 w-4 border border-white/20" style={{ backgroundColor: hex }} />
                    {name} ({hex})
                    <button
                      onClick={() => removeColor(i)}
                      type="button"
                      aria-label={"Remove color: " + name}
                      className="text-(--muted-foreground) hover:text-red-400 transition-colors w-6 h-6 flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* key features */}
          <motion.div variants={fadeUp}>
            <label className="block text-sm uppercase tracking-wider mb-2">Key Features</label>
            <div className="flex gap-2 mb-3">
              <input
                value={featureInput}
                onChange={e => setFeatureInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeature())}
                placeholder="e.g. Genuine leather"
                className="flex-1 px-4 py-2 bg-transparent border border-(--border) focus:border-(--primary) outline-none text-sm transition-colors placeholder:text-(--muted-foreground)"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addFeature}
                type="button"
                className="px-4 py-2 bg-(--primary) text-(--primary-foreground) text-sm uppercase tracking-wider">
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>

            {/* feature chips */}
            {form.keyFeatures.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.keyFeatures.map((feature, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-(--secondary) border border-(--border) text-xs">
                    {feature}
                    <button
                      onClick={() => removeFeature(i)}
                      aria-label={"Remove feature: " + feature}
                      className="text-(--muted-foreground) hover:text-red-400 transition-colors w-6 h-6 flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Right column — images ── */}
        <motion.div variants={fadeUp}>
          <ImageUpload
            images={form.images}
            onChange={urls => setForm(prev => ({ ...prev, images: urls }))}
            maxImages={4}
          />
        </motion.div>
      </div>

      {/* submit */}
      <motion.div variants={fadeUp} className="flex gap-4 pt-4 border-t border-(--border)">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={loading}
          className="px-10 py-4 bg-(--primary) text-(--primary-foreground) uppercase tracking-widest text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {mode === "create" ? "Creating..." : "Saving..."}
            </>
          ) : mode === "create" ? "Create Product" : "Save Changes"}
        </motion.button>

        <button
          onClick={() => router.push("/admin/products")}
          className="px-6 py-4 border border-(--border) hover:border-(--primary) uppercase text-sm tracking-wider transition-colors">
          Cancel
        </button>
      </motion.div>
    </motion.div>
  )
}