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
    <header className="flex flex-col gap-4 px-4 pb-3 pt-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:pt-8">
      <div>
        <h1 className="font-display text-[26px] font-bold leading-tight tracking-[-0.03em] text-foreground sm:text-[32px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
