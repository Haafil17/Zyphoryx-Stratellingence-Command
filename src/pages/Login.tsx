import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, LogIn, Loader2, Mail, Lock, UserPlus, ArrowRight, Sparkles } from "lucide-react";
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
        toast.success("Account created! Check your email to verify, then sign in.");
        setIsSignup(false);
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Check if user is blocked
        const { data: profile } = await supabase.from("profiles").select("blocked").eq("user_id", data.user.id).single();
        if (profile?.blocked) {
          await supabase.auth.signOut();
          toast.error("Your account has been blocked. Contact an administrator.");
          return;
        }
        toast.success("Welcome back!");
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
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 overflow-hidden rounded-2xl border border-border/50">
        {/* Left panel — branding */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col justify-between p-12 bg-primary/5 border-r border-border/50 relative overflow-hidden"
        >
          <div className="absolute inset-0 grid-pattern opacity-5" />
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-12">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold gradient-text">Zephoryx AI</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4 leading-tight">
              Turn data into
              <br />
              <span className="gradient-text">strategic power.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-sm">
              Upload business data and get AI-generated charts, forecasts, simulations, and executive-level insights — instantly.
            </p>
          </div>
          <div className="relative z-10 space-y-3">
            {["AI-powered analytics", "Predictive forecasting", "Strategic recommendations"].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right panel — form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="p-10 md:p-14 bg-card/80 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold gradient-text">Zephoryx AI</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
            {isSignup ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            {isSignup ? "Get started with AI-powered business intelligence." : "Sign in to access your analytics dashboard."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border pl-10 h-12"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border pl-10 h-12"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground font-bold h-12 text-sm border-0 mt-2" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : isSignup ? (
                <UserPlus className="h-4 w-4 mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {isSignup ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button onClick={() => setIsSignup(!isSignup)} className="text-primary hover:underline font-semibold">
                {isSignup ? "Sign in" : "Create one"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
