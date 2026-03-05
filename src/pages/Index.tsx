import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Brain, BarChart3, FileSearch, TrendingUp, Shuffle,
  MessageSquare, Users, LayoutDashboard, ArrowRight, Zap
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  { icon: BarChart3, title: "Data Analytics Engine", desc: "Multi-source ingestion, pattern detection, and interactive KPI dashboards." },
  { icon: FileSearch, title: "Document Intelligence", desc: "Upload PDFs, Excel, contracts — AI extracts insights and summaries." },
  { icon: TrendingUp, title: "Predictive Forecasting", desc: "Revenue trends, growth projections, and confidence scoring." },
  { icon: Shuffle, title: "Scenario Simulation", desc: "What-if modeling for strategic decision-making." },
  { icon: MessageSquare, title: "AI Business Assistant", desc: "Ask questions, get data-driven strategic answers." },
  { icon: Users, title: "Co-Founder Mode", desc: "Your AI strategic partner and growth advisor." },
  { icon: LayoutDashboard, title: "Command Center", desc: "Real-time KPIs, risk maps, and strategic alerts." },
  { icon: Zap, title: "Data Storytelling", desc: "Convert raw data into executive narratives." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const Index = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 neural-bg" />
          <div className="absolute inset-0 grid-pattern opacity-20" />
        </div>
        <div className="container relative z-10 py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-6">
              <Brain className="h-4 w-4" />
              Strategic Intelligence Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.05] mb-6">
              <span className="gradient-text">Zephoryx AI</span>
              <br />
              <span className="text-foreground">Your Strategic</span>
              <br />
              <span className="text-foreground">Decision Engine</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
              Transform raw data into strategic power. Predict outcomes, simulate scenarios,
              and command your business with AI-driven intelligence that thinks like a co-founder.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/contact">
                <Button size="lg" className="gradient-primary text-primary-foreground font-semibold border-0 px-8">
                  Request Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary px-8 font-semibold">
                  Enter Platform
                </Button>
              </Link>
            </div>
          </motion.div>
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
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              One Platform. <span className="gradient-text">Total Intelligence.</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Every tool your enterprise needs to dominate data-driven strategy.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="glass-card p-6 hover:glow-border transition-all duration-300 group"
              >
                <f.icon className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="glass-card glow-border p-12 text-center">
            <h2 className="text-3xl font-black mb-4">
              Ready to <span className="gradient-text">Transform</span> Your Strategy?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
              Join enterprises already using Zephoryx AI to outthink, outperform, and outlast the competition.
            </p>
            <Link to="/contact">
              <Button size="lg" className="gradient-primary text-primary-foreground font-semibold border-0 px-10">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
