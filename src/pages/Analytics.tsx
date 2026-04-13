import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  BarChart3,
  TrendingUp,
  Sparkles,
  Table,
  BookOpen,
  X,
  Brain,
  Shuffle,
  FileImage,
  FileSpreadsheet,
  Image,
  Lightbulb,
  Target,
  Zap,
  TrendingDown,
  DollarSign,
  Activity,
  PieChart as PieChartIcon,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  AlertTriangle,
  Eye,
  AlertCircle,
  Flame,
  Award,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AIChatPanel from "@/components/AIChatPanel";
import DynamicChart, { ChartData, parseChartBlocks } from "@/components/DynamicChart";
import {
  parseFileContent,
  parseExcel,
  parsePdf,
  parseStructuredData,
  streamAnalyticsChat,
} from "@/lib/analytics-ai";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useFileDrop } from "@/hooks/use-file-drop";
import ExportButtons from "@/components/ExportButtons";
import SavedAnalysesPanel from "@/components/SavedAnalysesPanel";

const ACCEPTED_FILES = ".csv,.json,.txt,.tsv,.pdf,.xlsx,.xls,.jpeg,.jpg,.png,.gif,.webp,.svg";
const AUTO_ANALYZE_FINANCIAL =
  "Run the full autonomous analysis now. Use these exact sections in this order: ## DATA STORY, ## FORECAST, ## SIMULATION, ## STRATEGY. Generate 3 to 4 chart blocks using only exact values from the uploaded data. Include concise recommendations in STRATEGY.";
const AUTO_ANALYZE_GENERAL =
  "Run the full autonomous analysis now. This is NON-FINANCIAL data. Use these exact sections in this order: ## DATA STORY (minimum 600 words, very detailed), ## KEY FINDINGS (8-12 bullet points with specific numbers), ## SLIDESHOW (6-8 slides with titles, key points, and bullet points), ## RECOMMENDATIONS. Do NOT generate any chart blocks. Focus entirely on narrative analysis, findings, and presentation slides.";

const COLORS = [
  "hsl(220,80%,60%)",
  "hsl(280,70%,65%)",
  "hsl(25,95%,58%)",
  "hsl(340,75%,60%)",
  "hsl(152,69%,45%)",
  "hsl(200,80%,55%)",
];

const tooltipStyle = {
  background: "hsl(222,28%,8%)",
  border: "1px solid hsl(222,18%,16%)",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  color: "#fff",
};

const TIPS = [
  {
    icon: Lightbulb,
    color: "text-[hsl(220,80%,60%)]",
    bg: "kpi-card-blue",
    text: "Upload one file that includes both revenue and expense columns for the strongest KPIs, charts, and profit analysis.",
  },
  {
    icon: Target,
    color: "text-[hsl(280,70%,65%)]",
    bg: "kpi-card-purple",
    text: "Analysis runs automatically after upload — charts, story, forecast, simulation, and strategy are generated without prompting.",
  },
  {
    icon: Zap,
    color: "text-[hsl(25,95%,58%)]",
    bg: "kpi-card-orange",
    text: "Use the AI panel for follow-up questions only, like pricing changes, market expansion, or risk scenarios.",
  },
  {
    icon: Brain,
    color: "text-[hsl(340,75%,60%)]",
    bg: "kpi-card-pink",
    text: "Recommendations and insight boxes update from your uploaded data, not from placeholder values or hardcoded examples.",
  },
];

const FINANCIAL_KEYWORDS = ["revenue", "sales", "income", "earning", "earnings", "turnover", "gross", "expense", "cost", "spending", "budget", "expenditure", "profit", "margin", "cogs", "cash flow", "roi"];
const REVENUE_KEYWORDS = ["revenue", "sales", "income", "earning", "earnings", "turnover", "gross"];
const EXPENSE_KEYWORDS = ["expense", "cost", "spending", "budget", "expenditure", "outflow", "cogs"];
const AMOUNT_KEYWORDS = ["amount", "amt", "value", "total", "net"];
const FILE_REVENUE_KEYWORDS = [...REVENUE_KEYWORDS, "receipt", "receipts"];
const FILE_EXPENSE_KEYWORDS = [...EXPENSE_KEYWORDS, "expence", "expenses"];

type TabKey = "overview" | "story" | "table" | "forecast" | "simulation" | "cofounder" | "slideshow" | "findings";
type StructuredRow = Record<string, string>;

const parseNumericValue = (value: unknown): number => {
  const normalized = String(value ?? "")
    .replace(/\(([^)]+)\)/g, "-$1")
    .replace(/[₹$€£¥,%\s]/g, "")
    .replace(/,/g, "")
    .trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sortLabels = (labels: string[]) =>
  [...labels].sort((a, b) => {
    const dateA = Date.parse(a);
    const dateB = Date.parse(b);
    if (!Number.isNaN(dateA) && !Number.isNaN(dateB)) return dateA - dateB;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });

const formatValue = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
};

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

