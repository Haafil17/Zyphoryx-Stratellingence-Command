import { useState, useRef, useEffect } from "react";
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

const AIChatPanel = ({ fileData, onChartsGenerated, onStoryGenerated }: AIChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Welcome to **Zephoryx AI Analytics**. Upload your data files and ask me anything — I can analyze trends, **generate interactive charts**, create data stories, forecast outcomes, run what-if simulations, and provide strategic recommendations.\n\nTry asking:\n- \"Generate charts from data\"\n- \"Create a data story\"\n- \"What if we increase price by 10%?\"",
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
        // Auto-populate story panel for story/summary/narrative requests
        const lowerInput = lastSentRef.current.toLowerCase();
        if ((lowerInput.includes("story") || lowerInput.includes("summary") || lowerInput.includes("narrative") || lowerInput.includes("executive") || lowerInput.includes("summarize")) && onStoryGenerated) {
          onStoryGenerated(text);
        }
      },
      onError: (error) => {
        toast.error(error);
        setIsLoading(false);
      },
    });
  };

  const renderMessage = (content: string) => {
    const { text, charts } = parseChartBlocks(content);
    return (
      <>
        <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_li]:text-sm [&_strong]:text-foreground">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
        {charts.map((chart, i) => (
          <DynamicChart key={i} chart={chart} />
        ))}
      </>
    );
  };

  return (
    <div className="glass-card h-[750px] flex flex-col">
      <div className="p-4 border-b border-border/50 flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="font-black text-sm">AI Analytics Assistant</h3>
        {fileData && (
          <span className="ml-auto text-xs text-primary/70 flex items-center gap-1 font-semibold">
            <Sparkles className="h-3 w-3" /> Data loaded
          </span>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "gradient-primary text-primary-foreground font-semibold"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {msg.role === "assistant" ? renderMessage(msg.content) : msg.content}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-xl px-4 py-3 text-sm flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your data...
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-border/50">
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
            className="bg-secondary border-border text-sm resize-none"
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
              className="text-[11px] px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors font-semibold"
              disabled={isLoading}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
