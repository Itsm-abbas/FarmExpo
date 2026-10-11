"use client";

import { CURRENCIES } from "@constants/currencies";

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-text sm:text-[2rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[15px] text-text/65">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

// A titled block of related content on a page.
export function Panel({ title, description, children, footer, className = "" }) {
  return (
    <section
      className={`rounded-xl border border-text/10 bg-surface ${className}`}
    >
      {(title || description) && (
        <header className="border-b border-text/10 px-5 py-4 sm:px-6">
          {title && <h2 className="text-base font-semibold text-text">{title}</h2>}
          {description && (
            <p className="mt-0.5 text-sm text-text/60">{description}</p>
          )}
        </header>
      )}
      <div className="px-5 py-5 sm:px-6">{children}</div>
      {footer && (
        <footer className="flex flex-wrap items-center justify-end gap-3 rounded-b-xl border-t border-text/10 bg-text/[0.02] px-5 py-3.5 sm:px-6">
          {footer}
        </footer>
      )}
    </section>
  );
}

export const inputClass =
  "w-full rounded-lg border border-text/15 bg-surface px-3.5 py-2.5 text-[15px] text-text placeholder:text-text/35 transition-colors hover:border-text/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60";

export function Field({ label, htmlFor, hint, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-text">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-text/55">{hint}</p>}
    </div>
  );
}

const BUTTON_VARIANTS = {
  primary: "bg-primary text-white hover:bg-accent",
  secondary: "border border-text/15 bg-surface text-text hover:bg-text/5",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-text/70 hover:bg-text/5 hover:text-text",
};

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/40 border-t-current" />
      )}
      {children}
    </button>
  );
}

// Picker for an ISO currency code. A stored code missing from the list is
// still offered, so editing an old record never loses its currency.
export function CurrencySelect({ value, className = "", ...props }) {
  const known = CURRENCIES.some((c) => c.code === value);
  return (
    <select value={value || ""} className={`${inputClass} ${className}`} {...props}>
      <option value="" disabled>
        Choose a currency
      </option>
      {value && !known && <option value={value}>{value}</option>}
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.name} ({c.code})
        </option>
      ))}
    </select>
  );
}
