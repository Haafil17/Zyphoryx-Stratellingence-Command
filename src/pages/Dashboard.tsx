import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Activity,
  Shield, Zap, Brain, Upload, FileText, X, Loader2,
  BarChart3, FileSpreadsheet, FileImage, Image, AlertTriangle,
  Lightbulb, BookOpen, Shuffle, Table, Sparkles
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

const COLORS = ["hsl(187,85%,53%)", "hsl(152,69%,45%)", "hsl(42,92%,56%)", "hsl(280,65%,60%)", "hsl(340,75%,55%)"];
const tooltipStyle = { background: "hsl(222,22%,9%)", border: "1px solid hsl(222,15%,18%)", borderRadius: 8, fontSize: 12 };
const ACCEPTED_FILES = ".csv,.json,.txt,.tsv,.pdf,.xlsx,.xls,.jpeg,.jpg,.png,.gif,.webp,.svg";

const REVENUE_KEYWORDS = ["revenue", "sales", "income", "earning", "turnover", "gross"];
const EXPENSE_KEYWORDS = ["expense", "cost", "spending", "budget", "expenditure", "outflow"];

const TIPS = [
  { icon: Lightbulb, text: "Upload a single file with both revenue and expense columns for the most accurate KPIs." },
  { icon: Lightbulb, text: "Use CSV or Excel files for best results — the system auto-detects column types." },
  { icon: Lightbulb, text: "Include a date/month column so charts display a proper timeline." },
  { icon: Lightbulb, text: "Ask the AI to 'Create a forecast' or 'Run a what-if simulation' for deeper insights." },
  { icon: Lightbulb, text: "Export your data as CSV or JSON using the export buttons above." },
];

