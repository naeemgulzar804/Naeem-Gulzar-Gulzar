// Hand-written to match supabase/migrations/*.sql.
// If the schema changes, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > lib/supabase/types.ts

export type TradeSide = "long" | "short";
export type TradeGrade = "A+" | "A" | "B" | "C";
export type TradeResult = "Win" | "Loss" | "Break Even";
export type JournalMood = "confident" | "neutral" | "frustrated" | "disciplined";

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

  entry_price: number | null;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  planned_rr: number | null;
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

  entry_price?: number | null;
  exit_price?: number | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  planned_rr?: number | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
