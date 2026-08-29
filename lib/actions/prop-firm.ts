"use server";

import { revalidatePath } from "next/cache";
import {
  addPropEvent,
  deletePropEvent,
  promoteAccount,
} from "@/lib/data/prop-events";
import { archiveAccount } from "@/lib/data/accounts";
import type { PropEventKind } from "@/lib/types";
import type { PropFirmActionState } from "@/lib/actions/state";
import { errorMessage } from "@/lib/errors";

const KINDS: PropEventKind[] = ["payout", "cut", "purchase", "promotion"];

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function refresh() {
  revalidatePath("/prop-firm");
  revalidatePath("/");
  revalidatePath("/settings");
}

/**
 * Records a payout, a cut, or an evaluation purchase. A cut also archives the
 * account: the framework treats a cut as final — you rebuy, you don't recover
 * — and leaving it in the tier totals would overstate the pipeline.
 */
export async function logPropEvent(
  _prev: PropFirmActionState,
  formData: FormData
): Promise<PropFirmActionState> {
  const kind = str(formData, "kind") as PropEventKind;
  if (!KINDS.includes(kind)) {
    return { error: "Unknown event type.", savedAt: null };
  }

  const amountRaw = str(formData, "amount");
  const amount = amountRaw ? Number(amountRaw) : 0;
  if (!Number.isFinite(amount) || amount < 0) {
    return { error: "Amount must be zero or more.", savedAt: null };
  }

  const occurredOn = str(formData, "occurredOn") || new Date().toISOString().slice(0, 10);
  const accountId = str(formData, "accountId") || null;

  try {
    await addPropEvent({
      accountId,
      accountLabel: str(formData, "accountLabel"),
      kind,
      amount,
      occurredOn,
      note: str(formData, "note"),
    });

    if (kind === "cut" && accountId) {
      await archiveAccount(accountId);
    }
  } catch (err) {
    return {
      error: errorMessage(err, "Failed to record the event."),
      savedAt: null,
    };
  }

  refresh();
  return { error: null, savedAt: Date.now() };
}

/** Phase 1 → Phase 2, or Phase 2 → funded. Logged, so the history survives. */
export async function promoteAccountAction(
  _prev: PropFirmActionState,
  formData: FormData
): Promise<PropFirmActionState> {
  const accountId = str(formData, "accountId");
  const phase = str(formData, "phase");
  if (!accountId) return { error: "No account given.", savedAt: null };
  if (phase !== "phase2" && phase !== "funded") {
    return { error: "An account can only move up one phase at a time.", savedAt: null };
  }

  try {
    await promoteAccount(accountId, phase);
    await addPropEvent({
      accountId,
      accountLabel: str(formData, "accountLabel"),
      kind: "promotion",
      amount: 0,
      occurredOn: new Date().toISOString().slice(0, 10),
      note: phase === "funded" ? "Passed Phase 2 — now funded (T1)" : "Passed Phase 1 — now in Phase 2 (T2)",
    });
  } catch (err) {
    return {
      error: errorMessage(err, "Failed to promote the account."),
      savedAt: null,
    };
  }

  refresh();
  return { error: null, savedAt: Date.now() };
}

export async function deletePropEventAction(formData: FormData) {
  const id = String(formData.get("eventId") ?? "").trim();
  if (!id) return;
  await deletePropEvent(id);
  refresh();
}
