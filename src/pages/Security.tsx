import { motion } from "framer-motion";
import { Shield, Lock, Server, FileCheck, Globe, Key } from "lucide-react";

const items = [
  { icon: Lock, title: "Enterprise Encryption", desc: "AES-256 encryption at rest and TLS 1.3 in transit. Your data is protected at every layer." },
  { icon: Server, title: "Cloud & On-Premise", desc: "Deploy in your preferred cloud or on-premise. Full flexibility with zero compromise." },
  { icon: FileCheck, title: "Compliance Ready", desc: "SOC 2, GDPR, HIPAA compliant. Built for the most regulated industries." },
  { icon: Globe, title: "Data Residency", desc: "Choose where your data lives. Multi-region support with full sovereignty control." },
  { icon: Key, title: "Access Control", desc: "Role-based access, SSO integration, MFA, and audit logging for every action." },
  { icon: Shield, title: "Zero Trust Architecture", desc: "Every request verified, every action logged. Defense in depth across every layer." },
];

const SecurityPage = () => (
  <div className="neural-bg min-h-screen">
    <section className="py-24">
      <div className="container max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-6">
            Enterprise-Grade <span className="gradient-text">Security</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your data deserves military-grade protection. We deliver it.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6"
            >
              <item.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default SecurityPage;
