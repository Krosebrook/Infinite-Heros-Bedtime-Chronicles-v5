import { fetch } from "expo/fetch";
import { QueryClient, QueryFunction } from "@tanstack/react-query";

let _getAuthToken: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  _getAuthToken = getter;
}

/**
 * Gets the base URL for the Express API server (e.g., "http://localhost:3000")
 * Falls back to relative root "/" so the app works when deployed on the same
 * origin as the API (e.g., Vercel deployment with the Express serverless function).
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (apiUrl) {
    return apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
  }

  const host = process.env.EXPO_PUBLIC_DOMAIN;
  if (!host) {
    // Fall back to the current origin so API calls are relative (same-origin)
    if (typeof window !== 'undefined') {
      return window.location.origin + '/';
    }
    return '/';
  }

  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  const protocol = isLocal ? 'http' : 'https';
  const url = new URL(`${protocol}://${host}`);
  return url.href;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const headers: Record<string, string> = {};
  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  if (_getAuthToken) {
    const token = await _getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const fetchHeaders: Record<string, string> = {};
    if (_getAuthToken) {
      const token = await _getAuthToken();
      if (token) {
        fetchHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    const res = await fetch(url.toString(), {
      headers: fetchHeaders,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      // staleTime: Infinity is intentional — the app's server-state queries are all
      // user-initiated mutations that manually invalidate the cache after changes.
      // No background refetching is needed since data only changes via explicit user actions.
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
