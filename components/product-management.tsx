// src/components/ProductManagement.tsx

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
import { Plus, Search, Package, Upload, Trash2, Edit, Loader2, Eye, X, Image as ImageIcon } from "lucide-react"
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
    const { canEdit } = useAuth()
    const [products, setProducts] = useState<ApiProduct[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null)
    const [viewingProduct, setViewingProduct] = useState<ApiProduct | null>(null)
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

    const handleViewProduct = (product: ApiProduct) => {
        setViewingProduct(product)
        setIsViewDialogOpen(true)
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
                    <p className="text-muted-foreground">Manage your product catalog</p>
                </div>
                {canEdit() && (
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search products, codes, or categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

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
                                {searchTerm ? "No products match your search" : "No products found"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Inventory</TableHead>
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
                                            <TableCell className="font-mono text-sm">{product.uniqueCode}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{product.category.name}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{product.inventoryItems.length} items</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end space-x-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleViewProduct(product)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {canEdit() && (
                                                        <>
                                                            <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => setProductToDelete(product)}>
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

            <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the <strong>{productToDelete?.name}</strong> product. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {viewingProduct && (
                <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Product Details</DialogTitle>
                        </DialogHeader>
                        <ViewProductDetails product={viewingProduct} />
                    </DialogContent>
                </Dialog>
            )}

            {editingProduct && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Product</DialogTitle>
                            <DialogDescription>Update product information</DialogDescription>
                        </DialogHeader>
                        <EditProductForm
                            product={editingProduct}
                            onSuccess={() => {
                                loadProducts()
                                setIsEditDialogOpen(false)
                            }}
                            onCancel={() => setIsEditDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}

// --- Helper Components ---

function ImageUploadComponent({
    onImageChange,
    initialImage,
    disabled = false
}: {
    onImageChange: (file: File | null) => void;
    initialImage?: string | null;
    disabled?: boolean;
}) {
    const [preview, setPreview] = useState<string | null>(initialImage || null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (preview && preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }

        const newPreview = URL.createObjectURL(file);
        setPreview(newPreview);
        onImageChange(file);
    };

    const handleRemoveImage = () => {
        if (preview && preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        onImageChange(null);
    };
    
    useEffect(() => {
        setPreview(initialImage || null);
    }, [initialImage]);

    return (
        <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="flex flex-col items-center space-y-3">
                {preview ? (
                    <div className="relative">
                        <div className="w-32 h-32 rounded-lg overflow-hidden border">
                            <img src={preview} alt="Product preview" className="w-full h-full object-cover" />
                        </div>
                        {!disabled && (
                            <button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                )}

                {!disabled && (
                    <div>
                        <label htmlFor="image-upload" className="cursor-pointer inline-flex items-center px-3 py-2 text-sm border rounded-md hover:bg-accent">
                            <Upload className="h-4 w-4 mr-2" />
                            {preview ? "Change Image" : "Upload Image"}
                        </label>
                        <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={disabled} />
                    </div>
                )}
            </div>
        </div>
    );
}

function AddProductForm({ onSuccess }: { onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        name: "",
        uniqueCode: "",
        description: "",
        categoryId: "",
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const apiService = ApiService.getInstance();

    useEffect(() => {
        const loadCategories = async () => {
            setCategoriesLoading(true);
            const result = await apiService.getCategories();
            if (result.success && result.data) {
                setCategories(result.data);
            }
            setCategoriesLoading(false);
        };
        loadCategories();
    }, [apiService]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.name.trim() || !formData.uniqueCode.trim() || !formData.categoryId || !imageFile) {
            setError("All fields and an image are required.");
            return;
        }
        if (!user) {
            setError("Authentication error.");
            return;
        }

        setIsLoading(true);

        const data = new FormData();
        data.append("name", formData.name.trim());
        data.append("uniqueCode", formData.uniqueCode.trim().toUpperCase());
        data.append("description", formData.description.trim());
        data.append("categoryId", formData.categoryId);
        data.append("userId", user.id);
        data.append("image", imageFile);

        try {
            const result = await apiService.createProduct(data);
            if (result.success) {
                onSuccess();
            } else {
                setError(result.error || "Failed to create product.");
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name"  placeholder="e.g., DELL XPS" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="uniqueCode">Product Code *</Label>
                <Input id="uniqueCode" placeholder="e.g., DEL" value={formData.uniqueCode} onChange={(e) => setFormData({ ...formData, uniqueCode: e.target.value.toUpperCase() })} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <Select value={formData.categoryId}  onValueChange={(value) => setFormData({ ...formData, categoryId: value })} required>
                    <SelectTrigger disabled={categoriesLoading}>
                        <SelectValue placeholder={categoriesLoading ? "Loading..." : "Select a category"} />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <ImageUploadComponent onImageChange={setImageFile}  disabled={isLoading} />
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description"      placeholder="Detailed description of the product" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Product"}
            </Button>
        </form>
    );
}

function EditProductForm({ product, onSuccess, onCancel }: { product: ApiProduct; onSuccess: () => void; onCancel: () => void }) {
    const [formData, setFormData] = useState({
        name: product.name || "",
        description: product.description || "",
        categoryId: product.categoryId || "",
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [initialImageUrl, setInitialImageUrl] = useState<string | null>(product.image || null);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const apiService = ApiService.getInstance();

     useEffect(() => {
        const loadCategories = async () => {
            setCategoriesLoading(true);
            const result = await apiService.getCategories();
            if (result.success && result.data) {
                setCategories(result.data);
            }
            setCategoriesLoading(false);
        };
        loadCategories();
    }, [apiService]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.name.trim() || !formData.categoryId) {
            setError("Product name and category are required.");
            return;
        }

        setIsLoading(true);
        
        const data = new FormData();
        data.append("name", formData.name.trim());
        data.append("description", formData.description.trim());
        data.append("categoryId", formData.categoryId);
        if (imageFile) {
            data.append("image", imageFile);
        } else if (initialImageUrl === null) {
            data.append("image", ""); 
        }

        try {
            const result = await apiService.updateProduct(product.id, data);
            if (result.success) {
                onSuccess();
            } else {
                setError(result.error || "Failed to update product.");
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="edit-name">Product Name *</Label>
                <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit-categoryId">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })} required>
                    <SelectTrigger disabled={categoriesLoading}>
                        <SelectValue placeholder={categoriesLoading ? "Loading..." : "Select a category"} />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <ImageUploadComponent
                onImageChange={(file) => {
                    setImageFile(file);
                    if (file === null) {
                        setInitialImageUrl(null);
                    }
                }}
                initialImage={initialImageUrl}
                disabled={isLoading}
            />
            <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Product"}
                </Button>
            </div>
        </form>
    );
}

function ViewProductDetails({ product }: { product: ApiProduct }) {
    return (
        <div className="space-y-4">
            <div className="flex items-start space-x-4">
                <div className="w-24 h-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
                    {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                           <Package className="h-10 w-10 text-muted-foreground" />
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <h3 className="text-2xl font-bold">{product.name}</h3>
                    <Badge variant="outline" className="font-mono">{product.uniqueCode}</Badge>
                    <Badge>{product.category.name}</Badge>
                </div>
            </div>

            <div>
                <h4 className="font-semibold">Description</h4>
                <p className="text-muted-foreground">{product.description || "No description provided."}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h4 className="font-semibold">Inventory Count</h4>
                    <p className="text-muted-foreground">{product.inventoryItems.length} items</p>
                </div>
                 <div>
                    <h4 className="font-semibold">Created On</h4>
                    <p className="text-muted-foreground">{new Date(product.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
}