import { buildUrl } from "@shared/routes"; 

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${buildUrl(path)}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let error: any = {};
    try {
      error = await response.json();
    } catch {}
    throw error;
  }

  // Handle empty responses (204, etc.)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
