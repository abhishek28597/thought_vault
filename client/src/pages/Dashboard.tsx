import React from "react";
import { TerminalLayout } from "@/components/layout/TerminalLayout";
import { TerminalInput } from "@/components/TerminalInput";
import { useNotes } from "@/lib/notes-context";
import { motion } from "framer-motion";
import { Hash, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { notes, isLoading } = useNotes();
  
  const recentNotes = notes.slice(0, 10);

  return (
    <TerminalLayout>
      <div className="max-w-4xl mx-auto space-y-12">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-primary tracking-tighter text-glow">
            ALTER_EGO
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-light border-l-2 border-primary/50 pl-4 py-1">
            Vault Status: <span className="text-primary">ACTIVE</span>. Welcome back, User.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <TerminalInput />
        </motion.div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 text-primary/80 border-b border-border pb-2">
            <Hash className="w-5 h-5" />
            <h2 className="text-lg uppercase tracking-widest">System_Log :: Recent</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-3">Loading data streams...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {recentNotes.length === 0 ? (
                <div className="p-8 border border-dashed border-border text-center text-muted-foreground">
                  No data streams found. Initialize first entry above.
                </div>
              ) : (
                recentNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative pl-6 border-l border-border hover:border-primary transition-colors"
                    data-testid={`note-${note.id}`}
                  >
                    <div className="absolute -left-[5px] top-0 w-[9px] h-[9px] bg-background border border-border group-hover:border-primary rounded-full transition-colors" />
                    
                    <div className="mb-1 flex items-center gap-3 text-xs font-mono text-muted-foreground">
                      <span className="text-primary/70">
                        [{new Date(note.timestamp).toLocaleTimeString([], { hour12: false })}]
                      </span>
                      <span className="opacity-50">ID: {note.id.substring(0, 8)}</span>
                    </div>
                    
                    <div className="p-4 bg-card/50 border border-border/50 group-hover:border-primary/30 transition-all">
                      <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">
                        {note.content}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </TerminalLayout>
  );
}
