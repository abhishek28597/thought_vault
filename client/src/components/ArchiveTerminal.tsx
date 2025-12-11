import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNotes, Note } from "@/lib/notes-context";
import { ChevronRight, Terminal, Maximize2, Minimize2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getYear } from "date-fns";

interface TerminalLine {
  id: number;
  type: "input" | "output" | "error" | "success" | "header";
  content: string;
}

interface ArchiveTerminalProps {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (path: { year?: string; month?: string; day?: string }) => void;
}

export function ArchiveTerminal({ isOpen, onToggle, onNavigate }: ArchiveTerminalProps) {
  const { notes } = useNotes();
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 0, type: "header", content: "THOUGHT VAULT ARCHIVE TERMINAL v1.0" },
    { id: 1, type: "output", content: 'Type "help" for available commands.' },
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentPath, setCurrentPath] = useState<string[]>(["root"]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const lineIdRef = useRef(2);

  // Build the archive tree from notes
  const archiveTree = React.useMemo(() => {
    const tree: Record<string, Record<string, Record<string, Note[]>>> = {};

    notes.forEach((note) => {
      const date = new Date(note.timestamp);
      const year = getYear(date).toString();
      const month = date.toLocaleString('default', { month: 'long' });
      const day = date.toISOString().split('T')[0];

      if (!tree[year]) tree[year] = {};
      if (!tree[year][month]) tree[year][month] = {};
      if (!tree[year][month][day]) tree[year][month][day] = [];

      tree[year][month][day].push(note);
    });

    return tree;
  }, [notes]);

  const addLine = useCallback((type: TerminalLine["type"], content: string) => {
    const newLine: TerminalLine = { id: lineIdRef.current++, type, content };
    setLines((prev) => [...prev, newLine]);
  }, []);

  const getCurrentPathString = () => {
    return "/" + currentPath.join("/");
  };

  const getContentsAtPath = () => {
    if (currentPath.length === 1) {
      // At root - show years
      return { type: "years", items: Object.keys(archiveTree).sort((a, b) => Number(b) - Number(a)) };
    } else if (currentPath.length === 2) {
      // At year - show months
      const year = currentPath[1];
      if (archiveTree[year]) {
        return { type: "months", items: Object.keys(archiveTree[year]) };
      }
    } else if (currentPath.length === 3) {
      // At month - show days
      const [, year, month] = currentPath;
      if (archiveTree[year]?.[month]) {
        return { type: "days", items: Object.keys(archiveTree[year][month]).sort() };
      }
    } else if (currentPath.length === 4) {
      // At day - show notes
      const [, year, month, day] = currentPath;
      if (archiveTree[year]?.[month]?.[day]) {
        return { type: "notes", items: archiveTree[year][month][day] };
      }
    }
    return { type: "empty", items: [] };
  };

  const executeCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    addLine("input", `> ${cmd}`);

    if (!trimmedCmd) return;

    switch (command) {
      case "where":
        addLine("success", getCurrentPathString());
        break;

      case "list":
      case "ls":
        const contents = getContentsAtPath();
        if (contents.items.length === 0) {
          addLine("output", "(empty directory)");
        } else if (contents.type === "notes") {
          addLine("output", `Found ${(contents.items as Note[]).length} entries:`);
          (contents.items as Note[]).forEach((note) => {
            const time = new Date(note.timestamp).toLocaleTimeString([], { hour12: false });
            addLine("output", `  [${time}] ${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}`);
          });
        } else {
          contents.items.forEach((item) => {
            addLine("output", `  [DIR]  ${item}/`);
          });
        }
        break;

      case "cd":
        if (args.length === 0) {
          addLine("error", "Usage: cd <directory>");
          break;
        }
        const target = args[0];
        
        if (target === "/" || target === "~") {
          setCurrentPath(["root"]);
          addLine("success", "Changed to /root");
          onNavigate({});
        } else if (target === "..") {
          if (currentPath.length > 1) {
            const newPath = currentPath.slice(0, -1);
            setCurrentPath(newPath);
            addLine("success", `Changed to /${newPath.join("/")}`);
            // Navigate UI
            if (newPath.length === 1) onNavigate({});
            else if (newPath.length === 2) onNavigate({ year: newPath[1] });
            else if (newPath.length === 3) onNavigate({ year: newPath[1], month: newPath[2] });
          } else {
            addLine("output", "Already at root");
          }
        } else {
          // Check if target exists
          const contents = getContentsAtPath();
          const actualTarget = contents.items.find((item) => {
            if (typeof item === "string") {
              return item.toLowerCase() === target.toLowerCase() || item === target;
            }
            return false;
          });

          if (actualTarget && typeof actualTarget === "string") {
            const newPath = [...currentPath, actualTarget];
            setCurrentPath(newPath);
            addLine("success", `Changed to /${newPath.join("/")}`);
            // Navigate UI
            if (newPath.length === 2) onNavigate({ year: newPath[1] });
            else if (newPath.length === 3) onNavigate({ year: newPath[1], month: newPath[2] });
            else if (newPath.length === 4) onNavigate({ year: newPath[1], month: newPath[2], day: newPath[3] });
          } else {
            addLine("error", `Directory not found: ${target}`);
          }
        }
        break;

      case "show":
        if (args.length === 0) {
          addLine("error", "Usage: show YYYY-MM-DD");
          addLine("output", "Example: show 2025-12-11");
          break;
        }
        const dateArg = args[0].replace("--", "").trim();
        
        // Find notes for this date
        let foundNotes: Note[] = [];
        Object.entries(archiveTree).forEach(([year, months]) => {
          Object.entries(months).forEach(([month, days]) => {
            Object.entries(days).forEach(([day, dayNotes]) => {
              if (day === dateArg) {
                foundNotes = dayNotes;
              }
            });
          });
        });

        if (foundNotes.length === 0) {
          addLine("error", `No entries found for date: ${dateArg}`);
        } else {
          addLine("output", "┌──────────────────────────────────────────────");
          addLine("output", `│ DATE: ${dateArg}`);
          addLine("output", `│ ENTRIES: ${foundNotes.length}`);
          addLine("output", "├──────────────────────────────────────────────");
          foundNotes.forEach((note) => {
            const time = new Date(note.timestamp).toLocaleTimeString([], { hour12: false });
            // Split long content into multiple lines
            const contentLines = note.content.split('\n');
            contentLines.forEach((line, idx) => {
              if (idx === 0) {
                addLine("output", `│ [${time}] ${line}`);
              } else {
                addLine("output", `│          ${line}`);
              }
            });
          });
          addLine("output", "└──────────────────────────────────────────────");
        }
        break;

      case "help":
        addLine("header", "╔════════════════════════════════════════════════╗");
        addLine("header", "║        ARCHIVE TERMINAL - COMMANDS             ║");
        addLine("header", "╠════════════════════════════════════════════════╣");
        addLine("output", "│ where              Show current directory      │");
        addLine("output", "│ list (or ls)       List contents               │");
        addLine("output", "│ cd <dir>           Change directory            │");
        addLine("output", "│ cd ..              Go back one level           │");
        addLine("output", "│ cd /               Return to root              │");
        addLine("output", "│ show YYYY-MM-DD    Show entries for date       │");
        addLine("output", "│ clear              Clear terminal              │");
        addLine("output", "│ help               Show this help              │");
        addLine("header", "╚════════════════════════════════════════════════╝");
        break;

      case "clear":
        setLines([
          { id: lineIdRef.current++, type: "header", content: "THOUGHT VAULT ARCHIVE TERMINAL v1.0" },
          { id: lineIdRef.current++, type: "output", content: 'Terminal cleared.' },
        ]);
        break;

      default:
        addLine("error", `Command not found: ${command}`);
        addLine("output", 'Type "help" for available commands.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setCommandHistory((prev) => [...prev, input]);
    setHistoryIndex(-1);
    executeCommand(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || "");
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      executeCommand("clear");
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input when terminal is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getLineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "input":
        return "text-primary";
      case "error":
        return "text-red-400";
      case "success":
        return "text-emerald-400";
      case "header":
        return "text-primary font-bold";
      default:
        return "text-foreground/80";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: isExpanded ? "60vh" : "240px", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-primary/50 bg-background/98 backdrop-blur-sm flex flex-col"
        >
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-card/80 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="text-xs uppercase tracking-widest text-primary font-bold">
                Archive_Terminal
              </span>
              <span className="text-[10px] text-muted-foreground">
                {getCurrentPathString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary"
                title={isExpanded ? "Minimize" : "Maximize"}
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={onToggle}
                className="p-1.5 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-destructive"
                title="Close terminal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Terminal Body */}
          <div
            ref={terminalRef}
            onClick={() => inputRef.current?.focus()}
            className="flex-1 overflow-auto p-3 font-mono text-sm cursor-text"
          >
            {lines.map((line) => (
              <div
                key={line.id}
                className={`${getLineColor(line.type)} whitespace-pre-wrap leading-relaxed`}
              >
                {line.content}
              </div>
            ))}

            {/* Input Line */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
              <span className="text-primary flex items-center">
                <span className="text-muted-foreground text-xs mr-1">
                  {currentPath[currentPath.length - 1]}
                </span>
                <ChevronRight className="w-3 h-3" />
              </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none text-foreground caret-primary"
                spellCheck={false}
                autoComplete="off"
              />
              <span className="w-2 h-4 bg-primary animate-blink" />
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

