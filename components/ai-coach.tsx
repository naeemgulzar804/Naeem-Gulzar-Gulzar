"use client";

import { useState } from "react";
import Anthropic from "@anthropic-ai/sdk";
import { Brain, Sparkles } from "lucide-react";
import type { Trade } from "@/lib/types";

const KEY_STORAGE = "tradelog_anthropic_key";

const SYSTEM_PROMPT = `You are an elite ICT/Smart Money trading coach analyzing a trader's journal. Return insights under these exact headers:

## PERFORMANCE OVERVIEW
## HIGHEST PROBABILITY SETUP
## BEST ENTRY TIME
## BEST DAY TO TRADE
## PSYCHOLOGY PATTERNS
## RECURRING MISTAKES
## EXPECTANCY & EDGE
## ACTION PLAN FOR NEXT WEEK

Be data-driven and direct. Reference specific numbers and patterns from the data.`;

function summarize(trades: Trade[]) {
  return trades
    .map(
      (t, i) =>
        `T${i + 1}: ${t.symbol}|${t.date} ${t.day}|${t.session}|Bias:${t.dailyBias}|Cond:${t.marketCondition}|Playbook:${t.playbook}|Setup:${t.grade}|H4:${t.h4Candle}|Purge:${t.liquidityPurge}|Model:${t.entryModel}|Entry:${t.entryTime}@${t.entryPrice}|SL:${t.stopLoss}|TP:${t.takeProfit}|R:${t.rMultiple}|PnL:${t.pnl}|Result:${t.result}|Confluences:${t.confluences.join(",")}|Emotions:${t.emotionBefore}->${t.emotionDuring}->${t.emotionAfter}|Confidence:${t.confidence}/10|Mistakes:${t.mistakes}|Notes:${t.notes}`
    )
    .join("\n");
}

export function AICoach({ trades }: { trades: Trade[] }) {
  // Read on first render rather than in an effect; the input is uncontrolled
  // until the user types, so there's no hydration text to mismatch.
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(KEY_STORAGE) ?? "";
    } catch {
      // Private browsing or blocked storage — the key just won't persist.
      return "";
    }
  });
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function saveKey(value: string) {
    setApiKey(value);
    try {
      localStorage.setItem(KEY_STORAGE, value);
    } catch {
      // Ignore: the key still works for this session.
    }
  }

  async function runAnalysis() {
    if (!apiKey.trim()) {
      setError("Enter your Anthropic API key first.");
      return;
    }
    if (trades.length === 0) {
      setError("Log at least one trade before running an analysis.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis("");

    try {
      const client = new Anthropic({
        apiKey: apiKey.trim(),
        dangerouslyAllowBrowser: true,
      });

      const response = await client.messages.create({
        model: "claude-opus-5",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Analyze my trading journal:\n\n${summarize(trades)}`,
          },
        ],
      });

      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("\n");

      setAnalysis(text || "No response returned.");
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) {
        setError("Invalid API key — check it and try again.");
      } else if (err instanceof Anthropic.RateLimitError) {
        setError("Rate limited by the API. Wait a moment and retry.");
      } else if (err instanceof Anthropic.APIError) {
        setError(`API error ${err.status}: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="anthropic-key"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Anthropic API key
            </label>
            <input
              id="anthropic-key"
              type="password"
              value={apiKey}
              onChange={(e) => saveKey(e.target.value)}
              placeholder="sk-ant-api03-…"
              className="min-h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            className="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-profit px-4 text-sm font-semibold text-profit-foreground hover:bg-profit/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {loading ? "Analyzing…" : "Run analysis"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Your key is stored only in this browser and sent directly to Anthropic.
          Get one at console.anthropic.com.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-loss/10 px-4 py-3 text-sm text-loss">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p role="status" className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Reviewing {trades.length} trades…
        </p>
      ) : null}

      {analysis ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
            {analysis}
          </pre>
        </div>
      ) : !error && !loading ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Brain className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              AI strategy coach
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your API key and run an analysis to get ICT/SMC coaching based
              on your own logged trades.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
