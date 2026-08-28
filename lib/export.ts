import type { Trade } from "@/lib/types";

/*
 * Export lives client-side deliberately: the trades are already loaded in the
 * page, so building the file in the browser avoids a round trip and keeps the
 * download working the moment the button is pressed.
 */

const COLUMNS: [keyof Trade, string][] = [
  ["date", "Date"],
  ["symbol", "Pair"],
  ["side", "Side"],
  ["session", "Session"],
  ["day", "Day"],
  ["entryTime", "Entry time"],
  ["h4Candle", "H4 candle"],
  ["playbook", "Playbook"],
  ["grade", "Grade"],
  ["result", "Result"],
  ["dailyBias", "Daily bias"],
  ["dailyAligned", "Daily aligned"],
  ["smtQuality", "SMT quality"],
  ["smtPair", "SMT pair"],
  ["sweepQuality", "Sweep quality"],
  ["entryExecution", "Entry execution"],
  ["entryModel", "Entry model"],
  ["marketCondition", "Market condition"],
  ["timeframe", "Timeframe"],
  ["entryPrice", "Entry"],
  ["stopLoss", "Stop"],
  ["takeProfit", "Target"],
  ["exitPrice", "Exit"],
  ["plannedRR", "Planned RR"],
  ["rMultiple", "Realized R"],
  ["maePrice", "Worst price"],
  ["mfePrice", "Best price"],
  ["size", "Size"],
  ["riskAmount", "Risk $"],
  ["riskPct", "Risk %"],
  ["pnl", "P&L"],
  ["durationMinutes", "Duration (min)"],
  ["confluences", "Confluences"],
  ["emotionBefore", "Emotion before"],
  ["emotionDuring", "Emotion during"],
  ["emotionAfter", "Emotion after"],
  ["confidence", "Confidence"],
  ["entryReason", "Entry reason"],
  ["exitReason", "Exit reason"],
  ["mistakes", "Mistakes"],
  ["lessons", "Lessons"],
  ["notes", "Notes"],
];

/**
 * Quotes a value for CSV. A leading =, +, - or @ is prefixed with a single
 * quote so a spreadsheet treats it as text: a note starting with "=" would
 * otherwise be run as a formula on open.
 */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = Array.isArray(value) ? value.join("; ") : String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function tradesToCsv(trades: Trade[]): string {
  const header = COLUMNS.map(([, label]) => csvCell(label)).join(",");
  const rows = trades.map((t) =>
    COLUMNS.map(([key]) => csvCell(t[key])).join(",")
  );
  return [header, ...rows].join("\r\n");
}

export function tradesToJson(trades: Trade[]): string {
  return JSON.stringify(
    { exportedAt: new Date().toISOString(), count: trades.length, trades },
    null,
    2
  );
}

/** Triggers a browser download of `content` as `filename`. */
export function downloadFile(
  filename: string,
  content: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked on the next tick so the download has started.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
