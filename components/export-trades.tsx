"use client";

import { useState } from "react";
import { Download, FileJson, Sheet } from "lucide-react";
import type { Trade } from "@/lib/types";
import { downloadFile, tradesToCsv, tradesToJson } from "@/lib/export";

export function ExportTrades({ trades }: { trades: Trade[] }) {
  const [done, setDone] = useState<string | null>(null);

  function stamp() {
    return new Date().toISOString().slice(0, 10);
  }

  function exportCsv() {
    downloadFile(`tradelog-${stamp()}.csv`, tradesToCsv(trades), "text/csv");
    setDone("CSV downloaded.");
  }

  function exportJson() {
    downloadFile(
      `tradelog-${stamp()}.json`,
      tradesToJson(trades),
      "application/json"
    );
    setDone("JSON downloaded.");
  }

  const disabled = trades.length === 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Download className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-bold tracking-tight text-foreground">
            Export your trades
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {disabled
              ? "Nothing to export yet."
              : `All ${trades.length} trades with every field. CSV opens in Excel or Sheets; JSON is the exact data, for a backup you can re-import later.`}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportCsv}
              disabled={disabled}
              className="flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sheet className="h-4 w-4" aria-hidden="true" />
              CSV
            </button>
            <button
              type="button"
              onClick={exportJson}
              disabled={disabled}
              className="flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileJson className="h-4 w-4" aria-hidden="true" />
              JSON
            </button>
          </div>

          {done ? (
            <p role="status" className="mt-3 text-sm text-profit">
              {done}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
