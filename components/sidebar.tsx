"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  NotebookText,
  CalendarDays,
  ListOrdered,
  LogOut,
  BarChart3,
  Brain,
  Sparkles,
  Plus,
  Radar,
  ClipboardList,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { activeHref } from "@/lib/nav";
import { logout } from "@/lib/auth/actions";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades/new", label: "New Trade", icon: Plus },
  { href: "/trades", label: "Trade Log", icon: ListOrdered },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/psychology", label: "Psychology", icon: Brain },
  { href: "/journal", label: "Journal & Playbooks", icon: NotebookText },
  { href: "/reviews", label: "Market Reviews", icon: ClipboardList },
  { href: "/patterns", label: "Patterns", icon: Radar },
  { href: "/ai-coach", label: "AI Coach", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const initials = email.slice(0, 2).toUpperCase();
  const current = activeHref(
    pathname,
    NAV_ITEMS.map((i) => i.href)
  );

  return (
    <aside className="hidden w-[var(--sidebar-w)] shrink-0 flex-col border-r border-border bg-primary md:flex">
      <div className="flex h-[var(--header-h)] items-center gap-2.5 px-4">
        <Wordmark />
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-2" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active = current === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
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

      <div className="space-y-1.5 p-2">
        <ThemeToggle />
        <div className="flex items-center gap-2.5 rounded-lg bg-card px-2.5 py-2">
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
              className="flex h-11 w-11 items-center justify-center rounded-lg text-faint hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:h-8 lg:w-8"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
