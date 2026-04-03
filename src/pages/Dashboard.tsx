import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Activity,
  Shield, Zap, Brain, Upload, FileText, X, Loader2,
  BarChart3, FileSpreadsheet, FileImage, Image, AlertTriangle,
  Lightbulb, BookOpen, Shuffle, Table, Sparkles, Target,
  PieChart as PieChartIcon, Percent, ArrowUpRight, ArrowDownRight,
  Layers, CircleDot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { parseFileContent, parseCSV, parseExcel } from "@/lib/analytics-ai";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useFileDrop } from "@/hooks/use-file-drop";
import ExportButtons from "@/components/ExportButtons";
import AIChatPanel, { AIChatPanelHandle } from "@/components/AIChatPanel";
import DynamicChart, { ChartData } from "@/components/DynamicChart";
import ReactMarkdown from "react-markdown";

const COLORS = [
  "hsl(220,80%,60%)", "hsl(280,70%,65%)", "hsl(25,95%,58%)",
  "hsl(340,75%,60%)", "hsl(152,69%,45%)", "hsl(200,80%,55%)"
];
const tooltipStyle = {
  background: "hsl(222,28%,8%)", border: "1px solid hsl(222,18%,16%)",
  borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff"
};
const ACCEPTED_FILES = ".csv,.json,.txt,.tsv,.pdf,.xlsx,.xls,.jpeg,.jpg,.png,.gif,.webp,.svg";

const REVENUE_KEYWORDS = ["revenue", "sales", "income", "earning", "turnover", "gross"];
const EXPENSE_KEYWORDS = ["expense", "cost", "spending", "budget", "expenditure", "outflow"];

const TIPS = [
  { icon: Lightbulb, color: "text-[hsl(220,80%,60%)]", bg: "kpi-card-blue", text: "Upload a single file with both revenue and expense columns for the most accurate KPIs and profit analysis." },
  { icon: Target, color: "text-[hsl(280,70%,65%)]", bg: "kpi-card-purple", text: "AI auto-generates charts, stories, forecasts, and simulations — just upload your data and watch." },
  { icon: Zap, color: "text-[hsl(25,95%,58%)]", bg: "kpi-card-orange", text: "Ask the AI 'What if we cut costs 15%?' for instant scenario simulation with projected outcomes." },
  { icon: Brain, color: "text-[hsl(340,75%,60%)]", bg: "kpi-card-pink", text: "Use the AI Co-Founder mode — ask for growth strategies, profit leak detection, or competitive analysis." },
  { icon: Shield, color: "text-[hsl(152,69%,45%)]", bg: "kpi-card-green", text: "Export your analysis as CSV or JSON anytime. All insights are based strictly on your actual data." },
];

type DashTabKey = "overview" | "story" | "forecast" | "simulation" | "table";

