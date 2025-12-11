"""
Embedding Service for generating text embeddings using sentence-transformers.
Uses all-MiniLM-L6-v2 model (~80MB, 384 dimensions).
"""

import json
import numpy as np
from typing import List, Optional, Tuple
from sentence_transformers import SentenceTransformer

# Lazy load model to avoid loading on import
_model: Optional[SentenceTransformer] = None

def get_model() -> SentenceTransformer:
    """Get or initialize the sentence transformer model."""
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

def generate_embedding(text: str) -> List[float]:
    """
    Generate embedding vector for a single text.
    
    Args:
        text: The text to generate embedding for
        
    Returns:
        List of 384 floats representing the embedding
    """
    model = get_model()
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tolist()

def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for multiple texts in batch.
    
    Args:
        texts: List of texts to generate embeddings for
        
    Returns:
        List of embedding vectors
    """
    model = get_model()
    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=True)
    return embeddings.tolist()

def embedding_to_json(embedding: List[float]) -> str:
    """Serialize embedding to JSON string for database storage."""
    return json.dumps(embedding)

def json_to_embedding(json_str: str) -> List[float]:
    """Deserialize embedding from JSON string."""
    return json.loads(json_str)

def compute_cosine_similarity(emb1: List[float], emb2: List[float]) -> float:
    """
    Compute cosine similarity between two embeddings.
    
    Args:
        emb1: First embedding vector
        emb2: Second embedding vector
        
    Returns:
        Cosine similarity score between -1 and 1
    """
    a = np.array(emb1)
    b = np.array(emb2)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def reduce_to_3d(embeddings: List[List[float]]) -> List[List[float]]:
    """
    Reduce high-dimensional embeddings to 3D using UMAP for visualization.
    
    Args:
        embeddings: List of embedding vectors (384-dim each)
        
    Returns:
        List of 3D coordinates [x, y, z] for each embedding
    """
    if len(embeddings) < 2:
        # UMAP needs at least 2 points, return origin for single point
        return [[0.0, 0.0, 0.0] for _ in embeddings]
    
    import umap
    
    # Adjust n_neighbors based on dataset size
    n_neighbors = min(15, len(embeddings) - 1)
    
    reducer = umap.UMAP(
        n_components=3,
        n_neighbors=n_neighbors,
        min_dist=0.1,
        metric='cosine',
        random_state=42
    )
    
    embeddings_array = np.array(embeddings)
    coords_3d = reducer.fit_transform(embeddings_array)
    
    # Normalize to [-1, 1] range for easier visualization
    coords_3d = coords_3d - coords_3d.mean(axis=0)
    max_abs = np.abs(coords_3d).max()
    if max_abs > 0:
        coords_3d = coords_3d / max_abs
    
    return coords_3d.tolist()

def reduce_to_2d_tsne(embeddings: List[List[float]]) -> List[List[float]]:
    """
    Reduce high-dimensional embeddings to 2D using t-SNE for cluster visualization.
    
    t-SNE is excellent for visualizing clusters in high-dimensional data.
    
    Args:
        embeddings: List of embedding vectors (384-dim each)
        
    Returns:
        List of 2D coordinates [x, y] for each embedding
    """
    if len(embeddings) < 2:
        return [[0.0, 0.0] for _ in embeddings]
    
    from sklearn.manifold import TSNE
    
    embeddings_array = np.array(embeddings)
    
    # Adjust perplexity based on dataset size (must be less than n_samples)
    n_samples = len(embeddings)
    perplexity = min(30, max(5, n_samples - 1))
    
    tsne = TSNE(
        n_components=2,
        perplexity=perplexity,
        learning_rate='auto',
        init='pca',
        random_state=42,
        metric='cosine'
    )
    
    coords_2d = tsne.fit_transform(embeddings_array)
    
    # Normalize to [-1, 1] range for easier visualization
    coords_2d = coords_2d - coords_2d.mean(axis=0)
    max_abs = np.abs(coords_2d).max()
    if max_abs > 0:
        coords_2d = coords_2d / max_abs
    
    return coords_2d.tolist()

def coords_to_json(coords: List[float]) -> str:
    """Serialize 3D coordinates to JSON string."""
    return json.dumps(coords)

def json_to_coords(json_str: str) -> List[float]:
    """Deserialize 3D coordinates from JSON string."""
    return json.loads(json_str)

