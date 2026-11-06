import { IProduct } from "@/models/Product";
import { IOrder } from "@/models/Order";

type FetchOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
}
 type WishlistProduct = {
  _id: string
  title: string
  price: number
  images: string[]
  category: string
}



class APIClient {
    private async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
          const { method = "GET", body, headers = {}} = options;
        const defaultHeaders = {
            "Content-Type": "application/json",
            ...headers
        }
      const response = await fetch(`/api${endpoint}`,{
            method,
            body: body ? JSON.stringify(body) : undefined,
            headers: defaultHeaders
        } )
       
// ✅ always parse JSON whether ok or not
    const data = await response.json();
    return data;    }
   async registerUser(userData: {email: string, password: string, name: string}) {
    return this.fetch<{ success: boolean; error?: string | string[]; userId?: string }>("/auth/register", {
        method: "POST",
        body: {email: userData.email, password: userData.password, username: userData.name}
    })
}
async verifyOTP(data: { userId: string; otp: string }) {
    return this.fetch<{ success: boolean; error?: string }>("/auth/verify-otp", {
        method: "POST",
        body: data
    })
}

async resendOTP(data: { userId: string }) {
    return this.fetch<{ success: boolean; error?: string }>("/auth/resend-otp", {
        method: "POST",
        body: data
    })
}

async forgotPassword(data: { email: string }) {
    return this.fetch<{ success: boolean; error?: string; userId?: string }>("/auth/forgot-password", {
        method: "POST",
        body: data
    })
}

async verifyResetOTP(data: { userId: string; otp: string }) {
    return this.fetch<{ success: boolean; error?: string }>("/auth/verify-reset-otp", {
        method: "POST",
        body: data
    })
}

// resend OTP for forgot password flow
async forgotPasswordResend(data: { userId: string }) {
    return this.fetch<{ success: boolean; error?: string }>("/auth/forgot-password", {
        method: "POST",
        body: data
    })
}

async resetPassword(data: { userId: string; newPassword: string }) {
    return this.fetch<{ success: boolean; error?: string }>("/auth/reset-password", {
        method: "POST",
        body: data
    })
}
async getTrendingProducts() {
    return this.fetch<{ success: boolean; error?: string, data?: IProduct[] }>("/products?trending=true&limit=9")
}

async getProductById(id: string) {
    return this.fetch<{ success: boolean; data?: IProduct; error?: string }>(
        `/products?id=${id}`
    )
}

async getProductsByCategory(category: string) {
    return this.fetch<{ success: boolean; data?: IProduct[]; error?: string }>(
        `/categories?category=${category}`
    )
}

async getProducts() {
    return this.fetch<{ success: boolean; data?: IProduct[]; error?: string }>(
        `/products`
    )
}
async getProductsByCategoryAndLimit(category: string) {
    return this.fetch<{ success: boolean; data?: IProduct[]; error?: string }>(
        `/categories?category=${category}&limit=3`
    )
}
async createOrder(orderData: {
  name: string;
  email: string;
  products: {
    productId: string;
    title: string;
    price: number;
    image: string;
    category: string;
    quantity: number;
    color?: string;
  }[];
  address: string;
  city: string;
  postalCode: string;
  mobileNumber: string;
  paymentMethod: string;
}) {
  return this.fetch<{ success: boolean; error?: string; orderId?: string }>("/orders", {
    method: "POST",
    body: orderData,
  });
}
async getOrders() {
  return this.fetch<{ success: boolean; data: IOrder[]; error?: string }>("/orders");
}

async getOrderById(id: string) {
  return this.fetch<{ success: boolean; data: IOrder; error?: string }>(`/orders/${id}`);
}
async toggleWishlist(productId: string) {
  return this.fetch<{ success: boolean; action: "added" | "removed"; error?: string }>(
    "/wishlist",
    { method: "POST", body: { productId } }
  )
}

async getWishlist() {
  return this.fetch<{ success: boolean; data: WishlistProduct[]; error?: string }>(
    "/wishlist"
  )
}
async updateProfile(data: { name: string }) {
  return this.fetch<{ success: boolean; error?: string }>("/user/profile", {
    method: "PATCH",
    body: data
  })
}

async changePassword(data: { currentPassword: string; newPassword: string }) {
  return this.fetch<{ success: boolean; error?: string }>("/user/change-password", {
    method: "POST",
    body: data
  })
}

async deleteAccount() {
  return this.fetch<{ success: boolean; error?: string }>("/user/delete", {
    method: "DELETE"
  })
}
async adminGetOrders() {
  return this.fetch<{ success: boolean; data: any[]; error?: string }>("/admin/orders")
}

