import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Key, Plus, Copy, Trash2, Power, Code, Shield, Loader2,
  Eye, EyeOff, AlertTriangle, CheckCircle2, Activity, Globe, Terminal, ArrowLeft, RefreshCw, BookOpen, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (!session?.user) { setAuthLoading(false); return; }
      const { data: hasAdmin } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
      setIsAdmin(!!hasAdmin);
      setAuthLoading(false);
      if (hasAdmin) fetchKeys();
    };
    check();
  }, []);

  const fetchKeys = async () => {
    setLoading(true);
    const { data } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
    setKeys((data as ApiKey[]) || []);
    setLoading(false);
  };

  const createKey = async () => {
    if (!newKeyName.trim()) { toast.error("Enter a key name"); return; }
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }
    const apiKey = generateApiKey();
    const { data, error } = await supabase
      .from("api_keys")
      .insert({ user_id: user.id, key_name: newKeyName.trim(), api_key: apiKey })
      .select()
      .single();
    if (error) { toast.error("Failed to create API key"); setCreating(false); return; }
    toast.success("API key created — reveal & copy it now");
    setNewKeyName("");
    setCreating(false);
    await fetchKeys();
    if (data) setRevealedIds(prev => new Set(prev).add(data.id));
  };

  const toggleKey = async (id: string, currentState: boolean) => {
    await supabase.from("api_keys").update({ is_active: !currentState }).eq("id", id);
    toast.success(currentState ? "Key deactivated" : "Key activated");
    fetchKeys();
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Permanently delete this API key? Any integrations using it will stop working.")) return;
    await supabase.from("api_keys").delete().eq("id", id);
    toast.success("API key deleted");
    fetchKeys();
  };

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copy = (text: string, label = "Copied") => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const maskedKey = (key: string) => key.slice(0, 10) + "••••••••••••••••" + key.slice(-6);
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-analyze`;

  if (authLoading) {
    return (
      <div className="neural-bg min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) { navigate("/login"); return null; }

  if (!isAdmin) {
    return (
      <div className="neural-bg min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-accent mx-auto mb-4" />
          <h2 className="text-xl font-black mb-2 text-foreground">Admin Access Required</h2>
          <p className="text-sm text-muted-foreground mb-6">
            API key management is restricted to administrators.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">Go Home</Button>
        </div>
      </div>
    );
  }

  const totalKeys = keys.length;
  const activeKeys = keys.filter(k => k.is_active).length;
  const usedKeys = keys.filter(k => k.last_used_at).length;

  const stats = [
    { label: "Total Keys", value: totalKeys, icon: Key, color: "text-[hsl(220,80%,60%)]", bg: "kpi-card-blue" },
    { label: "Active", value: activeKeys, icon: CheckCircle2, color: "text-[hsl(152,69%,45%)]", bg: "kpi-card-green" },
    { label: "Inactive", value: totalKeys - activeKeys, icon: Power, color: "text-[hsl(340,75%,60%)]", bg: "kpi-card-pink" },
    { label: "In Use", value: usedKeys, icon: Activity, color: "text-[hsl(280,70%,65%)]", bg: "kpi-card-purple" },
  ];

  return (
    <div className="neural-bg min-h-screen">
      <div className="container py-8 max-w-6xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="mb-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Admin
        </Button>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black flex items-center gap-3 tracking-tight text-foreground">
              <Shield className="h-10 w-10 text-[hsl(220,80%,60%)]" />
              API <span className="gradient-text">Key Management</span>
            </h1>
            <p className="text-base text-muted-foreground mt-3 max-w-2xl leading-relaxed font-medium">
              Issue, monitor, and revoke programmatic access to Zephoryx AI analytics for external apps, websites, and partners.
            </p>
          </div>
          <Button onClick={fetchKeys} variant="outline" size="sm" className="font-bold">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`glass-card p-5 ${s.bg} border`}>
              <div className="flex items-center justify-between mb-3">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-3xl font-black text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1 font-bold uppercase tracking-wide">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Create */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
          <h3 className="text-lg font-black text-foreground mb-1 flex items-center gap-2">
            <Plus className="h-5 w-5 text-[hsl(152,69%,45%)]" /> Issue New API Key
          </h3>
          <p className="text-xs text-muted-foreground mb-4 font-medium">Name it after the integration (e.g. "Marketing Site", "Partner Portal", "Production Backend").</p>
          <div className="flex gap-3">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Integration name..."
              className="bg-secondary border-border text-foreground"
              onKeyDown={(e) => e.key === "Enter" && createKey()}
            />
            <Button onClick={createKey} disabled={creating} className="gradient-primary text-white font-black px-6 shrink-0">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> Generate Key</>}
            </Button>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-0 mb-8 overflow-hidden">
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <Key className="h-5 w-5 text-[hsl(220,80%,60%)]" /> Issued Keys
            </h3>
            <span className="text-xs text-muted-foreground font-bold">{totalKeys} {totalKeys === 1 ? "key" : "keys"}</span>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          ) : keys.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-lg font-bold text-muted-foreground">No API keys yet</p>
              <p className="text-sm text-muted-foreground mt-1">Issue your first key above to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-black text-xs uppercase tracking-wider text-muted-foreground">Name</TableHead>
                    <TableHead className="font-black text-xs uppercase tracking-wider text-muted-foreground">Key</TableHead>
                    <TableHead className="font-black text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="font-black text-xs uppercase tracking-wider text-muted-foreground">Created</TableHead>
                    <TableHead className="font-black text-xs uppercase tracking-wider text-muted-foreground">Last Used</TableHead>
                    <TableHead className="font-black text-xs uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((k) => (
                    <TableRow key={k.id} className="border-border/30 hover:bg-secondary/30">
                      <TableCell className="font-black text-foreground">{k.key_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-muted-foreground bg-background/60 px-2 py-1 rounded border border-border/40 max-w-[280px] truncate">
                            {revealedIds.has(k.id) ? k.api_key : maskedKey(k.api_key)}
                          </code>
                          <button onClick={() => toggleReveal(k.id)} className="text-muted-foreground hover:text-foreground" title={revealedIds.has(k.id) ? "Hide" : "Reveal"}>
                            {revealedIds.has(k.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={() => copy(k.api_key, "Key copied")} className="text-muted-foreground hover:text-foreground" title="Copy key">
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${k.is_active ? "bg-[hsl(152,69%,45%)]/15 text-[hsl(152,69%,45%)]" : "bg-destructive/15 text-destructive"}`}>
                          {k.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {new Date(k.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : <span className="opacity-50">Never</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toggleKey(k.id, k.is_active)} className="h-8 text-xs font-bold" title={k.is_active ? "Deactivate" : "Activate"}>
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteKey(k.id)} className="h-8 text-xs font-bold text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>

        {/* Endpoint banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 mb-6 kpi-card-blue border">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-[hsl(220,80%,60%)]" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Public API Endpoint</p>
                <code className="text-sm font-mono text-foreground">{baseUrl}</code>
              </div>
            </div>
            <Button onClick={() => copy(baseUrl, "Endpoint copied")} variant="outline" size="sm" className="font-bold">
              <Copy className="h-3.5 w-3.5 mr-2" /> Copy URL
            </Button>
          </div>
        </motion.div>

        {/* Integration guide with tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h3 className="text-lg font-black text-foreground mb-1 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[hsl(280,70%,65%)]" /> Integration Guide
          </h3>
          <p className="text-sm text-muted-foreground mb-5 font-medium">
            Send a POST request with <code className="text-xs bg-background/50 px-1.5 py-0.5 rounded">x-api-key</code> header and your data payload.
          </p>

          <Tabs defaultValue="js" className="w-full">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="js" className="font-bold"><Code className="h-3.5 w-3.5 mr-1.5" />JavaScript</TabsTrigger>
              <TabsTrigger value="curl" className="font-bold"><Terminal className="h-3.5 w-3.5 mr-1.5" />cURL</TabsTrigger>
              <TabsTrigger value="python" className="font-bold"><Zap className="h-3.5 w-3.5 mr-1.5" />Python</TabsTrigger>
              <TabsTrigger value="node" className="font-bold"><Code className="h-3.5 w-3.5 mr-1.5" />Node.js</TabsTrigger>
            </TabsList>

            <TabsContent value="js">
              <pre className="bg-[hsl(222,28%,6%)] rounded-xl p-5 overflow-x-auto border border-border/40 text-sm text-[hsl(152,69%,65%)] font-mono whitespace-pre-wrap leading-relaxed">{`const response = await fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "YOUR_ZEPH_API_KEY"
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Analyze this data" }],
    fileData: "Month,Revenue,Expense\\nJan,50000,30000"
  })
});
const data = await response.json();
console.log(data.choices[0].message.content);`}</pre>
            </TabsContent>

            <TabsContent value="curl">
              <pre className="bg-[hsl(222,28%,6%)] rounded-xl p-5 overflow-x-auto border border-border/40 text-sm text-[hsl(25,95%,68%)] font-mono whitespace-pre-wrap leading-relaxed">{`curl -X POST "${baseUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_ZEPH_API_KEY" \\
  -d '{
    "messages": [{"role": "user", "content": "Analyze this data"}],
    "fileData": "Month,Revenue,Expense\\nJan,50000,30000"
  }'`}</pre>
            </TabsContent>

            <TabsContent value="python">
              <pre className="bg-[hsl(222,28%,6%)] rounded-xl p-5 overflow-x-auto border border-border/40 text-sm text-[hsl(220,80%,70%)] font-mono whitespace-pre-wrap leading-relaxed">{`import requests

resp = requests.post(
    "${baseUrl}",
    headers={
        "Content-Type": "application/json",
        "x-api-key": "YOUR_ZEPH_API_KEY",
    },
    json={
        "messages": [{"role": "user", "content": "Analyze this data"}],
        "fileData": "Month,Revenue,Expense\\nJan,50000,30000",
    },
)
print(resp.json()["choices"][0]["message"]["content"])`}</pre>
            </TabsContent>

            <TabsContent value="node">
              <pre className="bg-[hsl(222,28%,6%)] rounded-xl p-5 overflow-x-auto border border-border/40 text-sm text-[hsl(152,69%,65%)] font-mono whitespace-pre-wrap leading-relaxed">{`import fetch from "node-fetch";

const res = await fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.ZEPH_API_KEY,
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Analyze this data" }],
    fileData: "Month,Revenue,Expense\\nJan,50000,30000",
  }),
});
const json = await res.json();
console.log(json.choices[0].message.content);`}</pre>
            </TabsContent>
          </Tabs>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary/40 border border-border/40">
              <p className="text-xs font-black uppercase tracking-wider text-[hsl(220,80%,60%)] mb-1">Authentication</p>
              <p className="text-xs text-muted-foreground font-medium">Pass your key in the <code className="bg-background/50 px-1 rounded">x-api-key</code> header on every request.</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/40 border border-border/40">
              <p className="text-xs font-black uppercase tracking-wider text-[hsl(152,69%,45%)] mb-1">Data Format</p>
              <p className="text-xs text-muted-foreground font-medium">Send raw CSV, JSON, or text in <code className="bg-background/50 px-1 rounded">fileData</code>. Any data type supported.</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/40 border border-border/40">
              <p className="text-xs font-black uppercase tracking-wider text-[hsl(280,70%,65%)] mb-1">Response</p>
              <p className="text-xs text-muted-foreground font-medium">OpenAI-compatible chat completion JSON with full markdown analysis.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ApiKeys;
