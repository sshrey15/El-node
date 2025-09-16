export interface Category {
  id: string
  name: string
  code: string // Short code like "FUR" for Furniture
  createdAt: string
}

export interface Destination {
  id: string
  name: string
  description?: string
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
  destinationId?: string
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

const DEFAULT_DESTINATIONS: Destination[] = [
  {
    id: "1",
    name: "Room-1",
    description: "Main office room",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Room-2",
    description: "Conference room",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Storage",
    description: "Storage area",
    createdAt: new Date().toISOString(),
  },
]

export class ProductService {
  private static instance: ProductService
  private products: Product[] = []
  private categories: Category[] = DEFAULT_CATEGORIES
  private destinations: Destination[] = DEFAULT_DESTINATIONS

  private constructor() {
    if (typeof window !== "undefined") {
      const storedProducts = localStorage.getItem("el-node-products")
      const storedCategories = localStorage.getItem("el-node-categories")
      const storedDestinations = localStorage.getItem("el-node-destinations")

      if (storedProducts) {
        this.products = JSON.parse(storedProducts)
      }
      if (storedCategories) {
        this.categories = JSON.parse(storedCategories)
      } else {
        // Save default categories
        localStorage.setItem("el-node-categories", JSON.stringify(DEFAULT_CATEGORIES))
      }
      if (storedDestinations) {
        this.destinations = JSON.parse(storedDestinations)
      } else {
        localStorage.setItem("el-node-destinations", JSON.stringify(DEFAULT_DESTINATIONS))
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

  private saveDestinations(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("el-node-destinations", JSON.stringify(this.destinations))
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
    destinationId?: string
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
      destinationId: data.destinationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.products.push(product)
    this.saveProducts()

    return { success: true, product }
  }

  updateProductDestination(productId: string, destinationId?: string): { success: boolean; error?: string } {
    const productIndex = this.products.findIndex((p) => p.id === productId)
    if (productIndex === -1) {
      return { success: false, error: "Product not found" }
    }

    this.products[productIndex].destinationId = destinationId
    this.products[productIndex].updatedAt = new Date().toISOString()
    this.saveProducts()

    return { success: true }
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

  getProductsByDestination(destinationId: string): Product[] {
    return this.products.filter((p) => p.destinationId === destinationId)
  }

  getCategories(): Category[] {
    return [...this.categories]
  }

  getDestinations(): Destination[] {
    return [...this.destinations]
  }

  addDestination(name: string, description?: string): { success: boolean; destination?: Destination; error?: string } {
    // Check if destination name already exists
    if (this.destinations.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: "Destination name already exists" }
    }

    const destination: Destination = {
      id: Date.now().toString(),
      name,
      description,
      createdAt: new Date().toISOString(),
    }

    this.destinations.push(destination)
    this.saveDestinations()

    return { success: true, destination }
  }

  deleteDestination(destinationId: string): { success: boolean; error?: string } {
    // Check if any products are assigned to this destination
    const productsInDestination = this.products.filter((p) => p.destinationId === destinationId)
    if (productsInDestination.length > 0) {
      return {
        success: false,
        error: `Cannot delete destination. ${productsInDestination.length} products are assigned to it.`,
      }
    }

    const destinationIndex = this.destinations.findIndex((d) => d.id === destinationId)
    if (destinationIndex === -1) {
      return { success: false, error: "Destination not found" }
    }

    this.destinations.splice(destinationIndex, 1)
    this.saveDestinations()

    return { success: true }
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

  getDestinationStats() {
    return this.destinations.map((destination) => {
      const products = this.getProductsByDestination(destination.id)
      const statusCounts = {
        active: products.filter((p) => p.status === "active").length,
        maintenance: products.filter((p) => p.status === "maintenance").length,
        damaged: products.filter((p) => p.status === "damaged").length,
        discarded: products.filter((p) => p.status === "discarded").length,
        missing: products.filter((p) => p.status === "missing").length,
      }

      return {
        destination,
        totalProducts: products.length,
        statusCounts,
        products,
      }
    })
  }
}
