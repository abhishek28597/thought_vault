from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    token: str

class NoteCreate(BaseModel):
    content: str = Field(..., min_length=1)

class NoteUpdate(BaseModel):
    content: str = Field(..., min_length=1)

class NoteResponse(BaseModel):
    id: str
    content: str
    timestamp: str
    isEncrypted: bool

class EmbeddingResponse(BaseModel):
    id: str
    note_id: str
    content: str
    timestamp: str
    embedding: List[float]
    coords_3d: Optional[List[float]] = None

class EmbeddingsListResponse(BaseModel):
    embeddings: List[EmbeddingResponse]
    total: int

class GenerateEmbeddingsResponse(BaseModel):
    generated: int
    total: int
    message: str
