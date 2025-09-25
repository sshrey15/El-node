"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Package, Settings, LogOut, BarChart3, MapPin, TrendingUp, AlertTriangle, Calendar, Activity, Loader2, FileDown, FileText, Search } from "lucide-react"
import { ProductManagement } from "@/components/product-management"
import { InventoryManagement } from "@/components/inventory-management"
import { CategoryManagement } from "@/components/category-management"
import { DestinationManagement } from "@/components/destination-management"
import { ApiService, type ApiInventoryItem, type ApiProduct, type ApiDestination, type ApiCategory, type ApiAuditLog } from "@/lib/api"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
// Imports for PDF Export Dialog
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"


export function Dashboard() {
  const { user, logout, canEdit } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "destinations", label: "Destinations", icon: MapPin },
    { id: "inventory", label: "Inventory", icon: Package },
    ...(canEdit() ? [{ id: "categories", label: "Categories", icon: Settings }] : []),
    { id: "products", label: "Products", icon: Package },
    { id: "audit-logs", label: "Audit Logs", icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Image
              src="/ELIMS.png"
              alt="ELIMS Logo"
              width={100}
              height={20}
              className="h-8 w-auto"
            />
            
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Welcome, </span>
              <span className="font-medium">{user?.username}</span>
              <Badge variant={user?.role === "admin" ? "default" : "secondary"} className="ml-2">
                {user?.role}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-sidebar min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-primary/10"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === "dashboard" && <DashboardOverview />}
          {activeTab === "products" && <ProductManagement />}
          {activeTab === "inventory" && <InventoryManagement />}
          {activeTab === "destinations" && <DestinationManagement />}
          {activeTab === "categories" && canEdit() && <CategoryManagement />}
          {activeTab === "audit-logs" && <AuditLogsManagement />}
        </main>
      </div>
    </div>
  )
}

const STATUS_OPTIONS = {
  active: { label: "Active", color: "#059669" },
  maintenance: { label: "Maintenance", color: "#d97706" },
  damaged: { label: "Damaged", color: "#be123c" },
  discarded: { label: "Discarded", color: "#6b7280" },
  missing: { label: "Missing", color: "#7c3aed" },
}

