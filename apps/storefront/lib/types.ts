export interface ProductVariantOption {
  id: string
  title: string
  price: number
  /** option values e.g. size/color labels */
  options: string[]
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  sizes?: string[]
  colors?: { name: string; value: string }[]
  tags: string[]
  isNew?: boolean
  rating: number
  reviews: number
  features: string[]
  details: Record<string, string>
  /** Default / first variant for Medusa cart */
  variantId?: string
  variants?: ProductVariantOption[]
}

export interface CartItem {
  id: string
  productId: string
  variantId?: string
  name: string
  price: number
  image: string
  quantity: number
  size?: string
  color?: string
}
