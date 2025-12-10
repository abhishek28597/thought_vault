import React, { useState } from "react";
import { useNotes } from "@/lib/notes-context";
import { Send, CornerDownLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function TerminalInput() {
  const { addNote } = useNotes();
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    addNote(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full relative group">
      <div className="absolute -top-3 left-4 bg-background px-2 text-xs text-primary/70 uppercase tracking-widest border border-primary/20">
        New_Entry_Buffer
      </div>
      
      <form 
        onSubmit={handleSubmit}
        className={`
          relative bg-card border transition-all duration-300
          ${isFocused ? 'border-primary shadow-[0_0_15px_rgba(74,222,128,0.1)]' : 'border-border'}
        `}
      >
        <div className="flex">
          <div className="w-10 border-r border-border/50 bg-muted/20 flex flex-col items-center pt-3 text-muted-foreground text-xs font-mono select-none">
            <span>01</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="// Initiate thought stream..."
            className="w-full bg-transparent p-3 min-h-[120px] resize-none outline-none font-mono text-base md:text-lg text-foreground placeholder:text-muted-foreground/40"
          />
        </div>
        
        <div className="border-t border-border/50 bg-muted/10 p-2 flex justify-between items-center">
          <div className="text-xs text-muted-foreground flex gap-2">
            <span>Ln {input.split('\n').length}, Col {input.length}</span>
            <span className="text-primary/50">UTF-8</span>
          </div>
          
          <button
            type="submit"
            disabled={!input.trim()}
            className="
              flex items-center gap-2 px-4 py-1.5 bg-primary/10 hover:bg-primary/20 
              text-primary text-xs uppercase tracking-wider border border-primary/30 
              hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <span>Push</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </div>
      </form>
    </div>
  );
}
