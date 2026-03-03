import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload, FileText, Brain, BarChart3, TrendingUp,
  Send, Sparkles, Table, BookOpen
} from "lucide-react";
import { toast } from "sonner";

// Mock data for when user hasn't uploaded files yet
const sampleRevenue = [
  { month: "Jan", value: 42000 }, { month: "Feb", value: 48000 },
  { month: "Mar", value: 51000 }, { month: "Apr", value: 49000 },
  { month: "May", value: 56000 }, { month: "Jun", value: 62000 },
];

const sampleCategories = [
  { name: "Sales", value: 40 }, { name: "Marketing", value: 25 },
  { name: "Operations", value: 20 }, { name: "R&D", value: 15 },
];

const COLORS = ["hsl(187,85%,53%)", "hsl(152,69%,45%)", "hsl(42,92%,56%)", "hsl(280,65%,60%)"];

const sampleStory = `## Executive Summary — Q2 Performance

**Revenue grew 12.3% QoQ**, driven primarily by the Sales division which exceeded targets by 15%. Marketing efficiency improved with cost-per-acquisition dropping 8%.

### Key Drivers
- **Sales team expansion** in APAC contributed $2.1M incremental revenue
- **Product B launch** captured 28% market share in its segment
- **Operational efficiency** gains reduced COGS by 4.2%

### Risks Identified
⚠️ **HR attrition** in Engineering is trending upward (+12% YoY) — requires immediate intervention
⚠️ **Marketing budget** overrun by 8% — recommend reallocation from low-performing channels

### Strategic Recommendation
> Focus Q3 investment on APAC expansion and Product B scaling. Pause Channel C marketing spend and redirect to high-converting segments. Address Engineering retention with compensation review.

### Forecast
If current trajectory holds, **Q3 revenue is projected at $6.8M** (confidence: 82%). Downside scenario at $6.1M if attrition issues persist.`;

