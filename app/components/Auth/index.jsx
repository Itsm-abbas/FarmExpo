"use client";

import { useState } from "react";
import Link from "next/link";
import { LuEye, LuEyeOff } from "react-icons/lu";

// The consignment stages, shown as the brand panel's motif — the same
// sequence the dashboard tracks.
const STAGES = ["Not started", "Pending", "Custom cleared", "Fulfilled"];

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-accent text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link href="/auth/login" className="font-display text-2xl font-bold tracking-tight">
          FarmExpo
        </Link>

        <div className="max-w-md">
          <p className="font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight">
            Every consignment, from packing shed to payment.
          </p>
          <ol className="mt-10 space-y-0" aria-label="Consignment stages">
            {STAGES.map((stage, i) => (
              <li key={stage} className="relative flex items-center gap-4 pb-5 last:pb-0">
                {i < STAGES.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[7px] top-4 h-full w-px bg-white/25"
                  />
                )}
                <span
                  aria-hidden="true"
                  className={`relative h-[15px] w-[15px] rounded-full border-2 ${
                    i === STAGES.length - 1
                      ? "border-highlight bg-highlight"
                      : "border-white/60 bg-accent"
                  }`}
                />
                <span className="text-sm text-white/80">{stage}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="max-w-sm text-sm leading-relaxed text-white/65">
          Airway bills, packing, customs and recoveries post straight to each
          partner's ledger.
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          <p className="mb-10 font-display text-xl font-bold text-primary lg:hidden">
            FarmExpo
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-text">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-[15px] text-text/65">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-sm text-text/65">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export function AuthField({ id, label, type = "text", hint, aside, ...props }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={isPassword && visible ? "text" : type}
          className={`w-full rounded-lg border border-text/15 bg-surface px-3.5 py-2.5 text-[15px] text-text placeholder:text-text/35 transition-colors hover:border-text/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            isPassword ? "pr-11" : ""
          }`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-text/45 hover:text-text"
          >
            {visible ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-text/55">{hint}</p>}
    </div>
  );
}

export function AuthButton({ children, loading, ...props }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-accent disabled:cursor-wait disabled:opacity-70"
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
}

// Inline message under a form: "error" or "success".
export function AuthNotice({ tone = "error", children }) {
  if (!children) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg px-3.5 py-2.5 text-sm ${
        tone === "error"
          ? "bg-red-500/10 text-red-700 dark:text-red-300"
          : "bg-primary/10 text-primary"
      }`}
    >
      {children}
    </p>
  );
}
