from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    user = relationship("User", back_populates="notes")
    embedding = relationship("NoteEmbedding", back_populates="note", uselist=False, cascade="all, delete-orphan")

class NoteEmbedding(Base):
    __tablename__ = "note_embeddings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    note_id = Column(UUID(as_uuid=True), ForeignKey("notes.id"), nullable=False, unique=True, index=True)
    embedding = Column(Text, nullable=False)  # JSON serialized 384-dim vector
    coords_3d = Column(Text, nullable=True)  # JSON serialized [x, y, z] for 3D visualization
    coords_tsne = Column(Text, nullable=True)  # JSON serialized [x, y] for t-SNE 2D visualization
    created_at = Column(DateTime, default=datetime.utcnow)
    
    note = relationship("Note", back_populates="embedding")
