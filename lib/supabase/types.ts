// Hand-written to match supabase/migrations/0001_init.sql.
// If the schema changes, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > lib/supabase/types.ts

export type TradeSide = "long" | "short";
export type TradeGrade = "A+" | "B";
export type JournalMood = "confident" | "neutral" | "frustrated" | "disciplined";

export interface Database {
  public: {
    Tables: {
      trades: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          symbol: string;
          side: TradeSide;
          playbook: string | null;
          grade: TradeGrade | null;
          entry_price: number | null;
          exit_price: number | null;
          size: number | null;
          risk_amount: number | null;
          r_multiple: number | null;
          pnl: number;
          duration_minutes: number | null;
          tags: string[];
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          date: string;
          symbol: string;
          side: TradeSide;
          playbook?: string | null;
          grade?: TradeGrade | null;
          entry_price?: number | null;
          exit_price?: number | null;
          size?: number | null;
          risk_amount?: number | null;
          r_multiple?: number | null;
          pnl: number;
          duration_minutes?: number | null;
          tags?: string[];
          notes?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["trades"]["Insert"]>;
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
