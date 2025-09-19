const API_BASE_URL = "https://el-node-backend.vercel.app/api"

export interface ApiDestination {
  id: string
  name: string
  description: string
  inventoryItems: Array<{
    id: string
    uniqueCode: string
    status: string
    yearOfPurchase: number
    createdAt: string
    updatedAt: string
    productId: string
    categoryId: string
    destinationId: string
    product: {
      id: string
      name: string
      uniqueCode: string
      description: string
      image: string
      createdAt: string
      categoryId: string
      userId: string
    }
    category: {
      id: string
      name: string
      code: string
    }
  }>
}

export interface ApiProduct {
  id: string
  name: string
  uniqueCode: string
  description: string
  image: string
  createdAt: string
  categoryId: string
  userId: string
  category: {
    id: string
    name: string
    code: string
  }
  user: {
    id: string
    username: string
    role: string
  }
  inventoryItems: Array<{
    id: string
    uniqueCode: string
    status: string
    yearOfPurchase: number
    createdAt: string
    updatedAt: string
    productId: string
    categoryId: string
    destinationId: string
    destination: {
      id: string
      name: string
      description: string
    }
  }>
}

export interface ApiCategory {
  id: string
  name: string
  code: string
  products: Array<{
    id: string
    name: string
    uniqueCode: string
    description: string
    image: string
    createdAt: string
    categoryId: string
    userId: string
  }>
}

export interface ApiInventoryItem {
  id: string
  uniqueCode: string
  status: string
  yearOfPurchase: number
  createdAt: string
  updatedAt: string
  productId: string
  categoryId: string
  destinationId: string
  product: {
    id: string
    name: string
    uniqueCode: string
    description: string
    image: string
    createdAt: string
    categoryId: string
    userId: string
  }
  destination: {
    id: string
    name: string
    description: string
  }
  category: {
    id: string
    name: string
    code: string
  }
}

export interface CreateDestinationRequest {
  name: string
  description: string
}

export interface UpdateDestinationRequest {
  name: string
  description: string
}

export interface CreateProductRequest {
  name: string
  uniqueCode: string
  description: string
  image: string
  categoryId: string
  userId: string
}

export interface UpdateProductRequest {
  name: string
  status?: string
  description: string
}

export interface CreateCategoryRequest {
  name: string
  code: string
}

export interface UpdateCategoryRequest {
  name: string
  code: string
}

export interface CreateInventoryItemRequest {
  status: string
  yearOfPurchase: number
  productId: string
  destinationId: string
  categoryId: string
}

export interface UpdateInventoryItemRequest {
  status: string
  yearOfPurchase: number
  productId: string
  destinationId: string
  categoryId: string
}

export class ApiService {
  private static instance: ApiService

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService()
    }
    return ApiService.instance
  }

  // GET /api/destinations
  async getDestinations(): Promise<{ success: boolean; data?: ApiDestination[]; error?: string }> {
    try {
      const response = await fetch(`https://el-node-backend.vercel.app/api/destinations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Failed to fetch destinations" }
      }
    } catch (error) {
      console.error("Get destinations error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  // POST /api/destinations
  async createDestination(destination: CreateDestinationRequest): Promise<{ success: boolean; data?: ApiDestination; error?: string }> {
    try {
      const response = await fetch(`https://el-node-backend.vercel.app/api/destinations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(destination),
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Failed to create destination" }
      }
    } catch (error) {
      console.error("Create destination error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  // PUT /api/destinations/:id
  async updateDestination(id: string, destination: UpdateDestinationRequest): Promise<{ success: boolean; data?: ApiDestination; error?: string }> {
    try {
      const response = await fetch(`https://el-node-backend.vercel.app/api/destinations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(destination),
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Failed to update destination" }
      }
    } catch (error) {
      console.error("Update destination error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  // DELETE /api/destinations/:id
  async deleteDestination(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`https://el-node-backend.vercel.app/api/destinations/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Failed to delete destination" }
      }
    } catch (error) {
      console.error("Delete destination error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  // GET /api/products
  async getProducts(): Promise<{ success: boolean; data?: ApiProduct[]; error?: string }> {
    try {
      const response = await fetch(`https://el-node-backend.vercel.app/api/products`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Failed to fetch products" }
      }
    } catch (error) {
      console.error("Get products error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  // POST /api/products
  async createProduct(product: CreateProductRequest): Promise<{ success: boolean; data?: ApiProduct; error?: string }> {
    try {
      const response = await fetch(`https://el-node-backend.vercel.app/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Failed to create product" }
      }
    } catch (error) {
      console.error("Create product error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  // PUT /api/products/:id
  async updateProduct(id: string, product: UpdateProductRequest): Promise<{ success: boolean; data?: ApiProduct; error?: string }> {
    try {
      const response = await fetch(`https://el-node-backend.vercel.app/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Failed to update product" }
      }
    } catch (error) {
      console.error("Update product error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  // DELETE /api/products/:id
  async deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`https://el-node-backend.vercel.app/api/products/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Failed to delete product" }
      }
    } catch (error) {
      console.error("Delete product error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  // GET /api/categories
  async getCategories(): Promise<{ success: boolean; data?: ApiCategory[]; error?: string }> {
    try {
      const response = await fetch(`https://el-node-backend.vercel.app/api/categories`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Failed to fetch categories" }
      }
    } catch (error) {
      console.error("Get categories error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  // POST /api/categories
  async createCategory(category: CreateCategoryRequest): Promise<{ success: boolean; data?: ApiCategory; error?: string }> {
    try {
      const response = await fetch(`https://el-node-backend.vercel.app/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Failed to create category" }
      }
    } catch (error) {
      console.error("Create category error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  // PUT /api/categories/:id
  async updateCategory(id: string, category: UpdateCategoryRequest): Promise<{ success: boolean; data?: ApiCategory; error?: string }> {
    try {
      const response = await fetch(`https://el-node-backend.vercel.app/api/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Failed to update category" }
      }
    } catch (error) {
      console.error("Update category error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  // DELETE /api/categories/:id
  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`https://el-node-backend.vercel.app/api/categories/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Failed to delete category" }
      }
    } catch (error) {
      console.error("Delete category error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  // GET /api/inventory
  async getInventoryItems(): Promise<{ success: boolean; data?: ApiInventoryItem[]; error?: string }> {
    try {
      const response = await fetch(`https://el-node-backend.vercel.app/api/inventory`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Failed to fetch inventory items" }
      }
    } catch (error) {
      console.error("Get inventory items error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  // POST /api/inventory
  async createInventoryItem(item: CreateInventoryItemRequest): Promise<{ success: boolean; data?: ApiInventoryItem; error?: string }> {
    try {
      const response = await fetch(`https://el-node-backend.vercel.app/api/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Failed to create inventory item" }
      }
    } catch (error) {
      console.error("Create inventory item error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  // PUT /api/inventory/:id
  async updateInventoryItem(id: string, item: UpdateInventoryItemRequest): Promise<{ success: boolean; data?: ApiInventoryItem; error?: string }> {
    try {
      const response = await fetch(`https://el-node-backend.vercel.app/api/inventory/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Failed to update inventory item" }
      }
    } catch (error) {
      console.error("Update inventory item error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  // DELETE /api/inventory/:id
  async deleteInventoryItem(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`https://el-node-backend.vercel.app/api/inventory/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Failed to delete inventory item" }
      }
    } catch (error) {
      console.error("Delete inventory item error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }
} 