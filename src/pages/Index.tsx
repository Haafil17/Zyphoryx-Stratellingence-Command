import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Brain, BarChart3, FileSearch, TrendingUp, Shuffle,
  MessageSquare, Users, Zap, ArrowRight, Sparkles, BookOpen,
  AlertTriangle, Database, Clock, Eye, TrendingDown, Check, Shield, Rocket, Target,
  Cpu, Monitor, Landmark, ShoppingCart, Factory, Building2, Truck, HeartPulse,
  Lock, Server, FileCheck, Globe, Key, X
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

/* ── Section 1: What It Does (Features) ── */
const features = [
  { icon: BarChart3, title: "Instant Data Analysis", desc: "Upload Excel, CSV, or financial data. Zephoryx auto-cleans, structures, and analyzes it — no formulas, no pivot tables, no analyst required." },
  { icon: BookOpen, title: "Data Storytelling", desc: "Numbers don't convince — stories do. Zephoryx turns raw data into clear, executive-ready narratives with auto-generated charts and trend explanations." },
  { icon: Brain, title: "AI Co-Founder", desc: "A strategic advisor that never sleeps. It spots growth levers, flags risks, recommends cost cuts, and suggests pivots — like having a co-founder who's seen a thousand businesses." },
  { icon: Shuffle, title: "Scenario Simulation", desc: "Ask 'What if we raise prices 15%?' or 'What happens if we enter a new market?' Zephoryx models the outcomes before you commit a single dollar." },
  { icon: TrendingUp, title: "Predictive Forecasting", desc: "ML-powered revenue forecasts, risk projections, and growth trajectories — each with confidence scores so you know exactly how reliable the prediction is." },
  { icon: MessageSquare, title: "AI Decision Assistant", desc: "Ask plain-English questions about your business. Get data-backed answers with full reasoning — not generic advice, but insights drawn from your actual numbers." },
  { icon: Sparkles, title: "Visual Intelligence", desc: "Interactive charts, trend lines, heatmaps, and KPI dashboards generated automatically. See your business at a glance, not through a spreadsheet." },
  { icon: Users, title: "Built for Founders & Leaders", desc: "Designed for decision-makers, not data scientists. No SQL, no code, no training required. Upload data, get strategy." },
];

/* ── Section 3: Problem ── */
const problems = [
  { icon: Database, title: "Drowning in Data, Starving for Insight", desc: "Your teams juggle dozens of spreadsheets, dashboards, and reports that don't talk to each other. The answers are in the data — but nobody can find them." },
  { icon: Clock, title: "Decisions Come Too Late", desc: "By the time you spot a problem, it has already cost you. Leaders react instead of anticipate — always one quarter behind." },
  { icon: Eye, title: "No Strategic Visibility", desc: "Market shifts, competitive threats, and internal risks stay invisible until they hit your bottom line. There's no early-warning system." },
  { icon: TrendingDown, title: "Tools That Show, but Don't Tell", desc: "Dashboards show charts. But they don't tell you what to do. You still need an analyst to interpret, a strategist to decide, and a week to act." },
];

/* ── Section 4: Solution ── */
const solutions = [
  { icon: Target, title: "One Source of Truth", desc: "Zephoryx consolidates every data source into a single AI-powered intelligence layer — no more silos, no more conflicting numbers.", points: ["Multi-source data integration in minutes", "Automatic cleaning, structuring & validation", "Every department sees the same numbers"] },
  { icon: Shield, title: "See Threats Before They Arrive", desc: "Continuous AI scanning detects anomalies, quantifies risks, and surfaces opportunities — so you act before your competitors even notice.", points: ["Real-time anomaly & outlier detection", "Risk scoring with confidence levels", "Automated alerts for critical changes"] },
  { icon: Rocket, title: "From Data to Decision in Seconds", desc: "Stop guessing. Simulate strategies, model outcomes, and execute with data-backed confidence — all in one conversation with your AI co-founder.", points: ["What-if scenario modeling", "Revenue & growth projections", "AI-generated strategic recommendations"] },
];

/* ── Section 6: Differentiation — Why Not Existing Tools ── */
const comparisonTraditional = [
  "Show dashboards — you still interpret them yourself",
  "Require trained analysts to set up and maintain",
  "No strategic recommendations or decision support",
  "Separate tools for charts, forecasts, and reports",
];

const comparisonZephoryx = [
  "Explains insights in plain English — no interpretation needed",
  "Works for non-technical founders and executives",
  "Gives actionable strategy, not just visualizations",
  "Analysis + storytelling + forecasting + simulation in one platform",
];

