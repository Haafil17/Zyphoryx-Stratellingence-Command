import { motion } from "framer-motion";
import { Database, Cpu, TrendingUp, Brain, Monitor } from "lucide-react";

const layers = [
  { icon: Database, title: "Data Integration Layer", desc: "Connect all your data sources — financial, operational, sales, HR, market. Automatic ingestion and structuring." },
  { icon: Cpu, title: "Intelligence Processing", desc: "AI cleans, normalizes, and analyzes data. Pattern detection, anomaly identification, and statistical modeling." },
  { icon: TrendingUp, title: "Prediction Engine", desc: "Machine learning models forecast trends, estimate risks, and project growth with confidence scoring." },
  { icon: Brain, title: "Strategic Engine", desc: "Scenario simulation, what-if modeling, strategic recommendations, and co-founder advisory intelligence." },
  { icon: Monitor, title: "Executive Interface", desc: "Beautiful command center with real-time KPIs, interactive visualizations, alerts, and natural language queries." },
];

const HowItWorks = () => (
  <div className="neural-bg min-h-screen">
    <section className="py-24">
      <div className="container max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-6">
            How <span className="gradient-text">Zephoryx</span> Works
          </h1>
          <p className="text-lg text-muted-foreground">Five intelligent layers working in harmony.</p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-accent/50 to-primary/50 hidden md:block" />
          <div className="space-y-8">
            {layers.map((l, i) => (
              <motion.div
                key={l.title}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex gap-6 items-start"
              >
                <div className="relative z-10 p-3 rounded-lg gradient-primary shrink-0">
                  <l.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="glass-card p-6 flex-1">
                  <div className="text-xs text-primary font-semibold mb-1">Layer {i + 1}</div>
                  <h3 className="text-lg font-bold mb-2">{l.title}</h3>
                  <p className="text-sm text-muted-foreground">{l.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default HowItWorks;
