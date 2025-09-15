"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ProductService, type Product, type Category } from "@/lib/products"
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
import { Plus, Search, Filter } from "lucide-react"

const STATUS_COLORS = {
  active: "bg-green-100 text-green-800 border-green-200",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  damaged: "bg-red-100 text-red-800 border-red-200",
  discarded: "bg-gray-100 text-gray-800 border-gray-200",
  missing: "bg-purple-100 text-purple-800 border-purple-200",
}

export function ProductManagement() {
  const { canEdit } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const productService = ProductService.getInstance()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setProducts(productService.getProducts())
    setCategories(productService.getCategories())
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.uniqueCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || product.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleStatusUpdate = (productId: string, newStatus: Product["status"]) => {
    const result = productService.updateProductStatus(productId, newStatus)
    if (result.success) {
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Product Management</h2>
          <p className="text-muted-foreground">Manage your inventory products and track their status</p>
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
                <DialogDescription>Create a new product with a unique EHS code</DialogDescription>
              </DialogHeader>
              <AddProductForm
                categories={categories}
                onSuccess={() => {
                  loadData()
                  setIsAddDialogOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filter */}
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="discarded">Discarded</SelectItem>
            <SelectItem value="missing">Missing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>All products with their unique EHS codes and current status</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "No products match your search criteria"
                  : "No products added yet"}
              </p>
              {canEdit() && !searchTerm && statusFilter === "all" && (
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
                    <TableHead>Unique Code</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit() && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono font-medium">{product.uniqueCode}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground">{product.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category.name}</Badge>
                      </TableCell>
                      <TableCell>{product.yearOfPurchase}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[product.status]}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      {canEdit() && (
                        <TableCell>
                          <StatusUpdateDropdown
                            currentStatus={product.status}
                            onStatusChange={(status) => handleStatusUpdate(product.id, status)}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AddProductForm({
  categories,
  onSuccess,
}: {
  categories: Category[]
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    categoryId: "",
    yearOfPurchase: new Date().getFullYear(),
    description: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const productService = ProductService.getInstance()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!formData.name || !formData.code || !formData.categoryId) {
      setError("Please fill in all required fields")
      setIsLoading(false)
      return
    }

    const result = productService.addProduct({
      name: formData.name,
      code: formData.code.toUpperCase(),
      categoryId: formData.categoryId,
      yearOfPurchase: formData.yearOfPurchase,
      description: formData.description,
    })

    if (result.success) {
      onSuccess()
      setFormData({
        name: "",
        code: "",
        categoryId: "",
        yearOfPurchase: new Date().getFullYear(),
        description: "",
      })
    } else {
      setError(result.error || "Failed to add product")
    }
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Office Table"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Product Code *</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          placeholder="e.g., TAB"
          maxLength={5}
          required
        />
        <p className="text-xs text-muted-foreground">Short code for this product type (max 5 characters)</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name} ({category.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="year">Year of Purchase</Label>
        <Input
          id="year"
          type="number"
          value={formData.yearOfPurchase}
          onChange={(e) => setFormData({ ...formData, yearOfPurchase: Number.parseInt(e.target.value) })}
          min="2000"
          max={new Date().getFullYear() + 1}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional details about the product"
          rows={3}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Adding Product..." : "Add Product"}
      </Button>
    </form>
  )
}

function StatusUpdateDropdown({
  currentStatus,
  onStatusChange,
}: {
  currentStatus: Product["status"]
  onStatusChange: (status: Product["status"]) => void
}) {
  const statuses: Product["status"][] = ["active", "maintenance", "damaged", "discarded", "missing"]

  return (
    <Select value={currentStatus} onValueChange={onStatusChange}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => (
          <SelectItem key={status} value={status}>
            <div className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  status === "active"
                    ? "bg-green-500"
                    : status === "maintenance"
                      ? "bg-yellow-500"
                      : status === "damaged"
                        ? "bg-red-500"
                        : status === "discarded"
                          ? "bg-gray-500"
                          : "bg-purple-500"
                }`}
              />
              {status}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
