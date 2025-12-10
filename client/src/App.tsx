import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { NotesProvider } from "@/lib/notes-context";
import Dashboard from "@/pages/Dashboard";
import Vault from "@/pages/Vault";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/vault" component={Vault} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotesProvider>
        <Router />
        <Toaster />
      </NotesProvider>
    </QueryClientProvider>
  );
}

export default App;
