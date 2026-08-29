import {
  AlertTriangle,
  ArrowRight,
  CircleCheck,
  Info,
  TriangleAlert,
} from "lucide-react";
import type { Action, ActionTone } from "@/lib/prop-firm";
import { cn } from "@/lib/utils";

const TONE: Record<
  ActionTone,
  { icon: typeof Info; wrap: string; icons: string; label: string }
> = {
  critical: {
    icon: AlertTriangle,
    wrap: "border-loss/30 bg-loss/8",
    icons: "text-loss",
    label: "Do this now",
  },
  good: {
    icon: CircleCheck,
    wrap: "border-profit/30 bg-profit/8",
    icons: "text-profit",
    label: "Do this now",
  },
  warn: {
    icon: TriangleAlert,
    wrap: "border-amber-500/30 bg-amber-500/8",
    icons: "text-amber-500",
    label: "Fix before scaling",
  },
  info: {
    icon: Info,
    wrap: "border-border bg-secondary/40",
    icons: "text-muted-foreground",
    label: "Keep in mind",
  },
};

/**
 * The framework's instructions for right now, hardest first. Every item names
 * the rule it came from — guidance you can't trace back to a rule is just an
 * opinion with a coloured border.
 */
export function ActionList({
  actions,
  limit,
}: {
  actions: Action[];
  limit?: number;
}) {
  const shown = limit ? actions.slice(0, limit) : actions;
  if (shown.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing to action. Every account is inside its triggers and the tier
        ratios hold.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {shown.map((action, i) => {
        const tone = TONE[action.tone];
        const Icon = tone.icon;
        return (
          <li
            key={`${action.title}-${i}`}
            className={cn("flex gap-3 rounded-xl border px-3 py-2.5", tone.wrap)}
          >
            <Icon
              className={cn("mt-0.5 h-4 w-4 shrink-0", tone.icons)}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {action.title}
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                {action.detail}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-faint">
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
                {action.rule}
              </p>
            </div>
          </li>
        );
      })}
      {limit && actions.length > limit ? (
        <li className="px-1 text-xs text-faint">
          + {actions.length - limit} more below.
        </li>
      ) : null}
    </ul>
  );
}
