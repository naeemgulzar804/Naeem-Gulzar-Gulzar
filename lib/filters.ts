import type { Trade } from "@/lib/types";

/*
 * View filters live in the URL rather than a cookie: the back button then
 * works, a filtered view can be linked or bookmarked, and there is no cached
 * server state to go stale when an account is renamed.
 */

export const RANGES = {
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  ytd: "This year",
  all: "All time",
} as const;

export type RangeKey = keyof typeof RANGES;

export interface ViewFilters {
  /** Undefined means every account. */
  accountId?: string;
  range: RangeKey;
  /** Inclusive ISO date bounds derived from `range`; undefined for "all". */
  from?: string;
  to?: string;
}

export type SearchParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}

function isoDaysAgo(days: number, now: Date) {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Parses raw search params, defaulting to every account and all time. */
export function parseFilters(
  params: SearchParams | undefined,
  now = new Date()
): ViewFilters {
  const rawRange = one(params?.range);
  const range: RangeKey =
    rawRange && rawRange in RANGES ? (rawRange as RangeKey) : "all";

  const to = now.toISOString().slice(0, 10);
  const from =
    range === "30d"
      ? isoDaysAgo(30, now)
      : range === "90d"
        ? isoDaysAgo(90, now)
        : range === "ytd"
          ? `${now.getUTCFullYear()}-01-01`
          : undefined;

  return {
    accountId: one(params?.account),
    range,
    from,
    to: from ? to : undefined,
  };
}

/** Serialises filters back into a query string for links. */
export function filterQuery(f: Partial<ViewFilters>): string {
  const q = new URLSearchParams();
  if (f.accountId) q.set("account", f.accountId);
  if (f.range && f.range !== "all") q.set("range", f.range);
  const s = q.toString();
  return s ? `?${s}` : "";
}

/**
 * Client-side equivalent of the query filter, for components that already
 * hold the full trade list.
 */
export function applyFilters(trades: Trade[], f: ViewFilters): Trade[] {
  if (!f.from) return trades;
  return trades.filter((t) => t.date >= f.from! && (!f.to || t.date <= f.to));
}
