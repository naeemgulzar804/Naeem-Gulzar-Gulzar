"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { addJournalEntry } from "@/lib/actions/journal";
import { initialJournalFormState } from "@/lib/actions/state";

const MOODS = ["disciplined", "confident", "neutral", "frustrated"] as const;

export function NewJournalEntryForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    addJournalEntry,
    initialJournalFormState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        New entry
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[15px] font-bold tracking-tight text-foreground">New journal entry</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="je-date" className="mb-1 block text-xs font-medium text-muted-foreground">
            Date
          </label>
          <input
            id="je-date"
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="min-h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="je-mood" className="mb-1 block text-xs font-medium text-muted-foreground">
            Mood
          </label>
          <select
            id="je-mood"
            name="mood"
            defaultValue="neutral"
            className="min-h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm capitalize text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {MOODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="je-title" className="mb-1 block text-xs font-medium text-muted-foreground">
          Title
        </label>
        <input
          id="je-title"
          name="title"
          type="text"
          required
          placeholder="e.g. Patient on the London sweep"
          className="min-h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="je-content" className="mb-1 block text-xs font-medium text-muted-foreground">
          Reflection
        </label>
        <textarea
          id="je-content"
          name="content"
          rows={3}
          placeholder="What happened, what you'd repeat, what you'd change..."
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {state.error ? (
        <p role="alert" className="rounded-lg bg-loss/10 px-3 py-2 text-sm text-loss">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save entry"}
      </button>
    </form>
  );
}
