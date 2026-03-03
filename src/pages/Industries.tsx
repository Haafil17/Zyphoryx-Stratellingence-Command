import { motion } from "framer-motion";
import { Landmark, ShoppingCart, Factory, Building2, Truck, HeartPulse } from "lucide-react";

const industries = [
  { icon: Landmark, title: "Finance & Banking", desc: "Risk modeling, portfolio analytics, regulatory compliance, fraud detection, and market forecasting." },
  { icon: ShoppingCart, title: "Retail & E-Commerce", desc: "Demand forecasting, customer behavior analysis, pricing optimization, and inventory intelligence." },
  { icon: Factory, title: "Manufacturing", desc: "Supply chain optimization, quality prediction, production forecasting, and operational efficiency." },
  { icon: Building2, title: "Government", desc: "Public policy simulation, budget forecasting, performance monitoring, and resource optimization." },
  { icon: Truck, title: "Logistics", desc: "Route optimization, demand prediction, fleet analytics, and cost reduction modeling." },
  { icon: HeartPulse, title: "Healthcare", desc: "Patient analytics, resource planning, outcome prediction, and operational efficiency." },
];

const Industries = () => (
  <div className="neural-bg min-h-screen">
    <section className="py-24">
      <div className="container max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-6">
            Built for <span className="gradient-text">Every Industry</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Zephoryx adapts to your domain with industry-specific intelligence models.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((ind, i) => (
            <motion.div
              key={ind.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 hover:glow-border transition-all duration-300"
            >
              <ind.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold mb-2">{ind.title}</h3>
              <p className="text-sm text-muted-foreground">{ind.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default Industries;
