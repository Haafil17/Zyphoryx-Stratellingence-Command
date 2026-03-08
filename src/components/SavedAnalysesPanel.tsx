import { useState, useEffect } from "react";
import { Save, History, Trash2, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ChartData } from "@/components/DynamicChart";

interface SavedAnalysis {
  id: string;
  title: string;
  file_names: string[];
  charts: ChartData[];
  story: string;
  forecast: string;
  simulation: string;
  cofounder: string;
  created_at: string;
}

interface SavedAnalysesPanelProps {
  fileNames: string[];
  charts: ChartData[];
  story: string;
  forecast: string;
  simulation: string;
  cofounder: string;
  onLoad: (analysis: SavedAnalysis) => void;
}

const SavedAnalysesPanel = ({
  fileNames, charts, story, forecast, simulation, cofounder, onLoad
}: SavedAnalysesPanelProps) => {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const fetchAnalyses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_analyses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data) {
      setAnalyses(data.map(d => ({
        ...d,
        charts: (d.charts as ChartData[]) || [],
        file_names: d.file_names || [],
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (showHistory) fetchAnalyses();
  }, [showHistory]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title for this analysis");
      return;
    }
    if (!charts.length && !story && !forecast && !simulation && !cofounder) {
      toast.error("No analysis data to save. Generate some insights first.");
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to save analyses");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("saved_analyses").insert({
      user_id: user.id,
      title: title.trim(),
      file_names: fileNames,
      charts: charts as any,
      story,
      forecast,
      simulation,
      cofounder,
    });

    if (error) {
      toast.error("Failed to save analysis");
    } else {
      toast.success("Analysis saved successfully!");
      setTitle("");
      if (showHistory) fetchAnalyses();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_analyses").delete().eq("id", id);
    if (!error) {
      setAnalyses(prev => prev.filter(a => a.id !== id));
      toast.success("Analysis deleted");
    }
  };

  const hasData = charts.length > 0 || story || forecast || simulation || cofounder;

  return (
    <div className="space-y-3">
      {/* Save Section */}
      {hasData && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Name this analysis..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary border-border text-sm h-9"
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="gradient-primary text-primary-foreground font-bold shrink-0"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              Save
            </Button>
          </div>
        </div>
      )}

      {/* History Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowHistory(!showHistory)}
        className="w-full border-border text-muted-foreground hover:text-foreground font-bold text-xs"
      >
        <History className="h-3.5 w-3.5 mr-1.5" />
        {showHistory ? "Hide" : "View"} Saved Analyses
      </Button>

      {/* History List */}
      {showHistory && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-6">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
            </div>
          ) : analyses.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No saved analyses yet</p>
          ) : (
            analyses.map((a) => (
              <div key={a.id} className="glass-card p-3 flex items-center justify-between gap-2 group">
                <button
                  onClick={() => { onLoad(a); toast.success(`Loaded: ${a.title}`); }}
                  className="flex-1 text-left"
                >
                  <p className="text-xs font-bold text-foreground truncate">{a.title}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(a.created_at).toLocaleDateString()} · {a.file_names.length} file(s)
                  </p>
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SavedAnalysesPanel;
