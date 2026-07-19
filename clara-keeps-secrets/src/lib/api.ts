const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001/api";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const tokenStorage = {
  getAccessToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("mrbrown_access_token");
  },
  setAccessToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("mrbrown_access_token", token);
  },
  getRefreshToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("mrbrown_refresh_token");
  },
  setRefreshToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("mrbrown_refresh_token", token);
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("mrbrown_access_token");
    localStorage.removeItem("mrbrown_refresh_token");
  }
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});
  
  const token = tokenStorage.getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  const res = await fetch(url, {
    ...options,
    headers,
  });
  
  if (res.status === 401 && path !== "/auth/login" && path !== "/auth/register" && path !== "/auth/refresh") {
    // Attempt token refresh
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clear();
      throw new Error("Session expired");
    }
    
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        
        if (!refreshRes.ok) {
          throw new Error("Refresh failed");
        }
        
        const data = await refreshRes.json() as { accessToken: string; refreshToken: string };
        tokenStorage.setAccessToken(data.accessToken);
        tokenStorage.setRefreshToken(data.refreshToken);
        
        isRefreshing = false;
        onRefreshed(data.accessToken);
      } catch (err) {
        isRefreshing = false;
        tokenStorage.clear();
        window.dispatchEvent(new Event("mrbrown-logout"));
        throw new Error("Session expired");
      }
    }
    
    // Wait for refresh to complete, then retry
    return new Promise<T>((resolve, reject) => {
      subscribeTokenRefresh((newToken) => {
        headers.set("Authorization", `Bearer ${newToken}`);
        fetch(url, { ...options, headers })
          .then((retryRes) => {
            if (!retryRes.ok) {
              return retryRes.json().then((err) => reject(err));
            }
            return retryRes.json();
          })
          .then((data) => resolve(data as T))
          .catch((err) => reject(err));
      });
    });
  }
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  
  return res.json() as Promise<T>;
}
