import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield, Users, Settings, LogOut, Brain, BarChart3,
  Activity, Database, Loader2, AlertTriangle, Ban, UserCheck, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      setUser(currentUser || null);
      if (!currentUser) { setLoading(false); return; }

      // Check admin role via has_role function
      const { data: hasAdmin } = await supabase.rpc("has_role", { _user_id: currentUser.id, _role: "admin" });
      setIsAdmin(!!hasAdmin);
      setLoading(false);

      if (hasAdmin) {
        loadUsers();
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { checkAdmin(); });
    checkAdmin();
    return () => subscription.unsubscribe();
  }, []);

  const loadUsers = async () => {
    const { data: profileData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (profileData) setProfiles(profileData);

    const { data: rolesData } = await supabase.from("user_roles").select("*");
    if (rolesData) {
      setAdminUserIds(rolesData.filter((r: any) => r.role === "admin").map((r: any) => r.user_id));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/login");
  };

  const toggleBlock = async (profileId: string, userId: string, currentlyBlocked: boolean) => {
    const { error } = await supabase.from("profiles").update({ blocked: !currentlyBlocked }).eq("id", profileId);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(currentlyBlocked ? "User unblocked" : "User blocked");
    loadUsers();
  };

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    if (currentlyAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) { toast.error("Failed to remove admin"); return; }
      toast.success("Admin role removed");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) { toast.error("Failed to make admin"); return; }
      toast.success("User is now admin");
    }
    loadUsers();
  };

  if (loading) {
    return (
      <div className="neural-bg min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) { navigate("/login"); return null; }

  if (!isAdmin) {
    return (
      <div className="neural-bg min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-accent mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2 text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your account ({user.email}) does not have admin privileges.
          </p>
          <Button onClick={handleLogout} variant="outline">Sign Out</Button>
        </motion.div>
      </div>
    );
  }

  const totalUsers = profiles.length;
  const blockedUsers = profiles.filter((p: any) => p.blocked).length;
  const totalAdmins = adminUserIds.length;

  const stats = [
    { label: "Total Users", value: totalUsers.toString(), icon: Users, change: "Live" },
    { label: "Admins", value: totalAdmins.toString(), icon: ShieldCheck, change: "Active" },
    { label: "Blocked", value: blockedUsers.toString(), icon: Ban, change: blockedUsers > 0 ? "Action needed" : "None" },
    { label: "Active", value: (totalUsers - blockedUsers).toString(), icon: Activity, change: "Online" },
  ];

  return (
    <div className="neural-bg min-h-screen">
      <div className="container py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              Admin <span className="gradient-text">Command Center</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome, {user.email}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm" className="border-border">
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <s.icon className="h-5 w-5 text-primary" />
                <span className="text-xs text-success font-medium">{s.change}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* User Management */}
        <div className="glass-card p-6 mb-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4 text-foreground">
            <Users className="h-5 w-5 text-primary" /> User Management
          </h3>
          <div className="space-y-3">
            {profiles.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>
            )}
            {profiles.map((profile: any) => {
              const isProfileAdmin = adminUserIds.includes(profile.user_id);
              const isCurrentUser = profile.user_id === user.id;
              return (
                <div key={profile.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                  <div>
                    <p className="text-sm font-medium text-foreground">{profile.email || profile.display_name || "Unknown"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {isProfileAdmin && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">Admin</span>
                      )}
                      {profile.blocked && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold">Blocked</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {!isCurrentUser && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={profile.blocked ? "default" : "outline"}
                        className="text-xs h-8"
                        onClick={() => toggleBlock(profile.id, profile.user_id, profile.blocked)}
                      >
                        {profile.blocked ? <><UserCheck className="h-3 w-3 mr-1" /> Unblock</> : <><Ban className="h-3 w-3 mr-1" /> Block</>}
                      </Button>
                      <Button
                        size="sm"
                        variant={isProfileAdmin ? "destructive" : "outline"}
                        className="text-xs h-8"
                        onClick={() => toggleAdmin(profile.user_id, isProfileAdmin)}
                      >
                        {isProfileAdmin ? <><Shield className="h-3 w-3 mr-1" /> Remove Admin</> : <><ShieldCheck className="h-3 w-3 mr-1" /> Make Admin</>}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4 text-foreground">
            <BarChart3 className="h-5 w-5 text-primary" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "View Analytics", href: "/analytics", icon: BarChart3 },
              { label: "View Dashboard", href: "/dashboard", icon: Activity },
              { label: "Refresh Users", href: "#refresh", icon: Users },
              { label: "Platform Settings", href: "#", icon: Settings },
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 border-border hover:border-primary/30"
                onClick={() => {
                  if (action.href === "#refresh") { loadUsers(); toast.success("Users refreshed"); }
                  else if (action.href !== "#") navigate(action.href);
                }}
              >
                <action.icon className="h-5 w-5 text-primary" />
                <span className="text-xs text-foreground">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
