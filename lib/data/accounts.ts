import { createClient } from "@/lib/supabase/server";
import type { Account, AccountSettings, DrawdownBasis } from "@/lib/types";
import { DEFAULT_ACCOUNT_SETTINGS } from "@/lib/types";
import type { PropPhase } from "@/lib/prop-framework";

type Row = {
  id: string;
  name: string;
  starting_balance: number;
  daily_loss_limit: number | null;
  max_drawdown: number | null;
  profit_target: number | null;
  max_losses_per_day: number;
  risk_pct_aligned: number;
  risk_pct_unaligned: number;
  firm: string | null;
  phase: PropPhase;
  program_cost: number | null;
  cycle_start: string | null;
  current_balance: number | null;
  drawdown_basis: DrawdownBasis;
  in_framework: boolean;
};

function mapAccount(row: Row): Account {
  return {
    id: row.id,
    name: row.name,
    startingBalance: row.starting_balance,
    dailyLossLimit: row.daily_loss_limit,
    maxDrawdown: row.max_drawdown,
    profitTarget: row.profit_target,
    maxLossesPerDay: row.max_losses_per_day,
    riskPctAligned: row.risk_pct_aligned,
    riskPctUnaligned: row.risk_pct_unaligned,
    firm: row.firm ?? "",
    // Columns added in 0007: an un-migrated database returns undefined for
    // them, and the framework defaults keep the rest of the app rendering.
    phase: row.phase ?? "funded",
    programCost: row.program_cost ?? null,
    cycleStart: row.cycle_start ?? null,
    currentBalance: row.current_balance ?? null,
    drawdownBasis: row.drawdown_basis ?? "initial",
    inFramework: row.in_framework ?? true,
  };
}

/**
 * Active accounts, oldest first. Returns empty rather than throwing when the
 * table doesn't exist yet, so an un-migrated database still renders the app.
 */
export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as Row[]).map(mapAccount);
}

/**
 * The account a view should use for balances and limits.
 *
 * "All accounts" has no single balance or limit set, so it falls back to the
 * defaults: the guardrail meters then show nothing rather than summing limits
 * that belong to different prop firms, which would be meaningless.
 */
export async function getAccountSettings(
  accountId?: string | null
): Promise<AccountSettings> {
  const accounts = await getAccounts();

  if (accounts.length === 0) {
    // Pre-migration: fall back to the single-row settings table.
    const supabase = await createClient();
    const { data } = await supabase
      .from("account_settings")
      .select("*")
      .maybeSingle();
    if (!data) return DEFAULT_ACCOUNT_SETTINGS;
    return {
      startingBalance: data.starting_balance,
      dailyLossLimit: data.daily_loss_limit,
      maxDrawdown: data.max_drawdown,
      profitTarget: data.profit_target,
      maxLossesPerDay: data.max_losses_per_day,
      riskPctAligned: data.risk_pct_aligned,
      riskPctUnaligned: data.risk_pct_unaligned,
    };
  }

  if (!accountId) {
    // Every account, or none chosen: sum the balances so the equity curve
    // still starts somewhere sensible, but enforce no limits.
    if (accounts.length === 1) return accounts[0];
    return {
      ...DEFAULT_ACCOUNT_SETTINGS,
      startingBalance: accounts.reduce((s, a) => s + a.startingBalance, 0),
      dailyLossLimit: null,
      maxDrawdown: null,
      profitTarget: null,
    };
  }

  return accounts.find((a) => a.id === accountId) ?? accounts[0];
}

export async function saveAccount(
  id: string | null,
  account: Omit<Account, "id">
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const row = {
    user_id: user.id,
    name: account.name,
    starting_balance: account.startingBalance,
    daily_loss_limit: account.dailyLossLimit,
    max_drawdown: account.maxDrawdown,
    profit_target: account.profitTarget,
    max_losses_per_day: account.maxLossesPerDay,
    risk_pct_aligned: account.riskPctAligned,
    risk_pct_unaligned: account.riskPctUnaligned,
    firm: account.firm || null,
    phase: account.phase,
    program_cost: account.programCost,
    cycle_start: account.cycleStart,
    current_balance: account.currentBalance,
    drawdown_basis: account.drawdownBasis,
    in_framework: account.inFramework,
  };

  const { error } = id
    ? await supabase.from("accounts").update(row).eq("id", id)
    : await supabase.from("accounts").insert(row);

  if (error) throw error;
}

/** Archived, not deleted — the trades logged against it keep their history. */
export async function archiveAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
