"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ProductService, type InventoryItem, type Category, type Product, type Destination } from "@/lib/products"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Search, Filter, Package, Trash2 } from "lucide-react"
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

const STATUS_COLORS = {
  active: "bg-green-100 text-green-800 border-green-200",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  damaged: "bg-red-100 text-red-800 border-red-200",
  discarded: "bg-gray-100 text-gray-800 border-gray-200",
  missing: "bg-purple-100 text-purple-800 border-purple-200",
}

export function InventoryManagement() {
  const { canEdit } = useAuth()
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const productService = ProductService.getInstance()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setInventoryItems(productService.getInventoryItems())
    setCategories(productService.getCategories())
    setProducts(productService.getProducts())
    setDestinations(productService.getDestinations())
  }

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.uniqueCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleStatusUpdate = (itemId: string, newStatus: InventoryItem["status"]) => {
    const result = productService.updateInventoryItemStatus(itemId, newStatus)
    if (result.success) {
      loadData()
    }
  }

  const handleDestinationUpdate = (itemId: string, destinationId?: string) => {
    const result = productService.updateInventoryItemDestination(itemId, destinationId)
    if (result.success) {
      loadData()
    }
  }

  const handleDeleteItem = () => {
    if (!itemToDelete) return

    const result = productService.deleteInventoryItem(itemToDelete.id)
    if (result.success) {
      loadData()
      setItemToDelete(null)
    } else {
      setDeleteError(result.error || "An unknown error occurred.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Inventory Management</h2>
          <p className="text-muted-foreground">Manage your inventory items and track their status</p>
        </div>
        {canEdit() && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add to Inventory
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add to Inventory</DialogTitle>
                <DialogDescription>Add a product instance to your inventory</DialogDescription>
              </DialogHeader>
              <AddInventoryForm
                categories={categories}
                products={products}
                destinations={destinations}
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
            placeholder="Search inventory items, codes, or categories..."
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

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items ({filteredItems.length})</CardTitle>
          <CardDescription>All inventory items with their unique codes and current status</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "No inventory items match your search criteria"
                  : "No inventory items added yet"}
              </p>
              {canEdit() && !searchTerm && statusFilter === "all" && (
                <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Item
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
                    <TableHead>Destination</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit() && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const destination = destinations.find((d) => d.id === item.destinationId)
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-medium">{item.uniqueCode}</TableCell>
                        <TableCell className="font-medium">{item.product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category.name}</Badge>
                        </TableCell>
                        <TableCell>
                          {destination ? (
                            <Badge variant="secondary">{destination.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">No location</span>
                          )}
                        </TableCell>
                        <TableCell>{item.yearOfPurchase}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_COLORS[item.status]}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        {canEdit() && (
                          <TableCell>
                            <div className="flex space-x-2">
                              <StatusUpdateDropdown
                                currentStatus={item.status}
                                onStatusChange={(status) => handleStatusUpdate(item.id, status)}
                              />
                              <DestinationUpdateDropdown
                                currentDestinationId={item.destinationId}
                                destinations={destinations}
                                onDestinationChange={(destinationId) =>
                                  handleDestinationUpdate(item.id, destinationId)
                                }
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDeleteError(null)
                                  setItemToDelete(item)
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={() => {
          setItemToDelete(null)
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
                  This action cannot be undone. This will permanently delete the inventory item with code
                  <span className="font-bold"> {itemToDelete?.uniqueCode}</span>.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {!deleteError && (
              <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AddInventoryForm({
  categories,
  products,
  destinations,
  onSuccess,
}: {
  categories: Category[]
  products: Product[]
  destinations: Destination[]
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    productName: "",
    categoryId: "",
    productId: "",
    destinationId: "",
    yearOfPurchase: new Date().getFullYear(),
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const productService = ProductService.getInstance()

  const filteredProducts = products.filter((p) => p.categoryId === formData.categoryId)

  const handleCategoryChange = (categoryId: string) => {
    setFormData({
      ...formData,
      categoryId,
      productId: "",
      productName: "",
    })
  }

  const handleProductChange = (productId: string) => {
    const selectedProduct = products.find((p) => p.id === productId)
    setFormData({
      ...formData,
      productId,
      productName: selectedProduct?.name || "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!formData.productId) {
      setError("Please select a product")
      setIsLoading(false)
      return
    }

    const result = productService.addInventoryItem({
      productId: formData.productId,
      yearOfPurchase: formData.yearOfPurchase,
      destinationId: formData.destinationId || undefined,
    })

    if (result.success) {
      onSuccess()
      setFormData({
        productName: "",
        categoryId: "",
        productId: "",
        destinationId: "",
        yearOfPurchase: new Date().getFullYear(),
      })
    } else {
      setError(result.error || "Failed to add inventory item")
    }
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="productName">Product Name</Label>
        <Input
          id="productName"
          value={formData.productName}
          placeholder="Select category and product first"
          disabled
          className="bg-muted"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
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
        <Label htmlFor="product">Product *</Label>
        <Select 
          value={formData.productId} 
          onValueChange={handleProductChange}
          disabled={!formData.categoryId}
        >
          <SelectTrigger>
            <SelectValue placeholder={formData.categoryId ? "Select product" : "Select category first"} />
          </SelectTrigger>
          <SelectContent>
            {filteredProducts.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name} ({product.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="destination">Destination</Label>
        <Select
          value={formData.destinationId || "none"}
          onValueChange={(value) => setFormData({ ...formData, destinationId: value === "none" ? "" : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select destination" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No destination</SelectItem>
            {destinations.map((destination) => (
              <SelectItem key={destination.id} value={destination.id}>
                {destination.name}
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

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Adding to Inventory..." : "Add to Inventory"}
      </Button>
    </form>
  )
}

function StatusUpdateDropdown({
  currentStatus,
  onStatusChange,
}: {
  currentStatus: InventoryItem["status"]
  onStatusChange: (status: InventoryItem["status"]) => void
}) {
  const statuses: InventoryItem["status"][] = ["active", "maintenance", "damaged", "discarded", "missing"]

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

function DestinationUpdateDropdown({
  currentDestinationId,
  destinations,
  onDestinationChange,
}: {
  currentDestinationId?: string
  destinations: Destination[]
  onDestinationChange: (destinationId?: string) => void
}) {
  return (
    <Select
      value={currentDestinationId || "none"}
      onValueChange={(value) => onDestinationChange(value === "none" ? undefined : value)}
    >
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No Location</SelectItem>
        {destinations.map((destination) => (
          <SelectItem key={destination.id} value={destination.id}>
            {destination.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}