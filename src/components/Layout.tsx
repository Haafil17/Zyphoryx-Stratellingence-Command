import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { Menu, X, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/problem", label: "Problem & Solution" },
  { to: "/features", label: "Features" },
  { to: "/platform", label: "Platform" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/analytics", label: "Analytics" },
  { to: "/login", label: "Login" },
  { to: "/contact", label: "Contact" },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Brain className="h-7 w-7 text-primary" />
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
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                  location.pathname === link.to
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/contact">
              <Button size="sm" className="hidden sm:inline-flex gradient-primary text-primary-foreground font-bold border-0">
                Request Demo
              </Button>
            </Link>
            <button
              className="lg:hidden text-muted-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl"
          >
            <nav className="container py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 text-sm font-semibold rounded-md ${
                    location.pathname === link.to
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </header>

      <main className="pt-16">{children}</main>

      <footer className="border-t border-border/50 py-16 mt-20">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-black text-lg gradient-text">Zephoryx AI</span>
          </div>
          <p className="text-sm text-muted-foreground font-semibold">
            Strategic Intelligence & Decision Ecosystem
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            © {new Date().getFullYear()} Zephoryx AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
