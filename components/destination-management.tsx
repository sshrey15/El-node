"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ApiService, type ApiDestination, type ApiCategory, type ApiProduct, type UpdateInventoryItemRequest, type ApiInventoryItem } from "@/lib/api"
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
  DialogClose,
} from "@/components/ui/dialog"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, MapPin, Package, Trash2, Eye, Edit, Loader2, Move, X } from "lucide-react"

// --- TYPE DEFINITIONS ---
interface ExtendedApiDestination extends ApiDestination {
  inventoryItems: ApiInventoryItem[]
}

const STATUS_COLORS = {
  active: "bg-primary text-white border-primary",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  damaged: "bg-red-100 text-red-800 border-red-200",
  discarded: "bg-gray-100 text-gray-800 border-gray-200",
  missing: "bg-purple-100 text-purple-800 border-purple-200",
}

export function DestinationManagement() {
  const { canEdit } = useAuth()
  const [destinations, setDestinations] = useState<ExtendedApiDestination[]>([])
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [allInventoryItems, setAllInventoryItems] = useState<ApiInventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // State for dialogs
  const [isAddDestinationDialogOpen, setIsAddDestinationDialogOpen] = useState(false)
  const [isEditDestinationDialogOpen, setIsEditDestinationDialogOpen] = useState(false)
  const [editingDestination, setEditingDestination] = useState<ExtendedApiDestination | null>(null)

  // State for viewing and managing items within a destination
  const [viewingDestination, setViewingDestination] = useState<ExtendedApiDestination | null>(null)
  const [itemToMove, setItemToMove] = useState<ApiInventoryItem | null>(null)
  const [itemToRemove, setItemToRemove] = useState<ApiInventoryItem | null>(null)
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)

  const apiService = ApiService.getInstance()

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setIsLoading(true)
    setError("")
    try {
      const [destResult, catResult, prodResult, inventoryResult] = await Promise.all([
        apiService.getDestinations(),
        apiService.getCategories(),
        apiService.getProducts(),
        apiService.getInventoryItems(),
      ])

      if (destResult.success && destResult.data) {
        setDestinations(destResult.data as ExtendedApiDestination[])
      } else {
        setError(destResult.error || "Failed to load destinations")
      }
      if (catResult.success && catResult.data) setCategories(catResult.data)
      if (prodResult.success && prodResult.data) setProducts(prodResult.data)
      if (inventoryResult.success && inventoryResult.data) setAllInventoryItems(inventoryResult.data)
    } catch (error) {
      console.error("Error loading data:", error)
      setError("An unexpected error occurred while loading data.")
    } finally {
      setIsLoading(false)
    }
  }
  
  const refreshDestinations = async () => {
      const [destResult, inventoryResult] = await Promise.all([
        apiService.getDestinations(),
        apiService.getInventoryItems(),
      ])
      
      if (destResult.success && destResult.data) {
          const allDestinations = destResult.data as ExtendedApiDestination[]
          setDestinations(allDestinations)
          if (viewingDestination) {
              const updatedView = allDestinations.find(d => d.id === viewingDestination.id)
              setViewingDestination(updatedView || null)
          }
      } else {
          setError(destResult.error || "Failed to refresh destinations")
      }
      
      if (inventoryResult.success && inventoryResult.data) {
          setAllInventoryItems(inventoryResult.data)
      }
  }

  const handleDeleteDestination = async (destinationId: string) => {
    if (!confirm("Are you sure? This will delete the destination and may affect assigned inventory items.")) return
    try {
      const result = await apiService.deleteDestination(destinationId)
      if (result.success) {
        await refreshDestinations()
      } else {
        setError(result.error || "Failed to delete destination.")
      }
    } catch (error) {
      setError("An unexpected error occurred while deleting the destination.")
    }
  }

  const handleEditDestination = (destination: ExtendedApiDestination) => {
    setEditingDestination(destination)
    setIsEditDestinationDialogOpen(true)
  }

  const handleRemoveItem = async () => {
    if (!itemToRemove || !viewingDestination) return
    
    try {
        const result = await apiService.deleteInventoryItem(itemToRemove.id)
        if (result.success) {
            console.log(`AUDIT: Item ${itemToRemove.product.name} removed from ${viewingDestination.name}`)
            setItemToRemove(null)
            await refreshDestinations()
        } else {
            setError(result.error || "Failed to remove item.")
            setItemToRemove(null);
        }
    } catch (err) {
        setError("An unexpected error occurred while removing the item.")
        setItemToRemove(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2"><Loader2 className="h-6 w-6 animate-spin" /><span>Loading destinations...</span></div>
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
          <Dialog open={isAddDestinationDialogOpen} onOpenChange={setIsAddDestinationDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Destination</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Destination</DialogTitle>
                <DialogDescription>Create a new location for your products</DialogDescription>
              </DialogHeader>
              <AddDestinationForm onSuccess={() => { refreshDestinations(); setIsAddDestinationDialogOpen(false) }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {destinations.map((destination) => (
          <Card key={destination.id} className="hover:shadow-md transition-shadow flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2"><MapPin className="h-5 w-5 text-primary" /><CardTitle className="text-lg">{destination.name}</CardTitle></div>
                {canEdit() && (
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700" onClick={() => handleEditDestination(destination)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteDestination(destination.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
              {destination.description && <CardDescription>{destination.description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2"><Package className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Total Items</span></div>
                  <Badge variant="secondary" className="text-lg font-bold">{destination.inventoryItems.length}</Badge>
                </div>
                {destination.inventoryItems.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <div className="text-sm font-medium text-muted-foreground">Status Breakdown</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(destination.inventoryItems.reduce((acc, item) => { acc[item.status] = (acc[item.status] || 0) + 1; return acc }, {} as Record<string, number>))
                        .map(([status, count]) => (
                          <div key={status} className="flex items-center justify-between">
                            <span className="capitalize">{status}</span>
                            <Badge variant="outline" className={`${STATUS_COLORS[status as keyof typeof STATUS_COLORS]} text-xs`}>{String(count)}</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => setViewingDestination(destination)}><Eye className="h-4 w-4 mr-2" />View & Manage Items</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {destinations.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No destinations found</p>
            {canEdit() && <Button onClick={() => setIsAddDestinationDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Create Your First Destination</Button>}
          </CardContent>
        </Card>
      )}

      {/* View & Manage Items Dialog */}
      <Dialog open={!!viewingDestination} onOpenChange={(isOpen) => !isOpen && setViewingDestination(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          {viewingDestination && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl">Items in {viewingDestination.name}</DialogTitle>
                    <DialogDescription>{viewingDestination.inventoryItems.length} items found in this location.</DialogDescription>
                  </div>
                  <DialogClose asChild><Button variant="ghost" size="icon" className="rounded-full"><X className="h-4 w-4"/></Button></DialogClose>
                </div>
                <div className="flex items-center space-x-2 pt-4">
                  {canEdit() && <Button size="sm" onClick={() => setIsAddItemDialogOpen(true)}><Plus className="h-4 w-4 mr-2"/>Add Item</Button>}
                </div>
              </DialogHeader>
              <div className="flex-grow overflow-y-auto">
                {viewingDestination.inventoryItems.length === 0 ? (
                  <div className="text-center py-16"><Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No items in this destination</p></div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Item Name</TableHead><TableHead>Status</TableHead><TableHead>Year</TableHead>{canEdit() && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader>
                    <TableBody>
                      {viewingDestination.inventoryItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono font-medium">{item.uniqueCode}</TableCell>
                          <TableCell><div className="font-medium">{item.product.name}</div></TableCell>
                          <TableCell><Badge variant="outline" className={STATUS_COLORS[item.status as keyof typeof STATUS_COLORS]}>{item.status}</Badge></TableCell>
                          <TableCell>{item.yearOfPurchase}</TableCell>
                           {canEdit() && (
                             <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setItemToMove(item)}><Move className="h-4 w-4 text-blue-600"/></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setItemToRemove(item)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                             </TableCell>
                           )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {viewingDestination && (
        <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Item to {viewingDestination.name}</DialogTitle>
                    <DialogDescription>Fill in the details for the new inventory item.</DialogDescription>
                </DialogHeader>
                <AddInventoryItemForm 
                    destinationId={viewingDestination.id}
                    categories={categories}
                    products={products}
                    allInventoryItems={allInventoryItems}
                    onSuccess={() => { setIsAddItemDialogOpen(false); refreshDestinations() }}
                    onCancel={() => setIsAddItemDialogOpen(false)}
                />
            </DialogContent>
        </Dialog>
      )}

      {itemToMove && viewingDestination && (
         <Dialog open={!!itemToMove} onOpenChange={() => setItemToMove(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Move Item</DialogTitle>
                    <DialogDescription>Move "{itemToMove.product.name}" to a new destination.</DialogDescription>
                </DialogHeader>
                <MoveItemForm
                    item={itemToMove}
                    currentDestination={viewingDestination}
                    destinations={destinations.filter(d => d.id !== viewingDestination?.id)}
                    onSuccess={() => { setItemToMove(null); refreshDestinations() }}
                    onCancel={() => setItemToMove(null)}
                />
            </DialogContent>
         </Dialog>
      )}

      <AlertDialog open={!!itemToRemove} onOpenChange={() => setItemToRemove(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This will remove the item "{itemToRemove?.product.name}" from the inventory. This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemoveItem} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editingDestination && (
        <Dialog open={isEditDestinationDialogOpen} onOpenChange={setIsEditDestinationDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Destination</DialogTitle>
              <DialogDescription>Update destination information</DialogDescription>
            </DialogHeader>
            <EditDestinationForm
              destination={editingDestination}
              onSuccess={() => { refreshDestinations(); setIsEditDestinationDialogOpen(false); setEditingDestination(null) }}
              onCancel={() => { setIsEditDestinationDialogOpen(false); setEditingDestination(null) }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function AddDestinationForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const apiService = ApiService.getInstance()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) { setError("Please enter a destination name"); return }
    setIsLoading(true)
    try {
      const result = await apiService.createDestination({ name: formData.name.trim(), description: formData.description.trim() })
      if (result.success) onSuccess()
      else setError(result.error || "Failed to create destination")
    } catch (e) { setError("An unexpected error occurred.") } finally { setIsLoading(false) }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2"><Label htmlFor="name">Destination Name *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
      <div className="space-y-2"><Label htmlFor="description">Description (Optional)</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : "Add Destination"}</Button>
    </form>
  )
}

function EditDestinationForm({ destination, onSuccess, onCancel }: { destination: ApiDestination; onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({ name: destination.name, description: destination.description || "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const apiService = ApiService.getInstance()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) { setError("Please enter a destination name"); return }
    setIsLoading(true)
    try {
      const result = await apiService.updateDestination(destination.id, { name: formData.name.trim(), description: formData.description.trim() })
      if (result.success) onSuccess()
      else setError(result.error || "Failed to update destination")
    } catch (e) { setError("An unexpected error occurred.") } finally { setIsLoading(false) }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2"><Label htmlFor="edit-name">Destination Name *</Label><Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
      <div className="space-y-2"><Label htmlFor="edit-description">Description (Optional)</Label><Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="flex space-x-2"><Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button><Button type="submit" className="flex-1" disabled={isLoading}>{isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</> : "Update Destination"}</Button></div>
    </form>
  )
}

function AddInventoryItemForm({ 
    destinationId, 
    categories, 
    products, 
    allInventoryItems, 
    onSuccess, 
    onCancel 
}: { 
    destinationId: string; 
    categories: ApiCategory[]; 
    products: ApiProduct[]; 
    allInventoryItems: ApiInventoryItem[];
    onSuccess: () => void; 
    onCancel: () => void; 
}) {
    const [formData, setFormData] = useState({
        categoryId: "",
        productId: "",
        uniqueCode: "",
        yearOfPurchase: new Date().getFullYear().toString(),
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const apiService = ApiService.getInstance();

    // Get available unique codes for selected product
    const getAvailableUniqueCodes = () => {
        if (!formData.productId) return [];
        
        const selectedProduct = products.find(p => p.id === formData.productId);
        if (!selectedProduct) return [];
        
        // Get the product's unique code (like "OCH", "NEW", "TAB", etc.)
        const productCode = selectedProduct.uniqueCode;
        
        // Find ALL inventory items that match this product code pattern
        // This will show existing OCH-001, OCH-002, etc. for any OCH product
        const matchingCodeItems = allInventoryItems.filter(item => {
            // Check if the item's unique code contains the product code
            return item.uniqueCode.includes(`-${productCode}-`);
        });
        
        // Only show existing codes that can be moved (not assigned to current destination)
        const availableCodes = matchingCodeItems
            .filter(item => !item.destinationId || item.destinationId !== destinationId)
            .map(item => item.uniqueCode);
        
        // Remove duplicates and sort
        return [...new Set(availableCodes)].sort((a, b) => {
            // Sort by the number at the end
            const numA = parseInt(a.split('-').pop() || '0');
            const numB = parseInt(b.split('-').pop() || '0');
            return numA - numB;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (!formData.categoryId || !formData.productId || !formData.uniqueCode) {
            setError("Please fill in all required fields.");
            return;
        }
        
        setIsLoading(true);
        try {
            // Find the existing inventory item with this unique code
            const existingItem = allInventoryItems.find(item => item.uniqueCode === formData.uniqueCode);
            
            if (existingItem) {
                // Update existing item to move it to this destination
                // Keep the original product and category of the existing item
                const result = await apiService.updateInventoryItem(existingItem.id, {
                    status: "active", // Default to active
                    yearOfPurchase: parseInt(formData.yearOfPurchase),
                    productId: existingItem.productId, // Keep original product
                    categoryId: existingItem.categoryId, // Keep original category
                    destinationId: destinationId,
                });
                
                if (result.success) {
                    console.log(`AUDIT: Item ${formData.uniqueCode} moved to destination ${destinationId}`);
                    onSuccess();
                } else {
                    setError(result.error || "Failed to move item to destination.");
                }
            } else {
                // Create new inventory item with the selected unique code
                const result = await apiService.createInventoryItem({
                    uniqueCode: formData.uniqueCode,
                    status: "active",
                    yearOfPurchase: parseInt(formData.yearOfPurchase),
                    productId: formData.productId,
                    categoryId: formData.categoryId,
                    destinationId: destinationId,
                });
                
                if (result.success) {
                    console.log(`AUDIT: New item ${formData.uniqueCode} created in destination ${destinationId}`);
                    onSuccess();
                } else {
                    setError(result.error || "Failed to create new inventory item.");
                }
            }
        } catch(err) { 
            setError("An unexpected error occurred.") 
        } finally { 
            setIsLoading(false) 
        }
    };

    const filteredProducts = products.filter(p => p.categoryId === formData.categoryId);
    const availableUniqueCodes = getAvailableUniqueCodes();

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {/* Category Selection */}
            <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({
                        ...formData, 
                        categoryId: value, 
                        productId: "", 
                        uniqueCode: ""
                    })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Category"/>
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Product Selection */}
            <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Select 
                    value={formData.productId}
                    onValueChange={(value) => setFormData({
                        ...formData, 
                        productId: value, 
                        uniqueCode: ""
                    })}
                    disabled={!formData.categoryId}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Product"/>
                    </SelectTrigger>
                    <SelectContent>
                        {filteredProducts.length === 0 ? (
                            <div className="py-2 px-3 text-sm text-muted-foreground">
                                No products found for this category
                            </div>
                        ) : (
                            filteredProducts.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{p.name}</span>
                                        <span className="text-xs text-muted-foreground">Code: {p.uniqueCode}</span>
                                    </div>
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Unique Code Selection */}
            <div className="space-y-2">
                <Label htmlFor="uniqueCode">Available Unique Codes *</Label>
                <Select 
                    value={formData.uniqueCode}
                    onValueChange={(value) => setFormData({...formData, uniqueCode: value})}
                    disabled={!formData.productId}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Unique Code"/>
                    </SelectTrigger>
                    <SelectContent>
                        {availableUniqueCodes.length === 0 ? (
                            <div className="py-2 px-3 text-sm text-muted-foreground">
                                {formData.productId ? "No available codes for this product" : "Select a product first"}
                            </div>
                        ) : (
                            availableUniqueCodes.map(code => {
                                const existingItem = allInventoryItems.find(item => item.uniqueCode === code);
                                const isExisting = !!existingItem;
                                return (
                                    <SelectItem key={code} value={code}>
                                        <div className="flex flex-col w-full">
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-sm">{code}</span>
                                                {isExisting && (
                                                    <span className="text-xs text-blue-600 ml-2">(Move)</span>
                                                )}
                                            </div>
                                            {isExisting && existingItem && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    From: {existingItem.product.name} • {existingItem.destinationId ? "Other location" : "Unassigned"}
                                                </div>
                                            )}
                                        </div>
                                    </SelectItem>
                                );
                            })
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Year of Purchase */}
            <div className="space-y-2">
                <Label htmlFor="year">Year of Purchase</Label>
                <Input 
                    id="year"
                    type="number" 
                    placeholder="Year of Purchase" 
                    value={formData.yearOfPurchase} 
                    onChange={e => setFormData({...formData, yearOfPurchase: e.target.value})}
                    min="1900"
                    max={new Date().getFullYear() + 1}
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
                <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={isLoading || !formData.uniqueCode}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                            Adding...
                        </>
                    ) : (
                        "Add Item"
                    )}
                </Button>
            </div>
        </form>
    );
}

function MoveItemForm({ item, currentDestination, destinations, onSuccess, onCancel }: { item: ApiInventoryItem; currentDestination: ExtendedApiDestination, destinations: ApiDestination[], onSuccess: () => void; onCancel: () => void }) {
    const [newDestinationId, setNewDestinationId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const apiService = ApiService.getInstance();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDestinationId) { setError("Please select a new destination."); return; }
        setIsLoading(true);
        setError("");
        
        const updatePayload: UpdateInventoryItemRequest = {
            status: item.status,
            yearOfPurchase: item.yearOfPurchase,
            productId: item.productId,
            categoryId: item.categoryId,
            destinationId: newDestinationId,
        };

        try {
            const result = await apiService.updateInventoryItem(item.id, updatePayload);
            if (result.success) {
                const newDestName = destinations.find(d => d.id === newDestinationId)?.name || 'another destination';
                console.log(`AUDIT: Item ${item.product.name} moved from ${currentDestination.name} to ${newDestName}`);
                onSuccess();
            } else {
                setError(result.error || "Failed to move item.");
            }
        } catch(err) { setError("An unexpected error occurred.") }
        finally { setIsLoading(false) }
    }

    return (
         <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <Select onValueChange={setNewDestinationId}>
                <SelectTrigger><SelectValue placeholder="Select new destination"/></SelectTrigger>
                <SelectContent>{destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
             {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
             <div className="flex space-x-2"><Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button><Button type="submit" className="flex-1" disabled={isLoading || !newDestinationId}>{isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Moving...</> : "Move Item"}</Button></div>
         </form>
    );
}