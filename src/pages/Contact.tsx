import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send } from "lucide-react";

const Contact = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Thank you! We'll be in touch shortly.");
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="neural-bg min-h-screen">
      <section className="py-24">
        <div className="container max-w-xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              <span className="gradient-text">Get in Touch</span>
            </h1>
            <p className="text-muted-foreground">Request a demo or schedule a strategic consultation.</p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="glass-card p-8 space-y-5"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">First Name</label>
                <Input required placeholder="John" className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Last Name</label>
                <Input required placeholder="Doe" className="bg-secondary border-border" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Work Email</label>
              <Input required type="email" placeholder="john@company.com" className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Company</label>
              <Input required placeholder="Acme Corp" className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Message</label>
              <Textarea required rows={4} placeholder="Tell us about your strategic needs..." className="bg-secondary border-border" />
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground font-semibold border-0">
              {loading ? "Sending..." : "Send Inquiry"} <Send className="ml-2 h-4 w-4" />
            </Button>
          </motion.form>
        </div>
      </section>
    </div>
  );
};

export default Contact;
