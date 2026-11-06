// app/admin/products/[id]/page.tsx
"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import ProductForm from "@/app/components/admin/ProductForm"

export default function EditProductPage() {
  const { id } = useParams()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await apiClient.getProductById(id?.toString() || "")
        if (res.success) {
          setProduct(res.data)
        } else {
          setError("Product not found")
        }
      } catch {
        setError("Something went wrong")
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-(--muted-foreground)" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-cormorant-garamond">Edit Product</h1>
        <p className="text-sm text-(--muted-foreground) mt-1 line-clamp-1">
          {product.title}
        </p>
      </div>
      <ProductForm
        mode="edit"
        initialData={{
          _id: product._id,
          title: product.title,
          description: product.description,
          price: product.price,
          discountPrice: product.discountPrice ?? "",
          category: product.category,
          stock: product.stock,
          isTrending: product.isTrending,
          keyFeatures: product.keyFeatures || [],
          images: product.images || [],
          colors: product.colors || [],
        }}
      />
    </div>
  )
}