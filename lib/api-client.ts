
type FetchOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
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
    return this.fetch<{ success: boolean; error?: string, data?: any }>("/products?trending=true&limit=9")
}

}


export const apiClient = new APIClient();