async updateOrderStatus(orderId: string, status: string) {
  return this.fetch<{ success: boolean; error?: string }>(`/admin/orders/${orderId}`, {
    method: "PATCH",
    body: { status }
  })
}

async adminGetOrderById(id: string) {
  return this.fetch<{ success: boolean; data: any; error?: string }>(
    `/admin/orders/${id}`
  )
}

async createProduct(data: {
  title: string
  description: string
  price: number
  discountPrice: number | null
  category: string
  stock: number
  isTrending: boolean
  keyFeatures: string[]
  images: string[]
  colors: Record<string, string>[]
}) {
  return this.fetch<{ success: boolean; data: any; error?: string }>("/products", {
    method: "POST",
    body: data
  })
}

async updateProduct(id: string, data: {
  title: string
  description: string
  price: number
  discountPrice: number | null
  category: string
  stock: number
  isTrending: boolean
  keyFeatures: string[]
  images: string[]
  colors: Record<string, string>[]
}) {
  return this.fetch<{ success: boolean; data: any; error?: string }>(
    `/products?id=${id}`,
    { method: "PUT", body: data }
  )
}
async deleteProduct(id: string) {
  return this.fetch<{ success: boolean; error?: string }>(
    `/products?id=${id}`,
    { method: "DELETE" }
  )
}
async getAdminStats() {
  return this.fetch<{
    success: boolean
    error?: string
    data: {
      stats: {
        totalOrders: number
        totalRevenue: number
        totalProducts: number
        totalUsers: number
        pendingOrders: number
      }
      ordersPerDay: { date: string; orders: number; revenue: number }[]
      ordersByStatus: { name: string; value: number }[]
      topCategories: { name: string; orders: number; revenue: number }[]
      lowStock: any[]
      recentOrders: any[]
    }
  }>("/admin/stats")
}

async getAdminSetting() {
  return this.fetch<{ success: boolean; data: { deliveryFee: number }; error?: string }>("/admin/setting")
} 

async updateAdminSetting(data: { deliveryFee: number }) {
  return this.fetch<{ success: boolean; data: { deliveryFee: number }; error?: string }>("/admin/setting", {
    method: "PUT",
    body: data
  })
}

async getdeliveryFee() {
  return this.fetch<{ success: boolean; data: { deliveryFee: number }; error?: string }>("/setting")
}

async trackTikTokEvent(data: {
  event: string;
  eventId: string;
  value: number;
  currency: string;
  contents: {
    content_id: string;
    content_type: "product" | "product_group";
    content_name: string;
  }[];
  email?: string;
  phone?: string;
  pageUrl?: string;
}) {
  return this.fetch<{ success: boolean; error?: string }>("/events/tiktok", {
    method: "POST",
    body: data,
  });
}

/**
 * ADD these methods to your existing APIClient class in lib/api-client.ts.
 * Matches the {success, data, error} pattern used by getProductById,
 * createProduct, toggleWishlist, etc. Don't create this as a separate file.
 */

async getReviews(productId: string, page = 1, limit = 10) {
  try {
    const res = await fetch(`/api/reviews?productId=${productId}&page=${page}&limit=${limit}`)
    const json = await res.json()
    if (!res.ok) return { success: false, error: json.error || "Failed to fetch reviews" }
    return { success: true, data: json }
  } catch {
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

async createReview(payload: {
  productId: string
  name?: string
  rating: number
  title?: string
  comment: string
  images?: string[]
}) {
  try {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) return { success: false, error: json.error || "Failed to submit review" }
    return { success: true, data: json.review }
  } catch {
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

async deleteReview(id: string) {
  try {
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" })
    const json = await res.json()
    if (!res.ok) return { success: false, error: json.error || "Failed to delete review" }
    return { success: true }
  } catch {
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

// --- admin ---
async getAdminReviews(params: { status?: string; rating?: number; productId?: string; page?: number } = {}) {
  try {
    const query = new URLSearchParams(params as any).toString()
    const res = await fetch(`/api/admin/reviews?${query}`)
    const json = await res.json()
    if (!res.ok) return { success: false, error: json.error || "Failed to fetch reviews" }
    return { success: true, data: json }
  } catch {
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

async setReviewStatus(id: string, status: "active" | "hidden") {
  try {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    const json = await res.json()
    if (!res.ok) return { success: false, error: json.error || "Failed to update review" }
    return { success: true, data: json.review }
  } catch {
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

async deleteAdminReview(id: string) {
  try {
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" })
    const json = await res.json()
    if (!res.ok) return { success: false, error: json.error || "Failed to delete review" }
    return { success: true }
  } catch {
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

}


export const apiClient = new APIClient();