const findColumnByKeywords = (headers: string[], keywords: string[], excludeIdx?: number): number => {
  return headers.findIndex((header, index) => {
    if (index === excludeIdx) return false;
    const lower = header.toLowerCase();
    return keywords.some((keyword) => lower.includes(keyword));
  });
};

const findLabelColumn = (headers: string[], rows: StructuredRow[]): number => {
  let labelIdx = headers.findIndex((header) => {
    const lower = header.toLowerCase();
    return (
      lower.includes("month") ||
      lower.includes("date") ||
      lower.includes("period") ||
      lower.includes("year") ||
      lower.includes("quarter") ||
      lower.includes("name") ||
      lower.includes("category")
    );
  });

  if (labelIdx < 0) {
    labelIdx = headers.findIndex((header) => {
      const value = String(rows[0]?.[header] || "").replace(/[,$%]/g, "").trim();
      return Number.isNaN(Number.parseFloat(value)) || value === "";
    });
  }

  return labelIdx < 0 ? 0 : labelIdx;
};

const findFirstNumericCol = (headers: string[], rows: StructuredRow[], excludeIdxs: number[]): number => {
  for (let index = 0; index < headers.length; index += 1) {
    if (excludeIdxs.includes(index)) continue;
    const value = String(rows[0]?.[headers[index]] || "").replace(/[,$%₹$€£¥]/g, "").trim();
    if (value !== "" && !Number.isNaN(Number.parseFloat(value))) return index;
  }
  return -1;
};

const parseSections = (fullText: string) => {
  const result = { story: "", forecast: "", simulation: "", cofounder: "", general: "", slideshow: "", findings: "" };
  const sectionMap: Record<string, keyof typeof result> = {
    "DATA STORY": "story",
    STORY: "story",
    SUMMARY: "story",
    FORECAST: "forecast",
    PREDICTION: "forecast",
    PROJECTION: "forecast",
    SIMULATION: "simulation",
    SCENARIO: "simulation",
    "WHAT-IF": "simulation",
    STRATEGY: "cofounder",
    STRATEGIC: "cofounder",
    RECOMMENDATION: "cofounder",
    RECOMMENDATIONS: "cofounder",
    DECISION: "cofounder",
    "CO-FOUNDER": "cofounder",
    SLIDESHOW: "slideshow",
    PRESENTATION: "slideshow",
    SLIDES: "slideshow",
    "KEY FINDINGS": "findings",
    FINDINGS: "findings",
  };

  let currentSection: keyof typeof result = "general";
  let currentContent: string[] = [];

  const flush = () => {
    const content = currentContent.join("\n").trim();
    if (content) {
      result[currentSection] = result[currentSection]
        ? `${result[currentSection]}\n\n${content}`
        : content;
    }
    currentContent = [];
  };

  fullText.split("\n").forEach((line) => {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (!headingMatch) {
      currentContent.push(line);
      return;
    }

    flush();
    const heading = headingMatch[1].toUpperCase();
    const matchedEntry = Object.entries(sectionMap).find(([keyword]) => heading.includes(keyword));
    currentSection = matchedEntry?.[1] || "general";
    currentContent.push(line);
  });

  flush();
  return result;
};

