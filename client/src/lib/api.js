import { buildUrl } from "@shared/routes";
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
export async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${buildUrl(path)}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });
    if (!response.ok) {
        let error = {};
        try {
            error = await response.json();
        }
        catch { }
        throw error;
    }
    // Handle empty responses (204, etc.)
    if (response.status === 204) {
        return undefined;
    }
    return response.json();
}
//# sourceMappingURL=api.js.map