import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Key, Plus, Copy, Trash2, ToggleLeft, ToggleRight, Code, ExternalLink, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  key_name: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "zeph_";
  for (let i = 0; i < 48; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
  return key;
}

const ApiKeys = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const fetchKeys = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("api_keys").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setKeys((data as ApiKey[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchKeys(); }, []);

  const createKey = async () => {
    if (!newKeyName.trim()) { toast.error("Enter a key name"); return; }
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }

    const apiKey = generateApiKey();
    const { error } = await supabase.from("api_keys").insert({ user_id: user.id, key_name: newKeyName.trim(), api_key: apiKey });
    if (error) { toast.error("Failed to create API key"); setCreating(false); return; }

    toast.success("API key created! Copy it now — it won't be shown in full again.");
    setNewKeyName("");
    setCreating(false);
    await fetchKeys();
    setRevealedKeys(prev => new Set(prev).add(apiKey));
  };

  const toggleKey = async (id: string, currentState: boolean) => {
    await supabase.from("api_keys").update({ is_active: !currentState }).eq("id", id);
    toast.success(currentState ? "Key deactivated" : "Key activated");
    fetchKeys();
  };

  const deleteKey = async (id: string) => {
    await supabase.from("api_keys").delete().eq("id", id);
    toast.success("API key deleted");
    fetchKeys();
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard");
  };

  const maskedKey = (key: string) => key.slice(0, 10) + "••••••••••••••••••••" + key.slice(-6);

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-analyze`;

  return (
    <div className="neural-bg min-h-screen">
      <div className="container py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black flex items-center gap-3 tracking-tight text-foreground">
            <Key className="h-10 w-10 text-[hsl(220,80%,60%)]" />
            API <span className="gradient-text">Keys</span>
          </h1>
          <p className="text-base text-muted-foreground mt-3 max-w-2xl leading-relaxed font-medium">
            Generate API keys to use Zephoryx AI analytics from your own website, app, or server.
          </p>
        </motion.div>

        {/* Create Key */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
          <h3 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-[hsl(152,69%,45%)]" /> Create New API Key
          </h3>
          <div className="flex gap-3">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g. My Website, Production)"
              className="bg-secondary border-border text-foreground"
              onKeyDown={(e) => e.key === "Enter" && createKey()}
            />
            <Button onClick={createKey} disabled={creating} className="gradient-primary text-white font-black px-6 shrink-0">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Generate
            </Button>
          </div>
        </motion.div>

        {/* Keys List */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3 mb-8">
          {loading ? (
            <div className="glass-card p-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          ) : keys.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-lg font-bold text-muted-foreground">No API keys yet. Create one above.</p>
            </div>
          ) : (
            keys.map((k) => (
              <div key={k.id} className={`glass-card p-5 border ${k.is_active ? "border-border" : "border-destructive/30 opacity-60"}`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-foreground">{k.key_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${k.is_active ? "bg-[hsl(152,69%,45%)]/15 text-[hsl(152,69%,45%)]" : "bg-destructive/15 text-destructive"}`}>
                        {k.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <code className="text-sm text-muted-foreground font-mono block truncate">
                      {revealedKeys.has(k.api_key) ? k.api_key : maskedKey(k.api_key)}
                    </code>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">
                      Created: {new Date(k.created_at).toLocaleDateString()}
                      {k.last_used_at && ` · Last used: ${new Date(k.last_used_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyKey(k.api_key)} className="font-bold">
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleKey(k.id, k.is_active)} className="font-bold">
                      {k.is_active ? <ToggleRight className="h-3.5 w-3.5 mr-1" /> : <ToggleLeft className="h-3.5 w-3.5 mr-1" />}
                      {k.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteKey(k.id)} className="font-bold text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>

        {/* Integration Guide */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
            <Code className="h-5 w-5 text-[hsl(280,70%,65%)]" /> Integration Guide
          </h3>
          <p className="text-sm text-muted-foreground mb-4 font-medium">
            Use your API key to call Zephoryx AI from any website or server. Send a POST request with your data:
          </p>
          <div className="bg-[hsl(222,28%,6%)] rounded-xl p-5 overflow-x-auto border border-border/40">
            <pre className="text-sm text-[hsl(152,69%,65%)] font-mono whitespace-pre-wrap leading-relaxed">{`// JavaScript / Fetch Example
const response = await fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "YOUR_API_KEY_HERE"
  },
  body: JSON.stringify({
    messages: [
      { role: "user", content: "Analyze this data and give insights" }
    ],
    fileData: "Month,Revenue,Expense\\nJan,50000,30000\\nFeb,55000,32000"
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`}</pre>
          </div>
          <div className="mt-4 p-4 rounded-lg kpi-card-blue border">
            <p className="text-sm text-foreground font-bold flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-[hsl(220,80%,60%)]" />
              Endpoint: <code className="text-xs bg-background/50 px-2 py-1 rounded font-mono">{baseUrl}</code>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ApiKeys;
