from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import os

from database import get_db, engine, Base
from models import User, Note
from schemas import UserCreate, UserLogin, NoteCreate, NoteUpdate, UserResponse, NoteResponse
from auth import hash_password, verify_password, create_access_token, verify_token

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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
