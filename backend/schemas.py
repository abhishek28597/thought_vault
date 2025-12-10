from pydantic import BaseModel, Field
from typing import Optional
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
