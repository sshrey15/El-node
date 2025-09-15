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

// Default admin user for demo purposes
const DEFAULT_USERS: User[] = [
  {
    id: "1",
    username: "admin",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    username: "viewer",
    role: "viewer",
    createdAt: new Date().toISOString(),
  },
]

export class AuthService {
  private static instance: AuthService
  private currentUser: User | null = null

  private constructor() {
    // Initialize with stored user if available
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("el-node-user")
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser)
      }
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  login(username: string, password: string): { success: boolean; user?: User; error?: string } {
    // Simple authentication - in production, this would be server-side
    const user = DEFAULT_USERS.find((u) => u.username === username)

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Simple password check (admin/admin, viewer/viewer)
    if (password !== username) {
      return { success: false, error: "Invalid password" }
    }

    this.currentUser = user
    if (typeof window !== "undefined") {
      localStorage.setItem("el-node-user", JSON.stringify(user))
    }

    return { success: true, user }
  }

  logout(): void {
    this.currentUser = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("el-node-user")
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  hasRole(role: "admin" | "viewer"): boolean {
    return this.currentUser?.role === role
  }

  canEdit(): boolean {
    return this.currentUser?.role === "admin"
  }
}
