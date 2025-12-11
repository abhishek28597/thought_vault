import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { NotesProvider } from "@/lib/notes-context";
import Dashboard from "@/pages/Dashboard";
import Vault from "@/pages/Vault";
import Vectors from "@/pages/Vectors";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground font-mono flex items-center justify-center">
        <div className="text-primary">Initializing system...</div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/signin" />;
  }

  return <Component />;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground font-mono flex items-center justify-center">
        <div className="text-primary">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/signin">
        <PublicRoute component={SignIn} />
      </Route>
      <Route path="/signup">
        <PublicRoute component={SignUp} />
      </Route>
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/vault">
        <ProtectedRoute component={Vault} />
      </Route>
      <Route path="/vectors">
        <ProtectedRoute component={Vectors} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotesProvider>
          <Router />
          <Toaster />
        </NotesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
