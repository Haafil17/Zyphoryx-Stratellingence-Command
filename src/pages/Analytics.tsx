import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Upload, FileText, BarChart3, TrendingUp,
  Sparkles, Table, BookOpen, X, Brain, Shuffle,
  FileImage, FileSpreadsheet, Image, Lightbulb,
  Target, Zap, Shield
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import AIChatPanel from "@/components/AIChatPanel";
import DynamicChart, { ChartData } from "@/components/DynamicChart";
import { parseFileContent, parseExcel } from "@/lib/analytics-ai";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useFileDrop } from "@/hooks/use-file-drop";
import ExportButtons from "@/components/ExportButtons";
import SavedAnalysesPanel from "@/components/SavedAnalysesPanel";

const ACCEPTED_FILES = ".csv,.json,.txt,.tsv,.pdf,.xlsx,.xls,.jpeg,.jpg,.png,.gif,.webp,.svg";

type TabKey = "charts" | "story" | "table" | "forecast" | "simulation" | "cofound";

const TIPS = [
  { icon: Lightbulb, color: "text-[hsl(220,80%,60%)]", bg: "kpi-card-blue", text: "Upload any data file — AI will auto-analyze and generate all insights." },
  { icon: Target, color: "text-[hsl(280,70%,65%)]", bg: "kpi-card-purple", text: "Ask 'Create a forecast' for predictive trends with confidence scoring." },
  { icon: Zap, color: "text-[hsl(25,95%,58%)]", bg: "kpi-card-orange", text: "Try 'What if we increase price by 10%?' for scenario simulations." },
  { icon: Brain, color: "text-[hsl(340,75%,60%)]", bg: "kpi-card-pink", text: "Use Co-Founder mode for growth strategies and competitive analysis." },
];

