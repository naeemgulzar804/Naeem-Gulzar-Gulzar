"use client";

import { cn } from "@/lib/utils";

export function Field({
  label,
  id,
  children,
  hint,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const inputClass =
  "min-h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function TextField({
  label,
  id,
  value,
  onChange,
  type = "text",
  placeholder,
  step,
  required,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <Field label={label} id={id}>
      <input
        id={id}
        type={type}
        step={step}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </Field>
  );
}

export function SelectField({
  label,
  id,
  value,
  onChange,
  options,
  placeholder = "Select…",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
}) {
  return (
    <Field label={label} id={id}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "cursor-pointer")}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function TextareaField({
  label,
  id,
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Field label={label} id={id}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </Field>
  );
}

export type PillTone = "profit" | "loss" | "accent" | "amber" | "neutral";

const PILL_ACTIVE: Record<PillTone, string> = {
  profit: "border-profit/40 bg-profit/10 text-profit",
  loss: "border-loss/40 bg-loss/10 text-loss",
  accent: "border-accent-border/40 bg-accent-soft text-accent",
  amber: "border-amber-500/40 bg-amber-500/10 text-amber-500",
  neutral: "border-border bg-secondary text-foreground",
};

/** Single-select row of pill buttons; clicking the active pill clears it. */
export function PillSelect({
  label,
  value,
  onChange,
  options,
  tone = "neutral",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  tone?: PillTone;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-xs font-medium text-muted-foreground">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? "" : o)}
              className={cn(
                "min-h-9 rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? PILL_ACTIVE[tone]
                  : "border-border text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Multi-select chips, used for confluence tracking. */
export function ChipMultiSelect({
  label,
  values,
  onToggle,
  options,
}: {
  label: string;
  values: string[];
  onToggle: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(o)}
              className={cn(
                "min-h-9 rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-profit/40 bg-profit/10 text-profit"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {active ? "✓ " : ""}
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function FormSection({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 card">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <span className="flex h-5 w-5 items-center justify-center rounded border border-accent-border/30 bg-accent-soft text-[10px] font-extrabold text-accent">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
