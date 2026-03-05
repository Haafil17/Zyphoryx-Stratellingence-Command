import { motion } from "framer-motion";
import {
  Database, Cpu, TrendingUp, Brain, Monitor,
  Landmark, ShoppingCart, Factory, Building2, Truck, HeartPulse,
  Shield, Lock, Server, FileCheck, Globe, Key
} from "lucide-react";

const layers = [
  { icon: Database, title: "Data Integration Layer", desc: "Connect all your data sources — financial, operational, sales, HR, and market data. Fully automated ingestion and structuring pipeline." },
  { icon: Cpu, title: "Intelligence Processing", desc: "AI cleans, normalizes, and analyzes data in real time. Pattern detection, anomaly identification, and statistical modeling at scale." },
  { icon: TrendingUp, title: "Prediction Engine", desc: "Machine learning models forecast trends, estimate risks, and project growth trajectories with confidence scoring." },
  { icon: Brain, title: "Strategic Engine", desc: "Scenario simulation, what-if modeling, strategic recommendations, and co-founder advisory intelligence for leadership teams." },
  { icon: Monitor, title: "Executive Interface", desc: "Premium command center with real-time KPIs, interactive visualizations, strategic alerts, and natural language queries." },
];

const industries = [
  { icon: Landmark, title: "Finance & Banking", desc: "Risk modeling, portfolio analytics, regulatory compliance, and market forecasting." },
  { icon: ShoppingCart, title: "Retail & E-Commerce", desc: "Demand forecasting, customer behavior analysis, pricing optimization, and inventory intelligence." },
  { icon: Factory, title: "Manufacturing", desc: "Supply chain optimization, quality prediction, production forecasting, and operational efficiency." },
  { icon: Building2, title: "Government", desc: "Public policy simulation, budget forecasting, performance monitoring, and resource allocation." },
  { icon: Truck, title: "Logistics", desc: "Route optimization, demand prediction, fleet analytics, and cost reduction modeling." },
  { icon: HeartPulse, title: "Healthcare", desc: "Patient analytics, resource planning, outcome prediction, and operational efficiency." },
];

const securityItems = [
  { icon: Lock, title: "Enterprise Encryption", desc: "AES-256 at rest, TLS 1.3 in transit. Data protected at every layer." },
  { icon: Server, title: "Cloud & On-Premise", desc: "Deploy anywhere with zero compromise on performance or security." },
  { icon: FileCheck, title: "Compliance Ready", desc: "SOC 2, GDPR, HIPAA compliant. Built for regulated industries." },
  { icon: Globe, title: "Data Residency", desc: "Multi-region support with full data sovereignty control." },
  { icon: Key, title: "Access Control", desc: "Role-based access, SSO, MFA, and comprehensive audit logging." },
  { icon: Shield, title: "Zero Trust Architecture", desc: "Every request verified, every action logged. Defense in depth." },
];

const Platform = () => (
  <div className="neural-bg min-h-screen">
    {/* How It Works */}
    <section className="py-20 md:py-28">
      <div className="container max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            How <span className="gradient-text">Zephoryx</span> Works
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Five intelligent layers working in harmony to deliver strategic intelligence at enterprise scale.
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-accent/50 to-primary/50 hidden md:block" />
          <div className="space-y-6">
            {layers.map((l, i) => (
              <motion.div
                key={l.title}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex gap-5 items-start"
              >
                <div className="relative z-10 p-3 rounded-lg gradient-primary shrink-0">
                  <l.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="glass-card p-5 flex-1">
                  <div className="text-xs text-primary font-bold mb-1 uppercase tracking-wider">Layer {i + 1}</div>
                  <h3 className="text-lg font-bold mb-2">{l.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{l.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Divider */}
    <div className="container max-w-4xl">
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <span className="text-sm font-bold gradient-text px-4">INDUSTRIES</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>
    </div>

    {/* Industries */}
    <section className="py-20">
      <div className="container max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Built for <span className="gradient-text">Every Industry</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Zephoryx adapts to your domain with industry-specific intelligence models and workflows.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {industries.map((ind, i) => (
            <motion.div
              key={ind.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 hover:glow-border transition-all duration-300"
            >
              <ind.icon className="h-7 w-7 text-primary mb-3" />
              <h3 className="font-bold mb-2">{ind.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{ind.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Divider */}
    <div className="container max-w-4xl">
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <span className="text-sm font-bold gradient-text px-4">SECURITY</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>
    </div>

    {/* Security */}
    <section className="py-20">
      <div className="container max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Enterprise-Grade <span className="gradient-text">Security</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Your data deserves military-grade protection. Zephoryx delivers it across every layer.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {securityItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6"
            >
              <item.icon className="h-7 w-7 text-primary mb-3" />
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default Platform;
