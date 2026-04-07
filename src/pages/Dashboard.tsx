import { useRef, useState, useCallback, useEffect, useMemo } from "react";
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
  Layers, CircleDot, Eye, AlertCircle, Flame, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { parseFileContent, parseExcel, parsePdf, parseStructuredData } from "@/lib/analytics-ai";
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
const AMOUNT_KEYWORDS = ["amount", "amt", "value", "total", "net"];
const FILE_REVENUE_KEYWORDS = [...REVENUE_KEYWORDS, "receipt", "receipts"];
const FILE_EXPENSE_KEYWORDS = [...EXPENSE_KEYWORDS, "expence", "expenses"];

type StructuredRow = Record<string, string>;

const parseNumericValue = (val: unknown): number => {
  const s = String(val || "0").replace(/[₹$€£¥,\s%]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

const sortLabels = (labels: string[]) => labels.sort((a, b) => {
  const dateA = Date.parse(a);
  const dateB = Date.parse(b);
  if (!Number.isNaN(dateA) && !Number.isNaN(dateB)) return dateA - dateB;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
});

const detectSingleMetricKind = (headers: string[], rows: StructuredRow[], fileName: string) => {
  const combinedText = `${fileName} ${headers.join(" ")}`.toLowerCase();
  if (FILE_EXPENSE_KEYWORDS.some((keyword) => combinedText.includes(keyword))) return "expense";
  if (FILE_REVENUE_KEYWORDS.some((keyword) => combinedText.includes(keyword))) return "revenue";

  const typeHeader = headers.find((header) => {
    const normalized = header.toLowerCase();
    return normalized === "type" || normalized.includes("type") || normalized.includes("kind");
  });

  if (!typeHeader) return "unknown";

  const values = rows.slice(0, 25).map((row) => String(row[typeHeader] || "").toLowerCase());
  const expenseHits = values.filter((value) => FILE_EXPENSE_KEYWORDS.some((keyword) => value.includes(keyword))).length;
  const revenueHits = values.filter((value) => FILE_REVENUE_KEYWORDS.some((keyword) => value.includes(keyword))).length;

  if (expenseHits > revenueHits) return "expense";
  if (revenueHits > expenseHits) return "revenue";
  return "unknown";
};

const aggregateMetric = (rows: StructuredRow[], labelKey: string, valueKey: string, target: Map<string, number>) => {
  rows.forEach((row) => {
    const label = String(row[labelKey] || "Row").trim() || "Row";
    const value = parseNumericValue(row[valueKey]);
    if (value === 0) return;
    target.set(label, (target.get(label) || 0) + value);
  });
};

const TIPS = [
  { icon: Lightbulb, color: "text-[hsl(220,80%,60%)]", bg: "kpi-card-blue", text: "Upload a single file with both revenue and expense columns for the most accurate KPIs and profit analysis." },
  { icon: Target, color: "text-[hsl(280,70%,65%)]", bg: "kpi-card-purple", text: "AI auto-generates charts, stories, forecasts, and simulations — just upload your data and watch." },
  { icon: Zap, color: "text-[hsl(25,95%,58%)]", bg: "kpi-card-orange", text: "Ask the AI 'What if we cut costs 15%?' for instant scenario simulation with projected outcomes." },
  { icon: Brain, color: "text-[hsl(340,75%,60%)]", bg: "kpi-card-pink", text: "Use the AI Co-Founder mode — ask for growth strategies, profit leak detection, or competitive analysis." },
  { icon: Shield, color: "text-[hsl(152,69%,45%)]", bg: "kpi-card-green", text: "Export your analysis as CSV or JSON anytime. All insights are based strictly on your actual data." },
];

type DashTabKey = "overview" | "story" | "forecast" | "simulation" | "cofounder" | "table";

const Dashboard = () => {
  const { dashboardFiles: uploadedFiles, setDashboardFiles: setUploadedFiles } = useFileStore();
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
  const [aiCofounder, setAiCofounder] = useState("");

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
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [fileData, uploadedFiles.length, autoAnalyzeTriggered]);



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

  const { revenueData, expenseData, tableData } = useMemo(() => {
    const revenueMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();
    let firstStructuredTable: ReturnType<typeof parseStructuredData> = null;

    for (const file of uploadedFiles) {
      const parsed = parseStructuredData(file.content);
      if (!parsed || parsed.rows.length === 0) continue;
      if (!firstStructuredTable) firstStructuredTable = parsed;

      const headers = parsed.headers;
      const rows = parsed.rows;
      const labelIdx = findLabelColumn(headers, rows);
      const labelKey = headers[labelIdx];
      const revenueIdx = findColumnByKeywords(headers, REVENUE_KEYWORDS, labelIdx);
      const expenseIdx = findColumnByKeywords(headers, EXPENSE_KEYWORDS, labelIdx);
      const amountIdx = findColumnByKeywords(headers, AMOUNT_KEYWORDS, labelIdx);
      const detectedKind = detectSingleMetricKind(headers, rows, file.name);

      if (revenueIdx >= 0) aggregateMetric(rows, labelKey, headers[revenueIdx], revenueMap);
      if (expenseIdx >= 0) aggregateMetric(rows, labelKey, headers[expenseIdx], expenseMap);

      if (revenueIdx < 0 && expenseIdx < 0) {
        const primaryNumericIdx = amountIdx >= 0 ? amountIdx : findFirstNumericCol(headers, rows, [labelIdx]);
        if (primaryNumericIdx < 0) continue;

        if (detectedKind === "revenue") {
          aggregateMetric(rows, labelKey, headers[primaryNumericIdx], revenueMap);
          continue;
        }

        if (detectedKind === "expense") {
          aggregateMetric(rows, labelKey, headers[primaryNumericIdx], expenseMap);
          continue;
        }

        const secondaryNumericIdx = findFirstNumericCol(headers, rows, [labelIdx, primaryNumericIdx]);
        if (secondaryNumericIdx >= 0) {
          aggregateMetric(rows, labelKey, headers[primaryNumericIdx], revenueMap);
          aggregateMetric(rows, labelKey, headers[secondaryNumericIdx], expenseMap);
        }
        continue;
      }

      if (revenueIdx < 0 && amountIdx >= 0 && detectedKind === "revenue") {
        aggregateMetric(rows, labelKey, headers[amountIdx], revenueMap);
      }

      if (expenseIdx < 0 && amountIdx >= 0 && detectedKind === "expense") {
        aggregateMetric(rows, labelKey, headers[amountIdx], expenseMap);
      }
    }

    const labels = sortLabels(Array.from(new Set([...revenueMap.keys(), ...expenseMap.keys()])));

    return {
      revenueData: labels
        .filter((label) => revenueMap.has(label))
        .map((label) => ({ month: label, revenue: revenueMap.get(label) || 0, forecast: revenueMap.get(label) || 0 })),
      expenseData: labels
        .filter((label) => expenseMap.has(label))
        .map((label) => ({ month: label, expense: expenseMap.get(label) || 0 })),
      tableData: firstStructuredTable,
    };
  }, [uploadedFiles]);

  const hasData = revenueData.length > 0 || expenseData.length > 0;

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

  const autoInsights: { icon: typeof AlertCircle; color: string; bg: string; text: string }[] = [];
  if (hasData) {
    if (revenueData.length >= 3) {
      const last3 = revenueData.slice(-3);
      const isDecline = last3[2].revenue < last3[0].revenue;
      const changePercent = last3[0].revenue > 0 ? Math.abs(((last3[2].revenue - last3[0].revenue) / last3[0].revenue) * 100).toFixed(1) : "0";
      if (isDecline) {
        autoInsights.push({ icon: AlertTriangle, color: "text-[hsl(340,75%,60%)]", bg: "kpi-card-pink", text: `⚠️ Revenue declined ${changePercent}% over the last 3 periods (${last3[0].month} → ${last3[2].month}).` });
      } else {
        autoInsights.push({ icon: TrendingUp, color: "text-[hsl(152,69%,45%)]", bg: "kpi-card-green", text: `📈 Revenue grew ${changePercent}% over the last 3 periods (${last3[0].month} → ${last3[2].month}).` });
      }
    }
    if (totalRevenue > 0 && totalExpense > 0) {
      const ratio = (totalExpense / totalRevenue * 100).toFixed(1);
      if (parseFloat(ratio) > 80) {
        autoInsights.push({ icon: Flame, color: "text-[hsl(25,95%,58%)]", bg: "kpi-card-orange", text: `🔥 Expenses are ${ratio}% of revenue — profit margins are critically thin.` });
      } else if (parseFloat(ratio) > 60) {
        autoInsights.push({ icon: Eye, color: "text-[hsl(220,80%,60%)]", bg: "kpi-card-blue", text: `👁️ Expenses consume ${ratio}% of revenue. Monitor cost efficiency.` });
      } else {
        autoInsights.push({ icon: Award, color: "text-[hsl(152,69%,45%)]", bg: "kpi-card-green", text: `✅ Healthy cost ratio: expenses are only ${ratio}% of revenue.` });
      }
    }
    if (revenueData.length > 1) {
      const peakIdx = revenueData.reduce((best, d, i) => d.revenue > revenueData[best].revenue ? i : best, 0);
      autoInsights.push({ icon: Sparkles, color: "text-[hsl(280,70%,65%)]", bg: "kpi-card-purple", text: `🏆 Peak revenue period: ${revenueData[peakIdx].month} with ${formatValue(revenueData[peakIdx].revenue)}.` });
    }
    if (expenseData.length >= 2) {
      for (let i = 1; i < expenseData.length; i++) {
        const prev = expenseData[i-1].expense;
        const curr = expenseData[i].expense;
        if (prev > 0 && curr > prev * 1.3) {
          const spike = ((curr - prev) / prev * 100).toFixed(0);
          autoInsights.push({ icon: AlertCircle, color: "text-[hsl(25,95%,58%)]", bg: "kpi-card-orange", text: `⚡ Expense spike of ${spike}% detected in ${expenseData[i].month} vs ${expenseData[i-1].month}.` });
          break;
        }
      }
    }
  }

  const kpis = hasData ? [
    { label: "Total Revenue", value: formatValue(totalRevenue), icon: DollarSign, colorClass: "kpi-card-blue", iconColor: "text-[hsl(220,80%,60%)]", up: true },
    { label: "Total Expenses", value: formatValue(totalExpense), icon: TrendingDown, colorClass: "kpi-card-orange", iconColor: "text-[hsl(25,95%,58%)]", up: false },
    { label: "Net Profit", value: formatValue(netProfit), icon: Activity, colorClass: netProfit >= 0 ? "kpi-card-green" : "kpi-card-pink", iconColor: netProfit >= 0 ? "text-[hsl(152,69%,45%)]" : "text-[hsl(340,75%,60%)]", up: netProfit >= 0 },
    { label: "Profit Margin", value: `${margin.toFixed(1)}%`, icon: Percent, colorClass: "kpi-card-purple", iconColor: "text-[hsl(280,70%,65%)]", up: margin > 0 },
    { label: "Avg Revenue/Period", value: formatValue(avgRevenue), icon: Target, colorClass: "kpi-card-cyan", iconColor: "text-[hsl(200,80%,55%)]", up: true },
    { label: "Peak Revenue", value: formatValue(maxRevenue), icon: ArrowUpRight, colorClass: "kpi-card-blue", iconColor: "text-[hsl(220,80%,60%)]", up: true },
  ] : [];

  const processFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    setAutoAnalyzeTriggered(false);
    autoAnalyzeGuard.current = false;
    setAiCharts([]);
    setAiStory("");
    setAiForecast("");
    setAiSimulation("");
    setAiCofounder("");
    setActiveTab("overview");

    const parsedFiles: typeof uploadedFiles = [];
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isImage = ["jpeg", "jpg", "png", "gif", "webp", "svg"].includes(ext);
      const isExcel = ["xlsx", "xls"].includes(ext);
      try {
        if (isImage) { parsedFiles.push({ name: file.name, content: `[Image: ${file.name}]`, category: "other", type: ext }); toast.success(`${file.name} uploaded`); continue; }
        if (isExcel) {
          const buffer = await file.arrayBuffer();
          const content = parseExcel(buffer);
          if (content) { parsedFiles.push({ name: file.name, content, category: "other", type: ext }); toast.success(`${file.name} uploaded & parsed`); }
          else toast.error(`Could not parse ${file.name}`);
          continue;
        }
        if (ext === "pdf") {
          const buffer = await file.arrayBuffer();
          const content = await parsePdf(buffer);
          if (content) {
            parsedFiles.push({ name: file.name, content, category: "other", type: ext });
            toast.success(`${file.name} uploaded & parsed`);
          } else {
            toast.error(`Could not parse ${file.name}`);
          }
          continue;
        }
        const text = await file.text();
        const content = parseFileContent(text, file.name);
        parsedFiles.push({ name: file.name, content, category: "other", type: ext });
        toast.success(`${file.name} uploaded & parsed`);
      } catch { toast.error(`Failed to read ${file.name}`); }
    }
    setUploadedFiles(parsedFiles);
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
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
    setAiCharts([]);
    setAiStory("");
    setAiForecast("");
    setAiSimulation("");
    setAiCofounder("");
    setAutoAnalyzeTriggered(false);
    autoAnalyzeGuard.current = false;
  };

  const getFileIcon = (type: string) => {
    if (["jpeg", "jpg", "png", "gif", "webp", "svg"].includes(type)) return FileImage;
    if (["xlsx", "xls"].includes(type)) return FileSpreadsheet;
    return FileText;
  };

  const handleChartsGenerated = useCallback((charts: ChartData[]) => { setAiCharts(prev => [...prev, ...charts]); }, []);
  const handleStoryGenerated = useCallback((story: string) => { setAiStory(story); }, []);
  const handleForecastGenerated = useCallback((text: string) => { setAiForecast(text); }, []);
  const handleSimulationGenerated = useCallback((text: string) => { setAiSimulation(text); }, []);
  const handleCofounderGenerated = useCallback((text: string) => { setAiCofounder(text); }, []);

  const dashTabs: { key: DashTabKey; icon: typeof BarChart3; label: string }[] = [
    { key: "overview", icon: BarChart3, label: "Overview" },
    { key: "story", icon: BookOpen, label: "AI Story" },
    { key: "forecast", icon: TrendingUp, label: "Forecast" },
    { key: "simulation", icon: Shuffle, label: "Simulation" },
    { key: "cofounder", icon: Brain, label: "Co-Founder" },
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

  const combinedData = useMemo(() => {
    const revenueMap = new Map(revenueData.map((item) => [item.month, item.revenue]));
    const expenseMap = new Map(expenseData.map((item) => [item.month, item.expense]));
    const labels = sortLabels(Array.from(new Set([...revenueMap.keys(), ...expenseMap.keys()])));

    return labels.map((label) => ({
      month: label,
      revenue: revenueMap.get(label) || 0,
      expense: expenseMap.get(label) || 0,
    }));
  }, [expenseData, revenueData]);

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
                data={combinedData}
                headers={["month", "revenue", "expense"]}
                filename="dashboard-data"
              />
            )}
          </div>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`glass-card p-8 mb-6 transition-all duration-200 ${isDragging ? "ring-2 ring-primary border-primary/50 bg-primary/5" : ""}`}
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        >
          {isDragging && (
            <div className="text-center py-6 mb-4">
              <Upload className="h-12 w-12 text-primary mx-auto mb-3 animate-bounce" />
              <p className="text-lg font-black text-primary">Drop files here to upload</p>
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
                  <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
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

        {/* Auto Insights */}
        {autoInsights.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-[hsl(280,70%,65%)]" />
              <h3 className="text-lg font-black text-foreground">Auto-Detected Insights</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent font-bold">Live from your data</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {autoInsights.map((insight, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                  className={`glass-card p-5 ${insight.bg} border flex items-start gap-3`}>
                  <insight.icon className={`h-5 w-5 ${insight.color} shrink-0 mt-0.5`} />
                  <p className="text-sm text-foreground leading-relaxed font-bold">{insight.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!hasData && uploadedFiles.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-20 text-center mb-8">
            <BarChart3 className="h-24 w-24 text-muted-foreground mx-auto mb-8 opacity-15" />
            <h2 className="text-4xl font-black mb-5 text-foreground">No Data Uploaded Yet</h2>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed mb-8 font-medium">
              Upload your business data and watch AI transform it into <strong className="text-primary">actionable intelligence</strong> — charts, KPIs, forecasts, and strategic recommendations.
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
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} fontWeight={600} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} fontWeight={600} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Area type="monotone" dataKey="revenue" stroke="hsl(220,80%,60%)" fill="url(#revGradD)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

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
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} fontWeight={600} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} fontWeight={600} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Area type="monotone" dataKey="expense" stroke="hsl(25,95%,58%)" fill="url(#expGradD)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-5">
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

                    <div className="glass-card p-6">
                      <h3 className="text-base font-black mb-4 flex items-center gap-2 text-foreground">
                        <Layers className="h-5 w-5 text-[hsl(340,75%,60%)]" /> Revenue vs Expense Comparison
                      </h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={combinedData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} fontWeight={600} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} fontWeight={600} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="revenue" fill="hsl(220,80%,60%)" radius={[6, 6, 0, 0]} name="Revenue" />
                          <Bar dataKey="expense" fill="hsl(25,95%,58%)" radius={[6, 6, 0, 0]} name="Expense" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="text-base font-black mb-4 flex items-center gap-2 text-foreground">
                      <CircleDot className="h-5 w-5 text-[hsl(280,70%,65%)]" /> Revenue Breakdown by Period
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} fontWeight={600} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} fontWeight={600} />
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
                  {renderMarkdown(aiForecast, "No Forecast Yet", "AI will auto-generate forecasts when data is uploaded.", TrendingUp)}
                </div>
              )}

              {activeTab === "simulation" && (
                <div className="glass-card p-8 min-h-[350px]">
                  <div className="flex items-center gap-2 mb-6"><Shuffle className="h-5 w-5 text-[hsl(340,75%,60%)]" /><h3 className="text-lg font-black text-foreground">Scenario Simulation</h3></div>
                  {renderMarkdown(aiSimulation, "No Simulation Yet", "AI will auto-generate what-if scenarios. Try asking: 'What if we cut costs 15%?'", Shuffle)}
                </div>
              )}

              {activeTab === "cofounder" && (
                <div className="glass-card p-8 min-h-[350px]">
                  <div className="flex items-center gap-2 mb-6"><Brain className="h-5 w-5 text-[hsl(280,70%,65%)]" /><h3 className="text-lg font-black text-foreground">AI Strategic Co-Founder</h3></div>
                  {renderMarkdown(aiCofounder, "No Strategic Analysis Yet", "Your AI strategic partner. Ask for growth strategies, profit leak analysis, cost optimization.", Brain)}
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
                onCofounderGenerated={handleCofounderGenerated}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
