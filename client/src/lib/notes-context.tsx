import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export interface Note {
  id: string;
  content: string;
  timestamp: string;
  isEncrypted: boolean;
}

interface NotesContextType {
  notes: Note[];
  addNote: (content: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading, error } = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: api.notes.getAll,
    retry: false,
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => api.notes.create(content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const addNote = async (content: string) => {
    await addNoteMutation.mutateAsync(content);
  };

  return (
    <NotesContext.Provider value={{ notes, addNote, isLoading, error: error as Error | null }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
}
