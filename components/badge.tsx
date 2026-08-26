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
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        tone === "profit" && "bg-profit/15 text-profit",
        tone === "loss" && "bg-loss/15 text-loss",
        tone === "neutral" && "bg-secondary text-muted-foreground",
        tone === "accent" && "bg-ring/15 text-ring",
        className
      )}
    >
      {children}
    </span>
  );
}
