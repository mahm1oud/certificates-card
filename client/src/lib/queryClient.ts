import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  urlOrOptions: string | { url: string; method?: string; body?: any },
  options?: {
    method?: string;
    body?: any;
    on401?: UnauthorizedBehavior;
  }
): Promise<Response> {
  let url: string;
  let method: string = 'GET';
  let data: any = undefined;
  let on401: UnauthorizedBehavior | undefined = undefined;

  // Handle different call patterns
  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions;
    method = options?.method || 'GET';
    data = options?.body;
    on401 = options?.on401;
  } else {
    url = urlOrOptions.url;
    method = urlOrOptions.method || 'GET';
    data = urlOrOptions.body;
    on401 = options?.on401;
  }

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (res.status === 401 && on401) {
    if (on401 === "returnNull") {
      return res;
    } else if (on401 === "redirect-to-login") {
      window.location.href = "/auth";
      return res;
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw" | "redirect-to-login";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      } else if (unauthorizedBehavior === "redirect-to-login") {
        window.location.href = "/auth";
        return null;
      }
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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
