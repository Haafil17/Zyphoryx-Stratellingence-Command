import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-data`;

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export interface StructuredData {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

function isStructuredData(value: unknown): value is StructuredData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as StructuredData;
  return Array.isArray(candidate.headers) && Array.isArray(candidate.rows);
}

export function parseStructuredData(content: string): StructuredData | null {
  try {
    const parsed = JSON.parse(content);
    if (!isStructuredData(parsed)) return null;

    return {
      headers: parsed.headers.map((header) => String(header ?? "")),
      rows: parsed.rows.map((row) => {
        const normalized: Record<string, string> = {};
        Object.entries(row ?? {}).forEach(([key, value]) => {
          normalized[String(key)] = String(value ?? "");
        });
        return normalized;
      }),
      totalRows: typeof parsed.totalRows === "number" ? parsed.totalRows : parsed.rows.length,
    };
  } catch {
    return null;
  }
}

export async function streamAnalyticsChat({
  messages,
  fileData,
  onDelta,
  onDone,
  onError,
}: {
  messages: ChatMessage[];
  fileData: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, fileData }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Request failed" }));
      onError(err.error || `Error ${resp.status}`);
      return;
    }

    if (!resp.body) {
      onError("No response body");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    // flush remaining
    if (buffer.trim()) {
      for (let raw of buffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : "Connection failed");
  }
}

/**
 * Auto-detect delimiter from a text file. Supports comma, semicolon, tab, pipe.
 */
function detectDelimiter(firstLine: string): string {
  const candidates = [
    { delim: "|", count: (firstLine.match(/\|/g) || []).length },
    { delim: "\t", count: (firstLine.match(/\t/g) || []).length },
    { delim: ";", count: (firstLine.match(/;/g) || []).length },
    { delim: ",", count: (firstLine.match(/,/g) || []).length },
  ];
  candidates.sort((a, b) => b.count - a.count);
  return candidates[0].count > 0 ? candidates[0].delim : ",";
}

function splitLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === delimiter && !inQuotes) { result.push(current.trim()); current = ""; continue; }
    current += char;
  }
  result.push(current.trim());
  return result;
}

export function parseCSV(text: string): string {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length === 0) return "";
  
  const delimiter = detectDelimiter(lines[0]);

  const headers = splitLine(lines[0], delimiter);
  const rows = lines.slice(1).map(line => {
    const vals = splitLine(line, delimiter);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  });

  return JSON.stringify({ headers, rows: rows.slice(0, 200), totalRows: rows.length }, null, 2);
}

/**
 * Parse an Excel file (XLSX/XLS) from an ArrayBuffer into {headers, rows} JSON.
 */
export function parseExcel(buffer: ArrayBuffer): string {
  try {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return "";
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    if (jsonData.length === 0) return "";

    const headers = Object.keys(jsonData[0]);
    const rows = jsonData.slice(0, 200).map(item => {
      const obj: Record<string, string> = {};
      headers.forEach(h => { obj[h] = String(item[h] ?? ""); });
      return obj;
    });

    return JSON.stringify({ headers, rows, totalRows: jsonData.length }, null, 2);
  } catch (e) {
    console.error("Excel parse error:", e);
    return "";
  }
}

export async function parsePdf(buffer: ArrayBuffer): Promise<string> {
  try {
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 20); pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (text) pages.push(text);
    }

    const extractedText = pages.join("\n\n").trim();
    if (!extractedText) return "";

    const tabular = tryParseTabularText(extractedText);
    return tabular || extractedText.slice(0, 50000);
  } catch (e) {
    console.error("PDF parse error:", e);
    return "";
  }
}

/**
 * Detect if a text blob is tabular (pipe-delimited, whitespace-aligned, etc.)
 */
function tryParseTabularText(text: string): string | null {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) return null;

  // Check for pipe-delimited data
  const pipeLines = lines.filter(l => l.includes("|"));
  if (pipeLines.length >= 2) {
    const dataLines = pipeLines.filter(l => !l.replace(/[\s|:-]/g, "").match(/^$/));
    if (dataLines.length >= 2) {
      const parsePipeLine = (line: string): string[] =>
        line.split("|").map(s => s.trim()).filter(s => s.length > 0 && !s.match(/^[-:]+$/));

      const headers = parsePipeLine(dataLines[0]);
      if (headers.length >= 2) {
        const rows = dataLines.slice(1)
          .filter(l => {
            const cells = parsePipeLine(l);
            return cells.length > 0 && !cells.every(c => c.match(/^[-:]+$/));
          })
          .map(l => {
            const vals = parsePipeLine(l);
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
            return obj;
          });

        if (rows.length > 0) {
          return JSON.stringify({ headers, rows: rows.slice(0, 200), totalRows: rows.length }, null, 2);
        }
      }
    }
  }

  // Check for tab-delimited
  if (lines[0].includes("\t")) {
    return parseCSV(text);
  }

  // Check for consistent delimiter
  const delimiter = detectDelimiter(lines[0]);
  const firstLineParts = splitLine(lines[0], delimiter);
  if (firstLineParts.length >= 2) {
    const consistentLines = lines.filter(l => splitLine(l, delimiter).length === firstLineParts.length);
    if (consistentLines.length >= lines.length * 0.5) {
      const headers = firstLineParts;
      const rows = lines.slice(1).map(line => {
        const vals = splitLine(line, delimiter);
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return obj;
      });
      if (rows.length > 0) {
        return JSON.stringify({ headers, rows: rows.slice(0, 200), totalRows: rows.length }, null, 2);
      }
    }
  }

  return null;
}

export function parseFileContent(content: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  
  if (ext === "csv" || ext === "tsv") return parseCSV(content);
  
  if (ext === "json") {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
        const headers = Object.keys(parsed[0]);
        const rows = parsed.slice(0, 200).map(item => {
          const obj: Record<string, string> = {};
          headers.forEach(h => { obj[h] = String(item[h] ?? ""); });
          return obj;
        });
        return JSON.stringify({ headers, rows, totalRows: parsed.length }, null, 2);
      }
      return JSON.stringify(parsed, null, 2).slice(0, 50000);
    } catch {
      return content.slice(0, 50000);
    }
  }
  
  // For .txt and other text files, try to detect tabular structure
  if (ext === "txt" || ext === "dat" || ext === "log" || !ext) {
    const tabular = tryParseTabularText(content);
    if (tabular) return tabular;
  }

  // Fallback: try tabular detection on any unrecognized format
  const tabular = tryParseTabularText(content);
  if (tabular) return tabular;

  return content.slice(0, 50000);
}
