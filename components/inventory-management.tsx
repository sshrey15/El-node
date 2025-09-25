"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ApiService, type ApiInventoryItem, type ApiProduct, type ApiDestination, type ApiCategory } from "@/lib/api"
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
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Plus, Search, Package, Trash2, Edit, Loader2, Filter } from "lucide-react"
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
  active: "bg-primary text-white border-primary",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  damaged: "bg-red-100 text-red-800 border-red-200",
  discarded: "bg-gray-100 text-gray-800 border-gray-200",
  missing: "bg-purple-100 text-purple-800 border-purple-200",
}

export function InventoryManagement() {
  const { canEdit } = useAuth()
  const [inventoryItems, setInventoryItems] = useState<ApiInventoryItem[]>([])
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [destinations, setDestinations] = useState<ApiDestination[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ApiInventoryItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<ApiInventoryItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [error, setError] = useState("")
  const apiService = ApiService.getInstance()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError("")
    try {
      const [inventoryResult, productsResult, destinationsResult, categoriesResult] = await Promise.all([
        apiService.getInventoryItems(),
        apiService.getProducts(),
        apiService.getDestinations(),
        apiService.getCategories(),
      ])

      if (inventoryResult.success && inventoryResult.data) {
        setInventoryItems(inventoryResult.data)
      } else {
        setError(inventoryResult.error || "Failed to load inventory items")
      }

      if (productsResult.success && productsResult.data) {
        setProducts(productsResult.data)
      }

      if (destinationsResult.success && destinationsResult.data) {
        setDestinations(destinationsResult.data)
      }

      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Failed to load inventory data")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch = 
      item.uniqueCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.destination?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = filteredItems.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const resetPagination = () => {
    setCurrentPage(1)
  }

  // Reset pagination when search or filter changes
  useEffect(() => {
    resetPagination()
  }, [searchTerm, statusFilter])

  const handleDeleteItem = async () => {
    if (!itemToDelete) return

    try {
      const result = await apiService.deleteInventoryItem(itemToDelete.id)
      if (result.success) {
        await loadData()
        setItemToDelete(null)
      } else {
        setDeleteError(result.error || "Failed to delete inventory item")
      }
    } catch (error) {
      console.error("Error deleting inventory item:", error)
      setDeleteError("Failed to delete inventory item")
    }
  }

  const handleEditItem = (item: ApiInventoryItem) => {
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading inventory...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Inventory Management</h2>
          <p className="text-muted-foreground">Track and manage your inventory items</p>
        </div>
        {canEdit() && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Inventory Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
                <DialogDescription>Create a new inventory item</DialogDescription>
              </DialogHeader>
              <AddInventoryForm
                products={products}
                destinations={destinations}
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

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code, product, destination, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
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
          <Select value={itemsPerPage.toString()} onValueChange={(value) => {
            setItemsPerPage(parseInt(value))
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inventory Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Items ({filteredItems.length})</CardTitle>
              <CardDescription>
                {filteredItems.length > 0 && (
                  <>Showing {startIndex + 1} to {Math.min(endIndex, filteredItems.length)} of {filteredItems.length} items</>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "No items match your search criteria" 
                  : "No inventory items found"
                }
              </p>
              {canEdit() && !searchTerm && statusFilter === "all" && (
                <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Item
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unique Code</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-medium">{item.uniqueCode}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product.name}</div>
                            <div className="text-sm text-muted-foreground">{item.product.uniqueCode}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category.name}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.destination ? (
                            <div>
                              <div className="font-medium">{item.destination.name}</div>
                              <div className="text-sm text-muted-foreground">{item.destination.description}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No destination</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_COLORS[item.status as keyof typeof STATUS_COLORS]}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.yearOfPurchase}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {canEdit() && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditItem(item)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
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
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault()
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1)
                            }
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {/* Generate page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = i + 1
                        
                        // Adjust page numbers to show current page in center when possible
                        if (totalPages > 5) {
                          if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }
                        }

                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(pageNum)
                              }}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}

                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1)
                            }
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
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
                  This action cannot be undone. This will permanently delete the inventory item
                  <span className="font-bold"> {itemToDelete?.uniqueCode} </span>.
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

      {/* Edit Inventory Item Dialog */}
      {editingItem && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
              <DialogDescription>Update inventory item information</DialogDescription>
            </DialogHeader>
            <EditInventoryForm
              item={editingItem}
              products={products}
              destinations={destinations}
              categories={categories}
              onSuccess={() => {
                loadData()
                setIsEditDialogOpen(false)
                setEditingItem(null)
              }}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setEditingItem(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function AddInventoryForm({
  products,
  destinations,
  categories,
  onSuccess,
}: {
  products: ApiProduct[]
  destinations: ApiDestination[]
  categories: ApiCategory[]
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    status: "active",
    yearOfPurchase: new Date().getFullYear(),
    productId: "",
    destinationId: "",
    categoryId: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const apiService = ApiService.getInstance()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")

  const filteredProducts = products.filter(
    (product) => product.categoryId === selectedCategoryId
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!formData.productId || !formData.categoryId) {
      setError("Please fill in all required fields")
      setIsLoading(false)
      return
    }

    try {
      const result = await apiService.createInventoryItem({
        uniqueCode: formData.productId + "-" + formData.yearOfPurchase + "-" + Math.floor(Math.random() * 1000000),
        status: formData.status,
        yearOfPurchase: formData.yearOfPurchase,
        productId: formData.productId,
        destinationId: formData.destinationId || null,
        categoryId: formData.categoryId,
      })

      if (result.success) {
        onSuccess()
        setFormData({
          status: "active",
          yearOfPurchase: new Date().getFullYear(),
          productId: "",
          destinationId: "",
          categoryId: "",
        })
      } else {
        setError(result.error || "Failed to create inventory item")
      }
    } catch (error) {
      console.error("Error creating inventory item:", error)
      setError("Failed to create inventory item")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category Selection */}
      <div className="space-y-2">
        <Label htmlFor="categoryId">Category *</Label>
        <Select 
          value={selectedCategoryId} 
          onValueChange={(value) => {
            setSelectedCategoryId(value)
            setFormData({ ...formData, categoryId: value, productId: "" }) // Reset product when category changes
          }}
        >
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

      {/* Product Selection (Conditional based on Category) */}
      <div className="space-y-2">
        <Label htmlFor="productId">Product *</Label>
        <Select 
          value={formData.productId} 
          onValueChange={(value) => setFormData({ ...formData, productId: value })}
          disabled={!selectedCategoryId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {filteredProducts.length === 0 ? (
              <div className="py-2 px-3 text-sm text-muted-foreground">No products found for this category</div>
            ) : (
              filteredProducts.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} ({product.uniqueCode})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      
      {/* Destination Selection (Now optional) */}
      <div className="space-y-2">
        <Label htmlFor="destinationId">Destination (Optional)</Label>
        <Select 
          value={formData.destinationId} 
          onValueChange={(value) => setFormData({ ...formData, destinationId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select destination" />
          </SelectTrigger>
          <SelectContent>
            {destinations.map((destination) => (
              <SelectItem key={destination.id} value={destination.id}>
                {destination.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select 
          value={formData.status} 
          onValueChange={(value) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="discarded">Discarded</SelectItem>
            <SelectItem value="missing">Missing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="yearOfPurchase">Year of Purchase</Label>
        <Input
          id="yearOfPurchase"
          type="number"
          value={formData.yearOfPurchase}
          onChange={(e) => setFormData({ ...formData, yearOfPurchase: parseInt(e.target.value) || new Date().getFullYear() })}
          min="1900"
          max={new Date().getFullYear() + 1}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isLoading || !formData.productId}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating Item...
          </>
        ) : (
          "Create Inventory Item"
        )}
      </Button>
    </form>
  )
}

function EditInventoryForm({
  item,
  products,
  destinations,
  categories,
  onSuccess,
  onCancel,
}: {
  item: ApiInventoryItem
  products: ApiProduct[]
  destinations: ApiDestination[]
  categories: ApiCategory[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    status: item.status,
    yearOfPurchase: item.yearOfPurchase,
    productId: item.productId,
    destinationId: item.destinationId || "null",
    categoryId: item.categoryId,
  })

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const apiService = ApiService.getInstance()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(item.categoryId)

  // Filter products based on the selected category for the edit form
  const filteredProducts = products.filter(
    (product) => product.categoryId === selectedCategoryId
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!formData.productId || !formData.categoryId) {
      setError("Please fill in all required fields")
      setIsLoading(false)
      return
    }

    try {
      const result = await apiService.updateInventoryItem(item.id, {
        status: formData.status,
        yearOfPurchase: formData.yearOfPurchase,
        productId: formData.productId,
        destinationId: formData.destinationId || "null",
        categoryId: formData.categoryId,
      })

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || "Failed to update inventory item")
      }
    } catch (error) {
      console.error("Error updating inventory item:", error)
      setError("Failed to update inventory item")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-categoryId">Category *</Label>
        <Select 
          value={selectedCategoryId} 
          onValueChange={(value) => {
            setSelectedCategoryId(value)
            setFormData({ ...formData, categoryId: value, productId: "" }) // Reset product when category changes
          }}
        >
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
        <Label htmlFor="edit-productId">Product *</Label>
        <Select 
          value={formData.productId} 
          onValueChange={(value) => setFormData({ ...formData, productId: value })}
          disabled={!selectedCategoryId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {filteredProducts.length === 0 ? (
              <div className="py-2 px-3 text-sm text-muted-foreground">No products found for this category</div>
            ) : (
              filteredProducts.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} ({product.uniqueCode})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-destinationId">Destination (Optional)</Label>
        <Select 
          value={formData.destinationId || ""}
          onValueChange={(value) => setFormData({ ...formData, destinationId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select destination" />
          </SelectTrigger>
          <SelectContent>
            {destinations.map((destination) => (
              <SelectItem key={destination.id} value={destination.id}>
                {destination.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Changed order: Year of Purchase is now before Status */}
      <div className="space-y-2">
        <Label htmlFor="edit-yearOfPurchase">Year of Purchase</Label>
        <Input
          id="edit-yearOfPurchase"
          type="number"
          value={formData.yearOfPurchase}
          onChange={(e) => setFormData({ ...formData, yearOfPurchase: parseInt(e.target.value) || new Date().getFullYear() })}
          min="1900"
          max={new Date().getFullYear() + 1}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-status">Status</Label>
        <Select 
          value={formData.status} 
          onValueChange={(value) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="discarded">Discarded</SelectItem>
            <SelectItem value="missing">Missing</SelectItem>
          </SelectContent>
        </Select>
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
            "Update Item"
          )}
        </Button>
      </div>
    </form>
  )
}