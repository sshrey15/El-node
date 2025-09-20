<<<<<<< HEAD
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
  image: string // This will be the base64 string
  categoryId: string
  userId: string
}

export interface UpdateProductRequest {
  name: string
  description: string
  image: string // This will be the base64 string
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
  private baseUrl = "https://el-node-backend.vercel.app/api"

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
      const response = await fetch(`${this.baseUrl}/destinations`, { credentials: 'include' })
      if (response.ok) return { success: true, data: await response.json() }
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        return { success: false, error: errorData.message || "Failed to fetch destinations" }
      } catch (e) {
        return { success: false, error: `Failed to fetch destinations: ${response.statusText}` }
      }
    } catch (error) {
      console.error("Get destinations error:", error)
      return { success: false, error: "A network error occurred." }
    }
  }

  // POST /api/destinations
  async createDestination(destination: CreateDestinationRequest): Promise<{ success: boolean; data?: ApiDestination; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/destinations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(destination),
        credentials: 'include',
      })
      if (response.ok) return { success: true, data: await response.json() }
      const errorData = await response.json()
      return { success: false, error: errorData.message || "Failed to create destination" }
    } catch (error) {
      console.error("Create destination error:", error)
      return { success: false, error: "A network error occurred." }
    }
  }

  // PUT /api/destinations/:id
  async updateDestination(id: string, destination: UpdateDestinationRequest): Promise<{ success: boolean; data?: ApiDestination; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/destinations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(destination),
        credentials: 'include',
      })
      if (response.ok) return { success: true, data: await response.json() }
      const errorData = await response.json()
      return { success: false, error: errorData.message || "Failed to update destination" }
    } catch (error) {
      console.error("Update destination error:", error)
      return { success: false, error: "A network error occurred." }
    }
  }

  // DELETE /api/destinations/:id
  async deleteDestination(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/destinations/${id}`, { method: "DELETE", credentials: 'include' })
      if (response.ok) return { success: true }
      const errorData = await response.json()
      return { success: false, error: errorData.message || "Failed to delete destination" }
    } catch (error) {
      console.error("Delete destination error:", error)
      return { success: false, error: "A network error occurred." }
    }
  }

  // GET /api/products
  async getProducts(): Promise<{ success: boolean; data?: ApiProduct[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/products`, { credentials: 'include' })
      if (response.ok) return { success: true, data: await response.json() }
      const errorData = await response.json()
      return { success: false, error: errorData.message || "Failed to fetch products" }
    } catch (error) {
      console.error("Get products error:", error)
      return { success: false, error: "A network error occurred." }
    }
  }

  // ✅ CHANGED: POST /api/products using FormData
  async createProduct(productData: FormData): Promise<{ success: boolean; data?: ApiProduct; error?: string }> {
    try {
        const response = await fetch(`${this.baseUrl}/products`, {
            method: "POST",
            body: productData, // Send FormData directly
            credentials: 'include',
            // ❌ DO NOT set 'Content-Type' header, the browser does it automatically for FormData
        })

        if (response.ok) return { success: true, data: await response.json() }

        const errorText = await response.text();
        try {
            const errorData = JSON.parse(errorText);
            return { success: false, error: errorData.error || "Failed to create product" }
        } catch (e) {
            return { success: false, error: `Failed to create product: ${response.statusText}` }
        }
    } catch (error) {
        console.error("Create product error:", error)
        return { success: false, error: "A network error occurred." }
    }
}

