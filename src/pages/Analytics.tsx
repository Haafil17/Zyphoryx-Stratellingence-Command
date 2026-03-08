import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Upload, FileText, BarChart3, TrendingUp,
  Sparkles, Table, BookOpen, X, Brain, Shuffle,
  FileImage, FileSpreadsheet, Image
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import AIChatPanel from "@/components/AIChatPanel";
import DynamicChart, { ChartData } from "@/components/DynamicChart";
import { parseFileContent, parseExcel } from "@/lib/analytics-ai";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useFileDrop } from "@/hooks/use-file-drop";

const ACCEPTED_FILES = ".csv,.json,.txt,.tsv,.pdf,.xlsx,.xls,.jpeg,.jpg,.png,.gif,.webp,.svg";

type TabKey = "charts" | "story" | "table" | "forecast" | "simulation" | "cofound";

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

  // Auto-trigger analysis when files are uploaded (with guard against double-fire)
  useEffect(() => {
    if (uploadedFiles.length > 0 && !autoAnalyzeTriggered && !autoAnalyzeGuard.current) {
      autoAnalyzeGuard.current = true;
      setAutoAnalyzeTriggered(true);
      const timer = setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.sendMessage("Analyze this data: generate charts, identify key trends, and provide a summary with strategic insights.");
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
      try {
        const parsed = JSON.parse(f.content);
        if (parsed.headers && parsed.rows) return parsed;
      } catch { /* skip */ }
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
        if (isImage) {
          parsed.push({ name: file.name, content: `[Image: ${file.name}]`, type: ext });
        } else if (isExcel) {
          const buffer = await file.arrayBuffer();
          const content = parseExcel(buffer);
          if (content) {
            parsed.push({ name: file.name, content, type: ext });
          } else {
            toast.error(`Could not parse ${file.name}`);
          }
        } else if (ext === "pdf") {
          parsed.push({ name: file.name, content: `[PDF: ${file.name}]`, type: ext });
        } else {
          const text = await file.text();
          const content = parseFileContent(text, file.name);
          parsed.push({ name: file.name, content, type: ext });
        }
      } catch {
        toast.error(`Failed to read ${file.name}`);
      }
    }

    setAutoAnalyzeTriggered(false);
    autoAnalyzeGuard.current = false; // Reset so auto-analyze triggers again
    setUploadedFiles((prev) => [...prev, ...parsed]);
    toast.success(`${parsed.length} file(s) loaded — AI is analyzing automatically!`);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  };

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useFileDrop(processFiles);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleChartsGenerated = useCallback((charts: ChartData[]) => {
    setAiCharts(prev => [...prev, ...charts]);
    setActiveTab("charts");
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
    setActiveTab("cofound");
  }, []);

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
        <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&_p]:mb-3 [&_p]:text-foreground [&_h1]:text-xl [&_h1]:font-black [&_h1]:text-foreground [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-foreground [&_li]:text-sm [&_li]:text-foreground [&_strong]:text-foreground [&_table]:w-full [&_th]:text-left [&_th]:py-2 [&_th]:px-3 [&_th]:border-b [&_th]:border-border [&_th]:text-xs [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted-foreground [&_td]:py-2 [&_td]:px-3 [&_td]:border-b [&_td]:border-border/30 [&_td]:text-foreground">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }

    const EmptyIcon = emptyIcon;
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black flex items-center gap-3 tracking-tight leading-tight text-foreground">
            <BarChart3 className="h-9 w-9 text-primary" />
            Data Analytics & <span className="gradient-text">AI Intelligence</span>
          </h1>
          <p className="text-base text-muted-foreground mt-3 max-w-2xl leading-relaxed">
            Upload your data and AI will <strong className="text-foreground">automatically analyze</strong> it — generating charts, stories, forecasts, and strategic insights instantly.
          </p>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-card p-6 mb-8 transition-all duration-200 ${isDragging ? "ring-2 ring-primary border-primary/50 bg-primary/5" : ""}`}
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
            <input ref={fileRef} type="file" multiple accept={ACCEPTED_FILES} className="hidden" onChange={handleUpload} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="border-primary/30 text-primary hover:bg-primary/10 font-extrabold">
              <Upload className="h-4 w-4 mr-2" /> Upload Files
            </Button>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
              <Image className="h-3 w-3" />
              CSV, JSON, TXT, PDF, Excel, JPEG, PNG, GIF, WebP, SVG
            </span>
          </div>
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Tabs + Content */}
          <div className="space-y-5">
            <div className="flex gap-1.5 flex-wrap">
              {tabs.map((tab) => (
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

            {activeTab === "charts" && (
              <div className="space-y-4">
                {aiCharts.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <span className="text-sm font-extrabold text-foreground">AI-Generated Charts</span>
                      <button onClick={() => setAiCharts([])} className="ml-auto text-xs text-muted-foreground hover:text-destructive font-bold">Clear All</button>
                    </div>
                    {aiCharts.map((chart, i) => (
                      <DynamicChart key={i} chart={chart} />
                    ))}
                  </>
                ) : (
                  <div className="glass-card p-14 text-center">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-30" />
                    <h3 className="font-extrabold mb-3 text-xl text-foreground">No Charts Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                      Upload a data file and charts will be <strong className="text-foreground">generated automatically</strong> by the AI assistant.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "story" && (
              <div className="glass-card p-7 min-h-[450px]">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-extrabold text-foreground">AI Data Story</h3>
                </div>
                {renderMarkdownContent(
                  aiStory,
                  BookOpen,
                  "No Story Generated",
                  uploadedFiles.length > 0
                    ? 'Ask the AI: "Create a data story" or "Generate executive summary" — the narrative will appear here.'
                    : "Upload data files first, then ask the AI to generate a data story."
                )}
              </div>
            )}

            {activeTab === "table" && (
              <div className="glass-card p-6 overflow-x-auto min-h-[450px]">
                <h3 className="text-sm font-extrabold mb-6 text-foreground">Data Table</h3>
                {tableData ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {tableData.headers.map((h: string) => (
                          <th key={h} className="text-left py-3 text-muted-foreground font-extrabold px-3 text-[11px] uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.rows.slice(0, 50).map((row: Record<string, string>, i: number) => (
                        <tr key={i} className="border-b border-border/30 hover:bg-secondary/50 transition-colors">
                          {tableData.headers.map((h: string) => (
                            <td key={h} className="py-2.5 px-3 text-sm text-foreground">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12">
                    <Table className="h-14 w-14 text-muted-foreground mx-auto mb-5 opacity-30" />
                    <p className="text-sm text-muted-foreground">Upload a CSV or JSON file to see your data in table format.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "forecast" && (
              <div className="glass-card p-7 min-h-[450px]">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-extrabold text-foreground">Predictive Forecast</h3>
                </div>
                {renderMarkdownContent(
                  aiForecast,
                  TrendingUp,
                  "No Forecast Generated",
                  'Upload data and ask: "Create a forecast" or "Predict next quarter revenue" — AI generates forecast with confidence scoring.'
                )}
              </div>
            )}

            {activeTab === "simulation" && (
              <div className="glass-card p-7 min-h-[450px]">
                <div className="flex items-center gap-2 mb-6">
                  <Shuffle className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-extrabold text-foreground">Scenario Simulation</h3>
                </div>
                {renderMarkdownContent(
                  aiSimulation,
                  Shuffle,
                  "No Simulation Yet",
                  'Ask "What if" questions to simulate strategic scenarios with projected outcomes and risk analysis.'
                )}
                {!aiSimulation && (
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {["What if we increase price by 10%?", "What if marketing spend drops 20%?", "What if we hire 50 more employees?"].map(q => (
                      <span key={q} className="text-xs px-4 py-2 rounded-full border border-accent/30 text-accent font-bold">{q}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "cofound" && (
              <div className="glass-card p-7 min-h-[450px]">
                <div className="flex items-center gap-2 mb-6">
                  <Brain className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-extrabold text-foreground">AI Strategic Co-Founder</h3>
                </div>
                {renderMarkdownContent(
                  aiCofounder,
                  Brain,
                  "No Strategic Analysis Yet",
                  "Your AI strategic partner. Ask for growth strategies, profit leak analysis, cost optimization, and competitive threat detection."
                )}
                {!aiCofounder && (
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {["Suggest growth strategies", "Find profit leaks", "Recommend cost optimization"].map(q => (
                      <span key={q} className="text-xs px-4 py-2 rounded-full border border-primary/30 text-primary font-bold">{q}</span>
                    ))}
                  </div>
                )}
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
      </div>
    </div>
  );
};

export default Analytics;
