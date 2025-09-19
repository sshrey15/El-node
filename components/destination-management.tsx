"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ApiService, type ApiDestination } from "@/lib/api"
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
import { Plus, MapPin, Package, Trash2, Eye, Edit, Loader2 } from "lucide-react"

const STATUS_COLORS = {
  active: "bg-primary text-white border-primary",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  damaged: "bg-red-100 text-red-800 border-red-200",
  discarded: "bg-gray-100 text-gray-800 border-gray-200",
  missing: "bg-purple-100 text-purple-800 border-purple-200",
}

export function DestinationManagement() {
  const { canEdit } = useAuth()
  const [destinations, setDestinations] = useState<ApiDestination[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)
  const [editingDestination, setEditingDestination] = useState<ApiDestination | null>(null)
  const [error, setError] = useState("")
  const apiService = ApiService.getInstance()

  useEffect(() => {
    loadDestinations()
  }, [])

  const loadDestinations = async () => {
    setIsLoading(true)
    setError("")
    try {
      const result = await apiService.getDestinations()
      if (result.success && result.data) {
        setDestinations(result.data)
      } else {
        setError(result.error || "Failed to load destinations")
      }
    } catch (error) {
      console.error("Error loading destinations:", error)
      setError("Failed to load destinations")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDestination = async (destinationId: string) => {
    if (!confirm("Are you sure you want to delete this destination?")) {
      return
    }

    try {
      const result = await apiService.deleteDestination(destinationId)
      if (result.success) {
        await loadDestinations()
      } else {
        setError(result.error || "Failed to delete destination")
      }
    } catch (error) {
      console.error("Error deleting destination:", error)
      setError("Failed to delete destination")
    }
  }

  const handleEditDestination = (destination: ApiDestination) => {
    setEditingDestination(destination)
    setIsEditDialogOpen(true)
  }

  const selectedDestinationData = selectedDestination
    ? destinations.find((d) => d.id === selectedDestination)
    : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading destinations...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Destination Management</h2>
          <p className="text-muted-foreground">Manage locations and track products in each destination</p>
        </div>
        {canEdit() && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Destination
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Destination</DialogTitle>
                <DialogDescription>Create a new location for your products</DialogDescription>
              </DialogHeader>
              <AddDestinationForm
                onSuccess={() => {
                  loadDestinations()
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

      {/* Destinations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {destinations.map((destination) => (
          <Card key={destination.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{destination.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  {canEdit() && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditDestination(destination)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDestination(destination.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {destination.description && <CardDescription>{destination.description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Items</span>
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  {destination.inventoryItems.length}
                </Badge>
              </div>

              {destination.inventoryItems.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Status Breakdown</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(
                      destination.inventoryItems.reduce((acc, item) => {
                        acc[item.status] = (acc[item.status] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                    ).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="capitalize">{status}</span>
                        <Badge
                          variant="outline"
                          className={`${STATUS_COLORS[status as keyof typeof STATUS_COLORS]} text-xs`}
                        >
                          {String(count)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                onClick={() => setSelectedDestination(destination.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Items
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {destinations.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No destinations found</p>
            {canEdit() && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Destination
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected Destination Products */}
      {selectedDestination && selectedDestinationData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Items in {selectedDestinationData.name}</CardTitle>
                <CardDescription>{selectedDestinationData.inventoryItems.length} items in this destination</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedDestination(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDestinationData.inventoryItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No items in this destination</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unique Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Year of Purchase</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDestinationData.inventoryItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-medium">{item.uniqueCode}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product.name}</div>
                            {item.product.description && (
                              <div className="text-sm text-muted-foreground">{item.product.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_COLORS[item.status as keyof typeof STATUS_COLORS]}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.yearOfPurchase}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Destination Dialog */}
      {editingDestination && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Destination</DialogTitle>
              <DialogDescription>Update destination information</DialogDescription>
            </DialogHeader>
            <EditDestinationForm
              destination={editingDestination}
              onSuccess={() => {
                loadDestinations()
                setIsEditDialogOpen(false)
                setEditingDestination(null)
              }}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setEditingDestination(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function AddDestinationForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const apiService = ApiService.getInstance()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!formData.name.trim()) {
      setError("Please enter a destination name")
      setIsLoading(false)
      return
    }

    try {
      const result = await apiService.createDestination({
        name: formData.name.trim(),
        description: formData.description.trim(),
      })

      if (result.success) {
        onSuccess()
        setFormData({ name: "", description: "" })
      } else {
        setError(result.error || "Failed to create destination")
      }
    } catch (error) {
      console.error("Error creating destination:", error)
      setError("Failed to create destination")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Destination Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Room-1, Storage, Conference Room"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this location"
          rows={3}
        />
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
            Creating Destination...
          </>
        ) : (
          "Add Destination"
        )}
      </Button>
    </form>
  )
}

function EditDestinationForm({
  destination,
  onSuccess,
  onCancel,
}: {
  destination: ApiDestination
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: destination.name,
    description: destination.description,
  })

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const apiService = ApiService.getInstance()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!formData.name.trim()) {
      setError("Please enter a destination name")
      setIsLoading(false)
      return
    }

    try {
      const result = await apiService.updateDestination(destination.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
      })

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || "Failed to update destination")
      }
    } catch (error) {
      console.error("Error updating destination:", error)
      setError("Failed to update destination")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Destination Name *</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Room-1, Storage, Conference Room"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Description (Optional)</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this location"
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
            "Update Destination"
          )}
        </Button>
      </div>
    </form>
  )
}