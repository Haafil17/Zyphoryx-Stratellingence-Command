import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const COLORS = [
  "hsl(187,85%,53%)", "hsl(152,69%,45%)", "hsl(42,92%,56%)",
  "hsl(280,65%,60%)", "hsl(340,75%,55%)", "hsl(200,70%,50%)",
];

export interface ChartData {
  type: "bar" | "line" | "area" | "pie";
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
  background: "hsl(222,22%,9%)",
  border: "1px solid hsl(222,15%,18%)",
  borderRadius: 8,
};

const DynamicChart = ({ chart }: { chart: ChartData }) => {
  const data = chart.data.map((d) => ({ name: d.label, value: d.value }));

  return (
    <div className="glass-card p-4 my-3">
      <h4 className="text-xs font-semibold mb-3 text-foreground">{chart.title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        {chart.type === "pie" ? (
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={70} dataKey="value" paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        ) : chart.type === "area" ? (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,15%,18%)" />
            <XAxis dataKey="name" stroke="hsl(215,15%,55%)" fontSize={11} />
            <YAxis stroke="hsl(215,15%,55%)" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="value" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        ) : chart.type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,15%,18%)" />
            <XAxis dataKey="name" stroke="hsl(215,15%,55%)" fontSize={11} />
            <YAxis stroke="hsl(215,15%,55%)" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} dot={{ fill: COLORS[0] }} />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,15%,18%)" />
            <XAxis dataKey="name" stroke="hsl(215,15%,55%)" fontSize={11} />
            <YAxis stroke="hsl(215,15%,55%)" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default DynamicChart;
