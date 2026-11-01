"use client";

import { useState } from "react";
import { CurrencySelect, Field, inputClass } from "@components/Page";

export const emptyBankAccount = (currency = "") => ({
  bankName: "",
  accountTitle: "",
  accountNumber: "",
  iban: "",
  branch: "",
  swift: "",
  currency,
  openingBalance: "",
  notes: "",
});

// Form state from a saved account, for editing it.
export const bankAccountForm = (account) =>
  Object.fromEntries(
    Object.keys(emptyBankAccount()).map((key) => [key, String(account[key] ?? "")])
  );

// The fields of a bank account. `lockCurrency`: entries are already recorded
// in its currency.
export default function BankAccountFields({ form, setForm, lockCurrency = false, idPrefix = "bank" }) {
  const [open] = useState(() => Boolean(form.iban || form.branch || form.swift || form.notes));
  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const id = (name) => `${idPrefix}-${name}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Bank" htmlFor={id("bankName")}>
        <input id={id("bankName")} name="bankName" required maxLength={120} placeholder="e.g. Meezan Bank" value={form.bankName} onChange={update} className={inputClass} />
      </Field>
      <Field label="Account title" htmlFor={id("accountTitle")}>
        <input id={id("accountTitle")} name="accountTitle" required maxLength={160} value={form.accountTitle} onChange={update} className={inputClass} />
      </Field>
      <Field label="Account number" htmlFor={id("accountNumber")}>
        <input id={id("accountNumber")} name="accountNumber" required maxLength={60} value={form.accountNumber} onChange={update} className={inputClass} />
      </Field>
      <Field
        label="Currency"
        htmlFor={id("currency")}
        hint={lockCurrency ? "Entries are already recorded in this currency." : undefined}
      >
        <CurrencySelect id={id("currency")} name="currency" required value={form.currency} onChange={update} disabled={lockCurrency} />
      </Field>
      <Field label={`Opening balance${form.currency ? ` (${form.currency})` : ""}`} htmlFor={id("openingBalance")} hint="What was in the account before the first entry you record here.">
        <input id={id("openingBalance")} name="openingBalance" type="number" step="any" inputMode="decimal" placeholder="0" value={form.openingBalance} onChange={update} className={inputClass} />
      </Field>
      <Field label="IBAN" htmlFor={id("iban")}>
        <input id={id("iban")} name="iban" maxLength={40} value={form.iban} onChange={update} className={inputClass} />
      </Field>
      <details open={open} className="sm:col-span-2 lg:col-span-3">
        <summary className="cursor-pointer text-sm font-medium text-primary">Branch, SWIFT and notes</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Branch" htmlFor={id("branch")}>
            <input id={id("branch")} name="branch" maxLength={160} value={form.branch} onChange={update} className={inputClass} />
          </Field>
          <Field label="SWIFT / BIC" htmlFor={id("swift")}>
            <input id={id("swift")} name="swift" maxLength={20} value={form.swift} onChange={update} className={inputClass} />
          </Field>
          <Field label="Notes" htmlFor={id("notes")}>
            <input id={id("notes")} name="notes" maxLength={500} value={form.notes} onChange={update} className={inputClass} />
          </Field>
        </div>
      </details>
    </div>
  );
}
