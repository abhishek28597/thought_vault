import { getAuthToken } from "./auth-context";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/signin";
    }
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return response.json();
}

export const api = {
  notes: {
    getAll: () => fetchWithAuth("/api/notes"),
    create: (content: string) => fetchWithAuth("/api/notes", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
    update: (id: string, content: string) => fetchWithAuth(`/api/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),
    delete: (id: string) => fetchWithAuth(`/api/notes/${id}`, {
      method: "DELETE",
    }),
  },
};
