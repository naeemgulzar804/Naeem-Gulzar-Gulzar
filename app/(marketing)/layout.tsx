import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";

/*
 * The public shell. Deliberately shares the app's tokens, faces and radii
 * rather than being a separate "marketing brand": a trader who signs up should
 * recognise the product they were shown. What changes is density — the app is
 * a dense terminal, this is given room to breathe.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Wordmark />
            <span className="sr-only">TradeLog home</span>
          </Link>

          <nav
            className="hidden items-center gap-7 md:flex"
            aria-label="Sections"
          >
            {[
              ["Features", "#features"],
              ["Pricing", "#pricing"],
              ["FAQ", "#faq"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden min-h-10 items-center rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="flex min-h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              A trading journal for people who treat it like a job.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a href="#features" className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Features
            </a>
            <a href="#pricing" className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Pricing
            </a>
            <a href="#faq" className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              FAQ
            </a>
            <Link href="/login" className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
          <p className="border-t border-border pt-6 text-xs text-faint">
            TradeLog is a journaling and analytics tool. It does not provide
            financial advice, signals, or trade recommendations. Past
            performance does not indicate future results.
          </p>
        </div>
      </footer>
    </div>
  );
}
