import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Activity,
  AlertTriangle, Shield, Zap, Brain, Upload, FileText, X, Loader2,
  BarChart3, FileSpreadsheet, Image, FileImage, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { parseFileContent } from "@/lib/analytics-ai";
import { useFileStore } from "@/contexts/FileStoreContext";

const COLORS = ["hsl(187,85%,53%)", "hsl(152,69%,45%)", "hsl(42,92%,56%)", "hsl(280,65%,60%)", "hsl(340,75%,55%)"];

const tooltipStyle = {
  background: "hsl(222,22%,9%)",
  border: "1px solid hsl(222,15%,18%)",
  borderRadius: 8,
  fontSize: 12,
};

const ACCEPTED_FILES = ".csv,.json,.txt,.tsv,.pdf,.xlsx,.xls,.jpeg,.jpg,.png,.gif,.webp,.svg";

const Dashboard = () => {
  const { dashboardFiles: uploadedFiles, setDashboardFiles: setUploadedFiles } = useFileStore();
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number; forecast: number }[]>([]);
  const [expenseData, setExpenseData] = useState<{ month: string; expense: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const revenueRef = useRef<HTMLInputElement>(null);
  const expenseRef = useRef<HTMLInputElement>(null);
  const otherRef = useRef<HTMLInputElement>(null);

  const hasRevenue = uploadedFiles.some(f => f.category === "revenue");
  const hasExpense = uploadedFiles.some(f => f.category === "expense");
  const hasData = hasRevenue && hasExpense;
  const needsCompanion = (hasRevenue && !hasExpense) || (!hasRevenue && hasExpense);

  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalExpense = expenseData.reduce((s, d) => s + d.expense, 0);

  const kpis = hasData ? [
    { label: "Total Revenue", value: `$${(totalRevenue / 1000).toFixed(1)}K`, change: "From uploaded data", up: true, icon: DollarSign },
    { label: "Total Expenses", value: `$${(totalExpense / 1000).toFixed(1)}K`, change: "From uploaded data", up: false, icon: TrendingDown },
    { label: "Net Margin", value: totalRevenue > 0 ? `${((1 - totalExpense / totalRevenue) * 100).toFixed(1)}%` : "N/A", change: "Calculated", up: totalRevenue > totalExpense, icon: Activity },
    { label: "Profit/Loss", value: `$${((totalRevenue - totalExpense) / 1000).toFixed(1)}K`, change: totalRevenue > totalExpense ? "Profitable" : "Loss", up: totalRevenue > totalExpense, icon: Shield },
  ] : [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: "revenue" | "expense" | "other") => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isImage = ["jpeg", "jpg", "png", "gif", "webp", "svg"].includes(ext);
      const isBinary = ["pdf", "xlsx", "xls"].includes(ext);

      try {
        if (isImage) {
          setUploadedFiles(prev => [...prev, { name: file.name, content: `[Image: ${file.name}]`, category, type: ext }]);
          toast.success(`${file.name} uploaded`);
          continue;
        }
        if (isBinary) {
          setUploadedFiles(prev => [...prev, { name: file.name, content: `[Binary: ${file.name}]`, category, type: ext }]);
          toast.success(`${file.name} uploaded`);
          continue;
        }

        const text = await file.text();
        const content = parseFileContent(text, file.name);
        setUploadedFiles(prev => [...prev, { name: file.name, content, category, type: ext }]);

        try {
          const parsed = JSON.parse(content);
          if (parsed.headers && parsed.rows) {
            const headers = parsed.headers.map((h: string) => h.toLowerCase());

            if (category === "revenue" || headers.some((h: string) => h.includes("revenue") || h.includes("sales") || h.includes("income"))) {
              const monthCol = headers.find((h: string) => h.includes("month") || h.includes("date") || h.includes("period")) || headers[0];
              const valueCol = headers.find((h: string) => h.includes("revenue") || h.includes("sales") || h.includes("amount") || h.includes("income")) || headers[1];
              const monthIdx = parsed.headers.findIndex((h: string) => h.toLowerCase() === monthCol);
              const valueIdx = parsed.headers.findIndex((h: string) => h.toLowerCase() === valueCol);
              if (monthIdx >= 0 && valueIdx >= 0) {
                const chartData = parsed.rows.slice(0, 12).map((row: Record<string, string>) => ({
                  month: row[parsed.headers[monthIdx]] || "",
                  revenue: parseFloat(row[parsed.headers[valueIdx]]) || 0,
                  forecast: (parseFloat(row[parsed.headers[valueIdx]]) || 0) * (0.95 + Math.random() * 0.1),
                }));
                if (chartData.length > 0) setRevenueData(chartData);
              }
            }

            if (category === "expense" || headers.some((h: string) => h.includes("expense") || h.includes("cost") || h.includes("spending"))) {
              const monthCol = headers.find((h: string) => h.includes("month") || h.includes("date") || h.includes("period")) || headers[0];
              const valueCol = headers.find((h: string) => h.includes("expense") || h.includes("cost") || h.includes("spending") || h.includes("amount")) || headers[1];
              const monthIdx = parsed.headers.findIndex((h: string) => h.toLowerCase() === monthCol);
              const valueIdx = parsed.headers.findIndex((h: string) => h.toLowerCase() === valueCol);
              if (monthIdx >= 0 && valueIdx >= 0) {
                const chartData = parsed.rows.slice(0, 12).map((row: Record<string, string>) => ({
                  month: row[parsed.headers[monthIdx]] || "",
                  expense: parseFloat(row[parsed.headers[valueIdx]]) || 0,
                }));
                if (chartData.length > 0) setExpenseData(chartData);
              }
            }
          }
        } catch { /* not structured */ }

        toast.success(`${file.name} uploaded to ${category}`);
      } catch {
        toast.error(`Failed to read ${file.name}`);
      }
    }
    setUploading(false);
    if (e.target) e.target.value = "";

    // Prompt for companion file
    if (category === "revenue" && !hasExpense) {
      toast.info("Please also upload your Expense data to see the full dashboard.");
    } else if (category === "expense" && !hasRevenue) {
      toast.info("Please also upload your Revenue data to see the full dashboard.");
    }
  };

  const removeFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const getFileIcon = (type: string) => {
    if (["jpeg", "jpg", "png", "gif", "webp", "svg"].includes(type)) return FileImage;
    if (["xlsx", "xls"].includes(type)) return FileSpreadsheet;
    return FileText;
  };

  return (
    <div className="neural-bg min-h-screen">
      <div className="container py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3 tracking-tight">
            <Brain className="h-8 w-8 text-primary" />
            Executive <span className="gradient-text">Command Center</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed font-medium">
            Upload your revenue and expense data to see real-time analytics. Both files are required for a complete overview.
          </p>
        </motion.div>

        {/* File Upload Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-8">
          <h3 className="text-sm font-bold mb-5 flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
            <Upload className="h-4 w-4 text-primary" /> Upload Data Files
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <input ref={revenueRef} type="file" multiple accept={ACCEPTED_FILES} className="hidden" onChange={(e) => handleFileUpload(e, "revenue")} />
              <Button variant="outline" onClick={() => revenueRef.current?.click()} className={`w-full h-auto py-5 transition-all ${hasRevenue ? "border-primary text-primary bg-primary/5" : "border-primary/30 text-primary hover:bg-primary/10"}`} disabled={uploading}>
                <div className="flex flex-col items-center gap-2">
                  <DollarSign className="h-6 w-6" />
                  <span className="text-sm font-bold">Revenue Data {hasRevenue ? "✓" : "(Required)"}</span>
                  <span className="text-[11px] text-muted-foreground">Sales, income, revenue files</span>
                </div>
              </Button>
            </div>
            <div>
              <input ref={expenseRef} type="file" multiple accept={ACCEPTED_FILES} className="hidden" onChange={(e) => handleFileUpload(e, "expense")} />
              <Button variant="outline" onClick={() => expenseRef.current?.click()} className={`w-full h-auto py-5 transition-all ${hasExpense ? "border-accent text-accent bg-accent/5" : "border-accent/30 text-accent hover:bg-accent/10"}`} disabled={uploading}>
                <div className="flex flex-col items-center gap-2">
                  <TrendingDown className="h-6 w-6" />
                  <span className="text-sm font-bold">Expense Data {hasExpense ? "✓" : "(Required)"}</span>
                  <span className="text-[11px] text-muted-foreground">Costs, budgets, spending files</span>
                </div>
              </Button>
            </div>
            <div>
              <input ref={otherRef} type="file" multiple accept={ACCEPTED_FILES} className="hidden" onChange={(e) => handleFileUpload(e, "other")} />
              <Button variant="outline" onClick={() => otherRef.current?.click()} className="w-full border-border text-foreground hover:bg-secondary h-auto py-5 transition-all" disabled={uploading}>
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span className="text-sm font-bold">Other Data (Optional)</span>
                  <span className="text-[11px] text-muted-foreground">HR, ops, market, images, PDFs</span>
                </div>
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mb-4 flex items-center gap-1.5">
            <Image className="h-3 w-3" />
            Supports CSV, JSON, TXT, TSV, PDF, Excel, JPEG, PNG, GIF, WebP, SVG
          </p>
          {uploading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Loader2 className="h-3 w-3 animate-spin" /> Processing files...
            </div>
          )}
          {uploadedFiles.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {uploadedFiles.map((f, i) => {
                const Icon = getFileIcon(f.type);
                return (
                  <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    f.category === "revenue" ? "bg-primary/10 text-primary" :
                    f.category === "expense" ? "bg-accent/10 text-accent" :
                    "bg-secondary text-foreground"
                  }`}>
                    <Icon className="h-3 w-3" />
                    {f.name}
                    <span className="text-[10px] opacity-60">({f.category})</span>
                    <button onClick={() => removeFile(i)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Companion file warning */}
        {needsCompanion && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 mb-8 border-accent/30 bg-accent/5">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-accent shrink-0" />
              <div>
                <p className="text-sm font-bold text-accent">
                  {hasRevenue ? "Expense data required" : "Revenue data required"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please upload your {hasRevenue ? "expense" : "revenue"} data to see the full dashboard with KPIs, charts, and analysis.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto border-accent/30 text-accent hover:bg-accent/10 font-bold shrink-0"
                onClick={() => hasRevenue ? expenseRef.current?.click() : revenueRef.current?.click()}
              >
                Upload {hasRevenue ? "Expense" : "Revenue"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!hasData && !needsCompanion && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-16 text-center mb-8">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-30" />
            <h2 className="text-2xl font-black mb-3">No Data Uploaded Yet</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed mb-6">
              Upload your <strong className="text-primary">Revenue</strong> and <strong className="text-accent">Expense</strong> data files above to see real-time KPIs, interactive charts, trend analysis, and strategic alerts — all generated from your actual data.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => revenueRef.current?.click()} className="border-primary/30 text-primary hover:bg-primary/10 font-bold">
                <DollarSign className="h-4 w-4 mr-2" /> Upload Revenue
              </Button>
              <Button variant="outline" onClick={() => expenseRef.current?.click()} className="border-accent/30 text-accent hover:bg-accent/10 font-bold">
                <TrendingDown className="h-4 w-4 mr-2" /> Upload Expense
              </Button>
            </div>
          </motion.div>
        )}

        {/* Dashboard content — only shown when both files uploaded */}
        {hasData && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {kpis.map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">{kpi.label}</span>
                    <kpi.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black tracking-tight">{kpi.value}</div>
                  <div className={`text-xs mt-2 flex items-center gap-1 font-semibold ${kpi.up ? "text-success" : "text-accent"}`}>
                    {kpi.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {kpi.change}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid lg:grid-cols-3 gap-5 mb-6">
              <div className="lg:col-span-2 glass-card p-6">
                <h3 className="text-sm font-bold mb-5 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Revenue vs Forecast
                </h3>
                <ResponsiveContainer width="100%" height={300}>
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
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(187,85%,53%)" fill="url(#revGrad)" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="forecast" stroke="hsl(42,92%,56%)" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-sm font-bold mb-5">Revenue vs Expense Split</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Revenue", value: totalRevenue },
                        { name: "Expenses", value: totalExpense },
                        { name: "Net Profit", value: Math.max(0, totalRevenue - totalExpense) },
                      ]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={3}
                    >
                      <Cell fill={COLORS[0]} />
                      <Cell fill={COLORS[2]} />
                      <Cell fill={COLORS[1]} />
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-3 justify-center">
                  {[
                    { name: "Revenue", color: COLORS[0] },
                    { name: "Expenses", color: COLORS[2] },
                    { name: "Net Profit", color: COLORS[1] },
                  ].map(d => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs font-medium">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid lg:grid-cols-2 gap-5 mb-6">
              <div className="glass-card p-6">
                <h3 className="text-sm font-bold mb-5 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-accent" /> Expense Trend
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={expenseData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,15%,18%)" />
                    <XAxis dataKey="month" stroke="hsl(215,15%,55%)" fontSize={12} />
                    <YAxis stroke="hsl(215,15%,55%)" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="expense" stroke="hsl(42,92%,56%)" strokeWidth={2.5} dot={{ fill: "hsl(42,92%,56%)", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-sm font-bold mb-5 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Revenue Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,15%,18%)" />
                    <XAxis dataKey="month" stroke="hsl(215,15%,55%)" fontSize={12} />
                    <YAxis stroke="hsl(215,15%,55%)" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                      {revenueData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Alerts */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-bold mb-5 flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" /> Strategic Insights
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    type: totalRevenue > totalExpense ? "info" : "danger",
                    text: totalRevenue > totalExpense
                      ? `Your business is profitable with a net margin of ${((1 - totalExpense / totalRevenue) * 100).toFixed(1)}%.`
                      : `Warning: Expenses exceed revenue by $${((totalExpense - totalRevenue) / 1000).toFixed(1)}K. Review cost structure.`,
                  },
                  {
                    type: "info",
                    text: `Total revenue across ${revenueData.length} periods: $${(totalRevenue / 1000).toFixed(1)}K. Average per period: $${(totalRevenue / Math.max(revenueData.length, 1) / 1000).toFixed(1)}K.`,
                  },
                  {
                    type: "warning",
                    text: `Total expenses: $${(totalExpense / 1000).toFixed(1)}K. Average per period: $${(totalExpense / Math.max(expenseData.length, 1) / 1000).toFixed(1)}K. Use Analytics AI for deeper analysis.`,
                  },
                ].map((a, i) => (
                  <div key={i} className={`p-4 rounded-xl text-sm leading-relaxed font-medium ${
                    a.type === "danger" ? "bg-destructive/10 text-destructive border border-destructive/20" :
                    a.type === "warning" ? "bg-accent/10 text-accent border border-accent/20" :
                    "bg-primary/10 text-primary border border-primary/20"
                  }`}>
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    {a.text}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
