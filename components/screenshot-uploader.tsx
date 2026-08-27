"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Zap, Loader2, X } from "lucide-react";
import {
  removeScreenshot,
  signScreenshot,
  uploadScreenshot,
  type ScreenshotSlot,
} from "@/lib/storage";
import { cn } from "@/lib/utils";

export interface ScreenshotPaths {
  daily: string | null;
  h4: string | null;
  "15m": string | null;
}

const SLOTS: {
  slot: ScreenshotSlot;
  label: string;
  tf: string;
  icon: typeof Calendar;
}[] = [
  { slot: "daily", label: "Daily", tf: "D", icon: Calendar },
  { slot: "h4", label: "H4", tf: "H4", icon: Clock },
  { slot: "15m", label: "15 Min", tf: "15M", icon: Zap },
];

export function ScreenshotUploader({
  paths,
  onChange,
}: {
  paths: ScreenshotPaths;
  onChange: (slot: ScreenshotSlot, path: string | null) => void;
}) {
  const [previews, setPreviews] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState<ScreenshotSlot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        SLOTS.map(async ({ slot }) => {
          const path = paths[slot];
          if (!path) return [slot, null] as const;
          return [slot, await signScreenshot(path)] as const;
        })
      );
      if (!cancelled) setPreviews(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [paths]);

  async function handleFile(slot: ScreenshotSlot, file: File) {
    setBusy(slot);
    setError(null);
    try {
      const existing = paths[slot];
      const path = await uploadScreenshot(slot, file);
      onChange(slot, path);
      if (existing) await removeScreenshot(existing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove(slot: ScreenshotSlot) {
    const existing = paths[slot];
    onChange(slot, null);
    if (existing) await removeScreenshot(existing);
  }

  function onPaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith("image/")
    );
    if (!item) return;
    const emptySlot = SLOTS.find(({ slot }) => !paths[slot]);
    if (!emptySlot) return;
    const file = item.getAsFile();
    if (file) handleFile(emptySlot.slot, file);
  }

  const uploaded = SLOTS.filter(({ slot }) => paths[slot]).length;

  return (
    <div onPaste={onPaste}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SLOTS.map(({ slot, label, tf, icon: Icon }) => {
          const preview = previews[slot];
          const isBusy = busy === slot;
          return (
            <div
              key={slot}
              className={cn(
                "relative flex min-h-32 items-center justify-center overflow-hidden rounded-xl border transition-colors",
                paths[slot]
                  ? "border-border bg-card"
                  : "border-dashed border-border bg-card/40 hover:border-ring/60"
              )}
            >
              {isBusy ? (
                <Loader2
                  className="h-5 w-5 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
              ) : paths[slot] ? (
                <>
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt={`${label} chart`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {label} uploaded
                    </span>
                  )}
                  <span className="absolute left-2 top-2 rounded bg-ring px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                    {tf}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(slot)}
                    aria-label={`Remove ${label} screenshot`}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-background/80 text-muted-foreground hover:bg-loss/20 hover:text-loss focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </>
              ) : (
                <div className="pointer-events-none flex flex-col items-center gap-1.5 text-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Click or paste
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                aria-label={`Upload ${label} screenshot`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(slot, file);
                  e.target.value = "";
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Ctrl+V pastes into the next empty slot</span>
        <span>{uploaded}/3 uploaded</span>
      </div>

      {error ? (
        <p role="alert" className="mt-2 rounded-lg bg-loss/10 px-3 py-2 text-sm text-loss">
          {error}
        </p>
      ) : null}
    </div>
  );
}
