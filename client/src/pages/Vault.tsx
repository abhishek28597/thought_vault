import React, { useState, useMemo } from "react";
import { TerminalLayout } from "@/components/layout/TerminalLayout";
import { useNotes, Note } from "@/lib/notes-context";
import { getYear } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, ChevronRight, Calendar, HardDrive, Database, Loader2 } from "lucide-react";

type ViewMode = "years" | "months" | "days" | "notes";

export default function Vault() {
  const { notes, isLoading } = useNotes();
  const [viewMode, setViewMode] = useState<ViewMode>("years");
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const groupedNotes = useMemo(() => {
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

  const years = Object.keys(groupedNotes).sort((a, b) => Number(b) - Number(a));

  const Breadcrumbs = () => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 font-mono">
       <button onClick={() => { setViewMode("years"); setSelectedYear(null); }} className="hover:text-primary transition-colors flex items-center" data-testid="breadcrumb-root">
         <HardDrive className="w-4 h-4 mr-1" /> root
       </button>
       {selectedYear && (
         <>
           <ChevronRight className="w-4 h-4" />
           <button onClick={() => { setViewMode("months"); setSelectedMonth(null); }} className="hover:text-primary transition-colors" data-testid="breadcrumb-year">
             {selectedYear}
           </button>
         </>
       )}
       {selectedMonth && (
         <>
           <ChevronRight className="w-4 h-4" />
           <button onClick={() => { setViewMode("days"); setSelectedDay(null); }} className="hover:text-primary transition-colors" data-testid="breadcrumb-month">
             {selectedMonth}
           </button>
         </>
       )}
       {selectedDay && (
         <>
           <ChevronRight className="w-4 h-4" />
           <span className="text-primary">{selectedDay}</span>
         </>
       )}
    </div>
  );

  if (isLoading) {
    return (
      <TerminalLayout>
        <div className="flex items-center justify-center min-h-[400px] text-primary">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-3">Loading archive index...</span>
        </div>
      </TerminalLayout>
    );
  }

  return (
    <TerminalLayout>
      <div className="max-w-5xl mx-auto h-full">
        <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
            <Database className="w-6 h-6" /> ARCHIVE_INDEX
          </h1>
          <div className="text-xs text-muted-foreground">
            Total Records: {notes.length}
          </div>
        </div>

        <Breadcrumbs />

        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {viewMode === "years" && (
              <motion.div 
                key="years"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => { setSelectedYear(year); setViewMode("months"); }}
                    className="group p-6 border border-border hover:border-primary/50 bg-card/30 hover:bg-card/80 transition-all flex flex-col items-center gap-4 aspect-square justify-center"
                    data-testid={`folder-year-${year}`}
                  >
                    <Folder className="w-16 h-16 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1} />
                    <span className="text-xl font-bold font-mono group-hover:text-primary group-hover:text-glow transition-all">{year}</span>
                    <span className="text-xs text-muted-foreground">{Object.keys(groupedNotes[year]).length} months</span>
                  </button>
                ))}
              </motion.div>
            )}

            {viewMode === "months" && selectedYear && (
              <motion.div 
                key="months"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {Object.keys(groupedNotes[selectedYear]).map((month) => (
                  <button
                    key={month}
                    onClick={() => { setSelectedMonth(month); setViewMode("days"); }}
                    className="group p-6 border border-border hover:border-primary/50 bg-card/30 hover:bg-card/80 transition-all flex flex-col items-center gap-4 aspect-square justify-center"
                    data-testid={`folder-month-${month}`}
                  >
                    <Folder className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1} />
                    <span className="text-lg font-bold font-mono group-hover:text-primary transition-colors uppercase">{month}</span>
                  </button>
                ))}
              </motion.div>
            )}

            {viewMode === "days" && selectedYear && selectedMonth && (
              <motion.div 
                key="days"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              >
                {Object.keys(groupedNotes[selectedYear][selectedMonth]).map((day) => (
                   <button
                    key={day}
                    onClick={() => { setSelectedDay(day); setViewMode("notes"); }}
                    className="group p-4 border border-border hover:border-primary/50 bg-card/30 hover:bg-card/80 transition-all flex flex-col items-start gap-2 h-32"
                    data-testid={`folder-day-${day}`}
                  >
                    <div className="flex items-center gap-2 w-full border-b border-border/30 pb-2 mb-1">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-mono text-muted-foreground group-hover:text-foreground">{day}</span>
                    </div>
                    <div className="flex-1 w-full overflow-hidden">
                      <div className="flex flex-col gap-1">
                        {groupedNotes[selectedYear][selectedMonth][day].map(note => (
                           <div key={note.id} className="text-[10px] text-muted-foreground truncate w-full flex items-center gap-1">
                             <span className="w-1 h-1 bg-primary rounded-full flex-shrink-0" />
                             {note.content}
                           </div>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {viewMode === "notes" && selectedYear && selectedMonth && selectedDay && (
              <motion.div 
                 key="notes"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-4"
              >
                {groupedNotes[selectedYear][selectedMonth][selectedDay].map((note) => (
                  <div key={note.id} className="border border-border p-6 bg-card/50 relative overflow-hidden group hover:border-primary/50 transition-colors" data-testid={`note-detail-${note.id}`}>
                     <div className="absolute top-0 right-0 p-2 opacity-50 text-[10px] uppercase tracking-widest border-l border-b border-border text-primary bg-background/50">
                        Encrypted
                     </div>
                     <div className="mb-4 flex items-center gap-2 text-sm text-primary font-mono">
                        <span className="w-2 h-2 bg-primary animate-pulse" />
                        {new Date(note.timestamp).toLocaleTimeString([], { hour12: false })}
                     </div>
                     <p className="font-mono text-foreground/90 leading-relaxed whitespace-pre-wrap">
                       {note.content}
                     </p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TerminalLayout>
  );
}
