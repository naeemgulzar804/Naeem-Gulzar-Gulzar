"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { Badge } from "@/components/badge";
import { signScreenshot } from "@/lib/storage";
import type { Trade } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const SLOTS = [
  { key: "screenshotDailyPath", label: "Daily Chart", tf: "D" },
  { key: "screenshotH4Path", label: "H4 Chart", tf: "H4" },
  { key: "screenshot15mPath", label: "15 Min Entry", tf: "15M" },
] as const;

export function chartCount(t: Trade) {
  return [t.screenshotDailyPath, t.screenshotH4Path, t.screenshot15mPath].filter(
    Boolean
  ).length;
}

export function ChartReviewPanel({
  trades,
  index,
  onClose,
  onNavigate,
}: {
  trades: Trade[];
  index: number;
  onClose: () => void;
  onNavigate: (delta: number) => void;
}) {
  const trade = trades[index];
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const [fullscreen, setFullscreen] = useState<{ src: string; label: string } | null>(
    null
  );

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullscreen) setFullscreen(null);
        else onClose();
      }
      if (!fullscreen && e.key === "ArrowLeft") onNavigate(-1);
      if (!fullscreen && e.key === "ArrowRight") onNavigate(1);
    },
    [fullscreen, onClose, onNavigate]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        SLOTS.map(async ({ key }) => {
          const path = trade?.[key];
          if (!path) return [key, null] as const;
          return [key, await signScreenshot(path)] as const;
        })
      );
      if (!cancelled) setUrls(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [trade]);

  if (!trade) return null;
  const hasAny = chartCount(trade) > 0;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label="Chart review"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-primary shadow-2xl"
      >
        <header className="border-b border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Chart Review</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chart review"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 rounded-lg border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-bold text-foreground">{trade.symbol}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {trade.date} · {trade.day}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                <Badge
                  tone={
                    trade.result === "Win"
                      ? "profit"
                      : trade.result === "Loss"
                        ? "loss"
                        : "neutral"
                  }
                >
                  {trade.result}
                </Badge>
                <Badge tone={trade.grade === "A+" ? "accent" : "neutral"}>
                  {trade.grade}
                </Badge>
                <Badge tone={trade.pnl >= 0 ? "profit" : "loss"}>
                  {trade.pnl >= 0 ? "+" : ""}
                  {formatCurrency(trade.pnl)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={index <= 0}
              onClick={() => onNavigate(-1)}
              className="flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" /> Prev
            </button>
            <span className="min-w-14 text-center text-xs text-muted-foreground">
              {index + 1}/{trades.length}
            </span>
            <button
              type="button"
              disabled={index >= trades.length - 1}
              onClick={() => onNavigate(1)}
              className="flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Next <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {!hasAny ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No screenshots uploaded for this trade.
            </p>
          ) : (
            SLOTS.map(({ key, label, tf }) => {
              const url = urls[key];
              return (
                <div
                  key={key}
                  className="overflow-hidden rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                        {tf}
                      </span>
                      {label}
                    </span>
                    {url ? (
                      <button
                        type="button"
                        onClick={() =>
                          setFullscreen({ src: url, label: `${trade.symbol} — ${label}` })
                        }
                        aria-label={`View ${label} fullscreen`}
                        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={`${trade.symbol} ${label}`}
                      onClick={() =>
                        setFullscreen({ src: url, label: `${trade.symbol} — ${label}` })
                      }
                      className="w-full cursor-zoom-in"
                    />
                  ) : (
                    <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                      No {tf} screenshot
                    </p>
                  )}
                </div>
              );
            })
          )}

          {trade.confluences.length > 0 ? (
            <Section title="Confluences">
              <div className="flex flex-wrap gap-1.5">
                {trade.confluences.map((c) => (
                  <Badge key={c} tone="profit">
                    {c}
                  </Badge>
                ))}
              </div>
            </Section>
          ) : null}

          {trade.emotionBefore || trade.emotionDuring || trade.emotionAfter ? (
            <Section title="Psychology">
              <div className="flex gap-4">
                {(
                  [
                    ["Before", trade.emotionBefore],
                    ["During", trade.emotionDuring],
                    ["After", trade.emotionAfter],
                  ] as const
                )
                  .filter(([, v]) => v)
                  .map(([label, v]) => (
                    <div key={label} className="text-center">
                      <p className="mb-1 text-[10px] text-muted-foreground">{label}</p>
                      <Badge tone="neutral">{v}</Badge>
                    </div>
                  ))}
              </div>
              {trade.confidence ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Confidence:{" "}
                  <span className="font-mono text-foreground">
                    {trade.confidence}/10
                  </span>
                </p>
              ) : null}
            </Section>
          ) : null}

          {trade.notes ? (
            <Section title="Notes">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {trade.notes}
              </p>
            </Section>
          ) : null}
        </div>
      </aside>

      {fullscreen ? (
        <div
          className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-black/95 p-6"
          onClick={() => setFullscreen(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullscreen.src}
            alt={fullscreen.label}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[92vw] cursor-default rounded-lg"
          />
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-md bg-black/70 px-3 py-1.5 text-xs text-muted-foreground">
            {fullscreen.label}
          </p>
          <button
            type="button"
            onClick={() => setFullscreen(null)}
            className="absolute right-5 top-5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Close
          </button>
        </div>
      ) : null}
    </>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-3", className)}>
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}
