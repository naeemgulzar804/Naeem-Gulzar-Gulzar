import { createClient } from "@/lib/supabase/server";
import type { AccountSettings } from "@/lib/types";
import { DEFAULT_ACCOUNT_SETTINGS } from "@/lib/types";

/**
 * Account settings are created lazily: a user who never opens the settings
 * page has no row, and gets the defaults. Missing table or row both fall back
 * rather than throwing, so an un-migrated database still renders the app.
 */
export async function getAccountSettings(): Promise<AccountSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("account_settings")
    .select("*")
    .maybeSingle();

  if (error || !data) return DEFAULT_ACCOUNT_SETTINGS;

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

export async function saveAccountSettings(settings: AccountSettings) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("account_settings").upsert(
    {
      user_id: user.id,
      starting_balance: settings.startingBalance,
      daily_loss_limit: settings.dailyLossLimit,
      max_drawdown: settings.maxDrawdown,
      profit_target: settings.profitTarget,
      max_losses_per_day: settings.maxLossesPerDay,
      risk_pct_aligned: settings.riskPctAligned,
      risk_pct_unaligned: settings.riskPctUnaligned,
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}
