"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ProductService, type Category } from "@/lib/products"
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
import { Plus, Settings, Package, AlertCircle, Trash2 } from "lucide-react"
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
  const [categories, setCategories] = useState<Category[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const productService = ProductService.getInstance()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = () => {
    setCategories(productService.getCategories())
  }

  const getCategoryStats = (categoryId: string) => {
    const items = productService.getInventoryItems().filter((item) => item.category?.id === categoryId)
    const total = items.length
    const active = items.filter((item) => item.status === "active").length
    const maintenance = items.filter((item) => item.status === "maintenance").length
    const issues = items.filter((item) => item.status === "damaged" || item.status === "missing").length

    return { total, active, maintenance, issues }
  }

  const handleDeleteCategory = () => {
    if (!categoryToDelete) return

    const result = productService.deleteCategory(categoryToDelete.id)
    if (result.success) {
      loadCategories()
      setCategoryToDelete(null)
    } else {
      setDeleteError(result.error || "An unknown error occurred.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Category Management</h2>
          <p className="text-muted-foreground">Manage product categories and their short codes</p>
        </div>
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
      </div>

      {/* Category Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const stats = getCategoryStats(category.id)
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
                <CardDescription>Created {new Date(category.createdAt).toLocaleDateString()}</CardDescription>
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
              <p className="text-muted-foreground mb-4">No categories created yet</p>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Category
              </Button>
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
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => {
                    const stats = getCategoryStats(category.id)
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
                        <TableCell className="text-muted-foreground">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
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
  const productService = ProductService.getInstance()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!formData.name || !formData.code) {
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

    const result = productService.addCategory(formData.name, formData.code)

    if (result.success) {
      onSuccess()
      setFormData({ name: "", code: "" })
    } else {
      setError(result.error || "Failed to add category")
    }
    setIsLoading(false)
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
          placeholder="e.g., Office Furniture"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Short Code *</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="e.g., FUR"
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
        {isLoading ? "Adding Category..." : "Add Category"}
      </Button>
    </form>
  )
}