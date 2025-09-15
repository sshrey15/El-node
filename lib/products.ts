export interface Category {
  id: string
  name: string
  code: string // Short code like "FUR" for Furniture
  createdAt: string
}

export interface Product {
  id: string
  name: string
  code: string // Short code like "TAB" for Table
  category: Category
  uniqueCode: string // Full code like "EHS-FUR-TAB-24-0003"
  status: "active" | "maintenance" | "damaged" | "discarded" | "missing"
  yearOfPurchase: number
  unitNumber: number
  description?: string
  createdAt: string
  updatedAt: string
}

// Default categories for demo
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Furniture",
    code: "FUR",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Electronics",
    code: "ELE",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Office Supplies",
    code: "OFF",
    createdAt: new Date().toISOString(),
  },
]

export class ProductService {
  private static instance: ProductService
  private products: Product[] = []
  private categories: Category[] = DEFAULT_CATEGORIES

  private constructor() {
    if (typeof window !== "undefined") {
      const storedProducts = localStorage.getItem("el-node-products")
      const storedCategories = localStorage.getItem("el-node-categories")

      if (storedProducts) {
        this.products = JSON.parse(storedProducts)
      }
      if (storedCategories) {
        this.categories = JSON.parse(storedCategories)
      } else {
        // Save default categories
        localStorage.setItem("el-node-categories", JSON.stringify(DEFAULT_CATEGORIES))
      }
    }
  }

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService()
    }
    return ProductService.instance
  }

  private saveProducts(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("el-node-products", JSON.stringify(this.products))
    }
  }

  private saveCategories(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("el-node-categories", JSON.stringify(this.categories))
    }
  }

  private generateUniqueCode(category: Category, productCode: string, year: number): string {
    // Find the next unit number for this combination
    const existingProducts = this.products.filter(
      (p) => p.category.code === category.code && p.code === productCode && p.yearOfPurchase === year,
    )

    const nextUnitNumber = existingProducts.length + 1
    const unitNumberPadded = nextUnitNumber.toString().padStart(4, "0")
    const yearShort = year.toString().slice(-2)

    return `EHS-${category.code}-${productCode}-${yearShort}-${unitNumberPadded}`
  }

  addProduct(data: {
    name: string
    code: string
    categoryId: string
    yearOfPurchase: number
    description?: string
  }): { success: boolean; product?: Product; error?: string } {
    const category = this.categories.find((c) => c.id === data.categoryId)
    if (!category) {
      return { success: false, error: "Category not found" }
    }

    // Check if product code already exists for this category
    const existingProduct = this.products.find((p) => p.code === data.code && p.category.id === data.categoryId)

    const unitNumber = existingProduct
      ? this.products.filter(
          (p) => p.code === data.code && p.category.id === data.categoryId && p.yearOfPurchase === data.yearOfPurchase,
        ).length + 1
      : 1

    const uniqueCode = this.generateUniqueCode(category, data.code, data.yearOfPurchase)

    const product: Product = {
      id: Date.now().toString(),
      name: data.name,
      code: data.code,
      category,
      uniqueCode,
      status: "active",
      yearOfPurchase: data.yearOfPurchase,
      unitNumber,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.products.push(product)
    this.saveProducts()

    return { success: true, product }
  }

  updateProductStatus(productId: string, status: Product["status"]): { success: boolean; error?: string } {
    const productIndex = this.products.findIndex((p) => p.id === productId)
    if (productIndex === -1) {
      return { success: false, error: "Product not found" }
    }

    this.products[productIndex].status = status
    this.products[productIndex].updatedAt = new Date().toISOString()
    this.saveProducts()

    return { success: true }
  }

  getProducts(): Product[] {
    return [...this.products]
  }

  getProductsByStatus(status: Product["status"]): Product[] {
    return this.products.filter((p) => p.status === status)
  }

  getCategories(): Category[] {
    return [...this.categories]
  }

  addCategory(name: string, code: string): { success: boolean; category?: Category; error?: string } {
    // Check if code already exists
    if (this.categories.some((c) => c.code === code)) {
      return { success: false, error: "Category code already exists" }
    }

    const category: Category = {
      id: Date.now().toString(),
      name,
      code: code.toUpperCase(),
      createdAt: new Date().toISOString(),
    }

    this.categories.push(category)
    this.saveCategories()

    return { success: true, category }
  }

  getProductStats() {
    const total = this.products.length
    const active = this.products.filter((p) => p.status === "active").length
    const maintenance = this.products.filter((p) => p.status === "maintenance").length
    const damaged = this.products.filter((p) => p.status === "damaged").length
    const discarded = this.products.filter((p) => p.status === "discarded").length
    const missing = this.products.filter((p) => p.status === "missing").length

    return {
      total,
      active,
      maintenance,
      issues: damaged + missing,
      damaged,
      discarded,
      missing,
    }
  }
}
