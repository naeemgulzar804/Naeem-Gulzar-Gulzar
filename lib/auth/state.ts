export interface AuthState {
  error: string | null;
  message: string | null;
}

export const initialAuthState: AuthState = { error: null, message: null };
