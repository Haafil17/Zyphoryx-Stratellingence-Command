

# Plan: Fix Zephoryx Platform — Dashboard, Analytics & Overall Quality

## Problems Identified

1. **Dashboard CSV parsing fails for non-standard formats**: The `tryParseChartData` function expects JSON with `headers` and `rows`, but `parseFileContent` only converts `.csv` files to that format. Plain text files (`.txt`) and other formats are passed through as raw text, causing the JSON parse to fail silently.

2. **Analytics auto-analyze fires twice**: React strict mode + the `useEffect` dependency array causes duplicate API calls (confirmed by two identical network requests).

3. **AI response routing is fragile**: The `routeResponse` function in `AIChatPanel` matches keywords like "comprehensively" to route to the story tab, but the auto-trigger message contains that word, causing the entire AI response (including charts) to be dumped into the story tab as raw text with chart JSON blocks.

4. **Console warnings**: `CartesianGrid` and `ReactMarkdown` components receive refs they don't support.

5. **Dashboard shows `$` prefix** but user data is in INR — currency should be auto-detected or neutral.

## Implementation Plan

### 1. Fix `parseFileContent` to handle `.txt` tabular data
- Update `src/lib/analytics-ai.ts` to detect pipe-delimited (`|`) and whitespace-delimited tabular data in `.txt` files
- Auto-detect if a `.txt` file contains structured data (like the H2A2 Farm data with `|` separators) and convert it to the `{headers, rows}` JSON format
- Also handle `.tsv` files properly

### 2. Fix Dashboard data parsing robustness
- In `Dashboard.tsx`, make `tryParseChartData` attempt to parse raw text as CSV/TSV if JSON parse fails
- Remove hardcoded `$` symbol — display raw numbers or auto-detect currency from column headers (INR, USD, etc.)
- Fix the `findNumericCol` function to handle cases where revenue and expense use the same keyword ("amount")

### 3. Fix Analytics duplicate triggers
- Add a guard in the `useEffect` to prevent double-firing (use a ref flag)
- Debounce the auto-analyze to prevent race conditions

### 4. Fix AI response routing
- Separate chart extraction from story routing — always extract charts regardless of the query
- Clean the routed text by stripping chart blocks before sending to story/forecast tabs
- The `parseChartBlocks` function already strips charts, but `routeResponse` receives the full text — fix this so it receives the cleaned text

### 5. Fix console warnings
- The `CartesianGrid` ref warning is a recharts internal issue — no action needed
- The `ReactMarkdown` ref warning: avoid passing refs to ReactMarkdown component

### 6. UI/UX improvements
- Ensure all text has sufficient contrast (already at 72% muted-foreground)
- Make feature cards on homepage bolder with `font-extrabold` titles
- Clean up navigation — ensure "Log In" styling is distinct

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/analytics-ai.ts` | Add pipe-delimited and TSV parsing for `.txt` files |
| `src/pages/Dashboard.tsx` | Robust parsing fallback, currency auto-detect, fix numeric column detection |
| `src/pages/Analytics.tsx` | Fix double-trigger with ref guard, improve auto-analyze reliability |
| `src/components/AIChatPanel.tsx` | Fix response routing to use cleaned text, separate chart extraction |
| `src/components/DynamicChart.tsx` | Minor: ensure no ref forwarding issues |
| `src/pages/Index.tsx` | Bolder feature card titles |

