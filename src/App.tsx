import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import { FileStoreProvider } from "@/contexts/FileStoreContext";
import Index from "./pages/Index";
import ProblemSolution from "./pages/ProblemSolution";
import Features from "./pages/Features";
import Platform from "./pages/Platform";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FileStoreProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/problem" element={<ProblemSolution />} />
              <Route path="/solution" element={<ProblemSolution />} />
              <Route path="/features" element={<Features />} />
              <Route path="/how-it-works" element={<Platform />} />
              <Route path="/industries" element={<Platform />} />
              <Route path="/security" element={<Platform />} />
              <Route path="/platform" element={<Platform />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </FileStoreProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
