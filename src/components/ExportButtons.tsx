import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExportButtonsProps {
  data: Record<string, unknown>[];
  headers?: string[];
  filename?: string;
}

const ExportButtons = ({ data, headers, filename = "export" }: ExportButtonsProps) => {
  if (!data || data.length === 0) return null;

  const cols = headers || Object.keys(data[0]);

  const exportCSV = () => {
    const csvRows = [
      cols.join(","),
      ...data.map(row => cols.map(h => {
        const val = String(row[h] ?? "");
        return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(","))
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported successfully");
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportCSV}
        className="border-border text-muted-foreground hover:text-foreground text-xs font-bold"
      >
        <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> Export CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportJSON}
        className="border-border text-muted-foreground hover:text-foreground text-xs font-bold"
      >
        <FileText className="h-3.5 w-3.5 mr-1.5" /> Export JSON
      </Button>
    </div>
  );
};

export default ExportButtons;
