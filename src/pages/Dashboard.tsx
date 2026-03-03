import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Users, Activity,
  AlertTriangle, Shield, Zap, Brain
} from "lucide-react";

const revenueData = [
  { month: "Jan", revenue: 4200, forecast: 4100 },
  { month: "Feb", revenue: 4800, forecast: 4600 },
  { month: "Mar", revenue: 5100, forecast: 5200 },
  { month: "Apr", revenue: 4900, forecast: 5400 },
  { month: "May", revenue: 5600, forecast: 5500 },
  { month: "Jun", revenue: 6200, forecast: 5900 },
  { month: "Jul", revenue: 5800, forecast: 6100 },
  { month: "Aug", revenue: 6500, forecast: 6400 },
];

const deptData = [
  { dept: "Sales", performance: 87 },
  { dept: "Marketing", performance: 72 },
  { dept: "Ops", performance: 91 },
  { dept: "HR", performance: 68 },
  { dept: "Finance", performance: 84 },
];

const pieData = [
  { name: "Product A", value: 35 },
  { name: "Product B", value: 28 },
  { name: "Product C", value: 22 },
  { name: "Product D", value: 15 },
];

const COLORS = ["hsl(187,85%,53%)", "hsl(152,69%,45%)", "hsl(42,92%,56%)", "hsl(280,65%,60%)"];

const kpis = [
  { label: "Revenue", value: "$6.5M", change: "+12.3%", up: true, icon: DollarSign },
  { label: "Active Users", value: "24,891", change: "+8.1%", up: true, icon: Users },
  { label: "Performance", value: "94.2%", change: "+2.4%", up: true, icon: Activity },
  { label: "Risk Score", value: "Low", change: "-15%", up: false, icon: Shield },
];

const alerts = [
  { type: "warning", text: "Marketing spend exceeding budget by 8% — review allocation" },
  { type: "info", text: "Revenue growth accelerating — Q3 forecast revised upward" },
  { type: "danger", text: "HR retention risk detected in Engineering — attrition up 12%" },
];

const Dashboard = () => (
  <div className="neural-bg min-h-screen">
    <div className="container py-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          Executive <span className="gradient-text">Command Center</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time strategic intelligence overview</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className={`text-xs mt-1 flex items-center gap-1 ${kpi.up ? "text-success" : "text-accent"}`}>
              {kpi.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {kpi.change}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Revenue vs Forecast</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(187,85%,53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(187,85%,53%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,15%,18%)" />
              <XAxis dataKey="month" stroke="hsl(215,15%,55%)" fontSize={12} />
              <YAxis stroke="hsl(215,15%,55%)" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(222,22%,9%)", border: "1px solid hsl(222,15%,18%)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(187,85%,53%)" fill="url(#revGrad)" strokeWidth={2} />
              <Line type="monotone" dataKey="forecast" stroke="hsl(42,92%,56%)" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Mix */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Revenue Mix</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(222,22%,9%)", border: "1px solid hsl(222,15%,18%)", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Department Performance */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Department Performance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,15%,18%)" />
              <XAxis dataKey="dept" stroke="hsl(215,15%,55%)" fontSize={12} />
              <YAxis stroke="hsl(215,15%,55%)" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(222,22%,9%)", border: "1px solid hsl(222,15%,18%)", borderRadius: 8 }} />
              <Bar dataKey="performance" fill="hsl(187,85%,53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Strategic Alerts */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" /> Strategic Alerts
          </h3>
          <div className="space-y-3">
            {alerts.map((a, i) => (
              <div key={i} className={`p-3 rounded-lg text-xs leading-relaxed ${
                a.type === "danger" ? "bg-destructive/10 text-destructive" :
                a.type === "warning" ? "bg-accent/10 text-accent" :
                "bg-primary/10 text-primary"
              }`}>
                <AlertTriangle className="h-3 w-3 inline mr-1.5" />
                {a.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;
