// Hand-written to match supabase/migrations/*.sql.
// If the schema changes, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > lib/supabase/types.ts

export type TradeSide = "long" | "short";
export type TradeGrade = "A+" | "A" | "B" | "C";
export type TradeResult = "Win" | "Loss" | "Break Even";
export type JournalMood = "confident" | "neutral" | "frustrated" | "disciplined";
export type SmtQuality = "Clear" | "Borderline" | "Forced" | "None";
export type SmtPair = "GBPUSD" | "DXY" | "Both" | "None";
export type SweepQuality = "Clean" | "Borderline" | "None";
export type PropPhase = "phase1" | "phase2" | "funded";
export type DrawdownBasis = "initial" | "peak";
export type PropEventKind = "payout" | "cut" | "purchase" | "promotion";
export type EntryExecution =
  | "OB retest"
  | "Early — engulfing candle"
  | "Late — chased after retest"
  | "Other";

type TradeRow = {
  id: string;
  user_id: string;
  date: string;
  symbol: string;
  side: TradeSide;
  playbook: string | null;
  grade: TradeGrade | null;
  result: TradeResult | null;

  session: string | null;
  timeframe: string | null;
  daily_bias: string | null;
  market_condition: string | null;
  h4_candle: string | null;
  liquidity_purge: boolean | null;
  entry_model: string | null;
  entry_time: string | null;

  daily_aligned: boolean | null;
  smt_quality: SmtQuality | null;
  smt_pair: SmtPair | null;
  sweep_quality: SweepQuality | null;
  entry_execution: EntryExecution | null;

  entry_price: number | null;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  planned_rr: number | null;
  mae_price: number | null;
  mfe_price: number | null;
  account_id: string | null;
  size: number | null;
  risk_amount: number | null;
  risk_pct: number | null;
  r_multiple: number | null;
  pnl: number;
  duration_minutes: number | null;

  confluences: string[];

  emotion_before: string | null;
  emotion_during: string | null;
  emotion_after: string | null;
  confidence: number | null;

  entry_reason: string | null;
  exit_reason: string | null;
  mistakes: string | null;
  lessons: string | null;
  notes: string;
  tags: string[];

  screenshot_daily_path: string | null;
  screenshot_h4_path: string | null;
  screenshot_15m_path: string | null;

  created_at: string;
};

type TradeInsert = {
  id?: string;
  user_id?: string;
  date: string;
  symbol: string;
  side: TradeSide;
  playbook?: string | null;
  grade?: TradeGrade | null;
  result?: TradeResult | null;

  session?: string | null;
  timeframe?: string | null;
  daily_bias?: string | null;
  market_condition?: string | null;
  h4_candle?: string | null;
  liquidity_purge?: boolean | null;
  entry_model?: string | null;
  entry_time?: string | null;

  daily_aligned?: boolean | null;
  smt_quality?: SmtQuality | null;
  smt_pair?: SmtPair | null;
  sweep_quality?: SweepQuality | null;
  entry_execution?: EntryExecution | null;

  entry_price?: number | null;
  exit_price?: number | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  planned_rr?: number | null;
  mae_price?: number | null;
  mfe_price?: number | null;
  account_id?: string | null;
  size?: number | null;
  risk_amount?: number | null;
  risk_pct?: number | null;
  r_multiple?: number | null;
  pnl: number;
  duration_minutes?: number | null;

  confluences?: string[];

  emotion_before?: string | null;
  emotion_during?: string | null;
  emotion_after?: string | null;
  confidence?: number | null;

  entry_reason?: string | null;
  exit_reason?: string | null;
  mistakes?: string | null;
  lessons?: string | null;
  notes?: string;
  tags?: string[];

  screenshot_daily_path?: string | null;
  screenshot_h4_path?: string | null;
  screenshot_15m_path?: string | null;

  created_at?: string;
};

export interface Database {
  public: {
    Tables: {
      trades: {
        Row: TradeRow;
        Insert: TradeInsert;
        Update: Partial<TradeInsert>;
        Relationships: [];
      };
      playbooks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          summary: string | null;
          rules: string[];
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          summary?: string | null;
          rules?: string[];
          tags?: string[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["playbooks"]["Insert"]>;
        Relationships: [];
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          title: string;
          mood: JournalMood | null;
          content: string | null;
          linked_trade_ids: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          date: string;
          title: string;
          mood?: JournalMood | null;
          content?: string | null;
          linked_trade_ids?: string[];
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["journal_entries"]["Insert"]
        >;
        Relationships: [];
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
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
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          starting_balance?: number;
          daily_loss_limit?: number | null;
          max_drawdown?: number | null;
          profit_target?: number | null;
          max_losses_per_day?: number;
          risk_pct_aligned?: number;
          risk_pct_unaligned?: number;
          firm?: string | null;
          phase?: PropPhase;
          program_cost?: number | null;
          cycle_start?: string | null;
          current_balance?: number | null;
          drawdown_basis?: DrawdownBasis;
          in_framework?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["accounts"]["Insert"]>;
        Relationships: [];
      };
      account_settings: {
        Row: {
          user_id: string;
          starting_balance: number;
          daily_loss_limit: number | null;
          max_drawdown: number | null;
          profit_target: number | null;
          max_losses_per_day: number;
          risk_pct_aligned: number;
          risk_pct_unaligned: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id?: string;
          starting_balance?: number;
          daily_loss_limit?: number | null;
          max_drawdown?: number | null;
          profit_target?: number | null;
          max_losses_per_day?: number;
          risk_pct_aligned?: number;
          risk_pct_unaligned?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["account_settings"]["Insert"]
        >;
        Relationships: [];
      };
      prop_events: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          account_label: string | null;
          kind: PropEventKind;
          amount: number;
          occurred_on: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          account_id?: string | null;
          account_label?: string | null;
          kind: PropEventKind;
          amount?: number;
          occurred_on?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["prop_events"]["Insert"]>;
        Relationships: [];
      };
      market_reviews: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          kind: "pre" | "post";
          bias: string | null;
          watchlist: string[];
          key_levels: string | null;
          news_events: string | null;
          plan: string | null;
          mental_state: string | null;
          risk_plan: string | null;
          followed_plan: string | null;
          what_went_well: string | null;
          what_went_wrong: string | null;
          lessons: string | null;
          discipline_rating: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          date: string;
          kind: "pre" | "post";
          bias?: string | null;
          watchlist?: string[];
          key_levels?: string | null;
          news_events?: string | null;
          plan?: string | null;
          mental_state?: string | null;
          risk_plan?: string | null;
          followed_plan?: string | null;
          what_went_well?: string | null;
          what_went_wrong?: string | null;
          lessons?: string | null;
          discipline_rating?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["market_reviews"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
