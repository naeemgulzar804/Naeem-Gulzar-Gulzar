import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-2 border-b border-border px-3 py-3 sm:flex-row sm:h-[var(--header-h)] sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-0">
      <div>
        <h1 className="font-display text-lg font-bold leading-tight tracking-[-0.03em] text-foreground sm:text-xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
