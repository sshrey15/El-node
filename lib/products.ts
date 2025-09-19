export interface Category {
  id: string
  name: string
  code: string // Short code like "FUR" for Furniture
  createdAt: string
}

export interface Product {
  id: string
  name: string
  code: string // Short code like "CCH" for Chair
  categoryId: string
  image?: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Destination {
  id: string
  name: string
  description?: string
  createdAt: string
}

export interface InventoryItem {
  id: string
  productId: string
  product: Product
  category: Category
  uniqueCode: string // Full code like "EHS-CCH-0001"
  status: "active" | "maintenance" | "damaged" | "discarded" | "missing"
  yearOfPurchase: number
  serialNumber: number
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

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Office Chair",
    code: "CCH",
    categoryId: "1",
    description: "Ergonomic office chair",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Desk",
    code: "DSK",
    categoryId: "1",
    description: "Office desk",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
  private products: Product[] = DEFAULT_PRODUCTS
  private inventoryItems: InventoryItem[] = []
  private categories: Category[] = DEFAULT_CATEGORIES
  private destinations: Destination[] = DEFAULT_DESTINATIONS

  private constructor() {
    if (typeof window !== "undefined") {
      const storedProducts = localStorage.getItem("el-node-products")
      const storedInventoryItems = localStorage.getItem("el-node-inventory-items")
      const storedCategories = localStorage.getItem("el-node-categories")
      const storedDestinations = localStorage.getItem("el-node-destinations")

      if (storedProducts) {
        this.products = JSON.parse(storedProducts)
      } else {
        localStorage.setItem("el-node-products", JSON.stringify(DEFAULT_PRODUCTS))
      }
      
      if (storedInventoryItems) {
        this.inventoryItems = JSON.parse(storedInventoryItems)
      }
      
      if (storedCategories) {
        this.categories = JSON.parse(storedCategories)
      } else {
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

  private saveInventoryItems(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("el-node-inventory-items", JSON.stringify(this.inventoryItems))
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

  private generateUniqueCode(categoryCode: string, productCode: string, yearOfPurchase: number): string {
    // Find the next serial number for this product code
    const existingItems = this.inventoryItems.filter(
      (item) => item.product.code === productCode
    )

    const nextSerialNumber = existingItems.length + 1
    const serialNumberPadded = nextSerialNumber.toString().padStart(4, "0")

    return `EHS-${categoryCode}-${productCode}-${yearOfPurchase}-${serialNumberPadded}`
  }

  // Product management methods
  addProduct(data: {
    name: string
    code: string
    categoryId: string
    image?: string
    description?: string
  }): { success: boolean; product?: Product; error?: string } {
    const category = this.categories.find((c) => c.id === data.categoryId)
    if (!category) {
      return { success: false, error: "Category not found" }
    }

    // Check if product code already exists
    if (this.products.some((p) => p.code === data.code)) {
      return { success: false, error: "Product code already exists" }
    }

    const product: Product = {
      id: Date.now().toString(),
      name: data.name,
      code: data.code.toUpperCase(),
      categoryId: data.categoryId,
      image: data.image,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.products.push(product)
    this.saveProducts()

    return { success: true, product }
  }

  getProducts(): Product[] {
    return [...this.products]
  }

  getProductsByCategory(categoryId: string): Product[] {
    return this.products.filter((p) => p.categoryId === categoryId)
  }

  deleteProduct(productId: string): { success: boolean; error?: string } {
    const itemsOfProduct = this.inventoryItems.filter((item) => item.productId === productId)
    if (itemsOfProduct.length > 0) {
      return {
        success: false,
        error: `Cannot delete product. ${itemsOfProduct.length} inventory items are linked to it.`,
      }
    }

    const productIndex = this.products.findIndex((p) => p.id === productId)
    if (productIndex === -1) {
      return { success: false, error: "Product not found" }
    }

    this.products.splice(productIndex, 1)
    this.saveProducts()

    return { success: true }
  }

  // Inventory management methods
  addInventoryItem(data: {
    productId: string
    yearOfPurchase: number
    destinationId?: string
  }): { success: boolean; inventoryItem?: InventoryItem; error?: string } {
    const product = this.products.find((p) => p.id === data.productId)
    if (!product) {
      return { success: false, error: "Product not found" }
    }

    const category = this.categories.find((c) => c.id === product.categoryId)
    if (!category) {
      return { success: false, error: "Category not found" }
    }

    const uniqueCode = this.generateUniqueCode(category.code, product.code, data.yearOfPurchase)
    const serialNumber = this.inventoryItems.filter(
      (item) => item.product.code === product.code
    ).length + 1

    const inventoryItem: InventoryItem = {
      id: Date.now().toString(),
      productId: data.productId,
      product,
      category,
      uniqueCode,
      status: "active",
      yearOfPurchase: data.yearOfPurchase,
      serialNumber,
      destinationId: data.destinationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.inventoryItems.push(inventoryItem)
    this.saveInventoryItems()

    return { success: true, inventoryItem }
  }

  updateInventoryItemDestination(itemId: string, destinationId?: string): { success: boolean; error?: string } {
    const itemIndex = this.inventoryItems.findIndex((item) => item.id === itemId)
    if (itemIndex === -1) {
      return { success: false, error: "Inventory item not found" }
    }

    this.inventoryItems[itemIndex].destinationId = destinationId
    this.inventoryItems[itemIndex].updatedAt = new Date().toISOString()
    this.saveInventoryItems()

    return { success: true }
  }

  updateInventoryItemStatus(itemId: string, status: InventoryItem["status"]): { success: boolean; error?: string } {
    const itemIndex = this.inventoryItems.findIndex((item) => item.id === itemId)
    if (itemIndex === -1) {
      return { success: false, error: "Inventory item not found" }
    }

    this.inventoryItems[itemIndex].status = status
    this.inventoryItems[itemIndex].updatedAt = new Date().toISOString()
    this.saveInventoryItems()

    return { success: true }
  }

  deleteInventoryItem(itemId: string): { success: boolean; error?: string } {
    const itemIndex = this.inventoryItems.findIndex((item) => item.id === itemId)
    if (itemIndex === -1) {
      return { success: false, error: "Inventory item not found" }
    }

    this.inventoryItems.splice(itemIndex, 1)
    this.saveInventoryItems()

    return { success: true }
  }

  getInventoryItems(): InventoryItem[] {
    return [...this.inventoryItems]
  }

  getInventoryItemsByStatus(status: InventoryItem["status"]): InventoryItem[] {
    return this.inventoryItems.filter((item) => item.status === status)
  }

  getInventoryItemsByDestination(destinationId: string): InventoryItem[] {
    return this.inventoryItems.filter((item) => item.destinationId === destinationId)
  }

  // Category and destination methods remain the same
  getCategories(): Category[] {
    return [...this.categories]
  }

  getDestinations(): Destination[] {
    return [...this.destinations]
  }

  addDestination(name: string, description?: string): { success: boolean; destination?: Destination; error?: string } {
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
    const itemsInDestination = this.inventoryItems.filter((item) => item.destinationId === destinationId)
    if (itemsInDestination.length > 0) {
      return {
        success: false,
        error: `Cannot delete destination. ${itemsInDestination.length} inventory items are assigned to it.`,
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

  deleteCategory(categoryId: string): { success: boolean; error?: string } {
    const productsInCategory = this.products.filter((p) => p.categoryId === categoryId)
    if (productsInCategory.length > 0) {
      return {
        success: false,
        error: `Cannot delete category. ${productsInCategory.length} products are assigned to it.`,
      }
    }

    const categoryIndex = this.categories.findIndex((c) => c.id === categoryId)
    if (categoryIndex === -1) {
      return { success: false, error: "Category not found" }
    }

    this.categories.splice(categoryIndex, 1)
    this.saveCategories()

    return { success: true }
  }

  getInventoryStats() {
    // Exclude discarded items from stats
    const activeItems = this.inventoryItems.filter((item) => item.status !== "discarded")
    const total = activeItems.length
    const active = activeItems.filter((item) => item.status === "active").length
    const maintenance = activeItems.filter((item) => item.status === "maintenance").length
    const damaged = activeItems.filter((item) => item.status === "damaged").length
    const missing = activeItems.filter((item) => item.status === "missing").length

    return {
      total,
      active,
      maintenance,
      issues: damaged + missing,
      damaged,
      missing,
    }
  }

  getDestinationStats() {
    return this.destinations.map((destination) => {
      const items = this.getInventoryItemsByDestination(destination.id)
      const statusCounts = {
        active: items.filter((item) => item.status === "active").length,
        maintenance: items.filter((item) => item.status === "maintenance").length,
        damaged: items.filter((item) => item.status === "damaged").length,
        discarded: items.filter((item) => item.status === "discarded").length,
        missing: items.filter((item) => item.status === "missing").length,
      }

      return {
        destination,
        totalItems: items.length,
        statusCounts,
        items,
      }
    })
  }
}