"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Package, Settings, LogOut, Users, BarChart3, MapPin } from "lucide-react"
import { ProductManagement } from "@/components/product-management"
import { Analytics } from "@/components/analytics"
import { CategoryManagement } from "@/components/category-management"
import { DestinationManagement } from "@/components/destination-management"
import { ProductService } from "@/lib/products"

export function Dashboard() {
  const { user, logout, canEdit } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "destinations", label: "Destinations", icon: MapPin },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    ...(canEdit() ? [{ id: "categories", label: "Categories", icon: Settings }] : []),
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
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
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
          {activeTab === "destinations" && <DestinationManagement />}
          {activeTab === "analytics" && <Analytics />}
          {activeTab === "categories" && canEdit() && <CategoryManagement />}
          {activeTab === "users" && canEdit() && <div>Users section - Future enhancement</div>}
        </main>
      </div>
    </div>
  )
}

function DashboardOverview() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    issues: 0,
  })

  useEffect(() => {
    const productService = ProductService.getInstance()
    setStats(productService.getProductStats())
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground">Monitor your inventory status and key metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total === 0 ? "No products added yet" : "Products in inventory"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Products in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">{stats.maintenance}</div>
            <p className="text-xs text-muted-foreground">Under maintenance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.issues}</div>
            <p className="text-xs text-muted-foreground">Damaged/Missing</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Set up your inventory management system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">1</span>
            </div>
            <div>
              <p className="font-medium">Define Categories</p>
              <p className="text-sm text-muted-foreground">Set up product categories with short codes</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-medium text-muted-foreground">2</span>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Add Products</p>
              <p className="text-sm text-muted-foreground">Start adding products with unique codes</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-medium text-muted-foreground">3</span>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Track Status</p>
              <p className="text-sm text-muted-foreground">Monitor product status and maintenance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
