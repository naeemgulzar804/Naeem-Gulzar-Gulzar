/*
 * Reading an error out of Supabase.
 *
 * `err instanceof Error` is not safe here. postgrest-js returns plain object
 * literals for several failure paths — `{ message: body }` and
 * `{ code: "PGRST116", ... }` among them — so an `instanceof` check is false
 * and a generic fallback ends up swallowing the only text that says what
 * actually went wrong. "Failed to save account." is not a diagnosis.
 */

interface SupabaseLikeError {
  message?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
}

function asRecord(err: unknown): SupabaseLikeError | null {
  return typeof err === "object" && err !== null ? (err as SupabaseLikeError) : null;
}

/**
 * PostgREST and Postgres codes that all mean the same thing to a user: the
 * database does not have the shape the app expects, because a migration has
 * not been applied.
 *
 * - PGRST205 / 42P01 — the table is missing.
 * - PGRST204 / 42703 — the column is missing.
 */
const MISSING_SCHEMA_CODES = new Set([
  "PGRST205",
  "PGRST204",
  "42P01",
  "42703",
]);

const MIGRATION_HINT =
  "Your database is missing a migration — apply the files in supabase/migrations in order, then try again.";

/**
 * The most useful message available for an unknown thrown value, with the
 * migration hint appended when the cause is a missing table or column.
 */
export function errorMessage(err: unknown, fallback: string): string {
  const record = asRecord(err);
  const raw =
    typeof record?.message === "string" && record.message.trim()
      ? record.message.trim()
      : typeof err === "string" && err.trim()
        ? err.trim()
        : "";

  const code = typeof record?.code === "string" ? record.code : "";
  const looksLikeMissingSchema =
    MISSING_SCHEMA_CODES.has(code) ||
    /schema cache|does not exist/i.test(raw);

  if (!raw) return looksLikeMissingSchema ? `${fallback} ${MIGRATION_HINT}` : fallback;
  return looksLikeMissingSchema ? `${raw}. ${MIGRATION_HINT}` : raw;
}
