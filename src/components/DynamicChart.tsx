import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Treemap,
} from "recharts";

const COLORS = [
  "hsl(187,85%,53%)", "hsl(152,69%,45%)", "hsl(42,92%,56%)",
  "hsl(280,65%,60%)", "hsl(340,75%,55%)", "hsl(200,70%,50%)",
];

export interface ChartData {
  type: "bar" | "line" | "area" | "pie" | "radar" | "radialBar" | "treemap" | "funnel";
  title: string;
  data: { label: string; value: number }[];
}

export function parseChartBlocks(markdown: string): { text: string; charts: ChartData[] } {
  const charts: ChartData[] = [];
  const text = markdown.replace(/```chart\s*\n([\s\S]*?)```/g, (_, json) => {
    try {
      const parsed = JSON.parse(json.trim());
      if (parsed.data && Array.isArray(parsed.data)) {
        charts.push(parsed as ChartData);
        return `\n[Chart: ${parsed.title || "Generated Chart"}]\n`;
      }
    } catch { /* ignore */ }
    return "";
  });
  return { text, charts };
}

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--foreground))",
};

const DynamicChart = ({ chart }: { chart: ChartData }) => {
  const data = chart.data.map((d, i) => ({ name: d.label, value: d.value, fill: COLORS[i % COLORS.length] }));

  const renderChart = () => {
    switch (chart.type) {
      case "pie":
        return (
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={70} dataKey="value" paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        );
      case "area":
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="value" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        );
      case "line":
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} dot={{ fill: COLORS[0] }} />
          </LineChart>
        );
      case "radar":
        return (
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
            <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
            <Radar dataKey="value" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.3} strokeWidth={2} />
            <Tooltip contentStyle={tooltipStyle} />
          </RadarChart>
        );
      case "radialBar":
        return (
          <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={data} startAngle={180} endAngle={0}>
            <RadialBar dataKey="value" cornerRadius={6} />
            <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" />
            <Tooltip contentStyle={tooltipStyle} />
          </RadialBarChart>
        );
      case "treemap": {
        const treemapData = data.map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] }));
        return (
          <Treemap
            data={treemapData}
            dataKey="value"
            nameKey="name"
            stroke="hsl(var(--background))"
          >
            <Tooltip contentStyle={tooltipStyle} />
          </Treemap>
        );
      }
        );
      case "funnel":
        // Render funnel as horizontal bars sorted by value descending
        const sorted = [...data].sort((a, b) => b.value - a.value);
        return (
          <BarChart data={sorted} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={80} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {sorted.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        );
      default: // bar
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        );
    }
  };

  return (
    <div className="glass-card p-5 my-3">
      <h4 className="text-xs font-semibold mb-3 text-foreground tracking-tight">{chart.title}</h4>
      <ResponsiveContainer width="100%" height={220}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default DynamicChart;
