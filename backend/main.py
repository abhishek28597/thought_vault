from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
import os
import json

from database import get_db, engine, Base
from models import User, Note, NoteEmbedding
from schemas import (
    UserCreate, UserLogin, NoteCreate, NoteUpdate, UserResponse, NoteResponse,
    EmbeddingResponse, EmbeddingsListResponse, GenerateEmbeddingsResponse
)
from auth import hash_password, verify_password, create_access_token, verify_token
from embedding_service import (
    generate_embedding, generate_embeddings_batch, 
    embedding_to_json, json_to_embedding,
    reduce_to_3d, reduce_to_2d_tsne, coords_to_json, json_to_coords,
    compute_cosine_similarity
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ThoughtVault API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/")
def root():
    return {"status": "ThoughtVault API Online", "version": "2.0"}

@app.post("/api/auth/signup", response_model=UserResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_pwd = hash_password(user_data.password)
    new_user = User(username=user_data.username, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = create_access_token({"sub": str(new_user.id)})
    return {"id": str(new_user.id), "username": new_user.username, "token": token}

@app.post("/api/auth/signin", response_model=UserResponse)
def signin(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": str(user.id)})
    return {"id": str(user.id), "username": user.username, "token": token}

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    token = create_access_token({"sub": str(current_user.id)})
    return {"id": str(current_user.id), "username": current_user.username, "token": token}

@app.post("/api/notes", response_model=NoteResponse)
def create_note(
    note_data: NoteCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_note = Note(
        content=note_data.content,
        user_id=current_user.id,
        timestamp=datetime.utcnow()
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    
    # Generate embedding for the new note
    try:
        embedding = generate_embedding(note_data.content)
        note_embedding = NoteEmbedding(
            note_id=new_note.id,
            embedding=embedding_to_json(embedding)
        )
        db.add(note_embedding)
        db.commit()
    except Exception as e:
        # Log error but don't fail note creation
        print(f"Error generating embedding for note {new_note.id}: {e}")
    
    return {
        "id": str(new_note.id),
        "content": new_note.content,
        "timestamp": new_note.timestamp.isoformat(),
        "isEncrypted": False
    }

@app.get("/api/notes")
def get_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notes = db.query(Note).filter(Note.user_id == current_user.id).order_by(Note.timestamp.desc()).all()
    return [
        {
            "id": str(note.id),
            "content": note.content,
            "timestamp": note.timestamp.isoformat(),
            "isEncrypted": False
        }
        for note in notes
    ]

@app.get("/api/notes/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {
        "id": str(note.id),
        "content": note.content,
        "timestamp": note.timestamp.isoformat(),
        "isEncrypted": False
    }

@app.put("/api/notes/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: str,
    note_data: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    note.content = note_data.content
    db.commit()
    db.refresh(note)
    
    return {
        "id": str(note.id),
        "content": note.content,
        "timestamp": note.timestamp.isoformat(),
        "isEncrypted": False
    }

@app.delete("/api/notes/{note_id}")
def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}

# ============ EMBEDDING ENDPOINTS ============

@app.get("/api/embeddings")
def get_embeddings(
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all embeddings for the current user's notes with optional date filtering."""
    query = db.query(Note, NoteEmbedding).join(
        NoteEmbedding, Note.id == NoteEmbedding.note_id
    ).filter(Note.user_id == current_user.id)
    
    # Apply date filters
    if year:
        from sqlalchemy import extract
        query = query.filter(extract('year', Note.timestamp) == year)
    if month:
        from sqlalchemy import extract
        query = query.filter(extract('month', Note.timestamp) == month)
    
    results = query.order_by(Note.timestamp.desc()).all()
    
    embeddings_list = []
    for note, embedding in results:
        emb_data = {
            "id": str(embedding.id),
            "note_id": str(note.id),
            "content": note.content,
            "timestamp": note.timestamp.isoformat(),
            "embedding": json_to_embedding(embedding.embedding),
            "coords_3d": json_to_coords(embedding.coords_3d) if embedding.coords_3d else None,
            "coords_tsne": json_to_coords(embedding.coords_tsne) if embedding.coords_tsne else None
        }
        embeddings_list.append(emb_data)
    
    return {
        "embeddings": embeddings_list,
        "total": len(embeddings_list)
    }

@app.post("/api/embeddings/generate", response_model=GenerateEmbeddingsResponse)
def generate_all_embeddings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate embeddings for all notes that don't have embeddings yet."""
    # Get all notes without embeddings
    notes_without_embeddings = db.query(Note).outerjoin(
        NoteEmbedding, Note.id == NoteEmbedding.note_id
    ).filter(
        Note.user_id == current_user.id,
        NoteEmbedding.id == None
    ).all()
    
    if not notes_without_embeddings:
        return {
            "generated": 0,
            "total": db.query(Note).filter(Note.user_id == current_user.id).count(),
            "message": "All notes already have embeddings"
        }
    
    # Generate embeddings in batch
    texts = [note.content for note in notes_without_embeddings]
    embeddings = generate_embeddings_batch(texts)
    
    # Save embeddings to database
    for note, embedding in zip(notes_without_embeddings, embeddings):
        note_embedding = NoteEmbedding(
            note_id=note.id,
            embedding=embedding_to_json(embedding)
        )
        db.add(note_embedding)
    
    db.commit()
    
    total_notes = db.query(Note).filter(Note.user_id == current_user.id).count()
    
    return {
        "generated": len(notes_without_embeddings),
        "total": total_notes,
        "message": f"Generated embeddings for {len(notes_without_embeddings)} notes"
    }

@app.post("/api/embeddings/compute-3d")
def compute_3d_coordinates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compute 3D coordinates (UMAP) and 2D t-SNE coordinates for all embeddings."""
    # Get all embeddings for user
    results = db.query(NoteEmbedding).join(
        Note, Note.id == NoteEmbedding.note_id
    ).filter(Note.user_id == current_user.id).all()
    
    if len(results) < 2:
        return {
            "computed": 0,
            "message": "Need at least 2 notes to compute coordinates"
        }
    
    # Extract embeddings
    embeddings = [json_to_embedding(emb.embedding) for emb in results]
    
    # Compute 3D coords using UMAP
    coords_3d_list = reduce_to_3d(embeddings)
    
    # Compute 2D coords using t-SNE
    coords_tsne_list = reduce_to_2d_tsne(embeddings)
    
    # Update database with coordinates
    for emb, coords_3d, coords_tsne in zip(results, coords_3d_list, coords_tsne_list):
        emb.coords_3d = coords_to_json(coords_3d)
        emb.coords_tsne = coords_to_json(coords_tsne)
    
    db.commit()
    
    return {
        "computed": len(results),
        "message": f"Computed 3D (UMAP) and 2D (t-SNE) coordinates for {len(results)} embeddings"
    }

@app.get("/api/embeddings/similarity")
def get_similarity_edges(
    threshold: float = 0.5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get similarity edges between notes based on cosine similarity threshold."""
    results = db.query(Note, NoteEmbedding).join(
        NoteEmbedding, Note.id == NoteEmbedding.note_id
    ).filter(Note.user_id == current_user.id).all()
    
    if len(results) < 2:
        return {"edges": [], "nodes": []}
    
    # Build nodes list
    nodes = []
    embeddings_data = []
    for note, emb in results:
        nodes.append({
            "id": str(note.id),
            "content": note.content[:100] + "..." if len(note.content) > 100 else note.content,
            "timestamp": note.timestamp.isoformat(),
            "size": min(max(len(note.content) / 50, 5), 20)  # Size based on content length
        })
        embeddings_data.append({
            "id": str(note.id),
            "embedding": json_to_embedding(emb.embedding)
        })
    
    # Compute similarity edges
    edges = []
    for i in range(len(embeddings_data)):
        for j in range(i + 1, len(embeddings_data)):
            similarity = compute_cosine_similarity(
                embeddings_data[i]["embedding"],
                embeddings_data[j]["embedding"]
            )
            if similarity >= threshold:
                edges.append({
                    "source": embeddings_data[i]["id"],
                    "target": embeddings_data[j]["id"],
                    "similarity": round(similarity, 3)
                })
    
    return {"nodes": nodes, "edges": edges}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
