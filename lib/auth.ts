"use client"

import { jwtDecode } from 'jwt-decode';

// Define the User type for clarity
export interface User {
  id: string;
  username: string;
  role: "admin" | "viewer";
}

// --- AUTHENTICATION SERVICE ---
export class AuthService {
  private static instance: AuthService;
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://el-node-backend.vercel.app/api";

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Logs in a user, stores the received token and user data in localStorage.
   */
  async login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.token && data.user) {
        const user: User = data.user;
        
        // Store token and user data for session persistence
        localStorage.setItem("el-node-user", JSON.stringify(user));
        localStorage.setItem("el-node-token", data.token);

        return { success: true, user };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login API error:", error);
      return { success: false, error: "A network error occurred. Please try again." };
    }
  }

  /**
   * Registers a new user.
   */
  async register(username: string, password: string, role: "admin" | "viewer" = "viewer"): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, user: data };
      } else {
        return { success: false, error: data.error || "Registration failed" };
      }
    } catch (error) {
      console.error("Registration API error:", error);
      return { success: false, error: "A network error occurred. Please try again." };
    }
  }

  /**
   * Clears user data and token from localStorage.
   */
  logout(): void {
    localStorage.removeItem("el-node-user");
    localStorage.removeItem("el-node-token");
  }

  /**
   * Retrieves the current user's data from localStorage.
   */
  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const storedUser = localStorage.getItem("el-node-user");
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  }

  /**
   * Retrieves the auth token from localStorage.
   */
  getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("el-node-token");
  }

  /**
   * Checks if a token exists and is not expired.
   */
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    if (!token) {
      return false;
    }
    try {
      const decoded: { exp: number } = jwtDecode(token);
      // Check if the token's expiration time is in the future
      return decoded.exp * 1000 > Date.now();
    } catch (error) {
      console.error("Invalid token:", error);
      this.logout();
      return false;
    }
  }

  /**
   * Checks if the current user has editing permissions.
   */
  canEdit(): boolean {
    return this.getCurrentUser()?.role === "admin";
  }

  /**
   * Verifies the token with the backend to ensure the session is valid.
   */
  async verifyToken(): Promise<{ success: boolean; user?: User }> {
    const token = this.getAuthToken();
    if (!token) return { success: false };

    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        // Re-sync user data in localStorage to keep it fresh
        localStorage.setItem("el-node-user", JSON.stringify(data));
        return { success: true, user: data };
      }
      this.logout(); // If token is invalid on the server, log out client-side
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }
}