import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Brain, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { ChatMessage, streamAnalyticsChat } from "@/lib/analytics-ai";
import DynamicChart, { parseChartBlocks, ChartData } from "@/components/DynamicChart";

interface AIChatPanelProps {
  fileData: string;
  onChartsGenerated?: (charts: ChartData[]) => void;
  onStoryGenerated?: (story: string) => void;
  onForecastGenerated?: (text: string) => void;
  onSimulationGenerated?: (text: string) => void;
  onCofounderGenerated?: (text: string) => void;
}

export interface AIChatPanelHandle {
  sendMessage: (msg: string) => void;
}

const quickQuestions = [
  "Summarize this data",
  "Generate charts from data",
  "Create a data story",
  "What are the key trends?",
  "Show risk analysis",
  "What if we cut costs 15%?",
  "Create a forecast",
  "Suggest growth strategies",
];

/**
 * Parse sectioned AI response with markers like ## STORY, ## FORECAST, etc.
 * Falls back to routing by user input keywords.
 */
function parseSections(fullText: string): {
  story: string;
  forecast: string;
  simulation: string;
  cofounder: string;
  general: string;
} {
  const result = { story: "", forecast: "", simulation: "", cofounder: "", general: "" };

  // Try to extract sections by markers
  const sectionMap: Record<string, keyof typeof result> = {
    "DATA STORY": "story",
    "EXECUTIVE SUMMARY": "story",
    "NARRATIVE": "story",
    "STORY": "story",
    "FORECAST": "forecast",
    "PREDICTION": "forecast",
    "PROJECTION": "forecast",
    "SIMULATION": "simulation",
    "SCENARIO": "simulation",
    "WHAT-IF": "simulation",
    "WHAT IF": "simulation",
    "STRATEGIC": "cofounder",
    "STRATEGY": "cofounder",
    "GROWTH": "cofounder",
    "CO-FOUNDER": "cofounder",
    "RECOMMENDATION": "cofounder",
  };

  // Split by ## or # headings
  const lines = fullText.split("\n");
  let currentSection: keyof typeof result = "general";
  let currentContent: string[] = [];

  const flushSection = () => {
    const content = currentContent.join("\n").trim();
    if (content) {
      if (result[currentSection]) {
        result[currentSection] += "\n\n" + content;
      } else {
        result[currentSection] = content;
      }
    }
    currentContent = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      flushSection();
      const headingText = headingMatch[1].toUpperCase();
      let matched = false;
      for (const [keyword, section] of Object.entries(sectionMap)) {
        if (headingText.includes(keyword)) {
          currentSection = section;
          currentContent.push(line);
          matched = true;
          break;
        }
      }
      if (!matched) {
        currentContent.push(line);
      }
    } else {
      currentContent.push(line);
    }
  }
  flushSection();

  return result;
}

