export interface TradeFormState {
  error: string | null;
}

export const initialTradeFormState: TradeFormState = { error: null };

export interface JournalFormState {
  error: string | null;
}

export const initialJournalFormState: JournalFormState = { error: null };

export interface ReviewFormState {
  error: string | null;
  /** Timestamp of the last successful save, so each one is distinguishable. */
  savedAt: number | null;
}

export const initialReviewFormState: ReviewFormState = {
  error: null,
  savedAt: null,
};

export interface DangerState {
  error: string | null;
  deleted: number | null;
}

export const initialDangerState: DangerState = { error: null, deleted: null };

export interface SettingsFormState {
  error: string | null;
  savedAt: number | null;
}

export const initialSettingsFormState: SettingsFormState = {
  error: null,
  savedAt: null,
};

export interface PropFirmActionState {
  error: string | null;
  savedAt: number | null;
}

export const initialPropFirmActionState: PropFirmActionState = {
  error: null,
  savedAt: null,
};
