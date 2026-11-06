"use client";

// Dialog to correct or delete a payment (a manual ledger entry) from the
// Transactions page or a bank statement. Entries posted from consignments
// and purchases are changed through those instead.
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { LuTrash2, LuX } from "react-icons/lu";
import axiosInstance from "@utils/axiosConfig";
import { listQueries, markLedgerChanged } from "@hooks/queries";
import { formatMoney } from "@utils/money";
import { today } from "@utils/days";
import { bankLabel, directionOf, ledgerTypeFor, sameCurrency } from "@utils/banking";
import { Button, Field, inputClass } from "@components/Page";

const entryDay = (t) => new Date(t.createdAt).toLocaleDateString("en-CA");

const formOf = (t) => ({
  date: entryDay(t),
  direction: directionOf(t, t.vendor.role),
  amount: String(t.amount),
  bankAccountId: t.bankAccountId ? String(t.bankAccountId) : "",
  bankAmount: t.bankAmount != null && t.bankAmount !== t.amount ? String(t.bankAmount) : "",
  transactionId: t.transactionId || "",
  voucherId: t.voucherId || "",
  details: t.details || "",
});

export default function EditPayment({ entry, onClose }) {
  const queryClient = useQueryClient();
  const { data: bankAccounts = [] } = useQuery(listQueries.bankAccounts);
  const [form, setForm] = useState(() => formOf(entry));
  const [error, setError] = useState("");
  const vendor = entry.vendor;
  const isExpense = vendor.role === "expense";
  const bank = bankAccounts.find((b) => String(b.id) === form.bankAccountId);
  // Closed accounts are offered only to the entry already using one.
  const banks = bankAccounts.filter((b) => b.active || String(b.id) === form.bankAccountId);
  const needsBankAmount = Boolean(bank && !sameCurrency(vendor.currency, bank.currency));
  const received = form.direction === "received";

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const done = () => {
    markLedgerChanged(queryClient);
    onClose();
  };

  const save = useMutation({
    mutationFn: (payload) => axiosInstance.put("/vendor/transactions", payload),
    onSuccess: done,
    onError: (err) => setError(err.message),
  });

  const remove = useMutation({
    mutationFn: () => axiosInstance.delete("/vendor/transactions", { data: { id: entry.id } }),
    onSuccess: done,
    onError: (err) => setError(err.message),
  });

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError("");
    const amount = Number(form.amount);
    if (!(amount > 0)) return setError("Enter the amount.");
    if (needsBankAmount && !(Number(form.bankAmount) > 0)) {
      return setError(`Enter the amount in ${bank.currency} that went through the bank.`);
    }
    if (!form.details.trim()) return setError("Add a short note.");
    save.mutate({
      id: entry.id,
      type: ledgerTypeFor(vendor.role, form.direction),
      amount,
      // Only a changed day moves the entry; otherwise it keeps its time.
      ...(form.date !== entryDay(entry) ? { date: form.date } : {}),
      transactionId: form.transactionId,
      voucherId: form.voucherId,
      details: form.details.trim(),
      bankAccountId: bank ? bank.id : null,
      bankType: bank ? (received ? "in" : "out") : null,
      bankAmount: needsBankAmount ? Number(form.bankAmount) : null,
    });
  };

  const confirmDelete = async () => {
    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "Delete this payment?",
      text: `${formatMoney(entry.amount, vendor.currency, { decimals: 2 })} ${
        isExpense ? "spent on" : received ? "received from" : "paid to"
      } ${vendor.name} is removed from the ledger${entry.bankAccountId ? " and the bank statement" : ""}.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      background: "rgb(var(--color-surface))",
      color: "rgb(var(--color-text))",
    });
    if (isConfirmed) remove.mutate();
  };

  const busy = save.isPending || remove.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-payment-title"
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-surface shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-text/10 px-5 py-4">
          <div>
            <h2 id="edit-payment-title" className="font-display text-lg font-semibold text-text">Edit payment</h2>
            <p className="text-sm text-text/60">{vendor.name}&apos;s ledger, in {vendor.currency}</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="rounded-lg p-1.5 text-text/60 hover:bg-text/5 hover:text-text">
            <LuX className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          {!isExpense && (
            <Field label="Payment" htmlFor="edit-direction">
              <select id="edit-direction" name="direction" value={form.direction} onChange={update} className={inputClass}>
                <option value="received">Received from {vendor.name}</option>
                <option value="paid">Paid to {vendor.name}</option>
              </select>
            </Field>
          )}
          <Field label="Date" htmlFor="edit-date">
            <input id="edit-date" name="date" type="date" required max={today()} value={form.date} onChange={update} className={inputClass} />
          </Field>
          <Field label={`Amount (${vendor.currency})`} htmlFor="edit-amount">
            <input id="edit-amount" name="amount" type="number" min="0" step="any" inputMode="decimal" value={form.amount} onChange={update} className={inputClass} />
          </Field>
          <Field label="Bank account" htmlFor="edit-bank">
            <select
              id="edit-bank"
              name="bankAccountId"
              value={form.bankAccountId}
              onChange={(e) => setForm((f) => ({ ...f, bankAccountId: e.target.value, bankAmount: "" }))}
              className={inputClass}
            >
              <option value="">Not through a bank (cash)</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {bankLabel(b)} ({b.currency})
                </option>
              ))}
            </select>
          </Field>
          {needsBankAmount && (
            <Field label={`Amount in the bank (${bank.currency})`} htmlFor="edit-bank-amount">
              <input id="edit-bank-amount" name="bankAmount" type="number" min="0" step="any" inputMode="decimal" value={form.bankAmount} onChange={update} className={inputClass} />
            </Field>
          )}
          <Field label="Reference / transaction ID" htmlFor="edit-ref">
            <input id="edit-ref" name="transactionId" maxLength={100} value={form.transactionId} onChange={update} className={inputClass} />
          </Field>
          <Field label="Voucher ID" htmlFor="edit-voucher">
            <input id="edit-voucher" name="voucherId" maxLength={100} value={form.voucherId} onChange={update} className={inputClass} />
          </Field>
          <Field label="Note" htmlFor="edit-note" className="sm:col-span-2" hint="Shown on the statement.">
            <input id="edit-note" name="details" maxLength={500} value={form.details} onChange={update} className={inputClass} />
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-text/10 px-5 py-4">
          {error && <p role="alert" className="mr-auto w-full text-sm text-red-600 sm:w-auto">{error}</p>}
          <Button variant="ghost" onClick={confirmDelete} loading={remove.isPending} disabled={busy} className="mr-auto text-red-600">
            <LuTrash2 className="h-4 w-4" /> Delete
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" loading={save.isPending} disabled={busy}>Save changes</Button>
        </div>
      </form>
    </div>
  );
}
