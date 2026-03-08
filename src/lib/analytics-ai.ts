const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-data`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

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
  // Count occurrences of each candidate
  const candidates = [
    { delim: "|", count: (firstLine.match(/\|/g) || []).length },
    { delim: "\t", count: (firstLine.match(/\t/g) || []).length },
    { delim: ";", count: (firstLine.match(/;/g) || []).length },
    { delim: ",", count: (firstLine.match(/,/g) || []).length },
  ];
  // Pick the one with highest count (minimum 1)
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
 * Detect if a text blob is tabular (pipe-delimited, whitespace-aligned, etc.)
 * and convert to {headers, rows} JSON.
 */
function tryParseTabularText(text: string): string | null {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) return null;

  // Check for pipe-delimited data (e.g. "| Col1 | Col2 |")
  const pipeLines = lines.filter(l => l.includes("|"));
  if (pipeLines.length >= 2) {
    // Filter out separator lines (e.g. "|---|---|")
    const dataLines = pipeLines.filter(l => !l.replace(/[\s|:-]/g, "").match(/^$/));
    if (dataLines.length >= 2) {
      const parsePipeLine = (line: string): string[] =>
        line.split("|").map(s => s.trim()).filter(s => s.length > 0 && !s.match(/^[-:]+$/));

      const headers = parsePipeLine(dataLines[0]);
      if (headers.length >= 2) {
        const rows = dataLines.slice(1)
          .filter(l => {
            // Skip separator lines like |---|---|
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
    return parseCSV(text); // parseCSV auto-detects tabs
  }

  // Check for consistent delimiter (semicolons, commas in .txt)
  const delimiter = detectDelimiter(lines[0]);
  const firstLineParts = splitLine(lines[0], delimiter);
  if (firstLineParts.length >= 2) {
    // Verify consistency: at least 50% of lines have same number of columns
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
      // If it's an array of objects, convert to headers/rows format
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