function DashboardOverview() {
  const [inventoryItems, setInventoryItems] = useState<ApiInventoryItem[]>([])
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [destinations, setDestinations] = useState<ApiDestination[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [auditLogs, setAuditLogs] = useState<ApiAuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [timeRange, setTimeRange] = useState("all")
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const apiService = ApiService.getInstance()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError("")
    try {
      const [inventoryResult, productsResult, destinationsResult, categoriesResult, auditLogsResult] = await Promise.all([
        apiService.getInventoryItems(),
        apiService.getProducts(),
        apiService.getDestinations(),
        apiService.getCategories(),
        apiService.getAuditLogs(),
      ])

      if (inventoryResult.success && inventoryResult.data) setInventoryItems(inventoryResult.data)
      else setError(inventoryResult.error || "Failed to load inventory data")
      if (productsResult.success && productsResult.data) setProducts(productsResult.data)
      if (destinationsResult.success && destinationsResult.data) setDestinations(destinationsResult.data)
      if (categoriesResult.success && categoriesResult.data) setCategories(categoriesResult.data)
      if (auditLogsResult.success && auditLogsResult.data) setAuditLogs(auditLogsResult.data)

    } catch (error) {
      console.error("Error loading dashboard data:", error)
      setError("Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  const stats = {
    total: inventoryItems.length,
    active: inventoryItems.filter(item => item.status === "active").length,
    maintenance: inventoryItems.filter(item => item.status === "maintenance").length,
    damaged: inventoryItems.filter(item => item.status === "damaged").length,
    discarded: inventoryItems.filter(item => item.status === "discarded").length,
    missing: inventoryItems.filter(item => item.status === "missing").length,
  }

  const statusData = Object.entries(STATUS_OPTIONS)
    .map(([key, { label, color }]) => ({
      name: label,
      value: stats[key as keyof typeof stats],
      color: color,
    }))
    .filter((item) => item.value > 0)
    
  const categoryStats = inventoryItems.reduce((acc, item) => {
    const categoryName = item.category.name
    if (!acc[categoryName]) acc[categoryName] = { name: categoryName, count: 0, active: 0, issues: 0 }
    acc[categoryName].count++
    if (item.status === "active") acc[categoryName].active++
    if (item.status === "damaged" || item.status === "missing") acc[categoryName].issues++
    return acc
  }, {} as Record<string, { name: string; count: number; active: number; issues: number }>)

  const categoryData = Object.values(categoryStats)

  const yearStats = inventoryItems.reduce((acc, item) => {
    const year = item.yearOfPurchase.toString()
    if (!acc[year]) acc[year] = { year, count: 0 }
    acc[year].count++
    return acc
  }, {} as Record<string, { year: string; count: number }>)

  const yearData = Object.values(yearStats).sort((a, b) => parseInt(a.year) - parseInt(b.year))

  const healthScore = stats.total > 0 ? Math.round(((stats.active + stats.maintenance * 0.7) / stats.total) * 100) : 100

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground">Comprehensive insights into your inventory performance</p>
        </div>
        <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <FileDown className="h-4 w-4 mr-2"/>
                        Export PDF
                    </Button>
                </DialogTrigger>
                <ExportDialog 
                    items={inventoryItems}
                    categories={categories}
                    destinations={destinations}
                    onClose={() => setIsExportDialogOpen(false)}
                />
            </Dialog>
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><Package className="h-4 w-4 mr-2" />Inventory Health</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{healthScore}%</div>
            <Progress value={healthScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">{healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : "Needs Attention"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><TrendingUp className="h-4 w-4 mr-2" />Active Rate</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%</div>
            <p className="text-xs text-muted-foreground">Active items in use</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><AlertTriangle className="h-4 w-4 mr-2" />Risk Factor</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.total > 0 ? Math.round(((stats.damaged + stats.missing) / stats.total) * 100) : 0}%</div>
            <p className="text-xs text-muted-foreground">Items with issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><Activity className="h-4 w-4 mr-2" />Categories</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{categoryData.length}</div>
            <p className="text-xs text-muted-foreground">Item categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Status Distribution</CardTitle><CardDescription>Current status of all inventory items</CardDescription></CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
                <>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={5} dataKey="value">
                            {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-4 mt-4 justify-center">
                        {statusData.map((item) => (
                            <div key={item.name} className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm">{item.name}: {item.value}</span>
                            </div>
                        ))}
                    </div>
                </>
            ) : <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data available</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Category Performance</CardTitle><CardDescription>Items by category with health indicators</CardDescription></CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
                  <Bar dataKey="count" fill={STATUS_OPTIONS.active.color} name="Total" /><Bar dataKey="active" fill="#10b981" name="Active" /><Bar dataKey="issues" fill={STATUS_OPTIONS.damaged.color} name="Issues" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-[300px] text-muted-foreground">No categories available</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Acquisition Timeline</CardTitle><CardDescription>Items acquired by year</CardDescription></CardHeader>
        <CardContent>
          {yearData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={yearData}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" /><YAxis /><Tooltip />
                <Line type="monotone" dataKey="count" stroke={STATUS_OPTIONS.active.color} strokeWidth={3} dot={{ fill: STATUS_OPTIONS.active.color, strokeWidth: 2, r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-[300px] text-muted-foreground">No acquisition data available</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Category Breakdown</CardTitle><CardDescription>Detailed view of each category's performance</CardDescription></CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <div className="space-y-4">
              {categoryData.map((category) => {
                const healthPercentage = category.count > 0 ? Math.round((category.active / category.count) * 100) : 0
                return (
                  <div key={category.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{category.name}</h3>
                        <Badge variant="outline">{category.count} items</Badge>
                        {category.issues > 0 && <Badge variant="destructive">{category.issues} issues</Badge>}
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                          <span>Health: {healthPercentage}%</span>
                          <span>{category.active} active</span>
                        </div>
                        <Progress value={healthPercentage} className="h-2" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <div className="text-center py-8 text-muted-foreground">No categories to display</div>}
        </CardContent>
      </Card>

      {/* Recent Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest system activities and changes</CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {auditLogs.slice(0, 10).map((log) => {
                const getActionColor = (action: string) => {
                  switch (action.toLowerCase()) {
                    case 'create': return 'bg-green-100 text-green-800 border-green-200'
                    case 'update': return 'bg-blue-100 text-blue-800 border-blue-200'
                    case 'delete': return 'bg-red-100 text-red-800 border-red-200'
                    default: return 'bg-gray-100 text-gray-800 border-gray-200'
                  }
                }

                const getEntityTypeColor = (entityType: string) => {
                  switch (entityType.toLowerCase()) {
                    case 'product': return 'bg-purple-100 text-purple-800 border-purple-200'
                    case 'category': return 'bg-orange-100 text-orange-800 border-orange-200'
                    case 'inventory': return 'bg-cyan-100 text-cyan-800 border-cyan-200'
                    case 'destination': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
                    default: return 'bg-gray-100 text-gray-800 border-gray-200'
                  }
                }

                return (
                  <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs border ${getActionColor(log.action)}`}>
                            {log.action}
                          </Badge>
                          <Badge variant="outline" className={`text-xs border ${getEntityTypeColor(log.entityType)}`}>
                            {log.entityType}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{log.message}</p>
                    </div>
                  </div>
                )
              })}
              {auditLogs.length > 10 && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    View all {auditLogs.length} activities →
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent activities found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


// --- New Component for PDF Export Dialog ---
function ExportDialog({ items, categories, destinations, onClose }: { items: ApiInventoryItem[], categories: ApiCategory[], destinations: ApiDestination[], onClose: () => void }) {
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
    const [startYear, setStartYear] = useState<string>("");
    const [endYear, setEndYear] = useState<string>("");

    const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
    };

    const handleGeneratePdf = () => {
        const filteredData = items.filter(item => {
            const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);
            const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(item.category.id);
            const destinationMatch = selectedDestinations.length === 0 || (item.destinationId && selectedDestinations.includes(item.destinationId));
            const yearMatch = (!startYear || item.yearOfPurchase >= parseInt(startYear)) && (!endYear || item.yearOfPurchase <= parseInt(endYear));
            return statusMatch && categoryMatch && destinationMatch && yearMatch;
        });

        if (filteredData.length === 0) {
            alert("No data matches your filter criteria. PDF will not be generated.");
            return;
        }

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Inventory Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

        autoTable(doc, {
            startY: 35,
            head: [['Unique Code', 'Product', 'Category', 'Destination', 'Status', 'Purchase Year']],
            body: filteredData.map(item => [
                item.uniqueCode,
                item.product.name,
                item.category.name,
                item.destination?.name ?? 'N/A',
                item.status,
                item.yearOfPurchase.toString(),
            ]),
            theme: 'grid',
            headStyles: { fillColor: [22, 163, 74] },
        });

        doc.save(`ELIMS_Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        onClose();
    };

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Export Inventory Report</DialogTitle>
                <DialogDescription>Select filters to customize your PDF report.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[60vh] overflow-y-auto pr-2">
                {/* Status Filter */}
                <div className="space-y-2">
                    <Label className="font-semibold">Filter by Status</Label>
                    <div className="space-y-1">
                        {Object.entries(STATUS_OPTIONS).map(([key, { label }]) => (
                            <div key={key} className="flex items-center space-x-2">
                                <Checkbox className="border-grey" id={`status-${key}`} onCheckedChange={() => handleCheckboxChange(setSelectedStatuses, key)} />
                                <label htmlFor={`status-${key}`} className="text-sm">{label}</label>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Year Filter */}
                <div className="space-y-2">
                    <Label className="font-semibold">Filter by Purchase Year</Label>
                    <div className="flex items-center space-x-2">
                        <Input type="number" placeholder="Start Year" value={startYear} onChange={e => setStartYear(e.target.value)} />
                        <span>-</span>
                        <Input type="number" placeholder="End Year" value={endYear} onChange={e => setEndYear(e.target.value)} />
                    </div>
                </div>
                {/* Category Filter */}
                <div className="space-y-2">
                    <Label className="font-semibold">Filter by Category</Label>
                    <div className="space-y-1">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center space-x-2">
                                <Checkbox className="border-grey" id={`cat-${cat.id}`} onCheckedChange={() => handleCheckboxChange(setSelectedCategories, cat.id)} />
                                <label htmlFor={`cat-${cat.id}`} className="text-sm">{cat.name}</label>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Destination Filter */}
                <div className="space-y-2">
                    <Label className="font-semibold">Filter by Destination</Label>
                    <div className="space-y-1">
                        {destinations.map(dest => (
                            <div key={dest.id} className="flex items-center space-x-2">
                                <Checkbox className="border-grey" id={`dest-${dest.id}`} onCheckedChange={() => handleCheckboxChange(setSelectedDestinations, dest.id)} />
                                <label htmlFor={`dest-${dest.id}`} className="text-sm">{dest.name}</label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleGeneratePdf}>
                    <FileDown className="h-4 w-4 mr-2"/>
                    Generate PDF
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}

// --- New Component for Audit Logs Management ---
function AuditLogsManagement() {
  const [auditLogs, setAuditLogs] = useState<ApiAuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const apiService = ApiService.getInstance()

  useEffect(() => {
    loadAuditLogs()
  }, [])

  const loadAuditLogs = async () => {
    setIsLoading(true)
    setError("")
    try {
      const result = await apiService.getAuditLogs()
      if (result.success && result.data) {
        setAuditLogs(result.data)
      } else {
        setError(result.error || "Failed to load audit logs")
      }
    } catch (error) {
      console.error("Error loading audit logs:", error)
      setError("Failed to load audit logs")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLogs = auditLogs.filter((log) => {
    return (
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-800'
      case 'update':
        return 'bg-blue-100 text-blue-800'
      case 'delete':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'product':
        return 'bg-purple-100 text-purple-800'
      case 'category':
        return 'bg-orange-100 text-orange-800'
      case 'inventory':
        return 'bg-cyan-100 text-cyan-800'
      case 'destination':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading audit logs...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Audit Logs</h2>
          <p className="text-muted-foreground">Track all system activities and changes</p>
        </div>
        <Button variant="outline" onClick={loadAuditLogs}>
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search logs by message, action, or entity type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline ({filteredLogs.length})</CardTitle>
          <CardDescription>Recent system activities and changes</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No logs match your search" : "No audit logs found"}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${getActionColor(log.action)}`}>
                          {log.action}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getEntityTypeColor(log.entityType)}`}>
                          {log.entityType}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{log.message}</p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}