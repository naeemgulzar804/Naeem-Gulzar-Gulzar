import { Sparkles } from "lucide-react";
import { seedDemoData } from "@/lib/actions/seed";

export function SeedDemoButton() {
  return (
    <form action={seedDemoData}>
      <button
        type="submit"
        className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        Load demo data
      </button>
    </form>
  );
}