const Analytics = () => {
  const { analyticsFiles: uploadedFiles, setAnalyticsFiles: setUploadedFiles } = useFileStore();
  const [activeTab, setActiveTab] = useState<TabKey>("charts");
  const [aiCharts, setAiCharts] = useState<ChartData[]>([]);
  const [aiStory, setAiStory] = useState<string>("");
  const [aiForecast, setAiForecast] = useState<string>("");
  const [aiSimulation, setAiSimulation] = useState<string>("");
  const [aiCofounder, setAiCofounder] = useState<string>("");
  const [autoAnalyzeTriggered, setAutoAnalyzeTriggered] = useState(false);
  const autoAnalyzeGuard = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<{ sendMessage: (msg: string) => void } | null>(null);

  const fileData = uploadedFiles.map(f => `--- FILE: ${f.name} ---\n${f.content}`).join("\n\n");

  // Auto-trigger comprehensive analysis when files are uploaded
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

  const getTableData = () => {
    for (const f of uploadedFiles) {
      try { const parsed = JSON.parse(f.content); if (parsed.headers && parsed.rows) return parsed; } catch { /* skip */ }
    }
    return null;
  };
  const tableData = getTableData();

  const processFiles = async (files: File[]) => {
    if (!files.length) return;
    const parsed: { name: string; content: string; type: string }[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isImage = ["jpeg", "jpg", "png", "gif", "webp", "svg"].includes(ext);
      const isExcel = ["xlsx", "xls"].includes(ext);
      try {
        if (isImage) { parsed.push({ name: file.name, content: `[Image: ${file.name}]`, type: ext }); }
        else if (isExcel) {
          const buffer = await file.arrayBuffer();
          const content = parseExcel(buffer);
          if (content) parsed.push({ name: file.name, content, type: ext });
          else toast.error(`Could not parse ${file.name}`);
        } else if (ext === "pdf") { parsed.push({ name: file.name, content: `[PDF: ${file.name}]`, type: ext }); }
        else { const text = await file.text(); const content = parseFileContent(text, file.name); parsed.push({ name: file.name, content, type: ext }); }
      } catch { toast.error(`Failed to read ${file.name}`); }
    }
    setAutoAnalyzeTriggered(false);
    autoAnalyzeGuard.current = false;
    setUploadedFiles((prev) => [...prev, ...parsed]);
    toast.success(`${parsed.length} file(s) loaded — AI is analyzing automatically!`);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  };

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useFileDrop(processFiles);

  const removeFile = (index: number) => { setUploadedFiles(prev => prev.filter((_, i) => i !== index)); };

  const handleChartsGenerated = useCallback((charts: ChartData[]) => { setAiCharts(prev => [...prev, ...charts]); setActiveTab("charts"); }, []);
  const handleStoryGenerated = useCallback((story: string) => { setAiStory(story); }, []);
  const handleForecastGenerated = useCallback((text: string) => { setAiForecast(text); }, []);
  const handleSimulationGenerated = useCallback((text: string) => { setAiSimulation(text); }, []);
  const handleCofounderGenerated = useCallback((text: string) => { setAiCofounder(text); }, []);

  const getFileIcon = (type: string) => {
    if (["jpeg", "jpg", "png", "gif", "webp", "svg"].includes(type)) return FileImage;
    if (["xlsx", "xls"].includes(type)) return FileSpreadsheet;
    return FileText;
  };

  const tabs: { key: TabKey; icon: typeof BarChart3; label: string }[] = [
    { key: "charts", icon: BarChart3, label: "Charts" },
    { key: "story", icon: BookOpen, label: "Data Story" },
    { key: "table", icon: Table, label: "Data Table" },
    { key: "forecast", icon: TrendingUp, label: "Forecast" },
    { key: "simulation", icon: Shuffle, label: "Simulation" },
    { key: "cofound", icon: Brain, label: "Co-Founder" },
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

  return (
    <div className="neural-bg min-h-screen">
      <div className="container py-8 max-w-[1400px]">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black flex items-center gap-3 tracking-tight leading-tight text-foreground">
                <BarChart3 className="h-10 w-10 text-[hsl(220,80%,60%)]" />
                Data Analytics & <span className="gradient-text">AI Intelligence</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-2xl leading-relaxed font-medium">
                Upload your data and AI will <strong className="text-foreground font-bold">automatically analyze</strong> it — generating charts, stories, forecasts, simulations, and strategic recommendations.
              </p>
            </div>
            {tableData && (
              <ExportButtons data={tableData.rows} headers={tableData.headers} filename="analytics-data" />
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
            <input ref={fileRef} type="file" multiple accept={ACCEPTED_FILES} className="hidden" onChange={handleUpload} />
            <Button onClick={() => fileRef.current?.click()} className="gradient-primary text-white font-black px-6 py-3 text-base">
              <Upload className="h-5 w-5 mr-2" /> Upload Files
            </Button>
            <span className="text-sm text-muted-foreground flex items-center gap-2 font-semibold">
              <Image className="h-4 w-4" />
              CSV, JSON, TXT, PDF, Excel, Images
            </span>
          </div>
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

        {/* Tips */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {TIPS.map((tip, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                className={`glass-card p-4 ${tip.bg} border`}>
                <tip.icon className={`h-5 w-5 ${tip.color} mb-2`} />
                <p className="text-sm text-foreground leading-snug font-semibold">{tip.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Tabs + Content */}
          <div className="space-y-5">
            <div className="flex gap-2 flex-wrap">
              {tabs.map((tab) => (
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

            {activeTab === "charts" && (
              <div className="space-y-4">
                {aiCharts.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-[hsl(25,95%,58%)]" />
                      <span className="text-base font-black text-foreground">AI-Generated Charts</span>
                      <button onClick={() => setAiCharts([])} className="ml-auto text-sm text-muted-foreground hover:text-destructive font-bold">Clear All</button>
                    </div>
                    {aiCharts.map((chart, i) => <DynamicChart key={i} chart={chart} />)}
                  </>
                ) : (
                  <div className="glass-card p-16 text-center">
                    <BarChart3 className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-15" />
                    <h3 className="font-black mb-3 text-2xl text-foreground">No Charts Yet</h3>
                    <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed font-medium">
                      Upload a data file and charts will be <strong className="text-foreground font-bold">generated automatically</strong> by the AI.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "story" && (
              <div className="glass-card p-8 min-h-[450px]">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="h-5 w-5 text-[hsl(280,70%,65%)]" />
                  <h3 className="text-lg font-black text-foreground">AI Data Story</h3>
                </div>
                {renderMarkdownContent(aiStory, BookOpen, "No Story Generated",
                  uploadedFiles.length > 0 ? "AI is generating your data story..." : "Upload data files first — AI will auto-generate a narrative."
                )}
              </div>
            )}

            {activeTab === "table" && (
              <div className="glass-card p-6 overflow-x-auto min-h-[450px]">
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
                    <p className="text-base text-muted-foreground font-semibold">Upload a CSV or Excel file to view data in table format.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "forecast" && (
              <div className="glass-card p-8 min-h-[450px]">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="h-5 w-5 text-[hsl(220,80%,60%)]" />
                  <h3 className="text-lg font-black text-foreground">Predictive Forecast</h3>
                </div>
                {renderMarkdownContent(aiForecast, TrendingUp, "No Forecast Generated",
                  "AI auto-generates forecasts when data is uploaded. You can also ask: 'Predict next quarter revenue.'"
                )}
              </div>
            )}

            {activeTab === "simulation" && (
              <div className="glass-card p-8 min-h-[450px]">
                <div className="flex items-center gap-2 mb-6">
                  <Shuffle className="h-5 w-5 text-[hsl(340,75%,60%)]" />
                  <h3 className="text-lg font-black text-foreground">Scenario Simulation</h3>
                </div>
                {renderMarkdownContent(aiSimulation, Shuffle, "No Simulation Yet",
                  "AI auto-generates what-if scenarios. Try asking: 'What if we cut costs 15%?'"
                )}
                {!aiSimulation && (
                  <div className="flex flex-wrap gap-2 justify-center mt-6">
                    {["What if we increase price by 10%?", "What if marketing spend drops 20%?", "What if we hire 50 more?"].map(q => (
                      <span key={q} className="text-sm px-4 py-2.5 rounded-full kpi-card-pink border text-foreground font-bold">{q}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "cofound" && (
              <div className="glass-card p-8 min-h-[450px]">
                <div className="flex items-center gap-2 mb-6">
                  <Brain className="h-5 w-5 text-[hsl(280,70%,65%)]" />
                  <h3 className="text-lg font-black text-foreground">AI Strategic Co-Founder</h3>
                </div>
                {renderMarkdownContent(aiCofounder, Brain, "No Strategic Analysis Yet",
                  "Your AI strategic partner. Ask for growth strategies, profit leak analysis, cost optimization."
                )}
                {!aiCofounder && (
                  <div className="flex flex-wrap gap-2 justify-center mt-6">
                    {["Suggest growth strategies", "Find profit leaks", "Recommend cost optimization"].map(q => (
                      <span key={q} className="text-sm px-4 py-2.5 rounded-full kpi-card-purple border text-foreground font-bold">{q}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: AI Chat + Saved */}
          <div className="space-y-4">
            <AIChatPanel
              ref={chatRef}
              fileData={fileData}
              onChartsGenerated={handleChartsGenerated}
              onStoryGenerated={handleStoryGenerated}
              onForecastGenerated={handleForecastGenerated}
              onSimulationGenerated={handleSimulationGenerated}
              onCofounderGenerated={handleCofounderGenerated}
            />
            <SavedAnalysesPanel
              fileNames={uploadedFiles.map(f => f.name)}
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
                setActiveTab("charts");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
