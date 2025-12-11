import { getAuthToken } from "./auth-context";

// Use same origin since Express proxies to Python backend
const API_URL = "";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
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

export interface EmbeddingData {
  id: string;
  note_id: string;
  content: string;
  timestamp: string;
  embedding: number[];
  coords_3d: number[] | null;
  coords_tsne: number[] | null;
}

export interface EmbeddingsResponse {
  embeddings: EmbeddingData[];
  total: number;
}

export interface SimilarityNode {
  id: string;
  content: string;
  timestamp: string;
  size: number;
}

export interface SimilarityEdge {
  source: string;
  target: string;
  similarity: number;
}

export interface SimilarityResponse {
  nodes: SimilarityNode[];
  edges: SimilarityEdge[];
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
  embeddings: {
    getAll: (year?: number, month?: number): Promise<EmbeddingsResponse> => {
      const params = new URLSearchParams();
      if (year) params.append("year", year.toString());
      if (month) params.append("month", month.toString());
      const query = params.toString();
      return fetchWithAuth(`/api/embeddings${query ? `?${query}` : ""}`);
    },
    generate: () => fetchWithAuth("/api/embeddings/generate", {
      method: "POST",
    }),
    compute3D: () => fetchWithAuth("/api/embeddings/compute-3d", {
      method: "POST",
    }),
    getSimilarity: (threshold: number = 0.5): Promise<SimilarityResponse> => 
      fetchWithAuth(`/api/embeddings/similarity?threshold=${threshold}`),
  },
};
