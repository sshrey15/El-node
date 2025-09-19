"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ProductService, type Destination, type InventoryItem } from "@/lib/products"
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
import { Plus, MapPin, Package, Trash2, Eye } from "lucide-react"

const STATUS_COLORS = {
  active: "bg-primary text-white border-primary",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  damaged: "bg-red-100 text-red-800 border-red-200",
  discarded: "bg-gray-100 text-gray-800 border-gray-200",
  missing: "bg-purple-100 text-purple-800 border-purple-200",
}

export function DestinationManagement() {
  const { canEdit } = useAuth()
  const [destinationStats, setDestinationStats] = useState<any[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)
  const productService = ProductService.getInstance()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setDestinationStats(productService.getDestinationStats())
    setDestinations(productService.getDestinations())
    setInventoryItems(productService.getInventoryItems())
  }

  const handleDeleteDestination = (destinationId: string) => {
    const result = productService.deleteDestination(destinationId)
    if (result.success) {
      loadData()
    } else {
      alert(result.error)
    }
  }

  const selectedDestinationData = selectedDestination
    ? destinationStats.find((d) => d.destination.id === selectedDestination)
    : null

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
                  loadData()
                  setIsAddDialogOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Destinations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {destinationStats.map((stat) => (
          <Card key={stat.destination.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{stat.destination.name}</CardTitle>
                </div>
                {canEdit() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDestination(stat.destination.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {stat.destination.description && <CardDescription>{stat.destination.description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Items</span>
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  {stat.totalItems}
                </Badge>
              </div>

              {stat.totalItems > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Status Breakdown</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(stat.statusCounts).map(([status, count]) => (
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
                onClick={() => setSelectedDestination(stat.destination.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Items
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {destinationStats.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No destinations created yet</p>
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
                <CardTitle>Items in {selectedDestinationData.destination.name}</CardTitle>
                <CardDescription>{selectedDestinationData.totalItems} items in this destination</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedDestination(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDestinationData.items.length === 0 ? (
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
                      {canEdit() && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDestinationData.items.map((item: InventoryItem) => (
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
                          <Badge variant="outline" className={STATUS_COLORS[item.status]}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        {canEdit() && (
                          <TableCell>
                            <DestinationUpdateDropdown
                              currentDestinationId={item.destinationId}
                              destinations={destinations}
                              onDestinationChange={(destinationId) => {
                                productService.updateInventoryItemDestination(item.id, destinationId)
                                loadData()
                              }}
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
  const productService = ProductService.getInstance()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!formData.name) {
      setError("Please enter a destination name")
      setIsLoading(false)
      return
    }

  const result = productService.addDestination(formData.name, formData.description)

    if (result.success) {
      onSuccess()
      setFormData({ name: "", description: "" })
    } else {
      setError(result.error || "Failed to add destination")
    }
    setIsLoading(false)
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
        {isLoading ? "Adding Destination..." : "Add Destination"}
      </Button>
    </form>
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