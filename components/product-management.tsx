"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ApiService, type ApiProduct, type ApiCategory } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, Package, Upload, Trash2, Edit, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function ProductManagement() {
  const { canEdit, user } = useAuth()
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null)
  const [productToDelete, setProductToDelete] = useState<ApiProduct | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [error, setError] = useState("")
  const apiService = ApiService.getInstance()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setIsLoading(true)
    setError("")
    try {
      const result = await apiService.getProducts()
      if (result.success && result.data) {
        setProducts(result.data)
      } else {
        setError(result.error || "Failed to load products")
      }
    } catch (error) {
      console.error("Error loading products:", error)
      setError("Failed to load products")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    return (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.uniqueCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      const result = await apiService.deleteProduct(productToDelete.id)
      if (result.success) {
        await loadProducts()
        setProductToDelete(null)
      } else {
        setDeleteError(result.error || "Failed to delete product")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      setDeleteError("Failed to delete product")
    }
  }

  const handleEditProduct = (product: ApiProduct) => {
    setEditingProduct(product)
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading products...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Product Management</h2>
          <p className="text-muted-foreground">Manage your product catalog and subcategories</p>
        </div>
        {canEdit() && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>Create a new product for your catalog</DialogDescription>
              </DialogHeader>
              <AddProductForm
                onSuccess={() => {
                  loadProducts()
                  setIsAddDialogOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products, codes, or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>All products in your catalog</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No products match your search criteria" : "No products found"}
              </p>
              {canEdit() && !searchTerm && (
                <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Product Code</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Inventory Items</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-lg overflow-hidden">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-mono font-medium">{product.uniqueCode}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category.name}</Badge>
                      </TableCell>
                      <TableCell>
                        {product.description ? (
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {product.description}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No description</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.inventoryItems.length} items</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {canEdit() && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDeleteError(null)
                                  setProductToDelete(product)
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!productToDelete}
        onOpenChange={() => {
          setProductToDelete(null)
          setDeleteError(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError ? (
                <span className="text-destructive">{deleteError}</span>
              ) : (
                <span>
                  This action cannot be undone. This will permanently delete the
                  <span className="font-bold"> {productToDelete?.name} </span>
                  product.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {!deleteError && (
              <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Product Dialog */}
      {editingProduct && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>Update product information</DialogDescription>
            </DialogHeader>
            <EditProductForm
              product={editingProduct}
              onSuccess={() => {
                loadProducts()
                setIsEditDialogOpen(false)
                setEditingProduct(null)
              }}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setEditingProduct(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function AddProductForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    uniqueCode: "",
    description: "",
    image: "",
    categoryId: "",
  })
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const apiService = ApiService.getInstance()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setCategoriesLoading(true)
    try {
      const result = await apiService.getCategories()
      if (result.success && result.data) {
        setCategories(result.data)
      } else {
        setError(result.error || "Failed to load categories")
      }
    } catch (error) {
      console.error("Error loading categories:", error)
      setError("Failed to load categories")
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!formData.name.trim() || !formData.uniqueCode.trim() || !formData.categoryId) {
      setError("Please fill in all required fields")
      setIsLoading(false)
      return
    }

    if (!user) {
      setError("User not authenticated")
      setIsLoading(false)
      return
    }

    try {
      const result = await apiService.createProduct({
        name: formData.name.trim(),
        uniqueCode: formData.uniqueCode.trim().toUpperCase(),
        description: formData.description.trim(),
        image: formData.image.trim(),
        categoryId: formData.categoryId,
        userId: user.id,
      })

      if (result.success) {
        onSuccess()
        setFormData({
          name: "",
          uniqueCode: "",
          description: "",
          image: "",
          categoryId: "",
        })
      } else {
        setError(result.error || "Failed to create product")
      }
    } catch (error) {
      console.error("Error creating product:", error)
      setError("Failed to create product")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., DELL XPS"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="uniqueCode">Product Code *</Label>
        <Input
          id="uniqueCode"
          value={formData.uniqueCode}
          onChange={(e) => setFormData({ ...formData, uniqueCode: e.target.value.toUpperCase() })}
          placeholder="e.g., DEL"
          maxLength={10}
          className="font-mono"
          required
        />
        <p className="text-xs text-muted-foreground">
          Short code for this product. This will be used in inventory codes.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Category *</Label>
        <Select 
          value={formData.categoryId} 
          onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          disabled={categoriesLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select category"} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name} ({category.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select the category for this product
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Image URL</Label>
        <Input
          id="image"
          value={formData.image}
          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
        <p className="text-xs text-muted-foreground">Optional image URL for this product</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detailed description of the product"
          rows={3}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isLoading || categoriesLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating Product...
          </>
        ) : (
          "Save Product"
        )}
      </Button>
    </form>
  )
}

function EditProductForm({
  product,
  onSuccess,
  onCancel,
}: {
  product: ApiProduct
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description,
  })

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const apiService = ApiService.getInstance()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!formData.name.trim()) {
      setError("Please enter a product name")
      setIsLoading(false)
      return
    }

    try {
      const result = await apiService.updateProduct(product.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
      })

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || "Failed to update product")
      }
    } catch (error) {
      console.error("Error updating product:", error)
      setError("Failed to update product")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Product Name *</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., DELL XPS"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detailed description of the product"
          rows={3}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Product"
          )}
        </Button>
      </div>
    </form>
  )
}