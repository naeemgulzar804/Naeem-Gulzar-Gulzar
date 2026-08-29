"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  NotebookText,
  CalendarDays,
  ListOrdered,
  BarChart3,
  Brain,
  Sparkles,
  Plus,
  MoreHorizontal,
  LogOut,
  Radar,
  ClipboardList,
  Layers,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { activeHref } from "@/lib/nav";
import { logout } from "@/lib/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";

const PRIMARY = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/trades", label: "Trades", icon: ListOrdered },
  { href: "/trades/new", label: "Log", icon: Plus },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
] as const;

const SECONDARY = [
  { href: "/prop-firm", label: "Prop Firm System", icon: Layers },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/psychology", label: "Psychology", icon: Brain },
  { href: "/journal", label: "Journal & Playbooks", icon: NotebookText },
  { href: "/reviews", label: "Market Reviews", icon: ClipboardList },
  { href: "/patterns", label: "Patterns", icon: Radar },
  { href: "/ai-coach", label: "AI Coach", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

const ALL_HREFS = [...PRIMARY, ...SECONDARY].map((i) => i.href);

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const current = activeHref(pathname, ALL_HREFS);
  const moreActive = SECONDARY.some((i) => i.href === current);

  return (
    <>
      {moreOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-x-0 bottom-16 z-50 border-t border-border bg-primary p-2 md:hidden"
            style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
          >
            <div className="px-2 pb-2">
              <ThemeToggle />
            </div>
            {SECONDARY.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={current === item.href ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm font-medium",
                    current === item.href
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
            <form action={logout}>
              <button
                type="submit"
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-4 text-sm font-medium text-muted-foreground"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </>
      ) : null}

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-primary/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {PRIMARY.map((item) => {
          const active = current === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "text-accent" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          className={cn(
            "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            moreOpen || moreActive ? "text-accent" : "text-muted-foreground"
          )}
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          More
        </button>
      </nav>
    </>
  );
}
