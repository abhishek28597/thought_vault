import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Terminal, Folder, Lock, Wifi, Battery, Cpu, ShieldCheck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export function TerminalLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [time, setTime] = useState(new Date());
  const { user, logout } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative overflow-hidden flex flex-col selection:bg-primary selection:text-background">
      <div className="fixed inset-0 pointer-events-none z-50 crt-overlay opacity-30" />
      <div className="fixed inset-0 pointer-events-none z-40 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-[4px] w-full animate-scanline opacity-20" />

      <header className="border-b border-border bg-background/95 backdrop-blur z-10 px-4 py-2 flex items-center justify-between text-xs md:text-sm uppercase tracking-wider">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Terminal className="w-4 h-4" />
            <span>ThoughtVault_v2.0</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>System Online</span>
          </div>
        </div>

        <nav className="flex items-center gap-6">
          <Link href="/" className={cn("hover:text-primary transition-colors flex items-center gap-1", location === "/" && "text-primary text-glow font-bold")} data-testid="link-dashboard">
            <Cpu className="w-4 h-4" />
            <span className="hidden sm:inline">Input_Stream</span>
          </Link>
          <Link href="/vault" className={cn("hover:text-primary transition-colors flex items-center gap-1", location === "/vault" && "text-primary text-glow font-bold")} data-testid="link-vault">
            <Folder className="w-4 h-4" />
            <span className="hidden sm:inline">Data_Archive</span>
          </Link>
          <button 
            onClick={logout} 
            className="hover:text-destructive transition-colors flex items-center gap-1"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </nav>

        <div className="flex items-center gap-4 text-muted-foreground font-display">
          <div className="hidden md:flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-primary" />
            <span className="text-[10px]">User: {user?.username}</span>
          </div>
          <div className="w-px h-4 bg-border hidden md:block" />
          <span className="text-[10px] md:text-xs">{time.toLocaleTimeString([], { hour12: false })}</span>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-8 relative">
        <div className="max-w-5xl mx-auto w-full relative z-0">
          {children}
        </div>
      </main>

      <footer className="border-t border-border bg-background/95 px-4 py-1 flex items-center justify-between text-[10px] text-muted-foreground uppercase">
        <div className="flex items-center gap-4">
          <span>Mem: 64TB OK</span>
          <span>Cpu: 12%</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Connected</span>
          <span className="flex items-center gap-1"><Battery className="w-3 h-3" /> 100%</span>
        </div>
      </footer>
    </div>
  );
}
