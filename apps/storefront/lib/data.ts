import { Product } from "./types"
import {
  fetchStoreProductByHandle,
  fetchStoreProducts,
} from "./medusa"

/**
 * Demo products — used only when Medusa API is unreachable or returns empty.
 */
export const mockProducts: Product[] = [
  {
    id: "p1",
    name: "Handwoven Chanderi Silk Saree",
    slug: "handwoven-chanderi-silk-saree",
    description:
      "Experience the epitome of elegance with our handwoven Chanderi silk saree. Featuring delicate zari motifs and a weightless drape, perfect for festive occasions and weddings.",
    price: 12999,
    originalPrice: 15999,
    images: [
      "https://picsum.photos/seed/saree1/800/1000",
      "https://picsum.photos/seed/saree2/800/1000",
      "https://picsum.photos/seed/saree3/800/1000",
    ],
    category: "Sarees",
    tags: ["Festive", "Silk", "Handloom"],
    isNew: true,
    rating: 4.8,
    reviews: 124,
    features: [
      "Authentic Chanderi Silk",
      "Intricate Zari Work",
      "Includes Unstitched Blouse Piece",
      "Dry Clean Only",
    ],
    details: {
      Fabric: "Chanderi Silk",
      Pattern: "Woven Design",
      Length: "5.5 Metres",
      Blouse: "0.8 Metres",
    },
  },
  {
    id: "p2",
    name: "Men's Linen Blend Kurta Set",
    slug: "mens-linen-blend-kurta-set",
    description:
      "A contemporary take on traditional wear. This premium linen blend kurta set offers breathable comfort with a sharp, tailored fit suitable for day events and pujas.",
    price: 4599,
    originalPrice: 5999,
    images: [
      "https://picsum.photos/seed/kurta1/800/1000",
      "https://picsum.photos/seed/kurta2/800/1000",
    ],
    category: "Men",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Ivory", value: "#FFFFF0" },
      { name: "Sage Green", value: "#9DC183" },
    ],
    tags: ["Men", "Festive"],
    isNew: false,
    rating: 4.5,
    reviews: 89,
    features: ["Linen blend", "Breathable"],
    details: { Fabric: "Linen blend" },
  },
]

/** Prefer Medusa; fall back to mock so the shell always renders. */
export async function getProducts(): Promise<{
  products: Product[]
  source: "medusa" | "mock"
}> {
  try {
    const products = await fetchStoreProducts(50)
    if (products.length > 0) {
      return { products, source: "medusa" }
    }
  } catch (e) {
    console.warn("[storefront] Medusa products failed, using mock:", e)
  }
  return { products: mockProducts, source: "mock" }
}

export async function getProductBySlug(
  slug: string
): Promise<Product | undefined> {
  try {
    const p = await fetchStoreProductByHandle(slug)
    if (p) return p
  } catch (e) {
    console.warn("[storefront] Medusa product by handle failed:", e)
  }
  return mockProducts.find((x) => x.slug === slug)
}

export async function getRelatedProducts(
  currentId: string,
  limit = 4
): Promise<Product[]> {
  const { products } = await getProducts()
  return products.filter((p) => p.id !== currentId).slice(0, limit)
}

/** Sync helpers kept for client components that still import mocks */
export function getProductBySlugSync(slug: string): Product | undefined {
  return mockProducts.find((p) => p.slug === slug)
}

export function getRelatedProductsSync(
  currentId: string,
  limit = 4
): Product[] {
  return mockProducts.filter((p) => p.id !== currentId).slice(0, limit)
}
