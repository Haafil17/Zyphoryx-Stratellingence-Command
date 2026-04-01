import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Brain, BarChart3, FileSearch, TrendingUp, Shuffle,
  MessageSquare, Users, Zap, ArrowRight, Sparkles, BookOpen,
  AlertTriangle, Database, Clock, Eye, TrendingDown, Check, Shield, Rocket, Target,
  Cpu, Monitor, Landmark, ShoppingCart, Factory, Building2, Truck, HeartPulse,
  Lock, Server, FileCheck, Globe, Key
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  { icon: Sparkles, title: "AI-Powered Data Intelligence", desc: "Upload company data and watch it transform into actionable insights, interactive visualizations, and board-ready strategic reports in seconds." },
  { icon: BookOpen, title: "Data Storytelling Engine", desc: "Turn complex datasets into compelling narratives with auto-generated charts, trend explanations, and executive summaries anyone can understand." },
  { icon: TrendingUp, title: "Predictive Business Forecasting", desc: "Leverage pattern recognition and ML models to forecast revenue, identify emerging risks, and project growth trajectories with confidence scoring." },
  { icon: MessageSquare, title: "AI Decision Assistant", desc: "Ask natural-language questions about your business and receive data-backed recommendations with full reasoning transparency." },
  { icon: Brain, title: "Strategy Co-Founder AI", desc: "Your always-on virtual advisor — surfacing growth levers, competitive threats, cost optimization opportunities, and strategic pivots." },
  { icon: BarChart3, title: "Unified Analytics Platform", desc: "Spreadsheets, documents, charts, forecasts, simulations, and recommendations — consolidated into one powerful command center." },
  { icon: Users, title: "Enterprise-Ready Architecture", desc: "Purpose-built for organizations that demand speed, accuracy, and data-driven decision-making at every level of leadership." },
  { icon: Shuffle, title: "Scenario Simulation Engine", desc: "Model pricing changes, budget reallocations, market expansions, and strategic pivots with projected outcomes before committing resources." },
];

const problems = [
  { icon: Database, title: "Data Overload", desc: "Teams drown in disconnected spreadsheets and dashboards. Critical insights stay buried under noise, costing millions in missed opportunities." },
  { icon: Clock, title: "Reactive Decision-Making", desc: "By the time a problem surfaces, it has already eroded margins. Leaders react instead of anticipate — always one step behind." },
  { icon: Eye, title: "Strategic Blindness", desc: "Market shifts, competitive threats, and internal risks remain invisible until impact. No early-warning system exists." },
  { icon: TrendingDown, title: "Fragmented Analytics", desc: "Finance, marketing, and operations each use different tools. No unified intelligence layer. No single source of truth." },
];

const solutions = [
  { icon: Target, title: "Unified Intelligence Layer", desc: "Zephoryx consolidates every data source into a single, AI-powered intelligence platform — eliminating silos permanently.", points: ["Multi-source data integration", "Automatic cleaning & structuring", "Single source of truth across departments"] },
  { icon: Shield, title: "Predictive Clarity", desc: "Detect threats before they materialize. Continuous AI scanning identifies anomalies, quantifies risks, and surfaces opportunities.", points: ["Real-time anomaly detection", "Risk probability scoring with confidence levels", "Automated early warning alerts"] },
  { icon: Rocket, title: "Strategic Acceleration", desc: "Stop guessing. Simulate strategies, model outcomes, and execute with data-backed confidence at every decision point.", points: ["What-if scenario simulation engine", "Growth projection modeling", "AI-powered strategic recommendations"] },
];

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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const stats = [
  { value: "10x", label: "Faster Insights" },
  { value: "95%", label: "Accuracy Rate" },
  { value: "500+", label: "Data Sources" },
  { value: "24/7", label: "AI Availability" },
];