const mergeCharts = (existing: ChartData[], incoming: ChartData[]) => {
  const seen = new Set<string>();
  return [...existing, ...incoming].filter((chart) => {
    const key = `${chart.type}:${chart.title}:${JSON.stringify(chart.data)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const extractRecommendationCards = ({
  aiCofounder,
  hasData,
  totalRevenue,
  totalExpense,
  netProfit,
  revenueData,
}: {
  aiCofounder: string;
  hasData: boolean;
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  revenueData: { month: string; revenue: number }[];
}) => {
  const aiLines = aiCofounder
    .split("\n")
    .map((line) => line.replace(/^#{1,6}\s*/, "").replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").trim())
    .filter((line) => line.length > 24)
    .filter((line) => /recommend|focus|priorit|reduce|increase|improve|optimiz|invest|expand|monitor|fix|cut/i.test(line))
    .slice(0, 3);

  const aiTitles = ["Priority Move", "Growth Play", "Risk Watch"];
  if (aiLines.length > 0) {
    return aiLines.map((text, index) => ({
      title: aiTitles[index] || `Recommendation ${index + 1}`,
      text,
      bg: ["kpi-card-purple", "kpi-card-blue", "kpi-card-orange"][index] || "kpi-card-blue",
      color: ["text-[hsl(280,70%,65%)]", "text-[hsl(220,80%,60%)]", "text-[hsl(25,95%,58%)]"][index] || "text-primary",
    }));
  }

  if (!hasData) return [];

  const cards = [] as { title: string; text: string; bg: string; color: string }[];

  if (totalRevenue > 0 && totalExpense / totalRevenue > 0.8) {
    cards.push({
      title: "Protect Margin",
      text: "Expenses are consuming most of revenue. Tighten cost-heavy categories before pushing more growth spend.",
      bg: "kpi-card-orange",
      color: "text-[hsl(25,95%,58%)]",
    });
  }

  if (netProfit <= 0) {
    cards.push({
      title: "Stabilize Profit",
      text: "Profit is under pressure. Focus first on periods with the weakest contribution and remove low-return spend.",
      bg: "kpi-card-pink",
      color: "text-[hsl(340,75%,60%)]",
    });
  }

  if (revenueData.length >= 3 && revenueData[revenueData.length - 1].revenue < revenueData[0].revenue) {
    cards.push({
      title: "Recover Demand",
      text: "Recent revenue is softer than earlier periods. Investigate retention, conversion, and pricing before scaling acquisition.",
      bg: "kpi-card-blue",
      color: "text-[hsl(220,80%,60%)]",
    });
  }

  if (cards.length === 0) {
    cards.push({
      title: "Scale What Works",
      text: "Performance looks stable. Double down on the best-performing period, channel, or category visible in the uploaded data.",
      bg: "kpi-card-green",
      color: "text-[hsl(152,69%,45%)]",
    });
  }

  return cards.slice(0, 3);
};

const Analytics = () => {
  const { analyticsFiles: uploadedFiles, setAnalyticsFiles: setUploadedFiles } = useFileStore();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [aiCharts, setAiCharts] = useState<ChartData[]>([]);
  const [aiStory, setAiStory] = useState("");
  const [aiForecast, setAiForecast] = useState("");
  const [aiSimulation, setAiSimulation] = useState("");
  const [aiCofounder, setAiCofounder] = useState("");
  const [aiSlideshow, setAiSlideshow] = useState("");
  const [aiFindings, setAiFindings] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const autoRunIdRef = useRef(0);
  const lastAutoDataRef = useRef("");

  const fileData = useMemo(
    () => uploadedFiles.map((file) => `--- FILE: ${file.name} ---\n${file.content}`).join("\n\n"),
    [uploadedFiles],
  );

  const tableData = useMemo(() => {
    for (const file of uploadedFiles) {
      const parsed = parseStructuredData(file.content);
      if (parsed) return parsed;
    }
    return null;
  }, [uploadedFiles]);

  const { revenueData, expenseData } = useMemo(() => {
    const revenueMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();

    for (const file of uploadedFiles) {
      const parsed = parseStructuredData(file.content);
      if (!parsed || parsed.rows.length === 0) continue;

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
        .map((label) => ({ month: label, revenue: revenueMap.get(label) || 0 })),
      expenseData: labels
        .filter((label) => expenseMap.has(label))
        .map((label) => ({ month: label, expense: expenseMap.get(label) || 0 })),
    };
  }, [uploadedFiles]);

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

  const hasData = revenueData.length > 0 || expenseData.length > 0;
  const hasAnalysis = aiCharts.length > 0 || Boolean(aiStory || aiForecast || aiSimulation || aiCofounder || aiSlideshow || aiFindings);

  // Detect if uploaded data is financial
  const isFinancialData = useMemo(() => {
    if (hasData) return true; // Revenue/expense columns were detected
    const allContent = uploadedFiles.map(f => f.content).join(" ").toLowerCase();
    return FINANCIAL_KEYWORDS.some(kw => allContent.includes(kw));
  }, [uploadedFiles, hasData]);
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpense = expenseData.reduce((sum, item) => sum + item.expense, 0);
  const netProfit = totalRevenue - totalExpense;
  const margin = totalRevenue > 0 ? ((1 - totalExpense / totalRevenue) * 100) : 0;
  const avgRevenue = revenueData.length > 0 ? totalRevenue / revenueData.length : 0;
  const maxRevenue = revenueData.length > 0 ? Math.max(...revenueData.map((item) => item.revenue)) : 0;

  const autoInsights: { icon: typeof AlertCircle; color: string; bg: string; text: string }[] = [];
  if (hasData) {
    if (revenueData.length >= 3) {
      const last3 = revenueData.slice(-3);
      const changePercent = last3[0].revenue > 0
        ? Math.abs(((last3[2].revenue - last3[0].revenue) / last3[0].revenue) * 100).toFixed(1)
        : "0";
      if (last3[2].revenue < last3[0].revenue) {
        autoInsights.push({
          icon: AlertTriangle,
          color: "text-[hsl(340,75%,60%)]",
          bg: "kpi-card-pink",
          text: `Revenue declined ${changePercent}% over the last 3 periods (${last3[0].month} → ${last3[2].month}).`,
        });
      } else {
        autoInsights.push({
          icon: TrendingUp,
          color: "text-[hsl(152,69%,45%)]",
          bg: "kpi-card-green",
          text: `Revenue grew ${changePercent}% over the last 3 periods (${last3[0].month} → ${last3[2].month}).`,
        });
      }
    }

    if (totalRevenue > 0 && totalExpense > 0) {
      const ratio = (totalExpense / totalRevenue) * 100;
      if (ratio > 80) {
        autoInsights.push({
          icon: Flame,
          color: "text-[hsl(25,95%,58%)]",
          bg: "kpi-card-orange",
          text: `Expenses are ${ratio.toFixed(1)}% of revenue, so margins are critically thin.`,
        });
      } else if (ratio > 60) {
        autoInsights.push({
          icon: Eye,
          color: "text-[hsl(220,80%,60%)]",
          bg: "kpi-card-blue",
          text: `Expenses consume ${ratio.toFixed(1)}% of revenue. Monitor cost efficiency closely.`,
        });
      } else {
        autoInsights.push({
          icon: Award,
          color: "text-[hsl(152,69%,45%)]",
          bg: "kpi-card-green",
          text: `Cost structure looks healthy: expenses are ${ratio.toFixed(1)}% of revenue.`,
        });
      }
    }

    if (revenueData.length > 1) {
      const peakIdx = revenueData.reduce((best, item, index) =>
        item.revenue > revenueData[best].revenue ? index : best,
      0);
      autoInsights.push({
        icon: Sparkles,
        color: "text-[hsl(280,70%,65%)]",
        bg: "kpi-card-purple",
        text: `Peak revenue period: ${revenueData[peakIdx].month} with ${formatValue(revenueData[peakIdx].revenue)}.`,
      });
    }

    if (expenseData.length >= 2) {
      for (let index = 1; index < expenseData.length; index += 1) {
        const prev = expenseData[index - 1].expense;
        const current = expenseData[index].expense;
        if (prev > 0 && current > prev * 1.3) {
          const spike = (((current - prev) / prev) * 100).toFixed(0);
          autoInsights.push({
            icon: AlertCircle,
            color: "text-[hsl(25,95%,58%)]",
            bg: "kpi-card-orange",
            text: `Expense spike of ${spike}% detected in ${expenseData[index].month} versus ${expenseData[index - 1].month}.`,
          });
          break;
        }
      }
    }
  }

  const recommendationCards = extractRecommendationCards({
    aiCofounder,
    hasData,
    totalRevenue,
    totalExpense,
    netProfit,
    revenueData,
  });

  const kpis = hasData
    ? [
        {
          label: "Total Revenue",
          value: formatValue(totalRevenue),
          icon: DollarSign,
          colorClass: "kpi-card-blue",
          iconColor: "text-[hsl(220,80%,60%)]",
          up: true,
        },
        {
          label: "Total Expenses",
          value: formatValue(totalExpense),
          icon: TrendingDown,
          colorClass: "kpi-card-orange",
          iconColor: "text-[hsl(25,95%,58%)]",
          up: false,
        },
        {
          label: "Net Profit",
          value: formatValue(netProfit),
          icon: Activity,
          colorClass: netProfit >= 0 ? "kpi-card-green" : "kpi-card-pink",
          iconColor: netProfit >= 0 ? "text-[hsl(152,69%,45%)]" : "text-[hsl(340,75%,60%)]",
          up: netProfit >= 0,
        },
        {
          label: "Profit Margin",
          value: `${margin.toFixed(1)}%`,
          icon: Percent,
          colorClass: "kpi-card-purple",
          iconColor: "text-[hsl(280,70%,65%)]",
          up: margin > 0,
        },
        {
          label: "Avg Revenue / Period",
          value: formatValue(avgRevenue),
          icon: Target,
          colorClass: "kpi-card-cyan",
          iconColor: "text-[hsl(200,80%,55%)]",
          up: true,
        },
        {
          label: "Peak Revenue",
          value: formatValue(maxRevenue),
          icon: ArrowUpRight,
          colorClass: "kpi-card-blue",
          iconColor: "text-[hsl(220,80%,60%)]",
          up: true,
        },
      ]
    : [];

  const exportData = hasData ? combinedData : (tableData?.rows || []);
  const exportHeaders = hasData ? ["month", "revenue", "expense"] : tableData?.headers;

  const runAutoAnalysis = useCallback(async (sourceFileData: string, financial: boolean) => {
    if (!sourceFileData.trim()) return;

    const runId = Date.now();
    autoRunIdRef.current = runId;
    setIsAutoAnalyzing(true);

    const prompt = financial ? AUTO_ANALYZE_FINANCIAL : AUTO_ANALYZE_GENERAL;

    let assistantSoFar = "";
    await streamAnalyticsChat({
      messages: [{ role: "user", content: prompt }],
      fileData: sourceFileData,
      onDelta: (chunk) => {
        assistantSoFar += chunk;
      },
      onDone: () => {
        if (autoRunIdRef.current !== runId) return;
        setIsAutoAnalyzing(false);

        const { text, charts } = parseChartBlocks(assistantSoFar);
        const cleanText = text.trim();
        const sections = parseSections(cleanText);

        setAiCharts(financial ? charts : []);
        setAiStory(sections.story || sections.general || cleanText);
        setAiForecast(sections.forecast);
        setAiSimulation(sections.simulation);
        setAiCofounder(sections.cofounder);
        setAiSlideshow(sections.slideshow);
        setAiFindings(sections.findings);
        setActiveTab("story");
        toast.success("Automatic analysis is ready.");
      },
      onError: (error) => {
        if (autoRunIdRef.current !== runId) return;
        setIsAutoAnalyzing(false);
        toast.error(error || "Automatic analysis failed.");
      },
    });
  }, []);

  useEffect(() => {
    if (!fileData) {
      lastAutoDataRef.current = "";
      return;
    }

    if (isAutoAnalyzing || lastAutoDataRef.current === fileData) return;
    lastAutoDataRef.current = fileData;
    void runAutoAnalysis(fileData, isFinancialData);
  }, [fileData, isAutoAnalyzing, isFinancialData, runAutoAnalysis]);

  const processFiles = async (files: File[]) => {
    if (!files.length) return;

    setUploading(true);
    lastAutoDataRef.current = "";
    setAiCharts([]);
    setAiStory("");
    setAiForecast("");
    setAiSimulation("");
    setAiCofounder("");
    setAiSlideshow("");
    setAiFindings("");
    setActiveTab("overview");

    const parsed: { name: string; content: string; type: string }[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isImage = ["jpeg", "jpg", "png", "gif", "webp", "svg"].includes(ext);
      const isExcel = ["xlsx", "xls"].includes(ext);

      try {
        if (isImage) {
          parsed.push({ name: file.name, content: `[Image: ${file.name}]`, type: ext });
          continue;
        }

        if (isExcel) {
          const buffer = await file.arrayBuffer();
          const content = parseExcel(buffer);
          if (content) parsed.push({ name: file.name, content, type: ext });
          else toast.error(`Could not parse ${file.name}`);
          continue;
        }

        if (ext === "pdf") {
          const buffer = await file.arrayBuffer();
          const content = await parsePdf(buffer);
          if (content) parsed.push({ name: file.name, content, type: ext });
          else toast.error(`Could not parse ${file.name}`);
          continue;
        }

        const text = await file.text();
        const content = parseFileContent(text, file.name);
        parsed.push({ name: file.name, content, type: ext });
      } catch {
        toast.error(`Failed to read ${file.name}`);
      }
    }

    setUploadedFiles(parsed);
    setUploading(false);

    if (parsed.length > 0) {
      toast.success(`${parsed.length} file(s) loaded. Automatic analysis started.`);
    }

    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    await processFiles(files);
  };

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useFileDrop(processFiles);

  const removeFile = (index: number) => {
    lastAutoDataRef.current = "";
    setUploadedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
    setAiCharts([]);
    setAiStory("");
    setAiForecast("");
    setAiSimulation("");
    setAiCofounder("");
    setAiSlideshow("");
    setAiFindings("");
    setActiveTab("overview");
  };

  const handleChartsGenerated = useCallback((charts: ChartData[]) => {
    setAiCharts((prev) => mergeCharts(prev, charts));
    setActiveTab("overview");
  }, []);

  const handleStoryGenerated = useCallback((story: string) => {
    setAiStory(story);
    setActiveTab("story");
  }, []);

  const handleForecastGenerated = useCallback((text: string) => {
    setAiForecast(text);
    setActiveTab("forecast");
  }, []);

  const handleSimulationGenerated = useCallback((text: string) => {
    setAiSimulation(text);
    setActiveTab("simulation");
  }, []);

  const handleCofounderGenerated = useCallback((text: string) => {
    setAiCofounder(text);
    setActiveTab("cofounder");
  }, []);

  const getFileIcon = (type: string) => {
    if (["jpeg", "jpg", "png", "gif", "webp", "svg"].includes(type)) return FileImage;
    if (["xlsx", "xls"].includes(type)) return FileSpreadsheet;
    return FileText;
  };

  const tabs: { key: TabKey; icon: typeof BarChart3; label: string }[] = isFinancialData
    ? [
        { key: "overview", icon: BarChart3, label: "Overview" },
        { key: "story", icon: BookOpen, label: "Data Story" },
        { key: "forecast", icon: TrendingUp, label: "Forecast" },
        { key: "simulation", icon: Shuffle, label: "Simulation" },
        { key: "cofounder", icon: Brain, label: "Strategy" },
        { key: "table", icon: Table, label: "Data Table" },
      ]
    : [
        { key: "story", icon: BookOpen, label: "Data Story" },
        { key: "findings", icon: Zap, label: "Key Findings" },
        { key: "slideshow", icon: Layers, label: "Slideshow" },
        { key: "cofounder", icon: Brain, label: "Recommendations" },
        { key: "table", icon: Table, label: "Data Table" },
      ];

  const renderMarkdownContent = (content: string, emptyIcon: typeof BookOpen, emptyTitle: string, emptyDesc: string) => {
    if (content) {
      return (
        <div className="prose prose-sm max-w-none text-base leading-relaxed [&_p]:mb-3 [&_p]:text-foreground [&_p]:text-[15px] [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-foreground [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-foreground [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground [&_li]:text-[15px] [&_li]:text-foreground [&_strong]:text-foreground [&_table]:w-full [&_th]:text-left [&_th]:py-2 [&_th]:px-3 [&_th]:border-b [&_th]:border-border [&_th]:text-xs [&_th]:font-black [&_th]:uppercase [&_th]:tracking-widest [&_th]:text-muted-foreground [&_td]:py-2 [&_td]:px-3 [&_td]:border-b [&_td]:border-border/30 [&_td]:text-foreground [&_td]:text-sm">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }

    const EmptyIcon = emptyIcon;
    return (
      <div className="text-center py-12">
        <EmptyIcon className="h-16 w-16 text-muted-foreground mx-auto mb-5 opacity-20" />
        <h3 className="font-black mb-3 text-xl text-foreground">{emptyTitle}</h3>
        <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed font-medium">{emptyDesc}</p>
      </div>
    );
  };

  const chatPanelKey = uploadedFiles.map((file) => file.name).join("|") || "empty";

  return (
    <div className="neural-bg min-h-screen">
      <div className="container py-8 max-w-[1500px]">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black flex items-center gap-3 tracking-tight leading-tight text-foreground">
                <BarChart3 className="h-10 w-10 text-[hsl(220,80%,60%)]" />
                Analytics <span className="gradient-text">Command Center</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-3xl leading-relaxed font-medium">
                Upload data once and Zephoryx automatically generates KPIs, real charts, insight boxes, recommendations, forecasts, simulations, and strategic analysis.
              </p>
            </div>
            {exportData.length > 0 && exportHeaders && (
              <ExportButtons data={exportData} headers={exportHeaders} filename="analytics-command-center" />
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-card p-8 mb-6 transition-all duration-200 ${isDragging ? "ring-2 ring-primary border-primary/50 bg-primary/5" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="text-center py-6 mb-4">
              <Upload className="h-12 w-12 text-primary mx-auto mb-3 animate-bounce" />
              <p className="text-lg font-black text-primary">Drop files here to upload</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <input ref={fileRef} type="file" multiple accept={ACCEPTED_FILES} className="hidden" onChange={handleUpload} />
            <Button onClick={() => fileRef.current?.click()} className="gradient-primary text-white font-black px-6 py-3 text-base" disabled={uploading}>
              <Upload className="h-5 w-5 mr-2" /> Upload Data Files
            </Button>
            <span className="text-sm text-muted-foreground flex items-center gap-2 font-semibold">
              <Image className="h-4 w-4" />
              CSV, JSON, TXT, PDF, Excel, Images
            </span>
            {isAutoAnalyzing && (
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black kpi-card-purple border text-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-[hsl(280,70%,65%)]" /> Auto-analyzing now
              </span>
            )}
          </div>

          {(uploading || uploadedFiles.length > 0) && (
            <div className="mt-4 space-y-3">
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold">
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing files...
                </div>
              )}
              {uploadedFiles.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {uploadedFiles.map((file, index) => {
                    const Icon = getFileIcon(file.type);
                    return (
                      <div key={`${file.name}-${index}`} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                        <Icon className="h-4 w-4" /> {file.name}
                        <button onClick={() => removeFile(index)} className="ml-1 hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {TIPS.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index }}
                className={`glass-card p-4 ${tip.bg} border`}
              >
                <tip.icon className={`h-5 w-5 ${tip.color} mb-2`} />
                <p className="text-sm text-foreground leading-snug font-semibold">{tip.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {!hasData && uploadedFiles.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 mb-6 border border-border/60">
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-semibold">
              We loaded your file and are analyzing it. KPI charts appear when we detect structured numeric revenue and expense columns. PDFs and image-heavy files can still generate stories, forecasts, simulations, and strategy from extracted content.
            </p>
          </motion.div>
        )}

        {autoInsights.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-[hsl(280,70%,65%)]" />
              <h3 className="text-lg font-black text-foreground">Auto-Detected Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {autoInsights.map((insight, index) => (
                <motion.div
                  key={`${insight.text}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 * index }}
                  className={`glass-card p-5 ${insight.bg} border flex items-start gap-3`}
                >
                  <insight.icon className={`h-5 w-5 ${insight.color} shrink-0 mt-0.5`} />
                  <p className="text-sm text-foreground leading-relaxed font-bold">{insight.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {(recommendationCards.length > 0 || isAutoAnalyzing) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-[hsl(220,80%,60%)]" />
              <h3 className="text-lg font-black text-foreground">Recommendation Boxes</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recommendationCards.map((card, index) => (
                <div key={`${card.title}-${index}`} className={`glass-card p-5 ${card.bg} border`}>
                  <p className={`text-xs uppercase tracking-[0.18em] font-black mb-2 ${card.color}`}>{card.title}</p>
                  <p className="text-sm text-foreground leading-relaxed font-bold">{card.text}</p>
                </div>
              ))}
              {isAutoAnalyzing && recommendationCards.length === 0 && (
                <div className="glass-card p-5 kpi-card-purple border md:col-span-3">
                  <p className="text-sm text-foreground font-bold flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[hsl(280,70%,65%)]" /> Generating strategic recommendation boxes...
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {uploadedFiles.length === 0 && !hasData && !hasAnalysis ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-20 text-center mb-8">
            <BarChart3 className="h-24 w-24 text-muted-foreground mx-auto mb-8 opacity-15" />
            <h2 className="text-4xl font-black mb-5 text-foreground">Upload data to start automatic analysis</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8 font-medium">
              This page now combines the old dashboard and analytics experience into one workspace. Upload once, then review KPIs, charts, insights, strategy, and follow-up AI answers in one place.
            </p>
            <Button onClick={() => fileRef.current?.click()} className="gradient-primary text-white font-black px-8 py-4 text-lg">
              <Upload className="h-5 w-5 mr-2" /> Upload Your Data
            </Button>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {hasData && (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                  {kpis.map((kpi, index) => (
                    <motion.div
                      key={kpi.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className={`glass-card p-5 ${kpi.colorClass} border`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground font-black uppercase tracking-widest">{kpi.label}</span>
                        <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                      </div>
                      <div className="text-3xl md:text-4xl font-black tracking-tight text-foreground">{kpi.value}</div>
                      <div className={`text-sm mt-2 flex items-center gap-1 font-bold ${kpi.up ? "text-[hsl(152,69%,45%)]" : "text-[hsl(340,75%,60%)]"}`}>
                        {kpi.up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        {kpi.up ? "Positive trend" : "Needs attention"}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {hasData && (
                <>
                  <div className="grid xl:grid-cols-2 gap-5">
                    <div className="glass-card p-6">
                      <h3 className="text-base font-black mb-4 flex items-center gap-2 text-foreground">
                        <BarChart3 className="h-5 w-5 text-[hsl(220,80%,60%)]" /> Revenue Trend
                      </h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="analyticsRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(220,80%,60%)" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="hsl(220,80%,60%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} fontWeight={600} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} fontWeight={600} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Area type="monotone" dataKey="revenue" stroke="hsl(220,80%,60%)" fill="url(#analyticsRevenueGradient)" strokeWidth={3} />
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
                            <linearGradient id="analyticsExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(25,95%,58%)" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="hsl(25,95%,58%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} fontWeight={600} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} fontWeight={600} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Area type="monotone" dataKey="expense" stroke="hsl(25,95%,58%)" fill="url(#analyticsExpenseGradient)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid xl:grid-cols-2 gap-5">
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
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            dataKey="value"
                            paddingAngle={4}
                            strokeWidth={2}
                          >
                            <Cell fill="hsl(220,80%,60%)" />
                            <Cell fill="hsl(25,95%,58%)" />
                            <Cell fill="hsl(152,69%,45%)" />
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
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
                </>
              )}

              <div className="flex gap-2 flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
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

              {activeTab === "overview" && (
                <div className="space-y-4">
                  {isAutoAnalyzing && aiCharts.length === 0 && (
                    <div className="glass-card p-10 text-center">
                      <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                      <h3 className="text-xl font-black text-foreground mb-2">Generating charts and analysis</h3>
                      <p className="text-sm text-muted-foreground font-semibold">We are creating AI charts, story, forecast, simulation, and strategic recommendations automatically.</p>
                    </div>
                  )}
                  {aiCharts.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-[hsl(25,95%,58%)]" />
                        <span className="text-base font-black text-foreground">AI-Generated Charts</span>
                        <button onClick={() => setAiCharts([])} className="ml-auto text-sm text-muted-foreground hover:text-destructive font-bold">Clear All</button>
                      </div>
                      {aiCharts.map((chart, index) => (
                        <DynamicChart key={`${chart.title}-${index}`} chart={chart} />
                      ))}
                    </>
                  ) : !isAutoAnalyzing ? (
                    <div className="glass-card p-16 text-center">
                      <BarChart3 className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-15" />
                      <h3 className="font-black mb-3 text-2xl text-foreground">No AI charts yet</h3>
                      <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed font-medium">
                        Upload a file and charts will be generated automatically. Use the AI panel for extra follow-up requests after that.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {activeTab === "story" && (
                <div className="glass-card p-8 min-h-[420px]">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="h-5 w-5 text-[hsl(280,70%,65%)]" />
                    <h3 className="text-lg font-black text-foreground">AI Data Story</h3>
                  </div>
                  {renderMarkdownContent(
                    aiStory,
                    BookOpen,
                    "No Story Generated",
                    uploadedFiles.length > 0 ? "Your story is being generated automatically from the uploaded data." : "Upload data files first — AI will auto-generate a narrative.",
                  )}
                </div>
              )}

              {activeTab === "forecast" && (
                <div className="glass-card p-8 min-h-[420px]">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="h-5 w-5 text-[hsl(220,80%,60%)]" />
                    <h3 className="text-lg font-black text-foreground">Predictive Forecast</h3>
                  </div>
                  {renderMarkdownContent(
                    aiForecast,
                    TrendingUp,
                    "No Forecast Generated",
                    uploadedFiles.length > 0 ? "Forecasts are generated automatically after upload." : "Upload data first to generate forecasts.",
                  )}
                </div>
              )}

              {activeTab === "simulation" && (
                <div className="glass-card p-8 min-h-[420px]">
                  <div className="flex items-center gap-2 mb-6">
                    <Shuffle className="h-5 w-5 text-[hsl(340,75%,60%)]" />
                    <h3 className="text-lg font-black text-foreground">Scenario Simulation</h3>
                  </div>
                  {renderMarkdownContent(
                    aiSimulation,
                    Shuffle,
                    "No Simulation Yet",
                    uploadedFiles.length > 0 ? "Simulation scenarios are generated automatically from the current data." : "Upload data to generate scenario simulations.",
                  )}
                </div>
              )}

              {activeTab === "cofounder" && (
                <div className="glass-card p-8 min-h-[420px]">
                  <div className="flex items-center gap-2 mb-6">
                    <Brain className="h-5 w-5 text-[hsl(280,70%,65%)]" />
                    <h3 className="text-lg font-black text-foreground">AI Strategic Co-Founder</h3>
                  </div>
                  {renderMarkdownContent(
                    aiCofounder,
                    Brain,
                    "No Strategic Analysis Yet",
                    uploadedFiles.length > 0 ? "Recommendations and strategic actions are being generated automatically." : "Upload data to get recommendations and decisions.",
                  )}
                </div>
              )}
              {activeTab === "findings" && (
                <div className="glass-card p-8 min-h-[420px]">
                  <div className="flex items-center gap-2 mb-6">
                    <Zap className="h-5 w-5 text-[hsl(25,95%,58%)]" />
                    <h3 className="text-lg font-black text-foreground">Key Findings</h3>
                  </div>
                  {renderMarkdownContent(
                    aiFindings,
                    Zap,
                    "No Findings Yet",
                    uploadedFiles.length > 0 ? "Key findings are being extracted automatically from the uploaded data." : "Upload data to discover key findings.",
                  )}
                </div>
              )}

              {activeTab === "slideshow" && (
                <div className="glass-card p-8 min-h-[420px]">
                  <div className="flex items-center gap-2 mb-6">
                    <Layers className="h-5 w-5 text-[hsl(340,75%,60%)]" />
                    <h3 className="text-lg font-black text-foreground">Slideshow Presentation</h3>
                  </div>
                  {aiSlideshow ? (
                    <div className="space-y-6">
                      {aiSlideshow.split(/###\s+Slide\s+\d+/i).filter(s => s.trim()).map((slide, i) => (
                        <div key={i} className={`glass-card p-6 border ${["kpi-card-blue", "kpi-card-purple", "kpi-card-orange", "kpi-card-pink", "kpi-card-green", "kpi-card-cyan"][i % 6]}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full gradient-primary text-white text-sm font-black">{i + 1}</span>
                          </div>
                          <div className="prose prose-sm max-w-none [&_p]:mb-2 [&_p]:text-foreground [&_h1]:text-xl [&_h1]:font-black [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold [&_li]:text-foreground [&_strong]:text-foreground">
                            <ReactMarkdown>{slide.trim()}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Layers className="h-16 w-16 text-muted-foreground mx-auto mb-5 opacity-20" />
                      <h3 className="font-black mb-3 text-xl text-foreground">No Slideshow Yet</h3>
                      <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed font-medium">
                        {uploadedFiles.length > 0 ? "Slideshow is being generated automatically from the uploaded data." : "Upload non-financial data to auto-generate a slideshow presentation."}
                      </p>
                    </div>
                  )}
                </div>
              )}


                <div className="glass-card p-6 overflow-x-auto min-h-[420px]">
                  <h3 className="text-lg font-black mb-6 text-foreground flex items-center gap-2">
                    <Table className="h-5 w-5 text-[hsl(200,80%,55%)]" /> Data Table
                  </h3>
                  {tableData ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-border">
                          {tableData.headers.map((header) => (
                            <th key={header} className="text-left py-3 text-muted-foreground font-black px-3 text-xs uppercase tracking-widest">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.rows.slice(0, 50).map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b border-border/30 hover:bg-secondary/50 transition-colors">
                            {tableData.headers.map((header) => (
                              <td key={header} className="py-3 px-3 text-sm font-semibold text-foreground">{row[header]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12">
                      <Table className="h-16 w-16 text-muted-foreground mx-auto mb-5 opacity-20" />
                      <p className="text-base text-muted-foreground font-semibold">Upload a CSV, Excel file, or table-like PDF to inspect structured rows here.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <AIChatPanel
                key={chatPanelKey}
                fileData={fileData}
                onChartsGenerated={handleChartsGenerated}
                onStoryGenerated={handleStoryGenerated}
                onForecastGenerated={handleForecastGenerated}
                onSimulationGenerated={handleSimulationGenerated}
                onCofounderGenerated={handleCofounderGenerated}
              />
              <SavedAnalysesPanel
                fileNames={uploadedFiles.map((file) => file.name)}
                charts={aiCharts}
                story={aiStory}
                forecast={aiForecast}
                simulation={aiSimulation}
                cofounder={aiCofounder}
                onLoad={(analysis) => {
                  setAiCharts(analysis.charts);
                  setAiStory(analysis.story);
                  setAiForecast(analysis.forecast);
                  setAiSimulation(analysis.simulation);
                  setAiCofounder(analysis.cofounder);
                  setActiveTab("overview");
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
