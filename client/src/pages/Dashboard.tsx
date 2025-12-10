import React from "react";
import { TerminalLayout } from "@/components/layout/TerminalLayout";
import { TerminalInput } from "@/components/TerminalInput";
import { useNotes } from "@/lib/notes-context";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Hash, Clock, FileText } from "lucide-react";

export default function Dashboard() {
  const { notes } = useNotes();
  const today = new Date();
  
  // Filter for today's notes roughly (mock logic since we generated dates)
  // For the demo, we just show the first 5 notes as "Recent Activity"
  const recentNotes = notes.slice(0, 10);

  return (
    <TerminalLayout>
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Welcome Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-primary tracking-tighter text-glow">
            GHOST_PROTOCOL
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-light border-l-2 border-primary/50 pl-4 py-1">
            Vault Status: <span className="text-primary">ACTIVE</span>. Welcome back, User.
          </p>
        </motion.div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <TerminalInput />
        </motion.div>

        {/* Log Stream */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-primary/80 border-b border-border pb-2">
            <Hash className="w-5 h-5" />
            <h2 className="text-lg uppercase tracking-widest">System_Log :: Recent</h2>
          </div>

          <div className="space-y-4">
            {recentNotes.length === 0 ? (
              <div className="p-8 border border-dashed border-border text-center text-muted-foreground">
                No data streams found.
              </div>
            ) : (
              recentNotes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative pl-6 border-l border-border hover:border-primary transition-colors"
                >
                  <div className="absolute -left-[5px] top-0 w-[9px] h-[9px] bg-background border border-border group-hover:border-primary rounded-full transition-colors" />
                  
                  <div className="mb-1 flex items-center gap-3 text-xs font-mono text-muted-foreground">
                    <span className="text-primary/70">
                      [{format(note.timestamp, "HH:mm:ss")}]
                    </span>
                    <span className="opacity-50">ID: {note.id}</span>
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
        </div>
      </div>
    </TerminalLayout>
  );
}
