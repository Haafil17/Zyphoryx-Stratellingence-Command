import { motion } from "framer-motion";
import { AlertTriangle, Database, Clock, Eye, TrendingDown, Check, Shield, Rocket, Target, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const problems = [
  {
    icon: Database,
    title: "Data Overload",
    desc: "Teams drown in disconnected spreadsheets and dashboards. Critical insights stay buried under noise, costing millions in missed opportunities.",
  },
  {
    icon: Clock,
    title: "Reactive Decision-Making",
    desc: "By the time a problem surfaces, it has already eroded margins. Leaders react instead of anticipate — always one step behind.",
  },
  {
    icon: Eye,
    title: "Strategic Blindness",
    desc: "Market shifts, competitive threats, and internal risks remain invisible until impact. No early-warning system exists.",
  },
  {
    icon: TrendingDown,
    title: "Fragmented Analytics",
    desc: "Finance, marketing, and operations each use different tools. No unified intelligence layer. No single source of truth.",
  },
];

const solutions = [
  {
    icon: Target,
    title: "Unified Intelligence Layer",
    desc: "Zephoryx consolidates every data source into a single, AI-powered intelligence platform — eliminating silos permanently.",
    points: ["Multi-source data integration", "Automatic cleaning & structuring", "Single source of truth across departments"],
  },
  {
    icon: Shield,
    title: "Predictive Clarity",
    desc: "Detect threats before they materialize. Continuous AI scanning identifies anomalies, quantifies risks, and surfaces opportunities.",
    points: ["Real-time anomaly detection", "Risk probability scoring with confidence levels", "Automated early warning alerts"],
  },
  {
    icon: Rocket,
    title: "Strategic Acceleration",
    desc: "Stop guessing. Simulate strategies, model outcomes, and execute with data-backed confidence at every decision point.",
    points: ["What-if scenario simulation engine", "Growth projection modeling", "AI-powered strategic recommendations"],
  },
];

const ProblemSolution = () => (
  <div className="neural-bg min-h-screen">
    {/* Problem Section */}
    <section className="py-20 md:py-28">
      <div className="container max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-destructive/30 bg-destructive/5 text-destructive text-sm font-medium mb-6">
            <AlertTriangle className="h-4 w-4" />
            The Enterprise Crisis
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Your Data Is <span className="text-destructive">Failing</span> You
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            In today's hyper-competitive landscape, enterprises that cannot predict, simulate, and act on real-time intelligence are already losing ground.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5 mb-20">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 flex gap-4 items-start hover:glow-border transition-all duration-300"
            >
              <div className="p-3 rounded-lg bg-destructive/10 shrink-0">
                <p.icon className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-16">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <span className="text-sm font-bold gradient-text px-4">THE SOLUTION</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>

        {/* Solution Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            The <span className="gradient-text">Zephoryx</span> Advantage
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            One platform that transforms chaos into clarity, uncertainty into strategy, and data into decisive action.
          </p>
        </motion.div>

        <div className="space-y-6">
          {solutions.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card glow-border p-8"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg gradient-primary shrink-0">
                  <s.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
              <div className="ml-14 mt-4 space-y-2">
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
              Explore All Features <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default ProblemSolution;
