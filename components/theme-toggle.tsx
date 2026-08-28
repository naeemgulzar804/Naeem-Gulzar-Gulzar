"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "tradelog_theme";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/**
 * "system" removes the attribute entirely so the prefers-color-scheme media
 * query in globals.css takes over; an explicit choice stamps the attribute so
 * it wins regardless of the OS setting.
 */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

/*
 * The stored choice lives in localStorage, which is an external store: the
 * server cannot read it and guessing would flash the wrong highlight. Reading
 * it through useSyncExternalStore gives a null server snapshot and the real
 * value straight after hydration, with no mismatch and no state-setting
 * effect. The `storage` event keeps two open tabs in agreement; the local
 * listener set covers the sidebar and mobile-nav copies of this control in
 * the same tab.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readStoredTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // Blocked storage — fall back to following the system.
  }
  return "system";
}

/** Null on the server and in the very first client render. */
const noStoredTheme = (): Theme | null => null;

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    readStoredTheme,
    noStoredTheme
  );

  const choose = useCallback((next: Theme) => {
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Choice still applies for this page view.
    }
    for (const notify of listeners) notify();
  }, []);

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="flex items-center gap-0.5 rounded-lg bg-secondary p-1"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => choose(value)}
            aria-label={label}
            aria-pressed={theme === null ? undefined : active}
            title={label}
            className={cn(
              "flex h-9 flex-1 items-center justify-center rounded-lg lg:h-7",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-faint hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Runs before first paint to stamp the stored theme, so a dark-mode user never
 * sees a white flash while React hydrates.
 */
export const THEME_INIT_SCRIPT = `
(function(){try{
var t=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}
}catch(e){}})();
`;