// ✅ CHANGED: PUT /api/products/:id using FormData
async updateProduct(id: string, productData: FormData): Promise<{ success: boolean; data?: ApiProduct; error?: string }> {
    try {
        const response = await fetch(`${this.baseUrl}/products/${id}`, {
            method: "PUT",
            body: productData, // Send FormData directly
            credentials: 'include',
             // ❌ DO NOT set 'Content-Type' header
        })

        if (response.ok) return { success: true, data: await response.json() }

        const errorText = await response.text();
        try {
            const errorData = JSON.parse(errorText);
            return { success: false, error: errorData.error || "Failed to update product" }
        } catch (e) {
            return { success: false, error: `Failed to update product: ${response.statusText}` }
        }
    } catch (error) {
        console.error("Update product error:", error)
        return { success: false, error: "A network error occurred." }
    }
}

  // DELETE /api/products/:id
  async deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/products/${id}`, { method: "DELETE", credentials: 'include' })
      if (response.ok) return { success: true }
      const errorData = await response.json()
      return { success: false, error: errorData.message || "Failed to delete product" }
    } catch (error) {
      console.error("Delete product error:", error)
      return { success: false, error: "A network error occurred." }
    }
  }

  // GET /api/categories
  async getCategories(): Promise<{ success: boolean; data?: ApiCategory[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/categories`, { credentials: 'include' })
      if (response.ok) return { success: true, data: await response.json() }
      const errorData = await response.json()
      return { success: false, error: errorData.message || "Failed to fetch categories" }
    } catch (error) {
      console.error("Get categories error:", error)
      return { success: false, error: "A network error occurred." }
    }
  }

  // POST /api/categories
  async createCategory(category: CreateCategoryRequest): Promise<{ success: boolean; data?: ApiCategory; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
        credentials: 'include',
      })
      if (response.ok) return { success: true, data: await response.json() }
      const errorData = await response.json()
      return { success: false, error: errorData.message || "Failed to create category" }
    } catch (error) {
      console.error("Create category error:", error)
      return { success: false, error: "A network error occurred." }
    }
  }

  // PUT /api/categories/:id
  async updateCategory(id: string, category: UpdateCategoryRequest): Promise<{ success: boolean; data?: ApiCategory; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
        credentials: 'include',
      })
      if (response.ok) return { success: true, data: await response.json() }
      const errorData = await response.json()
      return { success: false, error: errorData.message || "Failed to update category" }
    } catch (error) {
      console.error("Update category error:", error)
      return { success: false, error: "A network error occurred." }
    }
  }

  // DELETE /api/categories/:id
  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/categories/${id}`, { method: "DELETE", credentials: 'include' })
      if (response.ok) return { success: true }
      const errorData = await response.json()
      return { success: false, error: errorData.message || "Failed to delete category" }
    } catch (error) {
      console.error("Delete category error:", error)
      return { success: false, error: "A network error occurred." }
    }
  }

  // GET /api/inventory
  async getInventoryItems(): Promise<{ success: boolean; data?: ApiInventoryItem[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/inventory`, { credentials: 'include' })
      if (response.ok) return { success: true, data: await response.json() }
      const errorData = await response.json()
      return { success: false, error: errorData.message || "Failed to fetch inventory items" }
    } catch (error) {
      console.error("Get inventory items error:", error)
      return { success: false, error: "A network error occurred." }
    }
  }

  // POST /api/inventory
  async createInventoryItem(item: CreateInventoryItemRequest): Promise<{ success: boolean; data?: ApiInventoryItem; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        credentials: 'include',
      })
      if (response.ok) return { success: true, data: await response.json() }
      const errorData = await response.json()
      return { success: false, error: errorData.message || "Failed to create inventory item" }
    } catch (error) {
      console.error("Create inventory item error:", error)
      return { success: false, error: "A network error occurred." }
    }
  }

  // PUT /api/inventory/:id
  async updateInventoryItem(id: string, item: UpdateInventoryItemRequest): Promise<{ success: boolean; data?: ApiInventoryItem; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        credentials: 'include',
      })
      if (response.ok) return { success: true, data: await response.json() }
      const errorData = await response.json()
      return { success: false, error: errorData.message || "Failed to update inventory item" }
    } catch (error) {
      console.error("Update inventory item error:", error)
      return { success: false, error: "A network error occurred." }
    }
  }

  // DELETE /api/inventory/:id
  async deleteInventoryItem(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/inventory/${id}`, { method: "DELETE", credentials: 'include' })
      if (response.ok) return { success: true }
      const errorData = await response.json()
      return { success: false, error: errorData.message || "Failed to delete inventory item" }
    } catch (error) {
      console.error("Delete inventory item error:", error)
      return { success: false, error: "A network error occurred." }
    }
  }
}

=======


{"code":"rate-limited","message":"You have hit the rate limit. Please upgrade to keep chatting.","providerLimitHit":false,"isRetryable":true} 
>>>>>>> 1edf8dba0cf28a5431278eb993e25f22633a40f0
