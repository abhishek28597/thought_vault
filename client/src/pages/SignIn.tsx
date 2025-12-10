import React, { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { Terminal, Lock, User, ChevronRight } from "lucide-react";

export default function SignIn() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-50 crt-overlay opacity-30" />
      <div className="fixed inset-0 pointer-events-none z-40 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-[4px] w-full animate-scanline opacity-20" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Terminal className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-primary text-glow tracking-tighter">
            ACCESS_VAULT
          </h1>
          <p className="text-muted-foreground">Enter credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute -top-2 left-4 bg-background px-2 text-xs text-primary/70 uppercase tracking-widest">
                Username
              </div>
              <div className="flex border border-border focus-within:border-primary transition-all">
                <div className="w-12 border-r border-border/50 bg-muted/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 bg-transparent p-3 outline-none text-foreground"
                  placeholder="user_id"
                  required
                  data-testid="input-username"
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-2 left-4 bg-background px-2 text-xs text-primary/70 uppercase tracking-widest">
                Password
              </div>
              <div className="flex border border-border focus-within:border-primary transition-all">
                <div className="w-12 border-r border-border/50 bg-muted/20 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent p-3 outline-none text-foreground"
                  placeholder="••••••••"
                  required
                  data-testid="input-password"
                />
              </div>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 border border-destructive bg-destructive/10 text-destructive text-sm"
              data-testid="text-error"
            >
              ERROR: {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary text-sm uppercase tracking-wider border border-primary/30 hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-signin"
          >
            {isLoading ? "AUTHENTICATING..." : "GRANT ACCESS"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            New User?{" "}
            <Link href="/signup">
              <a className="text-primary hover:text-glow transition-all" data-testid="link-signup">
                Initialize Account
              </a>
            </Link>
          </p>
        </div>

        <div className="text-center text-xs text-muted-foreground/50 space-y-1">
          <p>SYSTEM: AES-256 ENCRYPTED</p>
          <p>STATUS: AWAITING AUTH</p>
        </div>
      </motion.div>
    </div>
  );
}
