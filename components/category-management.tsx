"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ApiService, type ApiCategory } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Plus, Settings, Package, AlertCircle, Trash2, Edit, Loader2 } from "lucide-react"
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

export function CategoryManagement() {
  const { canEdit } = useAuth()
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ApiCategory | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<ApiCategory | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [error, setError] = useState("")
  const apiService = ApiService.getInstance()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setIsLoading(true)
    setError("")
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
      setIsLoading(false)
    }
  }

  const getCategoryStats = (category: ApiCategory) => {
    const products = category.products || []
    const total = products.length
    // Since we don't have inventory status in the API response, we'll show product count
    return { total, active: total, maintenance: 0, issues: 0 }
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    try {
      const result = await apiService.deleteCategory(categoryToDelete.id)
      if (result.success) {
        await loadCategories()
        setCategoryToDelete(null)
      } else {
        setDeleteError(result.error || "Failed to delete category")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      setDeleteError("Failed to delete category")
    }
  }

  const handleEditCategory = (category: ApiCategory) => {
    setEditingCategory(category)
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading categories...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Category Management</h2>
          <p className="text-muted-foreground">Manage product categories and their short codes</p>
        </div>
        {canEdit() && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>Create a new product category with a unique short code</DialogDescription>
              </DialogHeader>
              <AddCategoryForm
                onSuccess={() => {
                  loadCategories()
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

      {/* Category Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const stats = getCategoryStats(category)
          const healthPercentage = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 100

          return (
            <Card key={category.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <Badge variant="outline" className="font-mono">
                    {category.code}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">Total Products</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-chart-1">{stats.active}</div>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>

                {stats.total > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Health Score</span>
                      <span className="font-medium">{healthPercentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${healthPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {stats.issues > 0 && (
                  <div className="flex items-center space-x-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{stats.issues} products need attention</span>
                  </div>
                )}

                {stats.maintenance > 0 && (
                  <div className="flex items-center space-x-2 text-chart-4">
                    <Settings className="h-4 w-4" />
                    <span className="text-sm">{stats.maintenance} under maintenance</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>Complete list of product categories with usage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No categories found</p>
              {canEdit() && (
                <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Category
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Short Code</TableHead>
                    <TableHead>Total Products</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Maintenance</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => {
                    const stats = getCategoryStats(category)
                    const healthPercentage = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 100

                    return (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {category.code}
                          </Badge>
                        </TableCell>
                        <TableCell>{stats.total}</TableCell>
                        <TableCell>
                          <span className="text-chart-1 font-medium">{stats.active}</span>
                        </TableCell>
                        <TableCell>
                          {stats.maintenance > 0 ? (
                            <span className="text-chart-4 font-medium">{stats.maintenance}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {stats.issues > 0 ? (
                            <span className="text-destructive font-medium">{stats.issues}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-12 bg-muted rounded-full h-2">
                              <div className="bg-primary h-2 rounded-full" style={{ width: `${healthPercentage}%` }} />
                            </div>
                            <span className="text-sm font-medium">{healthPercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {canEdit() && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditCategory(category)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setDeleteError(null)
                                    setCategoryToDelete(category)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
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
        open={!!categoryToDelete}
        onOpenChange={() => {
          setCategoryToDelete(null)
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
                  <span className="font-bold"> {categoryToDelete?.name} </span>
                  category.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {!deleteError && (
              <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Category Dialog */}
      {editingCategory && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>Update category information</DialogDescription>
            </DialogHeader>
            <EditCategoryForm
              category={editingCategory}
              onSuccess={() => {
                loadCategories()
                setIsEditDialogOpen(false)
                setEditingCategory(null)
              }}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setEditingCategory(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Category Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Category Guidelines</CardTitle>
          <CardDescription>Best practices for creating and managing categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Short Code Rules</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use 3-5 uppercase letters</li>
                <li>• Make it memorable and descriptive</li>
                <li>• Avoid special characters or numbers</li>
                <li>• Examples: FUR (Furniture), ELE (Electronics)</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Category Names</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use clear, descriptive names</li>
                <li>• Keep them concise but specific</li>
                <li>• Consider future product additions</li>
                <li>• Group similar items logically</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AddCategoryForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const apiService = ApiService.getInstance()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!formData.name.trim() || !formData.code.trim()) {
      setError("Please fill in all required fields")
      setIsLoading(false)
      return
    }

    if (formData.code.length < 2 || formData.code.length > 5) {
      setError("Short code must be 2-5 characters long")
      setIsLoading(false)
      return
    }

    if (!/^[A-Z]+$/.test(formData.code)) {
      setError("Short code must contain only uppercase letters")
      setIsLoading(false)
      return
    }

    try {
      const result = await apiService.createCategory({
        name: formData.name.trim(),
        code: formData.code.trim(),
      })

      if (result.success) {
        onSuccess()
        setFormData({ name: "", code: "" })
      } else {
        setError(result.error || "Failed to create category")
      }
    } catch (error) {
      console.error("Error creating category:", error)
      setError("Failed to create category")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (value: string) => {
    // Auto-convert to uppercase and limit length
    const upperValue = value
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 5)
    setFormData({ ...formData, code: upperValue })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Category Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Electronics"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Short Code *</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="e.g., ELEC"
          maxLength={5}
          className="font-mono"
          required
        />
        <p className="text-xs text-muted-foreground">
          2-5 uppercase letters only. This will be used in product codes like EHS-{formData.code || "XXX"}-...
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating Category...
          </>
        ) : (
          "Add Category"
        )}
      </Button>
    </form>
  )
}

function EditCategoryForm({
  category,
  onSuccess,
  onCancel,
}: {
  category: ApiCategory
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: category.name,
    code: category.code,
  })

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const apiService = ApiService.getInstance()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!formData.name.trim() || !formData.code.trim()) {
      setError("Please fill in all required fields")
      setIsLoading(false)
      return
    }

    if (formData.code.length < 2 || formData.code.length > 5) {
      setError("Short code must be 2-5 characters long")
      setIsLoading(false)
      return
    }

    if (!/^[A-Z]+$/.test(formData.code)) {
      setError("Short code must contain only uppercase letters")
      setIsLoading(false)
      return
    }

    try {
      const result = await apiService.updateCategory(category.id, {
        name: formData.name.trim(),
        code: formData.code.trim(),
      })

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || "Failed to update category")
      }
    } catch (error) {
      console.error("Error updating category:", error)
      setError("Failed to update category")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (value: string) => {
    // Auto-convert to uppercase and limit length
    const upperValue = value
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 5)
    setFormData({ ...formData, code: upperValue })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Category Name *</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Consumer Electronics"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-code">Short Code *</Label>
        <Input
          id="edit-code"
          value={formData.code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="e.g., ELEC-01"
          maxLength={5}
          className="font-mono"
          required
        />
        <p className="text-xs text-muted-foreground">
          2-5 uppercase letters only. This will be used in product codes like EHS-{formData.code || "XXX"}-...
        </p>
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
            "Update Category"
          )}
        </Button>
      </div>
    </form>
  )
}