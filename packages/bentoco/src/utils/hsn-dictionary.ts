export interface HSNEntry {
  hsnCode: string
  category: string
  description: string
  defaultGstRate: number
}

/**
 * Top Indian D2C E-Commerce HSN Code Dictionary
 * Lightweight lookup table for merchant autocomplete in the catalog editor.
 */
export const POPULAR_INDIAN_HSN_CODES: HSNEntry[] = [
  // Apparel & Textiles
  { hsnCode: "6109", category: "Apparel", description: "T-Shirts, Singlets, and Vests (Knitted/Crocheted)", defaultGstRate: 12 },
  { hsnCode: "6204", category: "Apparel", description: "Women's Dresses, Skirts, Suits, and Trousers", defaultGstRate: 12 },
  { hsnCode: "6203", category: "Apparel", description: "Men's Shirts, Suits, Trousers, and Shorts", defaultGstRate: 12 },
  { hsnCode: "6104", category: "Apparel", description: "Women's Knitted Suits, Dresses, and Pants", defaultGstRate: 12 },
  { hsnCode: "6110", category: "Apparel", description: "Sweaters, Cardigans, and Sweatshirts", defaultGstRate: 12 },

  // Footwear & Accessories
  { hsnCode: "6403", category: "Footwear", description: "Leather Footwear & Formal Shoes", defaultGstRate: 18 },
  { hsnCode: "6402", category: "Footwear", description: "Sports Shoes, Sneakers, and Rubber/Plastic Footwear", defaultGstRate: 12 },
  { hsnCode: "4202", category: "Accessories", description: "Handbags, Wallets, Backpacks, and Travel Cases", defaultGstRate: 18 },
  { hsnCode: "7117", category: "Accessories", description: "Imitation / Fashion Jewelry", defaultGstRate: 3 },

  // Cosmetics & Personal Care
  { hsnCode: "3304", category: "Cosmetics", description: "Skincare, Makeup, Sunscreen, and Lipsticks", defaultGstRate: 18 },
  { hsnCode: "3305", category: "Cosmetics", description: "Shampoo, Hair Oil, Hair Wax, and Conditioner", defaultGstRate: 18 },
  { hsnCode: "3307", category: "Cosmetics", description: "Perfumes, Deodorants, and Shaving Products", defaultGstRate: 18 },
  { hsnCode: "3401", category: "Personal Care", description: "Organic Soaps & Body Washes", defaultGstRate: 18 },

  // Electronics & Gadgets
  { hsnCode: "8518", category: "Electronics", description: "Earphones, Headphones, and Bluetooth Speakers", defaultGstRate: 18 },
  { hsnCode: "8517", category: "Electronics", description: "Smartwatches, Mobile Accessories, and Chargers", defaultGstRate: 18 },

  // Food & Packaged Goods
  { hsnCode: "0902", category: "Food & Beverage", description: "Specialty Tea & Herbal Infusions", defaultGstRate: 5 },
  { hsnCode: "0901", category: "Food & Beverage", description: "Artisanal Coffee & Roasted Beans", defaultGstRate: 5 },
  { hsnCode: "2106", category: "Food & Beverage", description: "Health Supplements, Protein Powders, and Gummies", defaultGstRate: 18 },
  { hsnCode: "1806", category: "Food & Beverage", description: "Chocolates & Cocoa Confectionery", defaultGstRate: 18 },
]

/**
 * Searches HSN Dictionary by keyword or code
 */
export function searchHSNDictionary(query: string): HSNEntry[] {
  const clean = query.trim().toLowerCase()
  if (!clean) return POPULAR_INDIAN_HSN_CODES.slice(0, 5)

  return POPULAR_INDIAN_HSN_CODES.filter(
    (item) =>
      item.hsnCode.includes(clean) ||
      item.description.toLowerCase().includes(clean) ||
      item.category.toLowerCase().includes(clean)
  )
}
