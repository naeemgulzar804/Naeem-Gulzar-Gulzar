"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CalendarRange, Wallet } from "lucide-react";
import type { Account } from "@/lib/types";
import { RANGES, type RangeKey } from "@/lib/filters";

const selectCls =
  "min-h-11 appearance-none rounded-lg border border-border bg-card py-1 pl-7 pr-6 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:min-h-9";

/**
 * Account and date-range pickers, writing to the URL so every page below
 * reads the same filters from its own searchParams. Kept as one control so
 * the two can't disagree about which view you're looking at.
 */
export function ViewFilters({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const q = next.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  }

  const account = params.get("account") ?? "";
  const range = (params.get("range") ?? "all") as RangeKey;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {accounts.length > 1 ? (
        <span className="relative flex items-center">
          <Wallet
            className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-faint"
            aria-hidden="true"
          />
          <select
            aria-label="Account"
            value={account}
            onChange={(e) => set("account", e.target.value)}
            className={selectCls}
          >
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </span>
      ) : null}

      <span className="relative flex items-center">
        <CalendarRange
          className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-faint"
          aria-hidden="true"
        />
        <select
          aria-label="Date range"
          value={range}
          onChange={(e) => set("range", e.target.value)}
          className={selectCls}
        >
          {Object.entries(RANGES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </span>
    </div>
  );
}
