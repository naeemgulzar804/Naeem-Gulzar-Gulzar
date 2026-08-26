import { PageHeader } from "@/components/page-header";
import { PlaybookCard } from "@/components/playbook-card";
import { JournalEntryCard } from "@/components/journal-entry-card";
import { JOURNAL_ENTRIES, PLAYBOOKS, TRADES } from "@/lib/mock-data";

export const metadata = { title: "Journal & Playbooks — TradeLog" };

export default function JournalPage() {
  const sortedEntries = [...JOURNAL_ENTRIES].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return (
    <>
      <PageHeader
        title="Journal & Playbooks"
        description="Strategy rules and daily reflections, side by side."
      />
      <div className="flex-1 space-y-10 px-4 py-6 sm:px-8">
        <section aria-labelledby="playbooks-heading">
          <h2
            id="playbooks-heading"
            className="mb-4 text-sm font-semibold text-foreground"
          >
            Playbooks
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {PLAYBOOKS.map((playbook) => (
              <PlaybookCard
                key={playbook.id}
                playbook={playbook}
                trades={TRADES.filter((t) => t.playbook === playbook.name)}
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="journal-heading">
          <h2
            id="journal-heading"
            className="mb-4 text-sm font-semibold text-foreground"
          >
            Daily journal
          </h2>
          <div className="space-y-4">
            {sortedEntries.map((entry) => (
              <JournalEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
