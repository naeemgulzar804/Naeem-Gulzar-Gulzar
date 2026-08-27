import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "profit" | "loss" | "neutral" | "accent";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        tone === "profit" && "bg-profit/12 text-profit",
        tone === "loss" && "bg-loss/12 text-loss",
        tone === "neutral" && "bg-secondary text-muted-foreground",
        tone === "accent" && "bg-accent-soft text-accent",
        className
      )}
    >
      {children}
    </span>
  );
}
