import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Activity,
  Shield, Zap, Brain, Upload, FileText, X, Loader2,
  BarChart3, FileSpreadsheet, FileImage, AlertCircle, Image, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { parseFileContent, parseCSV } from "@/lib/analytics-ai";
import { useFileStore } from "@/contexts/FileStoreContext";

const COLORS = ["hsl(187,85%,53%)", "hsl(152,69%,45%)", "hsl(42,92%,56%)", "hsl(280,65%,60%)", "hsl(340,75%,55%)"];
const tooltipStyle = { background: "hsl(222,22%,9%)", border: "1px solid hsl(222,15%,18%)", borderRadius: 8, fontSize: 12 };
const ACCEPTED_FILES = ".csv,.json,.txt,.tsv,.pdf,.xlsx,.xls,.jpeg,.jpg,.png,.gif,.webp,.svg";

const Dashboard = () => {
  const { dashboardFiles: uploadedFiles, setDashboardFiles: setUploadedFiles, parsedChartData, setParsedChartData } = useFileStore();
  const [uploading, setUploading] = useState(false);
  const revenueRef = useRef<HTMLInputElement>(null);
  const expenseRef = useRef<HTMLInputElement>(null);
  const otherRef = useRef<HTMLInputElement>(null);

  const { revenueData, expenseData } = parsedChartData;
  const hasRevenue = uploadedFiles.some(f => f.category === "revenue");
  const hasExpense = uploadedFiles.some(f => f.category === "expense");
  const hasData = hasRevenue && hasExpense;
  const needsCompanion = (hasRevenue && !hasExpense) || (!hasRevenue && hasExpense);

  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalExpense = expenseData.reduce((s, d) => s + d.expense, 0);

  const formatValue = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return v.toFixed(0);
  };

  const kpis = hasData ? [
    { label: "Total Revenue", value: formatValue(totalRevenue), change: "From uploaded data", up: true, icon: DollarSign },
    { label: "Total Expenses", value: formatValue(totalExpense), change: "From uploaded data", up: false, icon: TrendingDown },
    { label: "Net Margin", value: totalRevenue > 0 ? `${((1 - totalExpense / totalRevenue) * 100).toFixed(1)}%` : "N/A", change: "Calculated", up: totalRevenue > totalExpense, icon: Activity },
    { label: "Profit/Loss", value: formatValue(totalRevenue - totalExpense), change: totalRevenue > totalExpense ? "Profitable" : "Loss", up: totalRevenue > totalExpense, icon: Shield },
  ] : [];

  const tryParseChartData = (content: string, category: "revenue" | "expense" | "other") => {
    try {
      const parsed = JSON.parse(content);
      if (!parsed.headers || !parsed.rows || parsed.rows.length === 0) {
        console.warn("Dashboard: No headers/rows found in parsed content");
        return;
      }

      const originalHeaders: string[] = parsed.headers;
      const rows: Record<string, string>[] = parsed.rows;

      // Find label column index: prefer date/month/period, fallback to first non-numeric column, then col 0
      let labelIdx = originalHeaders.findIndex((h: string) => {
        const l = h.toLowerCase();
        return l.includes("month") || l.includes("date") || l.includes("period") || l.includes("year") || l.includes("quarter") || l.includes("name") || l.includes("category");
      });
      if (labelIdx < 0) {
        // Use first column where first row value is NOT a number
        labelIdx = originalHeaders.findIndex((h: string) => {
          const val = String(rows[0]?.[h] || "").replace(/[,$%]/g, "").trim();
          return isNaN(parseFloat(val)) || val === "";
        });
      }
      if (labelIdx < 0) labelIdx = 0;

      // Find value column index: prefer keyword match, fallback to first numeric column
      const findNumericCol = (keywords: string[]): number => {
        // Try keyword match first
        const kwIdx = originalHeaders.findIndex((h: string) => {
          const l = h.toLowerCase();
          return keywords.some(k => l.includes(k));
        });
        if (kwIdx >= 0 && kwIdx !== labelIdx) return kwIdx;

        // Fallback: first column (not labelIdx) with numeric data in row 0
        for (let i = 0; i < originalHeaders.length; i++) {
          if (i === labelIdx) continue;
          const val = String(rows[0]?.[originalHeaders[i]] || "").replace(/[,$%]/g, "").trim();
          if (val !== "" && !isNaN(parseFloat(val))) return i;
        }
        // Last resort: any column that's not the label
        return labelIdx === 0 ? 1 : 0;
      };

      const parseNum = (val: unknown): number => {
        const s = String(val || "0").replace(/[,$%\s]/g, "");
        const n = parseFloat(s);
        return isNaN(n) ? 0 : n;
      };

      console.log("Dashboard parsing:", { category, headers: originalHeaders, labelIdx, sampleRow: rows[0] });

      if (category === "revenue" || category === "other") {
        const valueIdx = findNumericCol(["revenue", "sales", "income", "amount", "total", "price", "value"]);
        console.log("Revenue valueIdx:", valueIdx, "column:", originalHeaders[valueIdx]);
        if (valueIdx >= 0 && valueIdx < originalHeaders.length) {
          const chartData = rows.slice(0, 50).map((row) => {
            const rev = parseNum(row[originalHeaders[valueIdx]]);
            return { month: String(row[originalHeaders[labelIdx]] || `Row`), revenue: rev, forecast: rev };
          });
          if (chartData.some(d => d.revenue > 0)) {
            setParsedChartData(prev => ({ ...prev, revenueData: chartData }));
            console.log("Revenue data set:", chartData.length, "rows");
          } else {
            console.warn("No positive revenue values found");
          }
        }
      }

      if (category === "expense" || category === "other") {
        const valueIdx = findNumericCol(["expense", "cost", "spending", "budget", "amount", "total", "value"]);
        console.log("Expense valueIdx:", valueIdx, "column:", originalHeaders[valueIdx]);
        if (valueIdx >= 0 && valueIdx < originalHeaders.length) {
          const chartData = rows.slice(0, 50).map((row) => ({
            month: String(row[originalHeaders[labelIdx]] || `Row`),
            expense: parseNum(row[originalHeaders[valueIdx]]),
          }));
          if (chartData.some(d => d.expense > 0)) {
            setParsedChartData(prev => ({ ...prev, expenseData: chartData }));
            console.log("Expense data set:", chartData.length, "rows");
          } else {
            console.warn("No positive expense values found");
          }
        }
      }
    } catch {
      // JSON parse failed — try parsing raw text as tabular data
      console.log("Dashboard: JSON parse failed, attempting raw text parse for", category);
      try {
        const reparsed = parseCSV(content);
        if (reparsed) {
          const parsed2 = JSON.parse(reparsed);
          if (parsed2.headers && parsed2.rows && parsed2.rows.length > 0) {
            tryParseChartData(reparsed, category);
            return;
          }
        }
      } catch {
        console.error("Dashboard: raw text re-parse also failed for", category);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: "revenue" | "expense" | "other") => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isImage = ["jpeg", "jpg", "png", "gif", "webp", "svg"].includes(ext);
      const isBinary = ["pdf", "xlsx", "xls"].includes(ext);

      try {
        if (isImage || isBinary) {
          setUploadedFiles(prev => [...prev, { name: file.name, content: `[${isImage ? "Image" : "Binary"}: ${file.name}]`, category, type: ext }]);
          toast.success(`${file.name} uploaded`);
          continue;
        }

        const text = await file.text();
        const content = parseFileContent(text, file.name);
        setUploadedFiles(prev => [...prev, { name: file.name, content, category, type: ext }]);
        tryParseChartData(content, category);
        toast.success(`${file.name} uploaded to ${category}`);
      } catch {
        toast.error(`Failed to read ${file.name}`);
      }
    }
    setUploading(false);
    if (e.target) e.target.value = "";

    if (category === "revenue" && !hasExpense) {
      toast.info("Please also upload your Expense data to see the full dashboard.");
    } else if (category === "expense" && !hasRevenue) {
      toast.info("Please also upload your Revenue data to see the full dashboard.");
    }
  };

  const removeFile = (idx: number) => {
    const file = uploadedFiles[idx];
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
    if (file.category === "revenue") setParsedChartData(prev => ({ ...prev, revenueData: [] }));
    if (file.category === "expense") setParsedChartData(prev => ({ ...prev, expenseData: [] }));
  };

  const getFileIcon = (type: string) => {
    if (["jpeg", "jpg", "png", "gif", "webp", "svg"].includes(type)) return FileImage;
    if (["xlsx", "xls"].includes(type)) return FileSpreadsheet;
    return FileText;
  };

  return (
    <div className="neural-bg min-h-screen">
      <div className="container py-10 max-w-7xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black flex items-center gap-3 tracking-tight leading-tight">
            <Brain className="h-9 w-9 text-primary" />
            Executive <span className="gradient-text">Command Center</span>
          </h1>
          <p className="text-base text-muted-foreground mt-3 max-w-2xl leading-relaxed">
            Upload your revenue and expense data to generate real-time KPIs, interactive charts, and strategic insights — all from your actual data.
          </p>
        </motion.div>

        {/* Upload Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 mb-8">
          <h3 className="text-xs font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
            <Upload className="h-4 w-4 text-primary" /> Data Upload
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {[
              { ref: revenueRef, cat: "revenue" as const, has: hasRevenue, icon: DollarSign, label: "Revenue Data", sub: "Sales, income, revenue files", cls: "primary" },
              { ref: expenseRef, cat: "expense" as const, has: hasExpense, icon: TrendingDown, label: "Expense Data", sub: "Costs, budgets, spending files", cls: "accent" },
              { ref: otherRef, cat: "other" as const, has: false, icon: FileText, label: "Other Data", sub: "HR, ops, market, images, PDFs", cls: "foreground" },
            ].map(({ ref, cat, has, icon: Icon, label, sub, cls }) => (
              <div key={cat}>
                <input ref={ref} type="file" multiple accept={ACCEPTED_FILES} className="hidden" onChange={(e) => handleFileUpload(e, cat)} />
                <Button
                  variant="outline"
                  onClick={() => ref.current?.click()}
                  className={`w-full h-auto py-6 transition-all border-2 ${
                    has ? `border-${cls} text-${cls} bg-${cls}/5` : `border-${cls}/20 text-${cls} hover:bg-${cls}/5`
                  }`}
                  disabled={uploading}
                >
                  <div className="flex flex-col items-center gap-2.5">
                    <Icon className="h-7 w-7" />
                    <span className="text-sm font-extrabold">{label} {has ? "✓" : cat !== "other" ? "(Required)" : "(Optional)"}</span>
                    <span className="text-[11px] text-muted-foreground font-medium">{sub}</span>
                  </div>
                </Button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mb-4 flex items-center gap-1.5 font-medium">
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
                  <div key={i} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold ${
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

        {/* Companion Warning */}
        {needsCompanion && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 mb-8 border-accent/40 bg-accent/5">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-6 w-6 text-accent shrink-0" />
              <div>
                <p className="text-sm font-extrabold text-accent">
                  {hasRevenue ? "Expense data required" : "Revenue data required"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload your {hasRevenue ? "expense" : "revenue"} data to unlock the full dashboard with KPIs, charts, and analysis.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto border-accent/30 text-accent hover:bg-accent/10 font-extrabold shrink-0"
                onClick={() => hasRevenue ? expenseRef.current?.click() : revenueRef.current?.click()}
              >
                Upload {hasRevenue ? "Expense" : "Revenue"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!hasData && !needsCompanion && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-20 text-center mb-8">
            <BarChart3 className="h-20 w-20 text-muted-foreground mx-auto mb-8 opacity-20" />
            <h2 className="text-3xl font-black mb-4">No Data Uploaded Yet</h2>
            <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed mb-8">
              Upload your <strong className="text-primary">Revenue</strong> and <strong className="text-accent">Expense</strong> data files to see real-time KPIs, interactive charts, trend analysis, and strategic alerts.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => revenueRef.current?.click()} className="border-primary/30 text-primary hover:bg-primary/10 font-extrabold px-6">
                <DollarSign className="h-4 w-4 mr-2" /> Upload Revenue
              </Button>
              <Button variant="outline" onClick={() => expenseRef.current?.click()} className="border-accent/30 text-accent hover:bg-accent/10 font-extrabold px-6">
                <TrendingDown className="h-4 w-4 mr-2" /> Upload Expense
              </Button>
            </div>
          </motion.div>
        )}

        {/* Dashboard Content */}
        {hasData && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {kpis.map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-7"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-muted-foreground font-extrabold uppercase tracking-widest">{kpi.label}</span>
                    <kpi.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-black tracking-tight">{kpi.value}</div>
                  <div className={`text-xs mt-3 flex items-center gap-1 font-bold ${kpi.up ? "text-success" : "text-accent"}`}>
                    {kpi.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {kpi.change}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid lg:grid-cols-3 gap-5 mb-6">
              <div className="lg:col-span-2 glass-card p-7">
                <h3 className="text-sm font-extrabold mb-6 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Revenue vs Forecast
                </h3>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(187,85%,53%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(187,85%,53%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,15%,18%)" />
                    <XAxis dataKey="month" stroke="hsl(215,15%,55%)" fontSize={11} />
                    <YAxis stroke="hsl(215,15%,55%)" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(187,85%,53%)" fill="url(#revGrad)" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="forecast" stroke="hsl(42,92%,56%)" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-7">
                <h3 className="text-sm font-extrabold mb-6">Revenue vs Expense Split</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Revenue", value: totalRevenue },
                        { name: "Expenses", value: totalExpense },
                        { name: "Net Profit", value: Math.max(0, totalRevenue - totalExpense) },
                      ]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={3}
                    >
                      <Cell fill={COLORS[0]} />
                      <Cell fill={COLORS[2]} />
                      <Cell fill={COLORS[1]} />
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-4 justify-center">
                  {[
                    { name: "Revenue", color: COLORS[0] },
                    { name: "Expenses", color: COLORS[2] },
                    { name: "Net Profit", color: COLORS[1] },
                  ].map(d => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs font-bold">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid lg:grid-cols-2 gap-5 mb-6">
              <div className="glass-card p-7">
                <h3 className="text-sm font-extrabold mb-6 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-accent" /> Expense Trend
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={expenseData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,15%,18%)" />
                    <XAxis dataKey="month" stroke="hsl(215,15%,55%)" fontSize={11} />
                    <YAxis stroke="hsl(215,15%,55%)" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="expense" stroke="hsl(42,92%,56%)" strokeWidth={2.5} dot={{ fill: "hsl(42,92%,56%)", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-7">
                <h3 className="text-sm font-extrabold mb-6 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Revenue Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,15%,18%)" />
                    <XAxis dataKey="month" stroke="hsl(215,15%,55%)" fontSize={11} />
                    <YAxis stroke="hsl(215,15%,55%)" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                      {revenueData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Strategic Insights */}
            <div className="glass-card p-7">
              <h3 className="text-sm font-extrabold mb-6 flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" /> Strategic Insights
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    type: totalRevenue > totalExpense ? "info" : "danger",
                    text: totalRevenue > totalExpense
                      ? `Your business is profitable with a net margin of ${((1 - totalExpense / totalRevenue) * 100).toFixed(1)}%.`
                      : `Warning: Expenses exceed revenue by ${formatValue(totalExpense - totalRevenue)}. Review cost structure immediately.`,
                  },
                  {
                    type: "info",
                    text: `Total revenue across ${revenueData.length} periods: ${formatValue(totalRevenue)}. Average per period: ${formatValue(totalRevenue / Math.max(revenueData.length, 1))}.`,
                  },
                  {
                    type: "warning",
                    text: `Total expenses: ${formatValue(totalExpense)}. Average per period: ${formatValue(totalExpense / Math.max(expenseData.length, 1))}. Use Analytics AI for deeper analysis.`,
                  },
                ].map((a, i) => (
                  <div key={i} className={`p-5 rounded-xl text-sm leading-relaxed font-semibold ${
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
