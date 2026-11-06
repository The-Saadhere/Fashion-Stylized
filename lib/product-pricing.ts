type ProductPricing = {
  price?: number | null
  discountPrice?: number | null
}

export function getProductPrice(product: ProductPricing): number {
  const regularPrice = Number(product.price ?? 0)
  const discountPrice = Number(product.discountPrice ?? 0)

  return discountPrice > 0 && discountPrice < regularPrice
    ? discountPrice
    : regularPrice
}

export function hasProductDiscount(product: ProductPricing): boolean {
  return getProductPrice(product) < Number(product.price ?? 0)
}

export function getProductDiscountPercent(product: ProductPricing): number {
  const regularPrice = Number(product.price ?? 0)
  if (!hasProductDiscount(product) || regularPrice <= 0) return 0

  return Math.round(((regularPrice - getProductPrice(product)) / regularPrice) * 100)
}
