import { motion } from "framer-motion";
import { AlertTriangle, Database, Clock, Eye, TrendingDown } from "lucide-react";

const problems = [
  {
    icon: Database,
    title: "Data Overload",
    desc: "Your teams are drowning in spreadsheets, reports, and dashboards that don't talk to each other. Critical insights are buried under noise.",
  },
  {
    icon: Clock,
    title: "Reactive Decision-Making",
    desc: "By the time you spot a problem, it's already cost you millions. You're always reacting — never anticipating.",
  },
  {
    icon: Eye,
    title: "Strategic Blindness",
    desc: "You can't see around corners. Market shifts, competitive threats, and internal risks remain invisible until they hit.",
  },
  {
    icon: TrendingDown,
    title: "Fragmented Analytics",
    desc: "Finance uses one tool, marketing another, ops a third. No single source of truth. No unified strategy layer.",
  },
];

const Problem = () => (
  <div className="neural-bg min-h-screen">
    <section className="py-24">
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-destructive/30 bg-destructive/5 text-destructive text-sm mb-6">
            <AlertTriangle className="h-4 w-4" />
            The Crisis
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6">
            Your Data Is <span className="text-destructive">Failing</span> You
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            In today's hyper-competitive landscape, enterprises that can't predict, simulate, and act
            on real-time intelligence are already losing.
          </p>
        </motion.div>

        <div className="space-y-6">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card p-8 flex gap-6 items-start"
            >
              <div className="p-3 rounded-lg bg-destructive/10 shrink-0">
                <p.icon className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{p.title}</h3>
                <p className="text-muted-foreground">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-2xl font-bold">
            The question isn't <span className="text-destructive">if</span> you'll fall behind.
            <br />
            It's <span className="gradient-text">how fast</span> you'll catch up.
          </p>
        </motion.div>
      </div>
    </section>
  </div>
);

export default Problem;
