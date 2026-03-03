import { motion } from "framer-motion";
import { Check, Shield, Rocket, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const solutions = [
  {
    icon: Target,
    title: "Data Chaos → Unified Intelligence",
    desc: "Zephoryx ingests all your data sources into a single intelligence layer. No more fragmented analytics.",
    points: ["Multi-source data integration", "Automatic cleaning & structuring", "Single source of truth"],
  },
  {
    icon: Shield,
    title: "Risk Blindness → Predictive Clarity",
    desc: "See threats before they materialize. Our AI continuously scans for anomalies, risks, and opportunities.",
    points: ["Real-time anomaly detection", "Risk probability scoring", "Early warning system"],
  },
  {
    icon: Rocket,
    title: "Inefficient Growth → Strategic Acceleration",
    desc: "Stop guessing. Simulate strategies, model scenarios, and execute with confidence.",
    points: ["What-if scenario simulation", "Growth projection modeling", "Strategic recommendation engine"],
  },
];

const Solution = () => (
  <div className="neural-bg min-h-screen">
    <section className="py-24">
      <div className="container max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-black mb-6">
            The <span className="gradient-text">Zephoryx</span> Solution
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One platform that transforms chaos into clarity, uncertainty into strategy,
            and data into decisive action.
          </p>
        </motion.div>

        <div className="space-y-8">
          {solutions.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card glow-border p-8 md:p-10"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg gradient-primary shrink-0">
                  <s.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">{s.title}</h3>
                  <p className="text-muted-foreground">{s.desc}</p>
                </div>
              </div>
              <div className="ml-16 mt-4 space-y-2">
                {s.points.map((p) => (
                  <div key={p} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <span className="text-muted-foreground">{p}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link to="/features">
            <Button size="lg" className="gradient-primary text-primary-foreground font-semibold border-0 px-10">
              Explore Features
            </Button>
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default Solution;