const Index = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-20 dark:opacity-20" />
          <div className="absolute inset-0 neural-bg" />
          <div className="absolute inset-0 grid-pattern opacity-10" />
        </div>
        <div className="container relative z-10 py-24">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-semibold mb-8">
              <Brain className="h-4 w-4" /> Strategic Intelligence Platform
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.02] mb-8 tracking-tight">
              <span className="gradient-text">Zephoryx AI</span><br />
              <span className="text-foreground">Strategic</span><br />
              <span className="text-foreground">Decision Engine</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed">
              Transform raw business data into strategic firepower. Predict outcomes, simulate scenarios, and lead with intelligence that thinks like a co-founder.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/contact">
                <Button size="lg" className="gradient-primary text-primary-foreground font-bold border-0 px-10 py-6 text-base">
                  Request a Demo <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary px-10 py-6 text-base font-bold">
                  Launch Platform
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-border/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="text-4xl md:text-5xl font-black gradient-text mb-2">{s.value}</div>
                <div className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-destructive/30 bg-destructive/5 text-destructive text-sm font-medium mb-6">
              <AlertTriangle className="h-4 w-4" /> The Enterprise Crisis
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
              Your Data Is <span className="text-destructive">Failing</span> You
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              In today's hyper-competitive landscape, enterprises that cannot predict, simulate, and act on real-time intelligence are already losing ground.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-5">
            {problems.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card p-6 flex gap-4 items-start hover:glow-border transition-all duration-300">
                <div className="p-3 rounded-lg bg-destructive/10 shrink-0"><p.icon className="h-5 w-5 text-destructive" /></div>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 border-t border-border/30">
        <div className="container max-w-5xl">
          <div className="flex items-center gap-4 mb-16">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <span className="text-sm font-bold gradient-text px-4">THE SOLUTION</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
              The <span className="gradient-text">Zephoryx</span> Advantage
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              One platform that transforms chaos into clarity, uncertainty into strategy, and data into decisive action.
            </p>
          </motion.div>
          <div className="space-y-6">
            {solutions.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card glow-border p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-lg gradient-primary shrink-0"><s.icon className="h-5 w-5 text-primary-foreground" /></div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">{s.title}</h3>
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
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 border-t border-border/30">
        <div className="container">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-5 tracking-tight">
              One Platform. <span className="gradient-text">Total Intelligence.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg font-medium">
              Everything your leadership team needs to dominate data-driven strategy — powered by AI that deeply understands your business context.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="glass-card p-7 hover:glow-border transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-extrabold text-base mb-3 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Platform Layers */}
      <section className="py-20 border-t border-border/30">
        <div className="container max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
              How <span className="gradient-text">Zephoryx</span> Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Five intelligent layers working in harmony to deliver strategic intelligence at enterprise scale.
            </p>
          </motion.div>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-accent/50 to-primary/50 hidden md:block" />
            <div className="space-y-6">
              {layers.map((l, i) => (
                <motion.div key={l.title} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="flex gap-5 items-start">
                  <div className="relative z-10 p-3 rounded-lg gradient-primary shrink-0"><l.icon className="h-5 w-5 text-primary-foreground" /></div>
                  <div className="glass-card p-5 flex-1">
                    <div className="text-xs text-primary font-bold mb-1 uppercase tracking-wider">Layer {i + 1}</div>
                    <h3 className="text-lg font-bold mb-2 text-foreground">{l.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{l.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-20 border-t border-border/30">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
              Built for <span className="gradient-text">Every Industry</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Zephoryx adapts to your domain with industry-specific intelligence models and workflows.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {industries.map((ind, i) => (
              <motion.div key={ind.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass-card p-6 hover:glow-border transition-all duration-300">
                <ind.icon className="h-7 w-7 text-primary mb-3" />
                <h3 className="font-bold mb-2 text-foreground">{ind.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{ind.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 border-t border-border/30">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
              Enterprise-Grade <span className="gradient-text">Security</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Your data deserves military-grade protection. Zephoryx delivers it across every layer.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {securityItems.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass-card p-6">
                <item.icon className="h-7 w-7 text-primary mb-3" />
                <h3 className="font-bold mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container">
          <div className="glass-card glow-border p-16 text-center">
            <h2 className="text-3xl md:text-5xl font-black mb-5 tracking-tight">
              Ready to <span className="gradient-text">Transform</span> Your Strategy?
            </h2>
            <p className="text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed text-lg font-medium">
              Join forward-thinking enterprises already using Zephoryx AI to outthink, outperform, and outlast the competition.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="gradient-primary text-primary-foreground font-bold border-0 px-12 py-6 text-base">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/analytics">
                <Button size="lg" variant="outline" className="border-border font-bold px-12 py-6 text-base">
                  Explore Analytics
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
