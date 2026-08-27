"use client";

import { useState } from "react";
import Anthropic from "@anthropic-ai/sdk";
import { Brain, Sparkles } from "lucide-react";
import type { Trade } from "@/lib/types";
import { cn } from "@/lib/utils";

type Provider = "gemini" | "anthropic";

const PROVIDERS = {
  gemini: {
    label: "Google Gemini",
    badge: "Free",
    storageKey: "tradelog_gemini_key",
    keyLabel: "Google AI Studio API key",
    placeholder: "AQ.… or AIza…",
    help: "Free tier, no credit card. Get a key at aistudio.google.com/apikey.",
  },
  anthropic: {
    label: "Anthropic Claude",
    badge: "Paid",
    storageKey: "tradelog_anthropic_key",
    keyLabel: "Anthropic API key",
    placeholder: "sk-ant-api03-…",
    help: "Pay-as-you-go, needs credits. Get a key at console.anthropic.com.",
  },
} as const satisfies Record<Provider, unknown>;

const GEMINI_MODEL = "gemini-3.6-flash";

// Gemini 3.x reasons before answering, and those thinking tokens count against
// maxOutputTokens — a trivial reply already burns ~90. Leave generous headroom
// so a full eight-section analysis isn't cut off mid-thought.
const GEMINI_MAX_OUTPUT_TOKENS = 16000;

const SYSTEM_PROMPT = `You are an elite ICT/Smart Money trading coach analyzing a trader's journal.

The trader's model grades a setup on three criteria, and a trade is A+ only when all three are present:
1. Daily timeframe bias agrees with the H4 direction traded (Aligned)
2. SMT divergence on GBPUSD/DXY is Clear — not Borderline, and never Forced
3. The H4 liquidity sweep is Clean — not Borderline

3/3 = A+ at full risk. 2/3 = B-grade at half risk. 1 or fewer = no trade.
Entries are only taken at the 1/5/9 AM New York kill zones, on a retest of the 15M orderblock — entering at the engulfing candle instead is a known recurring mistake. Target is a fixed 1:3.

Weigh these against the outcomes. When a criterion correlates with losses, say so with the numbers. Do not invent patterns the data does not support, and say plainly when a sample is too small to conclude anything.

Return insights under these exact headers:

## PERFORMANCE OVERVIEW
## THE THREE CRITERIA
## EXECUTION & DISCIPLINE
## BEST ENTRY TIME
## BEST DAY TO TRADE
## PSYCHOLOGY PATTERNS
## RECURRING MISTAKES
## EXPECTANCY & EDGE
## ACTION PLAN FOR NEXT WEEK

Be data-driven and direct. Reference specific numbers from the data.`;

function summarize(trades: Trade[]) {
  return trades
    .map(
      (t, i) =>
        `T${i + 1}: ${t.symbol}|${t.date} ${t.day}|${t.session}|Bias:${t.dailyBias}|DailyAligned:${t.dailyAligned === null ? "unrecorded" : t.dailyAligned}|SMT:${t.smtQuality || "unrecorded"}${t.smtPair ? `(${t.smtPair})` : ""}|Sweep:${t.sweepQuality || "unrecorded"}|Execution:${t.entryExecution || "unrecorded"}|Cond:${t.marketCondition}|Playbook:${t.playbook}|Setup:${t.grade}|H4:${t.h4Candle}|Model:${t.entryModel}|Entry:${t.entryTime}@${t.entryPrice}|SL:${t.stopLoss}|TP:${t.takeProfit}|Risk%:${t.riskPct}|R:${t.rMultiple}|PnL:${t.pnl}|Result:${t.result}|Confluences:${t.confluences.join(",")}|Emotions:${t.emotionBefore}->${t.emotionDuring}->${t.emotionAfter}|Confidence:${t.confidence}/10|Mistakes:${t.mistakes}|Notes:${t.notes}`
    )
    .join("\n");
}

function readStoredKey(provider: Provider) {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(PROVIDERS[provider].storageKey) ?? "";
  } catch {
    // Private browsing or blocked storage — the key just won't persist.
    return "";
  }
}

async function runGemini(apiKey: string, prompt: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS },
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    const message = data?.error?.message ?? `Request failed (${res.status})`;
    if (res.status === 400 && /api key/i.test(message)) {
      throw new Error("Invalid API key — check it and try again.");
    }
    if (res.status === 429) {
      throw new Error(
        "Gemini free-tier rate limit hit. Wait a minute and retry."
      );
    }
    throw new Error(message);
  }

  const candidate = data?.candidates?.[0];
  if (candidate?.finishReason === "SAFETY") {
    throw new Error("Gemini blocked this response under its safety filters.");
  }

  // Reasoning parts carry only a thoughtSignature, so filter to real text.
  const text = (candidate?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();

  if (!text && candidate?.finishReason === "MAX_TOKENS") {
    throw new Error(
      "Gemini ran out of output budget before answering. Try again, or trim the number of trades."
    );
  }

  return text;
}

async function runAnthropic(apiKey: string, prompt: string) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim();
}

export function AICoach({ trades }: { trades: Trade[] }) {
  const [provider, setProvider] = useState<Provider>("gemini");
  // Keys are held per provider so switching tabs doesn't clobber the other one.
  const [keys, setKeys] = useState<Record<Provider, string>>(() => ({
    gemini: readStoredKey("gemini"),
    anthropic: readStoredKey("anthropic"),
  }));
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const config = PROVIDERS[provider];
  const apiKey = keys[provider];

  function saveKey(value: string) {
    setKeys((k) => ({ ...k, [provider]: value }));
    try {
      localStorage.setItem(config.storageKey, value);
    } catch {
      // Ignore: the key still works for this session.
    }
  }

  async function runAnalysis() {
    if (!apiKey.trim()) {
      setError(`Enter your ${config.label} API key first.`);
      return;
    }
    if (trades.length === 0) {
      setError("Log at least one trade before running an analysis.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis("");

    const prompt = `Analyze my trading journal:\n\n${summarize(trades)}`;

    try {
      const text =
        provider === "gemini"
          ? await runGemini(apiKey.trim(), prompt)
          : await runAnthropic(apiKey.trim(), prompt);

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
      <div className="rounded-2xl border border-border bg-card p-5">
        <div
          role="group"
          aria-label="AI provider"
          className="mb-4 flex flex-wrap gap-2"
        >
          {(Object.keys(PROVIDERS) as Provider[]).map((id) => {
            const active = provider === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setProvider(id);
                  setError("");
                }}
                aria-pressed={active}
                className={cn(
                  "flex min-h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-accent-border bg-accent-soft text-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {PROVIDERS[id].label}
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                    id === "gemini"
                      ? "bg-profit/15 text-profit"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {PROVIDERS[id].badge}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor={`key-${provider}`}
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              {config.keyLabel}
            </label>
            <input
              id={`key-${provider}`}
              type="password"
              value={apiKey}
              onChange={(e) => saveKey(e.target.value)}
              placeholder={config.placeholder}
              className="min-h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            className="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {loading ? "Analyzing…" : "Run analysis"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {config.help} Your key is stored only in this browser and sent
          directly to the provider.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-loss/10 px-4 py-3 text-sm text-loss">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p role="status" className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Reviewing {trades.length} trades…
        </p>
      ) : null}

      {analysis ? (
        <div className="rounded-2xl border border-border bg-card p-5">
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
            <h2 className="font-display text-[15px] font-bold tracking-tight text-foreground">
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
