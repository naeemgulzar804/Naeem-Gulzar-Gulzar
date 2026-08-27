"use client";

import { useActionState } from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import type { AuthState } from "@/lib/auth/state";
import { initialAuthState } from "@/lib/auth/state";

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "signup";
  action: (prevState: AuthState, formData: FormData) => Promise<AuthState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialAuthState);
  const isLogin = mode === "login";

  return (
    <div className="flex min-h-svh flex-1 items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-on-accent">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {isLogin ? "Sign in to TradeLog" : "Create your TradeLog account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLogin
              ? "Track trades, review performance, refine your edge."
              : "Start journaling your trades in under a minute."}
          </p>
        </div>

        <form action={formAction} className="space-y-4" noValidate>
          <Field label="Email" id="email" name="email" type="email" autoComplete="email" />
          <Field
            label="Password"
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
          {!isLogin ? (
            <Field
              label="Confirm password"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
            />
          ) : null}

          {state.error ? (
            <p role="alert" className="rounded-lg bg-loss/10 px-3 py-2 text-sm text-loss">
              {state.error}
            </p>
          ) : null}
          {state.message ? (
            <p role="status" className="rounded-lg bg-profit/10 px-3 py-2 text-sm text-profit">
              {state.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  name,
  type,
  autoComplete,
}: {
  label: string;
  id: string;
  name: string;
  type: string;
  autoComplete: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        className="min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
