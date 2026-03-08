import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, LogIn, Loader2, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created! Please check your email to verify, then sign in.");
        setIsSignup(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in successfully!");
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="neural-bg min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card glow-border p-10 w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Brain className="h-9 w-9 text-primary" />
          <span className="text-2xl font-black gradient-text">Zephoryx AI</span>
        </div>
        <h2 className="text-xl font-extrabold text-center mb-2">
          {isSignup ? "Create Account" : "Log In"}
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {isSignup ? "Sign up to access the platform" : "Sign in to your account"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary border-border pl-10 h-12"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-secondary border-border pl-10 h-12"
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground font-extrabold h-12 text-base" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
            {isSignup ? "Sign Up" : "Log In"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => setIsSignup(!isSignup)} className="text-primary hover:underline font-bold">
            {isSignup ? "Log In" : "Sign Up"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
