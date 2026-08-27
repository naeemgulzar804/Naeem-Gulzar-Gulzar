"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  NotebookText,
  CalendarDays,
  ListOrdered,
  TrendingUp,
  LogOut,
  BarChart3,
  Brain,
  Sparkles,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { activeHref } from "@/lib/nav";
import { logout } from "@/lib/auth/actions";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades/new", label: "New Trade", icon: Plus },
  { href: "/trades", label: "Trade Log", icon: ListOrdered },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/psychology", label: "Psychology", icon: Brain },
  { href: "/journal", label: "Journal & Playbooks", icon: NotebookText },
  { href: "/ai-coach", label: "AI Coach", icon: Sparkles },
] as const;

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const initials = email.slice(0, 2).toUpperCase();
  const current = activeHref(
    pathname,
    NAV_ITEMS.map((i) => i.href)
  );

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-primary md:flex">
      <div className="flex h-16 items-center gap-2.5 px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-on-accent">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="font-display text-lg font-semibold text-foreground">
          TradeLog
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-3" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active = current === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? "bg-accent-soft font-medium text-foreground"
                  : "font-normal text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
              )}
            >
              <Icon
                className={cn("h-4 w-4", active ? "text-accent" : "text-faint")}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <div className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-faint hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