/* ── Section 7: Why Not ChatGPT ── */
const chatgptLimitations = [
  "Needs carefully crafted prompts to get useful output",
  "Quality depends entirely on user skill",
  "No persistent data context or memory across sessions",
  "Cannot generate real charts, forecasts, or simulations",
  "Generic advice — not grounded in your actual business data",
];

const zephoryxAdvantages = [
  "Auto-analyzes your data the moment you upload it",
  "Generates structured reports, charts & forecasts automatically",
  "Remembers your business context across every session",
  "Runs real simulations with projected financial outcomes",
  "Every recommendation is backed by your actual numbers",
];

/* ── Platform Architecture ── */
const layers = [
  { icon: Database, title: "Data Integration", desc: "Connect financials, operations, sales, HR, and market data. Automated ingestion — no manual formatting." },
  { icon: Cpu, title: "Intelligence Engine", desc: "AI cleans, normalizes, and cross-references your data. Detects patterns and anomalies humans miss." },
  { icon: TrendingUp, title: "Prediction Layer", desc: "ML models forecast trends, estimate risks, and project growth — each with a confidence score." },
  { icon: Brain, title: "Strategy Layer", desc: "Scenario simulation, what-if modeling, and co-founder-grade strategic recommendations." },
  { icon: Monitor, title: "Executive Interface", desc: "Real-time KPIs, interactive charts, strategic alerts, and a natural-language query bar. Your command center." },
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
  { icon: Lock, title: "Enterprise Encryption", desc: "AES-256 at rest, TLS 1.3 in transit. Protected at every layer." },
  { icon: Server, title: "Cloud & On-Premise", desc: "Deploy anywhere — zero compromise on performance or security." },
  { icon: FileCheck, title: "Compliance Ready", desc: "SOC 2, GDPR, HIPAA compliant. Built for regulated industries." },
  { icon: Globe, title: "Data Residency", desc: "Multi-region support with full data sovereignty control." },
  { icon: Key, title: "Access Control", desc: "Role-based access, SSO, MFA, and comprehensive audit logging." },
  { icon: Shield, title: "Zero Trust", desc: "Every request verified, every action logged. Defense in depth." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const Index = () => {
  return (
    <div>
      {/* ═══ HERO — What It Is ═══ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-20 dark:opacity-20" />
          <div className="absolute inset-0 neural-bg" />
          <div className="absolute inset-0 grid-pattern opacity-10" />
        </div>
        <div className="container relative z-10 py-24">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-semibold mb-8">
              <Brain className="h-4 w-4" /> Your AI Strategic Co-Founder
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.02] mb-8 tracking-tight">
              <span className="gradient-text">Upload Data.</span><br />
              <span className="text-foreground">Get Decisions,</span><br />
              <span className="text-foreground">Not Dashboards.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-6 leading-relaxed">
              Zephoryx Stratelligence is an AI-powered platform that analyzes your business data, tells the story behind the numbers, and acts like a strategic co-founder — guiding every decision with intelligence, not guesswork.
            </p>
            <p className="text-base text-primary font-semibold mb-10 italic">
              "We don't just analyze your data — we tell you exactly what to do next."
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/contact">
                <Button size="lg" className="gradient-primary text-primary-foreground font-bold border-0 px-10 py-6 text-base">
                  Request a Demo <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary px-10 py-6 text-base font-bold">
                  Try the Platform
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ SECTION 2: What It Does ═══ */}
      <section className="py-24 border-t border-border/30">
        <div className="container">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-5 tracking-tight">
              What <span className="gradient-text">Zephoryx</span> Actually Does
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg font-medium">
              One platform that replaces your analyst, your BI tool, and your strategy consultant.
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

      {/* ═══ SECTION 3: The Problem ═══ */}
      <section className="py-24 border-t border-border/30">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-destructive/30 bg-destructive/5 text-destructive text-sm font-medium mb-6">
              <AlertTriangle className="h-4 w-4" /> The Real Problem
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
              You Have Data. You Don't Have <span className="text-destructive">Answers.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Businesses collect more data than ever — but most still make decisions based on gut feeling. The data exists. The clarity doesn't.
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
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-12 text-center">
            <p className="text-xl font-bold text-muted-foreground">
              Hiring analysts is expensive. Waiting for reports is slow.<br />
              <span className="gradient-text font-black">You need a faster way to go from data to decision.</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ SECTION 4: The Solution ═══ */}
      <section className="py-20 border-t border-border/30">
        <div className="container max-w-5xl">
          <div className="flex items-center gap-4 mb-16">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <span className="text-sm font-bold gradient-text px-4">THE SOLUTION</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-6">
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
              Raw Data → Insights → Story → Strategy → <span className="gradient-text">Action</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Zephoryx removes the confusion. Upload your data. Get clear, actionable decisions — instantly. No analysts. No waiting. No guesswork.
            </p>
          </motion.div>
          <div className="space-y-6 mt-12">
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

      {/* ═══ SECTION 5: USP ═══ */}
      <section className="py-20 border-t border-border/30">
        <div className="container max-w-4xl">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="glass-card glow-border p-12 md:p-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-semibold mb-8">
              <Zap className="h-4 w-4" /> What Makes Us Different
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
              Analysis + Storytelling + Strategy + Simulation<br />
              <span className="gradient-text">In One Platform.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              Other tools show you charts. Zephoryx tells you what the charts mean, what's about to change, and what you should do about it — like a co-founder who's always three steps ahead.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              {[
                { label: "Data to Decisions", value: "Seconds" },
                { label: "Accuracy Rate", value: "95%+" },
                { label: "Setup Required", value: "Zero" },
                { label: "AI Availability", value: "24/7" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-black gradient-text mb-1">{s.value}</div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ SECTION 6: Differentiation — vs Traditional Tools ═══ */}
      <section className="py-20 border-t border-border/30">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
              Power BI & Tableau Show Dashboards.<br />
              <span className="gradient-text">Zephoryx Makes Decisions.</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card p-8">
              <h3 className="text-lg font-bold mb-4 text-destructive flex items-center gap-2">
                <X className="h-5 w-5" /> Traditional BI Tools
              </h3>
              <div className="space-y-3">
                {comparisonTraditional.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm">
                    <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card glow-border p-8">
              <h3 className="text-lg font-bold mb-4 text-primary flex items-center gap-2">
                <Check className="h-5 w-5" /> Zephoryx Stratelligence
              </h3>
              <div className="space-y-3">
                {comparisonZephoryx.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 7: Why Not ChatGPT ═══ */}
      <section className="py-20 border-t border-border/30">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
              "Why Not Just Use <span className="text-destructive">ChatGPT</span>?"
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Fair question. Here's the honest answer.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card p-8">
              <h3 className="text-lg font-bold mb-4 text-destructive flex items-center gap-2">
                <X className="h-5 w-5" /> ChatGPT
              </h3>
              <div className="space-y-3">
                {chatgptLimitations.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm">
                    <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card glow-border p-8">
              <h3 className="text-lg font-bold mb-4 text-primary flex items-center gap-2">
                <Check className="h-5 w-5" /> Zephoryx
              </h3>
              <div className="space-y-3">
                {zephoryxAdvantages.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-10 text-center">
            <p className="text-lg font-bold text-muted-foreground">
              ChatGPT answers questions. <span className="gradient-text font-black">Zephoryx tells you what matters — without you asking.</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ How It Works — Platform Architecture ═══ */}
      <section className="py-20 border-t border-border/30">
        <div className="container max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
              How <span className="gradient-text">Zephoryx</span> Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Five intelligent layers working together — from raw data to strategic action.
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

      {/* ═══ Industries ═══ */}
      <section className="py-20 border-t border-border/30">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
              Built for <span className="gradient-text">Every Industry</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Zephoryx adapts to your domain with industry-specific intelligence models.
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

      {/* ═══ Security ═══ */}
      <section className="py-20 border-t border-border/30">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
              Enterprise-Grade <span className="gradient-text">Security</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Your data is your competitive advantage. We protect it like it's ours.
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

      {/* ═══ SECTION 8: Final Positioning — CTA ═══ */}
      <section className="py-24">
        <div className="container">
          <div className="glass-card glow-border p-16 text-center">
            <p className="text-sm font-bold text-primary uppercase tracking-wider mb-4">Your AI Strategic Co-Founder</p>
            <h2 className="text-3xl md:text-5xl font-black mb-5 tracking-tight">
              Upload Your Data.<br />
              <span className="gradient-text">Get Decisions, Not Dashboards.</span>
            </h2>
            <p className="text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed text-lg font-medium">
              Stop drowning in spreadsheets. Start leading with intelligence. Zephoryx turns your data into your unfair advantage.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="gradient-primary text-primary-foreground font-bold border-0 px-12 py-6 text-base">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="border-border font-bold px-12 py-6 text-base">
                  Try the Platform
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