const Dashboard = () => {
  const { dashboardFiles: uploadedFiles, setDashboardFiles: setUploadedFiles, parsedChartData, setParsedChartData } = useFileStore();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<AIChatPanelHandle>(null);
  const [autoAnalyzeTriggered, setAutoAnalyzeTriggered] = useState(false);
  const autoAnalyzeGuard = useRef(false);

  const [activeTab, setActiveTab] = useState<DashTabKey>("overview");
  const [aiCharts, setAiCharts] = useState<ChartData[]>([]);
  const [aiStory, setAiStory] = useState("");
  const [aiForecast, setAiForecast] = useState("");
  const [aiSimulation, setAiSimulation] = useState("");

  const { revenueData, expenseData } = parsedChartData;
  const hasData = revenueData.length > 0 || expenseData.length > 0;

  const fileData = uploadedFiles.map(f => `--- FILE: ${f.name} ---\n${f.content}`).join("\n\n");

  // Auto-trigger comprehensive AI analysis on file upload
  useEffect(() => {
    if (uploadedFiles.length > 0 && !autoAnalyzeTriggered && !autoAnalyzeGuard.current) {
      autoAnalyzeGuard.current = true;
      setAutoAnalyzeTriggered(true);
      const timer = setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.sendMessage(
            "Analyze this data comprehensively. Generate charts showing key metrics. " +
            "Create a data story with executive summary and narrative. " +
            "Provide a forecast with future predictions and projection trends. " +
            "Run a what-if scenario simulation showing best/worst cases. " +
            "Suggest growth strategies and optimize recommendations as a strategic advisor."
          );
        }
      }, 600);
      return () => clearTimeout(timer);
    }
    if (uploadedFiles.length === 0) {
      setAutoAnalyzeTriggered(false);
      autoAnalyzeGuard.current = false;
    }
  }, [uploadedFiles.length, autoAnalyzeTriggered]);

  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalExpense = expenseData.reduce((s, d) => s + d.expense, 0);
  const netProfit = totalRevenue - totalExpense;
  const margin = totalRevenue > 0 ? ((1 - totalExpense / totalRevenue) * 100) : 0;
  const avgRevenue = revenueData.length > 0 ? totalRevenue / revenueData.length : 0;
  const avgExpense = expenseData.length > 0 ? totalExpense / expenseData.length : 0;
  const maxRevenue = revenueData.length > 0 ? Math.max(...revenueData.map(d => d.revenue)) : 0;
  const maxExpense = expenseData.length > 0 ? Math.max(...expenseData.map(d => d.expense)) : 0;

  const formatValue = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return v.toLocaleString();
  };

  const kpis = hasData ? [
    { label: "Total Revenue", value: formatValue(totalRevenue), icon: DollarSign, colorClass: "kpi-card-blue", iconColor: "text-[hsl(220,80%,60%)]", up: true },
    { label: "Total Expenses", value: formatValue(totalExpense), icon: TrendingDown, colorClass: "kpi-card-orange", iconColor: "text-[hsl(25,95%,58%)]", up: false },
    { label: "Net Profit", value: formatValue(netProfit), icon: Activity, colorClass: netProfit >= 0 ? "kpi-card-green" : "kpi-card-pink", iconColor: netProfit >= 0 ? "text-[hsl(152,69%,45%)]" : "text-[hsl(340,75%,60%)]", up: netProfit >= 0 },
    { label: "Profit Margin", value: `${margin.toFixed(1)}%`, icon: Percent, colorClass: "kpi-card-purple", iconColor: "text-[hsl(280,70%,65%)]", up: margin > 0 },
    { label: "Avg Revenue/Period", value: formatValue(avgRevenue), icon: Target, colorClass: "kpi-card-cyan", iconColor: "text-[hsl(200,80%,55%)]", up: true },
    { label: "Peak Revenue", value: formatValue(maxRevenue), icon: ArrowUpRight, colorClass: "kpi-card-blue", iconColor: "text-[hsl(220,80%,60%)]", up: true },
  ] : [];

  const parseNum = (val: unknown): number => {
    const s = String(val || "0").replace(/[₹$€£¥,\s%]/g, "");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };

  const findColumnByKeywords = (headers: string[], keywords: string[], excludeIdx?: number): number => {
    return headers.findIndex((h, i) => {
      if (i === excludeIdx) return false;
      const l = h.toLowerCase();
      return keywords.some(k => l.includes(k));
    });
  };

  const findLabelColumn = (headers: string[], rows: Record<string, string>[]): number => {
    let labelIdx = headers.findIndex((h) => {
      const l = h.toLowerCase();
      return l.includes("month") || l.includes("date") || l.includes("period") || l.includes("year") || l.includes("quarter") || l.includes("name") || l.includes("category");
    });
    if (labelIdx < 0) {
      labelIdx = headers.findIndex((h) => {
        const val = String(rows[0]?.[h] || "").replace(/[,$%]/g, "").trim();
        return isNaN(parseFloat(val)) || val === "";
      });
    }
    if (labelIdx < 0) labelIdx = 0;
    return labelIdx;
  };

  const findFirstNumericCol = (headers: string[], rows: Record<string, string>[], excludeIdxs: number[]): number => {
    for (let i = 0; i < headers.length; i++) {
      if (excludeIdxs.includes(i)) continue;
      const val = String(rows[0]?.[headers[i]] || "").replace(/[,$%₹$€£¥]/g, "").trim();
      if (val !== "" && !isNaN(parseFloat(val))) return i;
    }
    return -1;
  };

  const tryParseChartData = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (!parsed.headers || !parsed.rows || parsed.rows.length === 0) return;
      const headers: string[] = parsed.headers;
      const rows: Record<string, string>[] = parsed.rows;
      const labelIdx = findLabelColumn(headers, rows);
      let revIdx = findColumnByKeywords(headers, REVENUE_KEYWORDS, labelIdx);
      let expIdx = findColumnByKeywords(headers, EXPENSE_KEYWORDS, labelIdx);
      if (revIdx < 0 && expIdx < 0) {
        const first = findFirstNumericCol(headers, rows, [labelIdx]);
        if (first >= 0) { revIdx = first; const second = findFirstNumericCol(headers, rows, [labelIdx, first]); if (second >= 0) expIdx = second; }
      } else if (revIdx >= 0 && expIdx < 0) { const next = findFirstNumericCol(headers, rows, [labelIdx, revIdx]); if (next >= 0) expIdx = next; }
      else if (expIdx >= 0 && revIdx < 0) { const next = findFirstNumericCol(headers, rows, [labelIdx, expIdx]); if (next >= 0) revIdx = next; }
      if (revIdx >= 0) {
        const chartData = rows.slice(0, 50).map((row) => ({ month: String(row[headers[labelIdx]] || "Row"), revenue: parseNum(row[headers[revIdx]]), forecast: parseNum(row[headers[revIdx]]) }));
        if (chartData.some(d => d.revenue > 0)) setParsedChartData(prev => ({ ...prev, revenueData: chartData }));
      }
      if (expIdx >= 0) {
        const chartData = rows.slice(0, 50).map((row) => ({ month: String(row[headers[labelIdx]] || "Row"), expense: parseNum(row[headers[expIdx]]) }));
        if (chartData.some(d => d.expense > 0)) setParsedChartData(prev => ({ ...prev, expenseData: chartData }));
      }
    } catch {
      try {
        const reparsed = parseCSV(content);
        if (reparsed) { const parsed2 = JSON.parse(reparsed); if (parsed2.headers && parsed2.rows && parsed2.rows.length > 0) tryParseChartData(reparsed); }
      } catch { /* skip */ }
    }
  };

  const processFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isImage = ["jpeg", "jpg", "png", "gif", "webp", "svg"].includes(ext);
      const isExcel = ["xlsx", "xls"].includes(ext);
      try {
        if (isImage) { setUploadedFiles(prev => [...prev, { name: file.name, content: `[Image: ${file.name}]`, category: "other", type: ext }]); toast.success(`${file.name} uploaded`); continue; }
        if (isExcel) {
          const buffer = await file.arrayBuffer();
          const content = parseExcel(buffer);
          if (content) { setUploadedFiles(prev => [...prev, { name: file.name, content, category: "other", type: ext }]); tryParseChartData(content); toast.success(`${file.name} uploaded & parsed`); }
          else toast.error(`Could not parse ${file.name}`);
          continue;
        }
        if (ext === "pdf") { setUploadedFiles(prev => [...prev, { name: file.name, content: `[PDF: ${file.name}]`, category: "other", type: ext }]); toast.info(`${file.name} uploaded (PDF content cannot be auto-parsed)`); continue; }
        const text = await file.text();
        const content = parseFileContent(text, file.name);
        setUploadedFiles(prev => [...prev, { name: file.name, content, category: "other", type: ext }]);
        tryParseChartData(content);
        toast.success(`${file.name} uploaded & parsed`);
      } catch { toast.error(`Failed to read ${file.name}`); }
    }
    setAutoAnalyzeTriggered(false);
    autoAnalyzeGuard.current = false;
    setUploading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDroppedFiles = useCallback((files: File[]) => { processFiles(files); }, []);
  const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useFileDrop(handleDroppedFiles);

  const removeFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
    if (uploadedFiles.length <= 1) setParsedChartData({ revenueData: [], expenseData: [] });
  };

  const getFileIcon = (type: string) => {
    if (["jpeg", "jpg", "png", "gif", "webp", "svg"].includes(type)) return FileImage;
    if (["xlsx", "xls"].includes(type)) return FileSpreadsheet;
    return FileText;
  };

  // Get table data from uploaded files
  const getTableData = () => {
    for (const f of uploadedFiles) {
      try { const parsed = JSON.parse(f.content); if (parsed.headers && parsed.rows) return parsed; } catch { /* skip */ }
    }
    return null;
  };
  const tableData = getTableData();

  const handleChartsGenerated = useCallback((charts: ChartData[]) => { setAiCharts(prev => [...prev, ...charts]); }, []);
  const handleStoryGenerated = useCallback((story: string) => { setAiStory(story); }, []);
  const handleForecastGenerated = useCallback((text: string) => { setAiForecast(text); }, []);
  const handleSimulationGenerated = useCallback((text: string) => { setAiSimulation(text); }, []);

  const dashTabs: { key: DashTabKey; icon: typeof BarChart3; label: string }[] = [
    { key: "overview", icon: BarChart3, label: "Overview" },
    { key: "story", icon: BookOpen, label: "AI Story" },
    { key: "forecast", icon: TrendingUp, label: "Forecast" },
    { key: "simulation", icon: Shuffle, label: "Simulation" },
    { key: "table", icon: Table, label: "Data Table" },
  ];

  const renderMarkdown = (content: string, emptyTitle: string, emptyDesc: string, EmptyIcon: typeof BookOpen) => {
    if (content) {
      return (
        <div className="prose prose-sm max-w-none text-base leading-relaxed [&_p]:mb-3 [&_p]:text-foreground [&_p]:text-[15px] [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-foreground [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-foreground [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground [&_li]:text-[15px] [&_li]:text-foreground [&_strong]:text-foreground [&_table]:w-full [&_th]:text-left [&_th]:py-2 [&_th]:px-3 [&_th]:border-b [&_th]:border-border [&_th]:text-xs [&_th]:font-black [&_th]:uppercase [&_th]:tracking-widest [&_th]:text-muted-foreground [&_td]:py-2 [&_td]:px-3 [&_td]:border-b [&_td]:border-border/30 [&_td]:text-foreground [&_td]:text-sm">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }
    return (
      <div className="text-center py-12">
        <EmptyIcon className="h-16 w-16 text-muted-foreground mx-auto mb-5 opacity-20" />
        <h3 className="font-black mb-3 text-xl text-foreground">{emptyTitle}</h3>
        <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">{emptyDesc}</p>
      </div>
    );
  };

  // Combined revenue + expense data for comparison chart
  const combinedData = revenueData.map((r, i) => ({
    month: r.month,
    revenue: r.revenue,
    expense: expenseData[i]?.expense ?? 0,
  }));

  return (
    <div className="neural-bg min-h-screen">
      <div className="container py-8 max-w-[1400px]">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black flex items-center gap-3 tracking-tight leading-tight">
                <Brain className="h-10 w-10 text-[hsl(220,80%,60%)]" />
                Executive <span className="gradient-text">Command Center</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-2xl leading-relaxed font-medium">
                Upload your business data — AI will <strong className="text-foreground font-bold">automatically analyze</strong> everything and generate charts, stories, forecasts, simulations, and strategic recommendations.
              </p>
            </div>
            {hasData && (
              <ExportButtons
                data={revenueData.map((r, i) => ({ ...r, expense: expenseData[i]?.expense ?? 0 }))}
                headers={["month", "revenue", "expense", "forecast"]}
                filename="dashboard-data"
              />
            )}
          </div>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`glass-card p-8 mb-6 transition-all duration-200 ${isDragging ? "ring-2 ring-[hsl(220,80%,60%)] border-[hsl(220,80%,60%)/0.5] bg-[hsl(220,80%,60%)/0.05]" : ""}`}
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        >
          {isDragging && (
            <div className="text-center py-6 mb-4">
              <Upload className="h-12 w-12 text-[hsl(220,80%,60%)] mx-auto mb-3 animate-bounce" />
              <p className="text-lg font-black text-[hsl(220,80%,60%)]">Drop files here to upload</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <input ref={fileRef} type="file" multiple accept={ACCEPTED_FILES} className="hidden" onChange={handleFileUpload} />
            <Button onClick={() => fileRef.current?.click()} className="gradient-primary text-white font-black px-6 py-3 text-base" disabled={uploading}>
              <Upload className="h-5 w-5 mr-2" /> Upload Data Files
            </Button>
            <span className="text-sm text-muted-foreground flex items-center gap-2 font-semibold">
              <Image className="h-4 w-4" />
              CSV, JSON, TXT, PDF, Excel, Images — auto-detected
            </span>
          </div>
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3 font-bold">
              <Loader2 className="h-4 w-4 animate-spin" /> Processing files...
            </div>
          )}
          {uploadedFiles.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-4">
              {uploadedFiles.map((f, i) => {
                const Icon = getFileIcon(f.type);
                return (
                  <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[hsl(220,80%,60%)/0.1] text-[hsl(220,80%,60%)] text-sm font-bold border border-[hsl(220,80%,60%)/0.2]">
                    <Icon className="h-4 w-4" /> {f.name}
                    <button onClick={() => removeFile(i)} className="ml-1 hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Tips Box */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-[hsl(25,95%,58%)]" />
            <h3 className="text-lg font-black text-foreground">Pro Tips</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {TIPS.map((tip, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                className={`glass-card p-4 ${tip.bg} border`}>
                <tip.icon className={`h-5 w-5 ${tip.color} mb-2`} />
                <p className="text-sm text-foreground leading-snug font-semibold">{tip.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Empty State */}
        {!hasData && uploadedFiles.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-20 text-center mb-8">
            <BarChart3 className="h-24 w-24 text-muted-foreground mx-auto mb-8 opacity-15" />
            <h2 className="text-4xl font-black mb-5 text-foreground">No Data Uploaded Yet</h2>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed mb-8 font-medium">
              Upload your business data and watch AI transform it into <strong className="text-[hsl(220,80%,60%)]">actionable intelligence</strong> — charts, KPIs, forecasts, and strategic recommendations.
            </p>
            <Button onClick={() => fileRef.current?.click()} className="gradient-primary text-white font-black px-8 py-4 text-lg">
              <Upload className="h-5 w-5 mr-2" /> Upload Your Data
            </Button>
          </motion.div>
        )}

        {/* Main Content Grid */}
        {(hasData || uploadedFiles.length > 0) && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: KPIs, Charts, Tabs */}
            <div className="lg:col-span-2 space-y-6">
              {/* KPIs */}
              {hasData && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {kpis.map((kpi, i) => (
                    <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className={`glass-card p-5 ${kpi.colorClass} border`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground font-black uppercase tracking-widest">{kpi.label}</span>
                        <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                      </div>
                      <div className="text-3xl md:text-4xl font-black tracking-tight text-foreground">{kpi.value}</div>
                      <div className={`text-sm mt-2 flex items-center gap-1 font-bold ${kpi.up ? "text-[hsl(152,69%,45%)]" : "text-[hsl(340,75%,60%)]"}`}>
                        {kpi.up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        {kpi.up ? "Positive" : "Negative"}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Charts */}
              {hasData && (
                <>
                  <div className="grid lg:grid-cols-2 gap-5">
                    {/* Revenue Trend */}
                    <div className="glass-card p-6">
                      <h3 className="text-base font-black mb-4 flex items-center gap-2 text-foreground">
                        <BarChart3 className="h-5 w-5 text-[hsl(220,80%,60%)]" /> Revenue Trend
                      </h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="revGradD" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(220,80%,60%)" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="hsl(220,80%,60%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,18%,20%)" />
                          <XAxis dataKey="month" stroke="hsl(215,15%,55%)" fontSize={12} fontWeight={600} />
                          <YAxis stroke="hsl(215,15%,55%)" fontSize={12} fontWeight={600} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Area type="monotone" dataKey="revenue" stroke="hsl(220,80%,60%)" fill="url(#revGradD)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Expense Trend */}
                    <div className="glass-card p-6">
                      <h3 className="text-base font-black mb-4 flex items-center gap-2 text-foreground">
                        <TrendingDown className="h-5 w-5 text-[hsl(25,95%,58%)]" /> Expense Trend
                      </h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={expenseData}>
                          <defs>
                            <linearGradient id="expGradD" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(25,95%,58%)" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="hsl(25,95%,58%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,18%,20%)" />
                          <XAxis dataKey="month" stroke="hsl(215,15%,55%)" fontSize={12} fontWeight={600} />
                          <YAxis stroke="hsl(215,15%,55%)" fontSize={12} fontWeight={600} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Area type="monotone" dataKey="expense" stroke="hsl(25,95%,58%)" fill="url(#expGradD)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-5">
                    {/* Revenue vs Expense Pie */}
                    <div className="glass-card p-6">
                      <h3 className="text-base font-black mb-4 flex items-center gap-2 text-foreground">
                        <PieChartIcon className="h-5 w-5 text-[hsl(280,70%,65%)]" /> Revenue vs Expense
                      </h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Revenue", value: totalRevenue },
                              { name: "Expenses", value: totalExpense },
                              { name: "Net Profit", value: Math.max(0, netProfit) },
                            ]}
                            cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={4} strokeWidth={2}
                          >
                            <Cell fill="hsl(220,80%,60%)" />
                            <Cell fill="hsl(25,95%,58%)" />
                            <Cell fill="hsl(152,69%,45%)" />
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-4 mt-3 justify-center">
                        {[{ name: "Revenue", color: "hsl(220,80%,60%)" }, { name: "Expenses", color: "hsl(25,95%,58%)" }, { name: "Profit", color: "hsl(152,69%,45%)" }].map(d => (
                          <div key={d.name} className="flex items-center gap-2 text-sm font-bold">
                            <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                            <span className="text-muted-foreground">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Revenue vs Expense Bar Comparison */}
                    <div className="glass-card p-6">
                      <h3 className="text-base font-black mb-4 flex items-center gap-2 text-foreground">
                        <Layers className="h-5 w-5 text-[hsl(340,75%,60%)]" /> Revenue vs Expense Comparison
                      </h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={combinedData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,18%,20%)" />
                          <XAxis dataKey="month" stroke="hsl(215,15%,55%)" fontSize={12} fontWeight={600} />
                          <YAxis stroke="hsl(215,15%,55%)" fontSize={12} fontWeight={600} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="revenue" fill="hsl(220,80%,60%)" radius={[6, 6, 0, 0]} name="Revenue" />
                          <Bar dataKey="expense" fill="hsl(25,95%,58%)" radius={[6, 6, 0, 0]} name="Expense" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Revenue Breakdown */}
                  <div className="glass-card p-6">
                    <h3 className="text-base font-black mb-4 flex items-center gap-2 text-foreground">
                      <CircleDot className="h-5 w-5 text-[hsl(280,70%,65%)]" /> Revenue Breakdown by Period
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,18%,20%)" />
                        <XAxis dataKey="month" stroke="hsl(215,15%,55%)" fontSize={12} fontWeight={600} />
                        <YAxis stroke="hsl(215,15%,55%)" fontSize={12} fontWeight={600} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                          {revenueData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {/* Tabs for AI Content */}
              <div className="flex gap-2 flex-wrap">
                {dashTabs.map((tab) => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all ${
                      activeTab === tab.key
                        ? "gradient-primary text-white shadow-lg"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-border"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" /> {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && aiCharts.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-[hsl(25,95%,58%)]" />
                    <span className="text-base font-black text-foreground">AI-Generated Charts</span>
                    <button onClick={() => setAiCharts([])} className="ml-auto text-sm text-muted-foreground hover:text-destructive font-bold">Clear</button>
                  </div>
                  {aiCharts.map((chart, i) => <DynamicChart key={i} chart={chart} />)}
                </div>
              )}

              {activeTab === "story" && (
                <div className="glass-card p-8 min-h-[350px]">
                  <div className="flex items-center gap-2 mb-6"><Sparkles className="h-5 w-5 text-[hsl(280,70%,65%)]" /><h3 className="text-lg font-black text-foreground">AI Data Story</h3></div>
                  {renderMarkdown(aiStory, "No Story Generated", "Upload data and AI will automatically generate an executive data story with key insights.", BookOpen)}
                </div>
              )}

              {activeTab === "forecast" && (
                <div className="glass-card p-8 min-h-[350px]">
                  <div className="flex items-center gap-2 mb-6"><TrendingUp className="h-5 w-5 text-[hsl(220,80%,60%)]" /><h3 className="text-lg font-black text-foreground">Predictive Forecast</h3></div>
                  {renderMarkdown(aiForecast, "No Forecast Yet", "AI will auto-generate forecasts when data is uploaded. You can also ask: 'Create a forecast for next quarter.'", TrendingUp)}
                </div>
              )}

              {activeTab === "simulation" && (
                <div className="glass-card p-8 min-h-[350px]">
                  <div className="flex items-center gap-2 mb-6"><Shuffle className="h-5 w-5 text-[hsl(340,75%,60%)]" /><h3 className="text-lg font-black text-foreground">Scenario Simulation</h3></div>
                  {renderMarkdown(aiSimulation, "No Simulation Yet", "AI will auto-generate what-if scenarios. Try asking: 'What if we cut costs 15%?'", Shuffle)}
                </div>
              )}

              {activeTab === "table" && (
                <div className="glass-card p-6 overflow-x-auto min-h-[350px]">
                  <h3 className="text-lg font-black mb-6 text-foreground flex items-center gap-2">
                    <Table className="h-5 w-5 text-[hsl(200,80%,55%)]" /> Data Table
                  </h3>
                  {tableData ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-border">
                          {tableData.headers.map((h: string) => (
                            <th key={h} className="text-left py-3 text-muted-foreground font-black px-3 text-xs uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.rows.slice(0, 50).map((row: Record<string, string>, i: number) => (
                          <tr key={i} className="border-b border-border/30 hover:bg-secondary/50 transition-colors">
                            {tableData.headers.map((h: string) => (
                              <td key={h} className="py-3 px-3 text-sm font-semibold text-foreground">{row[h]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12">
                      <Table className="h-16 w-16 text-muted-foreground mx-auto mb-5 opacity-20" />
                      <p className="text-base text-muted-foreground font-semibold">Upload a CSV or Excel file to view your data in table format.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Strategic Insights */}
              {hasData && (
                <div className="glass-card p-6">
                  <h3 className="text-base font-black mb-5 flex items-center gap-2 text-foreground">
                    <Zap className="h-5 w-5 text-[hsl(25,95%,58%)]" /> Strategic Insights
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      {
                        color: netProfit >= 0 ? "kpi-card-green" : "kpi-card-pink",
                        icon: netProfit >= 0 ? Shield : AlertTriangle,
                        iconColor: netProfit >= 0 ? "text-[hsl(152,69%,45%)]" : "text-[hsl(340,75%,60%)]",
                        text: netProfit >= 0
                          ? `Profitable with ${margin.toFixed(1)}% net margin. Net profit: ${formatValue(netProfit)}.`
                          : `Operating at a loss. Expenses exceed revenue by ${formatValue(Math.abs(netProfit))}.`,
                      },
                      {
                        color: "kpi-card-blue",
                        icon: TrendingUp,
                        iconColor: "text-[hsl(220,80%,60%)]",
                        text: `Revenue across ${revenueData.length} periods totals ${formatValue(totalRevenue)}. Average: ${formatValue(avgRevenue)} per period. Peak: ${formatValue(maxRevenue)}.`,
                      },
                      {
                        color: "kpi-card-orange",
                        icon: Activity,
                        iconColor: "text-[hsl(25,95%,58%)]",
                        text: `Total expenses: ${formatValue(totalExpense)}. Average: ${formatValue(avgExpense)} per period. Peak: ${formatValue(maxExpense)}.`,
                      },
                    ].map((a, i) => (
                      <div key={i} className={`p-5 rounded-xl ${a.color} border`}>
                        <a.icon className={`h-5 w-5 ${a.iconColor} mb-2`} />
                        <p className="text-sm leading-relaxed font-bold text-foreground">{a.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: AI Chat */}
            <div>
              <AIChatPanel
                ref={chatRef}
                fileData={fileData}
                onChartsGenerated={handleChartsGenerated}
                onStoryGenerated={handleStoryGenerated}
                onForecastGenerated={handleForecastGenerated}
                onSimulationGenerated={handleSimulationGenerated}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
