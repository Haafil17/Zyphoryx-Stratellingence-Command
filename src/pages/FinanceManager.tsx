import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Sparkles, TrendingUp, TrendingDown, Wallet, PiggyBank, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";

type Entry = {
  id: string;
  type: "revenue" | "expense";
  category: string;
  amount: number;
  description: string | null;
  entry_date: string;
};

const REVENUE_CATEGORIES = ["Sales", "Services", "Subscriptions", "Investments", "Consulting", "Other Income"];
const EXPENSE_CATEGORIES = ["Salaries", "Rent", "Marketing", "Software", "Utilities", "Travel", "Inventory", "Taxes", "Other"];
const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const FinanceManager = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"revenue" | "expense">("revenue");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [aiOutput, setAiOutput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("finance_entries")
      .select("*")
      .order("entry_date", { ascending: false });
    if (error) toast.error(error.message);
    else setEntries((data as Entry[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount) return toast.error("Pick a category and amount");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Please log in");
    const { error } = await supabase.from("finance_entries").insert({
      user_id: user.id, type, category, amount: parseFloat(amount),
      description: description || null, entry_date: entryDate,
    });
    if (error) return toast.error(error.message);
    toast.success(`${type === "revenue" ? "Revenue" : "Expense"} added`);
    setAmount(""); setDescription(""); setCategory("");
    load();
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("finance_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const stats = useMemo(() => {
    const revenue = entries.filter(e => e.type === "revenue").reduce((s, e) => s + Number(e.amount), 0);
    const expense = entries.filter(e => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0);
    const net = revenue - expense;
    const margin = revenue > 0 ? (net / revenue) * 100 : 0;

    const byMonth: Record<string, { month: string; revenue: number; expense: number; net: number }> = {};
    entries.forEach(e => {
      const m = e.entry_date.slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { month: m, revenue: 0, expense: 0, net: 0 };
      if (e.type === "revenue") byMonth[m].revenue += Number(e.amount);
      else byMonth[m].expense += Number(e.amount);
      byMonth[m].net = byMonth[m].revenue - byMonth[m].expense;
    });
    const monthly = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));

    const expByCat: Record<string, number> = {};
    entries.filter(e => e.type === "expense").forEach(e => {
      expByCat[e.category] = (expByCat[e.category] || 0) + Number(e.amount);
    });
    const expensePie = Object.entries(expByCat).map(([name, value]) => ({ name, value }));

    const revByCat: Record<string, number> = {};
    entries.filter(e => e.type === "revenue").forEach(e => {
      revByCat[e.category] = (revByCat[e.category] || 0) + Number(e.amount);
    });
    const revenuePie = Object.entries(revByCat).map(([name, value]) => ({ name, value }));

    return { revenue, expense, net, margin, monthly, expensePie, revenuePie };
  }, [entries]);

  const getAdvice = async () => {
    if (entries.length === 0) return toast.error("Add some entries first");
    setAiLoading(true);
    setAiOutput("");
    try {
      const summary = `TOTAL REVENUE: ${fmt(stats.revenue)}
TOTAL EXPENSES: ${fmt(stats.expense)}
NET: ${fmt(stats.net)}
PROFIT MARGIN: ${stats.margin.toFixed(1)}%

MONTHLY BREAKDOWN:
${stats.monthly.map(m => `${m.month}: Revenue ${fmt(m.revenue)}, Expense ${fmt(m.expense)}, Net ${fmt(m.net)}`).join("\n")}

REVENUE BY CATEGORY:
${stats.revenuePie.map(c => `${c.name}: ${fmt(c.value)}`).join("\n")}

EXPENSES BY CATEGORY:
${stats.expensePie.map(c => `${c.name}: ${fmt(c.value)}`).join("\n")}

ALL ENTRIES (${entries.length}):
${entries.map(e => `${e.entry_date} | ${e.type} | ${e.category} | ${fmt(Number(e.amount))} | ${e.description || ""}`).join("\n")}`;

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`https://agzfeymxyxtcdhzjspnl.supabase.co/functions/v1/finance-advisor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ summary }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const chunk = json.choices?.[0]?.delta?.content;
            if (chunk) setAiOutput(prev => prev + chunk);
          } catch {}
        }
      }
    } catch (e: any) {
      toast.error(e.message || "AI failed");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="container py-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Badge variant="outline" className="mb-3 font-bold">💼 Finance Manager</Badge>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Your <span className="gradient-text">Financial Command Center</span>
        </h1>
        <p className="text-muted-foreground mt-2 font-semibold">
          Track revenue, expenses, and get AI-powered CFO advice. Better than a dashboard — actual decisions.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-border/50 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">Revenue</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black">{fmt(stats.revenue)}</div>
        </Card>
        <Card className="p-5 border-border/50 bg-gradient-to-br from-rose-500/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">Expenses</span>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black">{fmt(stats.expense)}</div>
        </Card>
        <Card className={`p-5 border-border/50 bg-gradient-to-br ${stats.net >= 0 ? "from-primary/10" : "from-rose-500/10"} to-transparent`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">Net Profit</span>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div className={`text-2xl font-black ${stats.net >= 0 ? "text-foreground" : "text-rose-500"}`}>{fmt(stats.net)}</div>
        </Card>
        <Card className="p-5 border-border/50 bg-gradient-to-br from-accent/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">Margin</span>
            <PiggyBank className="h-4 w-4 text-accent" />
          </div>
          <div className="text-2xl font-black">{stats.margin.toFixed(1)}%</div>
        </Card>
      </div>

      {/* Add Entry Form */}
      <Card className="p-6 border-border/50">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Add Entry</h2>
        <form onSubmit={addEntry} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <Label className="text-xs font-bold">Type</Label>
            <Select value={type} onValueChange={(v: any) => { setType(v); setCategory(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">💰 Revenue</SelectItem>
                <SelectItem value="expense">💸 Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {(type === "revenue" ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold">Amount</Label>
            <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-bold">Date</Label>
            <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <Label className="text-xs font-bold">Note</Label>
            <Input placeholder="optional" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full gradient-primary text-primary-foreground font-extrabold border-0">Add</Button>
          </div>
        </form>
      </Card>

      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="charts" className="font-bold">📊 Charts</TabsTrigger>
          <TabsTrigger value="entries" className="font-bold">📋 Entries</TabsTrigger>
          <TabsTrigger value="advisor" className="font-bold">🤖 AI Advisor</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-border/50">
              <h3 className="font-black mb-4">Monthly Cash Flow</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.monthly}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#rev)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#exp)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 border-border/50">
              <h3 className="font-black mb-4">Net Profit Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.monthly}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="net" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 border-border/50">
              <h3 className="font-black mb-4">Expense Breakdown</h3>
              {stats.expensePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={stats.expensePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e) => `${e.name}: ${fmt(e.value)}`}>
                      {stats.expensePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground">No expenses yet</p>}
            </Card>

            <Card className="p-6 border-border/50">
              <h3 className="font-black mb-4">Revenue Sources</h3>
              {stats.revenuePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.revenuePie}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground">No revenue yet</p>}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="entries" className="mt-6">
          <Card className="p-6 border-border/50">
            <h3 className="font-black mb-4">All Transactions ({entries.length})</h3>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No entries yet — add your first one above.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs">{e.entry_date}</TableCell>
                      <TableCell>
                        <Badge variant={e.type === "revenue" ? "default" : "destructive"} className="font-bold">
                          {e.type === "revenue" ? "💰" : "💸"} {e.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{e.category}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{e.description || "—"}</TableCell>
                      <TableCell className={`text-right font-black ${e.type === "revenue" ? "text-emerald-500" : "text-rose-500"}`}>
                        {e.type === "revenue" ? "+" : "-"}{fmt(Number(e.amount))}
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => deleteEntry(e.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-rose-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="advisor" className="mt-6">
          <Card className="p-6 border-border/50">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h3 className="font-black flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> AI CFO Advisor</h3>
                <p className="text-sm text-muted-foreground">Get a CFO-grade breakdown and 30-day action plan based on your actual numbers.</p>
              </div>
              <Button onClick={getAdvice} disabled={aiLoading} className="gradient-primary text-primary-foreground font-extrabold border-0">
                {aiLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</> : <><Sparkles className="h-4 w-4 mr-2" /> Get Advice</>}
              </Button>
            </div>
            {aiOutput ? (
              <div className="prose prose-invert max-w-none whitespace-pre-wrap font-medium text-sm leading-relaxed bg-muted/30 p-5 rounded-lg border border-border/50">
                {aiOutput}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click "Get Advice" to receive your personalized financial analysis.</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceManager;