const AIChatPanel = forwardRef<AIChatPanelHandle, AIChatPanelProps>(({ fileData, onChartsGenerated, onStoryGenerated, onForecastGenerated, onSimulationGenerated, onCofounderGenerated }, ref) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Welcome to **Zephoryx AI Analytics**. Upload your data files and I'll **automatically analyze** them — generating interactive charts, data stories, forecasts, and strategic recommendations.\n\nYou can also ask me directly:\n- \"Generate charts from data\"\n- \"Create a data story\"\n- \"What if we increase price by 10%?\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSentRef = useRef<string>("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const routeResponse = (fullText: string, userInput: string) => {
    const { text } = parseChartBlocks(fullText);
    const cleanText = text.trim();
    if (!cleanText) return;

    const lower = userInput.toLowerCase();
    const isComprehensive = lower.includes("analyze this data") || lower.includes("comprehensively");

    if (isComprehensive) {
      // Parse sections from the AI response
      const sections = parseSections(cleanText);
      if (sections.story && onStoryGenerated) onStoryGenerated(sections.story);
      if (sections.forecast && onForecastGenerated) onForecastGenerated(sections.forecast);
      if (sections.simulation && onSimulationGenerated) onSimulationGenerated(sections.simulation);
      if (sections.cofounder && onCofounderGenerated) onCofounderGenerated(sections.cofounder);

      // If no sections were parsed, send everything to story as fallback
      if (!sections.story && !sections.forecast && !sections.simulation && !sections.cofounder) {
        if (onStoryGenerated) onStoryGenerated(cleanText);
      }
      return;
    }

    // Individual routing by keywords
    if ((lower.includes("story") || lower.includes("summary") || lower.includes("narrative") || lower.includes("executive") || lower.includes("summarize")) && onStoryGenerated) {
      onStoryGenerated(cleanText);
    }
    if ((lower.includes("forecast") || lower.includes("predict") || lower.includes("projection") || lower.includes("future")) && onForecastGenerated) {
      onForecastGenerated(cleanText);
    }
    if ((lower.includes("what if") || lower.includes("what-if") || lower.includes("scenario") || lower.includes("simulation") || lower.includes("simulate")) && onSimulationGenerated) {
      onSimulationGenerated(cleanText);
    }
    if ((lower.includes("strategy") || lower.includes("growth") || lower.includes("profit leak") || lower.includes("optimize") || lower.includes("co-founder") || lower.includes("cofounder") || lower.includes("advisor")) && onCofounderGenerated) {
      onCofounderGenerated(cleanText);
    }
  };

  const handleSend = async (customInput?: string) => {
    const msg = customInput || input.trim();
    if (!msg || isLoading) return;
    lastSentRef.current = msg;
    const userMsg: ChatMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages.filter(m => m.role !== "assistant" || messages.indexOf(m) !== 0), userMsg];

    await streamAnalyticsChat({
      messages: allMessages,
      fileData,
      onDelta: (chunk) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > 1 && assistantSoFar.length > chunk.length) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      },
      onDone: () => {
        setIsLoading(false);
        const { charts, text } = parseChartBlocks(assistantSoFar);
        if (charts.length > 0 && onChartsGenerated) {
          onChartsGenerated(charts);
        }
        routeResponse(assistantSoFar, lastSentRef.current);
      },
      onError: (error) => {
        toast.error(error);
        setIsLoading(false);
      },
    });
  };

  useImperativeHandle(ref, () => ({
    sendMessage: (msg: string) => handleSend(msg),
  }), [fileData, messages, isLoading]);

  const renderMessage = (content: string) => {
    const { text, charts } = parseChartBlocks(content);
    return (
      <>
        <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_p]:text-foreground [&_h1]:text-base [&_h1]:font-black [&_h1]:text-foreground [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-foreground [&_li]:text-sm [&_li]:text-foreground [&_strong]:text-foreground">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
        {charts.map((chart, i) => (
          <DynamicChart key={i} chart={chart} />
        ))}
      </>
    );
  };

  return (
    <div className="glass-card h-[780px] flex flex-col">
      <div className="p-5 border-b border-border/50 flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="font-extrabold text-sm text-foreground">AI Analytics Assistant</h3>
        {fileData && (
          <span className="ml-auto text-xs text-primary flex items-center gap-1 font-bold">
            <Sparkles className="h-3 w-3" /> Data loaded
          </span>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "gradient-primary text-primary-foreground font-bold"
                  : "bg-secondary text-foreground"
              }`}
            >
              {msg.role === "assistant" ? renderMessage(msg.content) : msg.content}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-xl px-4 py-3 text-sm flex items-center gap-2 text-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your data...
            </div>
          </div>
        )}
      </div>
      <div className="p-5 border-t border-border/50">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about data, trends, risks, what-if scenarios..."
            rows={2}
            className="bg-secondary border-border text-sm resize-none text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSend()}
            size="icon"
            className="gradient-primary text-primary-foreground shrink-0 self-end"
            disabled={isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="text-[11px] px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors font-bold"
              disabled={isLoading}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

AIChatPanel.displayName = "AIChatPanel";

export default AIChatPanel;
