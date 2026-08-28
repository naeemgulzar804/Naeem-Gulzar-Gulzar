import { PageHeader } from "@/components/page-header";
import { PlaybookCard } from "@/components/playbook-card";
import { JournalEntryCard } from "@/components/journal-entry-card";
import { NewJournalEntryForm } from "@/components/new-journal-entry-form";
import { getTrades } from "@/lib/data/trades";
import { getPlaybooks } from "@/lib/data/playbooks";
import { getJournalEntries } from "@/lib/data/journal";

export const metadata = { title: "Journal & Playbooks — TradeLog" };

export default async function JournalPage() {
  const [trades, playbooks, journalEntries] = await Promise.all([
    getTrades(),
    getPlaybooks(),
    getJournalEntries(),
  ]);

  return (
    <>
      <PageHeader
        title="Journal & Playbooks"
        description="Strategy rules and daily reflections, side by side."
      />
      <div className="page">
        <section aria-labelledby="playbooks-heading">
          <h2
            id="playbooks-heading"
            className="mb-3 font-display text-[13px] font-bold tracking-tight text-foreground"
          >
            Playbooks
          </h2>
          {playbooks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No playbooks yet.
            </p>
          ) : (
            <div className="grid-dense grid-cols-1 lg:grid-cols-2">
              {playbooks.map((playbook) => (
                <PlaybookCard
                  key={playbook.id}
                  playbook={playbook}
                  trades={trades.filter((t) => t.playbook === playbook.name)}
                />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="journal-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="journal-heading" className="font-display text-[13px] font-bold tracking-tight text-foreground">
              Daily journal
            </h2>
          </div>
          <div className="space-y-4">
            <NewJournalEntryForm trades={trades} />
            {journalEntries.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No journal entries yet.
              </p>
            ) : (
              journalEntries.map((entry) => (
                <JournalEntryCard key={entry.id} entry={entry} trades={trades} />
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
