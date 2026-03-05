import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Upload, FileText, BarChart3, TrendingUp,
  Sparkles, Table, BookOpen, X, Brain, Shuffle, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import AIChatPanel from "@/components/AIChatPanel";
import DynamicChart, { ChartData } from "@/components/DynamicChart";
import { parseFileContent } from "@/lib/analytics-ai";

const Analytics = () => {
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; content: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"charts" | "story" | "table" | "forecast" | "simulation" | "cofound">("charts");
  const [aiCharts, setAiCharts] = useState<ChartData[]>([]);
  const [aiStory, setAiStory] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fileData = uploadedFiles.map(f => `--- FILE: ${f.name} ---\n${f.content}`).join("\n\n");

  const getTableData = () => {
    if (uploadedFiles.length === 0) return null;
    try {
      const first = uploadedFiles[0];
      const parsed = JSON.parse(first.content);
      if (parsed.headers && parsed.rows) return parsed;
    } catch { /* not JSON table */ }
    return null;
  };

  const tableData = getTableData();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const parsed: { name: string; content: string }[] = [];
    for (const file of files) {
      try {
        const text = await file.text();
        const content = parseFileContent(text, file.name);
        parsed.push({ name: file.name, content });
      } catch {
        toast.error(`Failed to read ${file.name}`);
      }
    }

    setUploadedFiles((prev) => [...prev, ...parsed]);
    toast.success(`${parsed.length} file(s) loaded. Ask AI to generate charts and analysis!`);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleChartsGenerated = (charts: ChartData[]) => {
    setAiCharts(prev => [...prev, ...charts]);
    if (activeTab !== "charts") setActiveTab("charts");
  };

  const handleStoryGenerated = (story: string) => {
    setAiStory(story);
  };

  const tabs = [
    { key: "charts", icon: BarChart3, label: "Charts" },
    { key: "story", icon: BookOpen, label: "Data Story" },
    { key: "table", icon: Table, label: "Data Table" },
    { key: "forecast", icon: TrendingUp, label: "Forecast" },
    { key: "simulation", icon: Shuffle, label: "Simulation" },
    { key: "cofound", icon: Brain, label: "Co-Founder" },
  ];

  return (
    <div className="neural-bg min-h-screen">
      <div className="container py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-primary" />
            Data Analytics & <span className="gradient-text">AI Intelligence</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            Upload your data files → AI analyzes patterns and anomalies → generates interactive charts, executive stories, forecasts, and strategic simulations in real time.
          </p>
        </motion.div>

        {/* Upload Zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <input ref={fileRef} type="file" multiple accept=".csv,.json,.txt,.tsv" className="hidden" onChange={handleUpload} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="border-primary/30 text-primary hover:bg-primary/10">
              <Upload className="h-4 w-4 mr-2" /> Upload Files
            </Button>
            <span className="text-xs text-muted-foreground">
              Supports CSV, JSON, TXT — AI generates real charts from your data
            </span>
            {uploadedFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <FileText className="h-3 w-3" /> {f.name}
                    <button onClick={() => removeFile(i)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Main Content */}
          <div className="space-y-5">
            {/* Tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === tab.key
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
                      <span className="text-sm font-bold">AI-Generated Charts</span>
                      <button onClick={() => setAiCharts([])} className="ml-auto text-xs text-muted-foreground hover:text-destructive">Clear All</button>
                    </div>
                    {aiCharts.map((chart, i) => (
                      <DynamicChart key={i} chart={chart} />
                    ))}
                  </>
                ) : (
                  <div className="glass-card p-10 text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="font-bold mb-2 text-lg">No Charts Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                      Upload a data file and ask the AI to <strong className="text-foreground">"Generate charts from data"</strong> or <strong className="text-foreground">"Show revenue breakdown"</strong>. Charts will appear here automatically.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "story" && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-bold">AI Data Story</h3>
                </div>
                {aiStory ? (
                  <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: aiStory.replace(/\n/g, '<br/>') }} />
                  </div>
                ) : uploadedFiles.length > 0 ? (
                  <div className="text-center py-6">
                    <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Ask the AI: <strong className="text-foreground">"Create a data story"</strong> or <strong className="text-foreground">"Generate executive summary"</strong> to get a narrative analysis of your uploaded data.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Upload data files first, then ask the AI to generate a data story.
                  </p>
                )}
              </div>
            )}

            {activeTab === "table" && (
              <div className="glass-card p-5 overflow-x-auto">
                <h3 className="text-sm font-bold mb-4">Data Table</h3>
                {tableData ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {tableData.headers.map((h: string) => (
                          <th key={h} className="text-left py-2 text-muted-foreground font-semibold px-2 text-xs uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.rows.slice(0, 50).map((row: Record<string, string>, i: number) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-secondary/50">
                          {tableData.headers.map((h: string) => (
                            <td key={h} className="py-2 px-2 text-sm">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8">
                    <Table className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">Upload a CSV file to see your data in table format.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "forecast" && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold">Predictive Forecast</h3>
                </div>
                <div className="text-center py-6">
                  <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                    Upload data and ask the AI: <strong className="text-foreground">"Create a forecast"</strong> or <strong className="text-foreground">"Predict next quarter revenue"</strong>. The AI will generate forecast charts with confidence scoring.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "simulation" && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shuffle className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-bold">Scenario Simulation</h3>
                </div>
                <div className="text-center py-6">
                  <Shuffle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-4">
                    Ask "What if" questions to simulate strategic scenarios with projected outcomes and risk analysis.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "What if we increase price by 10%?",
                      "What if marketing spend drops 20%?",
                      "What if we hire 50 more employees?",
                    ].map(q => (
                      <span key={q} className="text-xs px-3 py-1.5 rounded-full border border-accent/30 text-accent font-medium">{q}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "cofound" && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold">AI Strategic Co-Founder</h3>
                </div>
                <div className="text-center py-6">
                  <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-4">
                    Your AI strategic partner. Ask for growth strategies, profit leak analysis, cost optimization, and competitive threat detection.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "Suggest growth strategies",
                      "Find profit leaks",
                      "Recommend cost optimization",
                      "Detect competitive threats",
                    ].map(q => (
                      <span key={q} className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary font-medium">{q}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Assistant — full half */}
          <div>
            <AIChatPanel fileData={fileData} onChartsGenerated={handleChartsGenerated} onStoryGenerated={handleStoryGenerated} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