const Analytics = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Welcome to the Analytics Engine. Upload your data files or ask me anything about the current dataset. I can create charts, generate stories, forecast trends, and simulate scenarios." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState<"charts" | "story" | "table" | "forecast">("charts");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
    toast.success(`${files.length} file(s) uploaded. AI is analyzing...`);
    // In real implementation, this would send to AI backend
  };

  const handleChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");

    // Mock AI response - in real implementation this calls the AI backend
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Based on the data analysis:\n\n${
            userMsg.toLowerCase().includes("revenue")
              ? "Revenue shows a strong upward trend with 12.3% QoQ growth. The primary driver is APAC expansion. I recommend focusing Q3 budget on scaling this channel."
              : userMsg.toLowerCase().includes("risk")
              ? "Three key risks detected: 1) Engineering attrition trending +12% YoY, 2) Marketing budget overrun at 8%, 3) Supply chain delays in Q3 pipeline. Recommend immediate HR intervention and budget reallocation."
              : userMsg.toLowerCase().includes("what if")
              ? "Running scenario simulation... If we implement the proposed changes: Revenue impact: +$1.2M, Risk reduction: 35%, Cost savings: $340K. Confidence level: 78%. Recommended action: Proceed with Phase 1."
              : "I've analyzed the query against the current dataset. The data suggests strong performance in core metrics with opportunities for optimization in marketing efficiency and talent retention. Would you like me to drill deeper into any specific area?"
          }`,
        },
      ]);
    }, 1200);
  };

  return (
    <div className="neural-bg min-h-screen">
      <div className="container py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            Data Analytics & <span className="gradient-text">Storytelling</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload data, analyze, visualize, and generate AI-powered insights
          </p>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.csv,.json,.txt,.doc,.docx"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <Upload className="h-4 w-4 mr-2" /> Upload Files
            </Button>
            <span className="text-xs text-muted-foreground">
              Supports PDF, Excel, CSV, JSON, Documents
            </span>
            {uploadedFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs">
                    <FileText className="h-3 w-3" /> {f.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Main Content — 3 cols */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tabs */}
            <div className="flex gap-2">
              {[
                { key: "charts", icon: BarChart3, label: "Charts" },
                { key: "story", icon: BookOpen, label: "Data Story" },
                { key: "table", icon: Table, label: "Data Table" },
                { key: "forecast", icon: TrendingUp, label: "Forecast" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "charts" && (
              <div className="space-y-4">
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold mb-4">Revenue Trend</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={sampleRevenue}>
                      <defs>
                        <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(187,85%,53%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(187,85%,53%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,15%,18%)" />
                      <XAxis dataKey="month" stroke="hsl(215,15%,55%)" fontSize={12} />
                      <YAxis stroke="hsl(215,15%,55%)" fontSize={12} />
                      <Tooltip contentStyle={{ background: "hsl(222,22%,9%)", border: "1px solid hsl(222,15%,18%)", borderRadius: 8 }} />
                      <Area type="monotone" dataKey="value" stroke="hsl(187,85%,53%)" fill="url(#aGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold mb-4">Category Breakdown</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={sampleCategories} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                          {sampleCategories.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(222,22%,9%)", border: "1px solid hsl(222,15%,18%)", borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold mb-4">Performance</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={[
                        { name: "Q1", value: 78 }, { name: "Q2", value: 85 },
                        { name: "Q3", value: 91 }, { name: "Q4", value: 88 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,15%,18%)" />
                        <XAxis dataKey="name" stroke="hsl(215,15%,55%)" fontSize={11} />
                        <YAxis stroke="hsl(215,15%,55%)" fontSize={11} />
                        <Bar dataKey="value" fill="hsl(152,69%,45%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "story" && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-semibold">AI-Generated Data Story</h3>
                </div>
                <div className="prose prose-sm prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm">
                  {sampleStory}
                </div>
              </div>
            )}

            {activeTab === "table" && (
              <div className="glass-card p-5 overflow-x-auto">
                <h3 className="text-sm font-semibold mb-4">Data Table</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Month</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Revenue</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Growth</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRevenue.map((r, i) => (
                      <tr key={r.month} className="border-b border-border/50">
                        <td className="py-2">{r.month}</td>
                        <td className="text-right">${(r.value / 1000).toFixed(0)}K</td>
                        <td className="text-right text-success">{i === 0 ? "—" : `+${((r.value / sampleRevenue[i-1].value - 1) * 100).toFixed(1)}%`}</td>
                        <td className="text-right">{(18 + Math.random() * 8).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "forecast" && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-4">Predictive Forecast</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={[
                    ...sampleRevenue,
                    { month: "Jul", value: 65000 },
                    { month: "Aug", value: 68000 },
                    { month: "Sep", value: 71000 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,15%,18%)" />
                    <XAxis dataKey="month" stroke="hsl(215,15%,55%)" fontSize={12} />
                    <YAxis stroke="hsl(215,15%,55%)" fontSize={12} />
                    <Tooltip contentStyle={{ background: "hsl(222,22%,9%)", border: "1px solid hsl(222,15%,18%)", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="value" stroke="hsl(187,85%,53%)" strokeWidth={2} dot={{ fill: "hsl(187,85%,53%)" }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 rounded-lg bg-primary/10 text-xs text-primary">
                  <Brain className="h-3 w-3 inline mr-1" />
                  AI Forecast: Revenue projected to reach $71K by September (confidence: 82%). Growth rate steady at ~4.5% MoM.
                </div>
              </div>
            )}
          </div>

          {/* AI Assistant — 2 cols */}
          <div className="lg:col-span-2">
            <div className="glass-card h-[700px] flex flex-col">
              <div className="p-4 border-b border-border/50 flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm">AI Analytics Assistant</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "gradient-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border/50">
                <div className="flex gap-2">
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleChat())}
                    placeholder="Ask about data, trends, risks, what-if scenarios..."
                    rows={2}
                    className="bg-secondary border-border text-sm resize-none"
                  />
                  <Button onClick={handleChat} size="icon" className="gradient-primary text-primary-foreground shrink-0 self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {["Why did revenue change?", "Show risk analysis", "What if we cut costs 15%?"].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setChatInput(q); }}
                      className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
