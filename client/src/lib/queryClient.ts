import { QueryClient, QueryFunction } from "@tanstack/react-query";

const CACHE_TIME = 1000 * 60 * 5; // 5 minutes
const STALE_TIME = 1000 * 30; // 30 seconds

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      "Cache-Control": "public, max-age=300", // 5 minutes cache
      Pragma: "no-cache",
    },
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
  async ({ queryKey, signal }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      signal, // Support for query cancellation
      headers: {
        "Cache-Control": "public, max-age=300",
        Pragma: "no-cache",
      },
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
      refetchOnWindowFocus: true, // Enable to keep data fresh
      staleTime: STALE_TIME,
      gcTime: CACHE_TIME,
      retry: 1, // Retry once on failure
      retryDelay: 1000, // Wait 1 second before retry
      networkMode: "offlineFirst" // Support offline mode
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      networkMode: "offlineFirst",
    },
  },
});
