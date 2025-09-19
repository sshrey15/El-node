export interface User {
  id: string
  username: string
  role: "admin" | "viewer"
  createdAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

const API_BASE_URL = "https://el-node-backend.vercel.app/api"

export class AuthService {
  private static instance: AuthService
  private currentUser: User | null = null
  private authToken: string | null = null

  private constructor() {
    // Initialize with stored user and token if available
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("el-node-user")
      const storedToken = localStorage.getItem("el-node-token")
      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser)
        this.authToken = storedToken
      }
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Create user object from API response
        const user: User = {
          id: data.user?.id || data.id || username,
          username: data.user?.username || data.username || username,
          role: data.user?.role || data.role || "viewer",
          createdAt: data.user?.createdAt || data.createdAt || new Date().toISOString(),
        }

        this.currentUser = user
        this.authToken = data.token || "authenticated"

        if (typeof window !== "undefined") {
          localStorage.setItem("el-node-user", JSON.stringify(user))
          localStorage.setItem("el-node-token", this.authToken!)
        }

        return { success: true, user }
      } else {
        return { success: false, error: data.message || data.error || "Login failed" }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  async register(username: string, password: string, role: "admin" | "viewer" = "viewer"): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, role }),
      })

      const data = await response.json()

      if (response.ok) {
        const user: User = {
          id: data.user?.id || data.id || username,
          username: data.user?.username || data.username || username,
          role: data.user?.role || data.role || role,
          createdAt: data.user?.createdAt || data.createdAt || new Date().toISOString(),
        }

        return { success: true, user }
      } else {
        return { success: false, error: data.message || data.error || "Registration failed" }
      }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error: "Network error. Please check if the server is running." }
    }
  }

  logout(): void {
    this.currentUser = null
    this.authToken = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("el-node-user")
      localStorage.removeItem("el-node-token")
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  getAuthToken(): string | null {
    return this.authToken
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.authToken !== null
  }

  hasRole(role: "admin" | "viewer"): boolean {
    return this.currentUser?.role === role
  }

  canEdit(): boolean {
    return this.currentUser?.role === "admin"
  }
}
