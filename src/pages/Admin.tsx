import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield, Users, Settings, LogOut, Brain, BarChart3,
  Activity, Database, Loader2, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAILS = ["haafil006@gmail.com", "syedmusheer982@gmail.com"];

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user;
      setUser(currentUser || null);
      setIsAdmin(!!currentUser && ADMIN_EMAILS.includes(currentUser.email || ""));
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user;
      setUser(currentUser || null);
      setIsAdmin(!!currentUser && ADMIN_EMAILS.includes(currentUser.email || ""));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="neural-bg min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="neural-bg min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-accent mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your account ({user.email}) does not have admin privileges.
          </p>
          <Button onClick={handleLogout} variant="outline">Sign Out</Button>
        </motion.div>
      </div>
    );
  }

  const stats = [
    { label: "Active Users", value: "1,247", icon: Users, change: "+12%" },
    { label: "Data Queries", value: "8,432", icon: Database, change: "+28%" },
    { label: "AI Sessions", value: "3,891", icon: Brain, change: "+45%" },
    { label: "Uptime", value: "99.97%", icon: Activity, change: "Stable" },
  ];

  return (
    <div className="neural-bg min-h-screen">
      <div className="container py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              Admin <span className="gradient-text">Command Center</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome, {user.email}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm" className="border-border">
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <s.icon className="h-5 w-5 text-primary" />
                <span className="text-xs text-success font-medium">{s.change}</span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Admin Panels */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" /> User Management
            </h3>
            <div className="space-y-3">
              {ADMIN_EMAILS.map((email) => (
                <div key={email} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div>
                    <p className="text-sm font-medium">{email}</p>
                    <p className="text-xs text-muted-foreground">Admin</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Active</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-primary" /> Platform Settings
            </h3>
            <div className="space-y-3">
              {[
                { label: "AI Model", value: "Gemini 3 Flash" },
                { label: "Max File Size", value: "20MB" },
                { label: "Data Retention", value: "90 Days" },
                { label: "API Rate Limit", value: "100 req/min" },
              ].map((setting) => (
                <div key={setting.label} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <p className="text-sm">{setting.label}</p>
                  <p className="text-sm font-medium text-primary">{setting.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 lg:col-span-2">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" /> Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "View Analytics", href: "/analytics", icon: BarChart3 },
                { label: "View Dashboard", href: "/dashboard", icon: Activity },
                { label: "Manage Users", href: "#", icon: Users },
                { label: "System Logs", href: "#", icon: Database },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2 border-border hover:border-primary/30"
                  onClick={() => action.href !== "#" && navigate(action.href)}
                >
                  <action.icon className="h-5 w-5 text-primary" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
