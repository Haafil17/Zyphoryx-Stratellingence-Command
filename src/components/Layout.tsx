import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/analytics", label: "Analytics", highlight: true },
  { to: "/contact", label: "Contact" },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
        setIsAdmin(!!data);
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
      } else {
        setIsAdmin(false);
      }
    });
    checkAuth();
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Zephoryx AI Lab" className="h-8 w-8 rounded-md object-cover" />
            <span className="text-lg font-black tracking-tight">
              <span className="gradient-text">Zephoryx</span>{" "}
              <span className="text-muted-foreground font-semibold text-sm">AI</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 text-sm font-bold rounded-md transition-colors ${
                  location.pathname === link.to
                    ? "text-primary bg-primary/10"
                    : link.highlight
                    ? "text-primary hover:text-primary hover:bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 text-sm font-bold rounded-md transition-colors flex items-center gap-1 ${
                  location.pathname === "/admin" ? "text-primary bg-primary/10" : "text-accent hover:text-accent hover:bg-accent/10"
                }`}
              >
                <Shield className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-1">
                <Link to="/profile">
                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground font-semibold text-xs">
                    <User className="h-4 w-4 mr-1" /> Profile
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground font-semibold text-xs">
                  <LogOut className="h-4 w-4 mr-1" /> Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground font-bold text-xs hidden sm:inline-flex">
                  Sign In
                </Button>
              </Link>
            )}
            <Link to="/contact">
              <Button size="sm" className="hidden sm:inline-flex gradient-primary text-primary-foreground font-extrabold border-0">
                Request Demo
              </Button>
            </Link>
            <button className="lg:hidden text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
            <nav className="container py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 text-sm font-bold rounded-md ${location.pathname === link.to ? "text-primary bg-primary/10" : link.highlight ? "text-primary" : "text-muted-foreground"}`}>
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-bold rounded-md text-accent flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> Admin
                </Link>
              )}
              {user && (
                <button onClick={handleSignOut} className="px-3 py-2.5 text-sm font-bold text-muted-foreground text-left">Sign Out</button>
              )}
            </nav>
          </motion.div>
        )}
      </header>

      <main className="pt-16">{children}</main>

      <footer className="border-t border-border/50 py-16 mt-20">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <img src={logo} alt="Zephoryx AI Lab" className="h-6 w-6 rounded-md object-cover" />
            <span className="font-black text-lg gradient-text">Zephoryx AI</span>
          </div>
          <p className="text-sm text-muted-foreground font-bold">Strategic Intelligence & Decision Ecosystem</p>
          <p className="text-xs text-muted-foreground mt-3">© {new Date().getFullYear()} Zephoryx AI Lab. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
