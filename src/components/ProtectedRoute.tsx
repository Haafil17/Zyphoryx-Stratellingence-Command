import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert } from "lucide-react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }
      setAuthenticated(true);
      // Check if blocked
      const { data: profile } = await supabase
        .from("profiles")
        .select("blocked")
        .eq("user_id", session.user.id)
        .single();
      if (profile?.blocked) {
        setBlocked(true);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        setAuthenticated(false);
        setBlocked(false);
        setLoading(false);
      } else {
        setAuthenticated(true);
        supabase.from("profiles").select("blocked").eq("user_id", session.user.id).single().then(({ data }) => {
          setBlocked(!!data?.blocked);
          setLoading(false);
        });
      }
    });

    checkAuth();
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-10 text-center max-w-md">
          <ShieldAlert className="h-14 w-14 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-black text-foreground mb-2">Account Blocked</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Your account has been blocked by an administrator. You cannot access this area.
          </p>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
            className="px-6 py-2 rounded-lg gradient-primary text-white font-bold text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
