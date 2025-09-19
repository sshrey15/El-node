"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Package, Settings, LogOut, Users, BarChart3, MapPin, TrendingUp, AlertTriangle, Calendar, Activity } from "lucide-react"
import { ProductManagement } from "@/components/product-management"
import { InventoryManagement } from "@/components/inventory-management"
import { CategoryManagement } from "@/components/category-management"
import { DestinationManagement } from "@/components/destination-management"
import { ProductService, type InventoryItem } from "@/lib/products"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export function Dashboard() {
  const { user, logout, canEdit } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "destinations", label: "Destinations", icon: MapPin },
    { id: "inventory", label: "Inventory", icon: Package },
    ...(canEdit() ? [{ id: "categories", label: "Categories", icon: Settings }] : []),
    { id: "products", label: "Products", icon: Package },
    ...(canEdit() ? [{ id: "users", label: "Users", icon: Users }] : []),
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">El-Node</h1>
            <Badge variant="secondary">Inventory Management</Badge>
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
          {activeTab === "users" && canEdit() && <div>Users section - Future enhancement</div>}
        </main>
      </div>
    </div>
  )
}

const STATUS_COLORS = {
  active: "#059669",
  maintenance: "#d97706",
  damaged: "#be123c",
  discarded: "#6b7280",
  missing: "#7c3aed",
}

function DashboardOverview() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [timeRange, setTimeRange] = useState("all")
  const productService = ProductService.getInstance()

  useEffect(() => {
    setInventoryItems(productService.getInventoryItems())
  }, [])

  const stats = productService.getInventoryStats()

  // Status distribution data for pie chart
  const statusData = [
    { name: "Active", value: stats.active, color: STATUS_COLORS.active },
    { name: "Maintenance", value: stats.maintenance, color: STATUS_COLORS.maintenance },
    { name: "Damaged", value: stats.damaged, color: STATUS_COLORS.damaged },
    { name: "Discarded", value: stats.discarded, color: STATUS_COLORS.discarded },
    { name: "Missing", value: stats.missing, color: STATUS_COLORS.missing },
  ].filter((item) => item.value > 0)

  // Category distribution
  const categoryStats = inventoryItems.reduce(
    (acc, product) => {
      const categoryName = product.category.name
      if (!acc[categoryName]) {
        acc[categoryName] = { name: categoryName, count: 0, active: 0, issues: 0 }
      }
      acc[categoryName].count++
      if (product.status === "active") acc[categoryName].active++
      if (product.status === "damaged" || product.status === "missing") acc[categoryName].issues++
      return acc
    },
    {} as Record<string, { name: string; count: number; active: number; issues: number }>,
  )

  const categoryData = Object.values(categoryStats)

  // Year-wise acquisition data
  const yearStats = inventoryItems.reduce(
    (acc, product) => {
      const year = product.yearOfPurchase.toString()
      if (!acc[year]) {
        acc[year] = { year, count: 0 }
      }
      acc[year].count++
      return acc
    },
    {} as Record<string, { year: string; count: number }>,
  )

  const yearData = Object.values(yearStats).sort((a, b) => Number.parseInt(a.year) - Number.parseInt(b.year))

  // Health score calculation
  const healthScore = stats.total > 0 ? Math.round(((stats.active + stats.maintenance * 0.7) / stats.total) * 100) : 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground">Comprehensive insights into your inventory performance</p>
        </div>
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Inventory Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{healthScore}%</div>
            <Progress value={healthScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : "Needs Attention"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Active Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Active items in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Risk Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.total > 0 ? Math.round((stats.issues / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Items with issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{categoryData.length}</div>
            <p className="text-xs text-muted-foreground">Item categories</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current status of all inventory items</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data available</div>
            )}
            <div className="flex flex-wrap gap-4 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
           <CardDescription>Items by category with health indicators</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#059669" name="Total" />
                  <Bar dataKey="active" fill="#10b981" name="Active" />
                  <Bar dataKey="issues" fill="#be123c" name="Issues" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No categories available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acquisition Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Acquisition Timeline</CardTitle>
          <CardDescription>Items acquired by year</CardDescription>
        </CardHeader>
        <CardContent>
          {yearData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={yearData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ fill: "#059669", strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No acquisition data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Detailed view of each category's performance</CardDescription>
        </CardHeader>
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">No categories to display</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
