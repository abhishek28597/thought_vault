import React, { createContext, useContext, useState, useEffect } from "react";
import { format, subDays, subMonths } from "date-fns";

export interface Note {
  id: string;
  content: string;
  timestamp: Date;
  isEncrypted: boolean;
}

interface NotesContextType {
  notes: Note[];
  addNote: (content: string) => void;
  getNotesByDate: (date: Date) => Note[];
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

// Generate some "lonely coder" sample data
const generateInitialNotes = (): Note[] => {
  const notes: Note[] = [];
  const now = new Date();
  
  // Today's notes
  notes.push({
    id: "1",
    content: "System check complete. All variables initialized. The silence is loud today.",
    timestamp: subDays(now, 0),
    isEncrypted: false,
  });
  
  notes.push({
    id: "2",
    content: "Refactored the core loop again. It feels faster but I have no one to show it to.",
    timestamp: subDays(now, 0),
    isEncrypted: false,
  });

  // Yesterday
  notes.push({
    id: "3",
    content: "Rainy day. Perfect for dark mode. Drank 4 coffees. Heart rate elevated.",
    timestamp: subDays(now, 1),
    isEncrypted: false,
  });

  // Last Month
  notes.push({
    id: "4",
    content: "Project 'Phoenix' is stalled. Need new inspiration. Maybe I should go outside? No, too bright.",
    timestamp: subDays(now, 25),
    isEncrypted: false,
  });
  
   notes.push({
    id: "5",
    content: "Found a bug in the old legacy code from 2023. It's like reading letters from a past self.",
    timestamp: subDays(now, 26),
    isEncrypted: false,
  });

  return notes;
};

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(generateInitialNotes());

  const addNote = (content: string) => {
    const newNote: Note = {
      id: Math.random().toString(36).substring(7),
      content,
      timestamp: new Date(),
      isEncrypted: false,
    };
    // Add to beginning of list
    setNotes((prev) => [newNote, ...prev]);
  };

  const getNotesByDate = (date: Date) => {
    const targetDate = format(date, "yyyy-MM-dd");
    return notes.filter((note) => format(note.timestamp, "yyyy-MM-dd") === targetDate);
  };

  return (
    <NotesContext.Provider value={{ notes, addNote, getNotesByDate }}>
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
