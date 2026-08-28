"use server";

import { revalidatePath } from "next/cache";
import { archiveAccount, saveAccount } from "@/lib/data/accounts";
import type { SettingsFormState } from "@/lib/actions/state";

/** Reads a positive number, or null when the field is left blank. */
function optionalPositive(fd: FormData, key: string): number | null {
  const raw = String(fd.get(key) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function required(fd: FormData, key: string, fallback: number): number {
  const n = Number(String(fd.get(key) ?? "").trim());
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function saveSettings(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const id = String(formData.get("accountId") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give the account a name.", savedAt: null };

  const startingBalance = required(formData, "startingBalance", 50000);
  const riskPctAligned = required(formData, "riskPctAligned", 1);
  const riskPctUnaligned = required(formData, "riskPctUnaligned", 0.5);

  if (riskPctUnaligned > riskPctAligned) {
    return {
      error:
        "Risk on a non-aligned trade should not exceed the aligned risk — that inverts the rule.",
      savedAt: null,
    };
  }

  const maxLossesPerDay = Math.round(required(formData, "maxLossesPerDay", 2));
  if (maxLossesPerDay < 1 || maxLossesPerDay > 20) {
    return { error: "Daily loss cap must be between 1 and 20.", savedAt: null };
  }

  try {
    await saveAccount(id, {
      name,
      startingBalance,
      dailyLossLimit: optionalPositive(formData, "dailyLossLimit"),
      maxDrawdown: optionalPositive(formData, "maxDrawdown"),
      profitTarget: optionalPositive(formData, "profitTarget"),
      maxLossesPerDay,
      riskPctAligned,
      riskPctUnaligned,
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to save account.",
      savedAt: null,
    };
  }

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/analytics");
  return { error: null, savedAt: Date.now() };
}

/**
 * Archived rather than deleted: the trades logged against the account keep
 * pointing at it, so its history stays readable.
 */
export async function archiveAccountAction(formData: FormData) {
  const id = String(formData.get("accountId") ?? "").trim();
  if (!id) return;
  await archiveAccount(id);
  revalidatePath("/settings");
  revalidatePath("/");
}
