import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Brain, BarChart3, FileSearch, TrendingUp, Shuffle,
  MessageSquare, Users, Zap, ArrowRight, Sparkles, BookOpen
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Data Intelligence",
    desc: "Upload company data and watch it transform into actionable insights, interactive visualizations, and board-ready strategic reports in seconds.",
  },
  {
    icon: BookOpen,
    title: "Data Storytelling Engine",
    desc: "Turn complex datasets into compelling narratives with auto-generated charts, trend explanations, and executive summaries anyone can understand.",
  },
  {
    icon: TrendingUp,
    title: "Predictive Business Forecasting",
    desc: "Leverage pattern recognition and ML models to forecast revenue, identify emerging risks, and project growth trajectories with confidence scoring.",
  },
  {
    icon: MessageSquare,
    title: "AI Decision Assistant",
    desc: "Ask natural-language questions about your business and receive data-backed recommendations with full reasoning transparency.",
  },
  {
    icon: Brain,
    title: "Strategy Co-Founder AI",
    desc: "Your always-on virtual advisor — surfacing growth levers, competitive threats, cost optimization opportunities, and strategic pivots.",
  },
  {
    icon: BarChart3,
    title: "Unified Analytics Platform",
    desc: "Spreadsheets, documents, charts, forecasts, simulations, and recommendations — consolidated into one powerful command center.",
  },
  {
    icon: Users,
    title: "Enterprise-Ready Architecture",
    desc: "Purpose-built for organizations that demand speed, accuracy, and data-driven decision-making at every level of leadership.",
  },
  {
    icon: Shuffle,
    title: "Scenario Simulation Engine",
    desc: "Model pricing changes, budget reallocations, market expansions, and strategic pivots with projected outcomes before committing resources.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
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
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-semibold mb-8">
              <Brain className="h-4 w-4" />
              Strategic Intelligence Platform
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.02] mb-8 tracking-tight">
              <span className="gradient-text">Zephoryx AI</span>
              <br />
              <span className="text-foreground">Your Strategic</span>
              <br />
              <span className="text-foreground">Decision Engine</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed font-medium">
              Transform raw business data into strategic firepower. Predict outcomes, simulate scenarios,
              and lead with AI-driven intelligence that thinks like a seasoned co-founder.
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
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-black gradient-text mb-2">{s.value}</div>
                <div className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-5 tracking-tight">
              One Platform. <span className="gradient-text">Total Intelligence.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg font-medium">
              Everything your leadership team needs to dominate data-driven strategy — powered by AI that deeply understands your business context.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="glass-card p-7 hover:glow-border transition-all duration-300 group"
              >
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

      {/* How It Works */}
      <section className="py-20 border-t border-border/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
              How <span className="gradient-text">It Works</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg font-medium">Three steps to strategic intelligence.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Upload Your Data", desc: "Drop CSV, JSON, PDF, or Excel files — revenue reports, expense logs, market research, customer data. Any format, any structure." },
              { step: "02", title: "AI Analyzes Everything", desc: "Our intelligence engine detects patterns, surfaces anomalies, and maps trends. Charts, forecasts, and strategic insights generated automatically." },
              { step: "03", title: "Make Smarter Decisions", desc: "Receive executive summaries, run what-if simulations, and get actionable recommendations backed by data — not gut feelings." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="text-5xl font-black gradient-text mb-4">{item.step}</div>
                <h3 className="text-lg font-bold mb-3 text-foreground">{item.title}</h3>
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
