#!/usr/bin/env python3
"""
Script to generate embeddings for all existing notes in the database.
Run this once to backfill embeddings for notes created before the embedding feature was added.

Usage:
    python generate_embeddings.py
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
from models import Note, NoteEmbedding
from embedding_service import (
    generate_embeddings_batch,
    embedding_to_json,
    reduce_to_3d,
    coords_to_json,
    json_to_embedding
)

def main():
    print("=" * 60)
    print("THOUGHT VAULT - Embedding Generation Script")
    print("=" * 60)
    
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Get all notes without embeddings
        notes_without_embeddings = db.query(Note).outerjoin(
            NoteEmbedding, Note.id == NoteEmbedding.note_id
        ).filter(NoteEmbedding.id == None).all()
        
        total_notes = db.query(Note).count()
        notes_with_embeddings = total_notes - len(notes_without_embeddings)
        
        print(f"\nTotal notes in database: {total_notes}")
        print(f"Notes with embeddings: {notes_with_embeddings}")
        print(f"Notes needing embeddings: {len(notes_without_embeddings)}")
        
        if not notes_without_embeddings:
            print("\n✓ All notes already have embeddings!")
        else:
            print(f"\nGenerating embeddings for {len(notes_without_embeddings)} notes...")
            
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
            print(f"✓ Generated embeddings for {len(notes_without_embeddings)} notes")
        
        # Now compute 3D coordinates for all embeddings
        print("\nComputing 3D coordinates for visualization...")
        
        all_embeddings = db.query(NoteEmbedding).all()
        
        if len(all_embeddings) < 2:
            print("Need at least 2 notes to compute 3D coordinates")
        else:
            # Extract embeddings and compute 3D coords
            embedding_vectors = [json_to_embedding(emb.embedding) for emb in all_embeddings]
            coords_3d_list = reduce_to_3d(embedding_vectors)
            
            # Update database with 3D coordinates
            for emb, coords in zip(all_embeddings, coords_3d_list):
                emb.coords_3d = coords_to_json(coords)
            
            db.commit()
            print(f"✓ Computed 3D coordinates for {len(all_embeddings)} embeddings")
        
        print("\n" + "=" * 60)
        print("Embedding generation complete!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()