type DashTabKey = "overview" | "story" | "forecast" | "simulation";

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

  // Auto-trigger AI analysis on file upload
  useEffect(() => {
    if (uploadedFiles.length > 0 && !autoAnalyzeTriggered && !autoAnalyzeGuard.current) {
      autoAnalyzeGuard.current = true;
      setAutoAnalyzeTriggered(true);
      const timer = setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.sendMessage("Analyze this data comprehensively: generate charts showing key metrics, create a data story with executive summary, provide a forecast with trends, and give strategic recommendations.");
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
        if (first >= 0) {
          revIdx = first;
          const second = findFirstNumericCol(headers, rows, [labelIdx, first]);
          if (second >= 0) expIdx = second;
        }
      } else if (revIdx >= 0 && expIdx < 0) {
        const next = findFirstNumericCol(headers, rows, [labelIdx, revIdx]);
        if (next >= 0) expIdx = next;
      } else if (expIdx >= 0 && revIdx < 0) {
        const next = findFirstNumericCol(headers, rows, [labelIdx, expIdx]);
        if (next >= 0) revIdx = next;
      }

      if (revIdx >= 0) {
        const chartData = rows.slice(0, 50).map((row) => ({
          month: String(row[headers[labelIdx]] || "Row"),
          revenue: parseNum(row[headers[revIdx]]),
          forecast: parseNum(row[headers[revIdx]]),
        }));
        if (chartData.some(d => d.revenue > 0)) {
          setParsedChartData(prev => ({ ...prev, revenueData: chartData }));
        }
      }

      if (expIdx >= 0) {
        const chartData = rows.slice(0, 50).map((row) => ({
          month: String(row[headers[labelIdx]] || "Row"),
          expense: parseNum(row[headers[expIdx]]),
        }));
        if (chartData.some(d => d.expense > 0)) {
          setParsedChartData(prev => ({ ...prev, expenseData: chartData }));
        }
      }
    } catch {
      try {
        const reparsed = parseCSV(content);
        if (reparsed) {
          const parsed2 = JSON.parse(reparsed);
          if (parsed2.headers && parsed2.rows && parsed2.rows.length > 0) {
            tryParseChartData(reparsed);
          }
        }
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
        if (isImage) {
          setUploadedFiles(prev => [...prev, { name: file.name, content: `[Image: ${file.name}]`, category: "other", type: ext }]);
          toast.success(`${file.name} uploaded`);
          continue;
        }
        if (isExcel) {
          const buffer = await file.arrayBuffer();
          const content = parseExcel(buffer);
          if (content) {
            setUploadedFiles(prev => [...prev, { name: file.name, content, category: "other", type: ext }]);
            tryParseChartData(content);
            toast.success(`${file.name} uploaded & parsed`);
          } else {
            toast.error(`Could not parse ${file.name}`);
          }
          continue;
        }
        if (ext === "pdf") {
          setUploadedFiles(prev => [...prev, { name: file.name, content: `[PDF: ${file.name}]`, category: "other", type: ext }]);
          toast.info(`${file.name} uploaded (PDF content cannot be auto-parsed)`);
          continue;
        }
        const text = await file.text();
        const content = parseFileContent(text, file.name);
        setUploadedFiles(prev => [...prev, { name: file.name, content, category: "other", type: ext }]);
        tryParseChartData(content);
        toast.success(`${file.name} uploaded & parsed`);
      } catch {
        toast.error(`Failed to read ${file.name}`);
      }
    }
    // Reset auto-analyze guard so it triggers
    setAutoAnalyzeTriggered(false);
    autoAnalyzeGuard.current = false;
    setUploading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDroppedFiles = useCallback((files: File[]) => {
    processFiles(files);
  }, []);

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useFileDrop(handleDroppedFiles);

  const removeFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
    if (uploadedFiles.length <= 1) {
      setParsedChartData({ revenueData: [], expenseData: [] });
    }
  };

  const getFileIcon = (type: string) => {
    if (["jpeg", "jpg", "png", "gif", "webp", "svg"].includes(type)) return FileImage;
    if (["xlsx", "xls"].includes(type)) return FileSpreadsheet;
    return FileText;
  };

  const handleChartsGenerated = useCallback((charts: ChartData[]) => {
    setAiCharts(prev => [...prev, ...charts]);
  }, []);
  const handleStoryGenerated = useCallback((story: string) => { setAiStory(story); }, []);
  const handleForecastGenerated = useCallback((text: string) => { setAiForecast(text); }, []);
  const handleSimulationGenerated = useCallback((text: string) => { setAiSimulation(text); }, []);

  const dashTabs: { key: DashTabKey; icon: typeof BarChart3; label: string }[] = [
    { key: "overview", icon: BarChart3, label: "Overview" },
    { key: "story", icon: BookOpen, label: "AI Story" },
    { key: "forecast", icon: TrendingUp, label: "Forecast" },
    { key: "simulation", icon: Shuffle, label: "Simulation" },
  ];

  const renderMarkdown = (content: string, emptyTitle: string, emptyDesc: string, EmptyIcon: typeof BookOpen) => {
    if (content) {
      return (
        <div className="prose prose-sm max-w-none text-sm leading-relaxed [&_p]:mb-3 [&_p]:text-foreground [&_h1]:text-xl [&_h1]:font-black [&_h1]:text-foreground [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-foreground [&_li]:text-sm [&_li]:text-foreground [&_strong]:text-foreground [&_table]:w-full [&_th]:text-left [&_th]:py-2 [&_th]:px-3 [&_th]:border-b [&_th]:border-border [&_th]:text-xs [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted-foreground [&_td]:py-2 [&_td]:px-3 [&_td]:border-b [&_td]:border-border/30 [&_td]:text-foreground">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }
    return (
      <div className="text-center py-12">
        <EmptyIcon className="h-14 w-14 text-muted-foreground mx-auto mb-5 opacity-30" />
        <h3 className="font-extrabold mb-3 text-lg text-foreground">{emptyTitle}</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">{emptyDesc}</p>
      </div>
    );
  };

  return (
    <div className="neural-bg min-h-screen">
      <div className="container py-10 max-w-7xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 tracking-tight leading-tight">
                <Brain className="h-8 w-8 text-primary" />
                Executive <span className="gradient-text">Command Center</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
                Drop your business data below — revenue, expenses, and key metrics are <strong className="text-foreground">auto-detected</strong>. AI will automatically generate charts, stories, forecasts, and recommendations.
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-card p-8 mb-8 transition-all duration-200 ${isDragging ? "ring-2 ring-primary border-primary/50 bg-primary/5" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="text-center py-6 mb-4">
              <Upload className="h-10 w-10 text-primary mx-auto mb-2 animate-bounce" />
              <p className="text-sm font-extrabold text-primary">Drop files here to upload</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <input ref={fileRef} type="file" multiple accept={ACCEPTED_FILES} className="hidden" onChange={handleFileUpload} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="border-primary/30 text-primary hover:bg-primary/10 font-extrabold" disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" /> Upload Data Files
            </Button>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
              <Image className="h-3 w-3" />
              CSV, JSON, TXT, PDF, Excel, Images — revenue & expense columns auto-detected
            </span>
          </div>
          {uploading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
              <Loader2 className="h-3 w-3 animate-spin" /> Processing files...
            </div>
          )}
          {uploadedFiles.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-4">
              {uploadedFiles.map((f, i) => {
                const Icon = getFileIcon(f.type);
                return (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    <Icon className="h-3 w-3" /> {f.name}
                    <button onClick={() => removeFile(i)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Tips Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {TIPS.map((tip, i) => (
              <div key={i} className="glass-card px-4 py-3 flex items-center gap-2.5 min-w-[280px] shrink-0">
                <tip.icon className="h-4 w-4 text-accent shrink-0" />
                <span className="text-xs text-muted-foreground leading-snug">{tip.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Empty State */}
        {!hasData && uploadedFiles.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-20 text-center mb-8">
            <BarChart3 className="h-20 w-20 text-muted-foreground mx-auto mb-8 opacity-20" />
            <h2 className="text-3xl font-black mb-4 text-foreground">No Data Uploaded Yet</h2>
            <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed mb-8">
              Upload a data file containing your <strong className="text-primary">revenue</strong> and <strong className="text-accent">expense</strong> data. The dashboard will automatically detect columns, generate KPIs, charts, and AI-powered insights.
            </p>
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="border-primary/30 text-primary hover:bg-primary/10 font-extrabold px-6">
              <Upload className="h-4 w-4 mr-2" /> Upload Your Data
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {kpis.map((kpi, i) => (
                    <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest">{kpi.label}</span>
                        <kpi.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-2xl md:text-3xl font-black tracking-tight text-foreground">{kpi.value}</div>
                      <div className={`text-xs mt-2 flex items-center gap-1 font-bold ${kpi.up ? "text-success" : "text-accent"}`}>
                        {kpi.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {kpi.change}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Charts */}
              {hasData && (
                <>
                  <div className="grid lg:grid-cols-2 gap-5">
                    <div className="glass-card p-6">
                      <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2 text-foreground">
                        <BarChart3 className="h-4 w-4 text-primary" /> Revenue Trend
                      </h3>
                      <ResponsiveContainer width="100%" height={260}>
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
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="glass-card p-6">
                      <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2 text-foreground">
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
                  </div>

                  <div className="grid lg:grid-cols-2 gap-5">
                    <div className="glass-card p-6">
                      <h3 className="text-sm font-extrabold mb-4 text-foreground">Revenue vs Expense</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Revenue", value: totalRevenue },
                              { name: "Expenses", value: totalExpense },
                              { name: "Net Profit", value: Math.max(0, totalRevenue - totalExpense) },
                            ]}
                            cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={3}
                          >
                            <Cell fill={COLORS[0]} />
                            <Cell fill={COLORS[2]} />
                            <Cell fill={COLORS[1]} />
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-3 mt-3 justify-center">
                        {[{ name: "Revenue", color: COLORS[0] }, { name: "Expenses", color: COLORS[2] }, { name: "Net Profit", color: COLORS[1] }].map(d => (
                          <div key={d.name} className="flex items-center gap-1.5 text-xs font-bold">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                            <span className="text-muted-foreground">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass-card p-6">
                      <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2 text-foreground">
                        <BarChart3 className="h-4 w-4 text-primary" /> Revenue Breakdown
                      </h3>
                      <ResponsiveContainer width="100%" height={220}>
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
                </>
              )}

              {/* AI Generated Content Tabs */}
              <div className="flex gap-1.5 flex-wrap">
                {dashTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-extrabold transition-all ${
                      activeTab === tab.key
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" /> {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && aiCharts.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="text-sm font-extrabold text-foreground">AI-Generated Charts</span>
                    <button onClick={() => setAiCharts([])} className="ml-auto text-xs text-muted-foreground hover:text-destructive font-bold">Clear</button>
                  </div>
                  {aiCharts.map((chart, i) => <DynamicChart key={i} chart={chart} />)}
                </div>
              )}

              {activeTab === "story" && (
                <div className="glass-card p-7 min-h-[300px]">
                  <div className="flex items-center gap-2 mb-6"><Sparkles className="h-4 w-4 text-accent" /><h3 className="text-sm font-extrabold text-foreground">AI Data Story</h3></div>
                  {renderMarkdown(aiStory, "No Story Generated", "Upload data and AI will automatically generate an executive data story.", BookOpen)}
                </div>
              )}

              {activeTab === "forecast" && (
                <div className="glass-card p-7 min-h-[300px]">
                  <div className="flex items-center gap-2 mb-6"><TrendingUp className="h-4 w-4 text-primary" /><h3 className="text-sm font-extrabold text-foreground">Predictive Forecast</h3></div>
                  {renderMarkdown(aiForecast, "No Forecast Yet", 'Ask the AI: "Create a forecast" or "Predict next quarter" for AI-powered predictions.', TrendingUp)}
                </div>
              )}

              {activeTab === "simulation" && (
                <div className="glass-card p-7 min-h-[300px]">
                  <div className="flex items-center gap-2 mb-6"><Shuffle className="h-4 w-4 text-accent" /><h3 className="text-sm font-extrabold text-foreground">Scenario Simulation</h3></div>
                  {renderMarkdown(aiSimulation, "No Simulation Yet", 'Ask "What if" questions to simulate scenarios with projected outcomes.', Shuffle)}
                </div>
              )}

              {/* Strategic Insights */}
              {hasData && (
                <div className="glass-card p-6">
                  <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2 text-foreground">
                    <Zap className="h-4 w-4 text-accent" /> Strategic Insights
                  </h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    {[
                      {
                        type: totalRevenue > totalExpense ? "info" : "danger",
                        text: totalRevenue > totalExpense
                          ? `Profitable with ${((1 - totalExpense / totalRevenue) * 100).toFixed(1)}% net margin.`
                          : `Expenses exceed revenue by ${formatValue(totalExpense - totalRevenue)}.`,
                      },
                      { type: "info", text: `Revenue across ${revenueData.length} periods: ${formatValue(totalRevenue)}. Avg: ${formatValue(totalRevenue / Math.max(revenueData.length, 1))}/period.` },
                      { type: "warning", text: `Total expenses: ${formatValue(totalExpense)}. Avg: ${formatValue(totalExpense / Math.max(expenseData.length, 1))}/period.` },
                    ].map((a, i) => (
                      <div key={i} className={`p-4 rounded-xl text-sm leading-relaxed font-semibold ${
                        a.type === "danger" ? "bg-destructive/10 text-destructive border border-destructive/20" :
                        a.type === "warning" ? "bg-accent/10 text-accent border border-accent/20" :
                        "bg-primary/10 text-primary border border-primary/20"
                      }`}>
                        <AlertTriangle className="h-4 w-4 inline mr-2" />{a.text}
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
