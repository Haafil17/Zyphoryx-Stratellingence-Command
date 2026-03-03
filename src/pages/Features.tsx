import { motion } from "framer-motion";
import {
  BarChart3, FileSearch, TrendingUp, Shuffle,
  MessageSquare, Users, LayoutDashboard, BookOpen
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Data Analytics Engine",
    desc: "Ingest multi-source data, auto-clean and structure it, generate interactive dashboards with line charts, bar graphs, pie charts, heatmaps, and trend projections. Detect patterns and anomalies automatically.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: FileSearch,
    title: "Document Intelligence",
    desc: "Upload PDFs, Excel sheets, contracts, financial statements. The AI analyzes, extracts key insights, summarizes content, identifies risks and opportunities, and generates executive summaries.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: BookOpen,
    title: "Data Storytelling Engine",
    desc: "Convert analytics into executive-level narratives. Automatically explain trends, describe why numbers changed, highlight performance drivers, and generate boardroom-ready reports.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: TrendingUp,
    title: "Predictive Forecasting",
    desc: "Predict revenue trends, forecast costs, model growth projections. Estimate risk probability with confidence scoring and detect future performance decline or acceleration.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Shuffle,
    title: "Scenario Simulation",
    desc: "Ask 'What if we increase price by 10%?' or 'What if we expand to another country?' The AI simulates scenarios, shows projected outcomes, financial impact, and risk levels.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: MessageSquare,
    title: "AI Business Assistant",
    desc: "Ask 'Why did revenue drop in Q2?' or 'Which department is underperforming?' The assistant accesses company data, references analytics, explains reasoning, and provides actionable recommendations.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: Users,
    title: "AI Co-Founder Mode",
    desc: "Your digital strategic advisor. Suggests growth strategies, identifies profit leaks, recommends cost optimization, detects competitive threats, and provides strategic warnings.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: LayoutDashboard,
    title: "Executive Command Center",
    desc: "Real-time KPIs, predictive graphs, risk heat maps, AI recommendations panel, scenario comparison view, strategic alerts, and performance score indicators.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

const Features = () => (
  <div className="neural-bg min-h-screen">
    <section className="py-24">
      <div className="container max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-black mb-6">
            Platform <span className="gradient-text">Features</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every capability designed to give you unfair strategic advantage.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 hover:glow-border transition-all duration-300"
            >
              <div className={`inline-flex p-3 rounded-lg ${f.bg} mb-4`}>
                <f.icon className={`h-6 w-6 ${f.color}`} />
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default Features;
