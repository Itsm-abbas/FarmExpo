"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LuLandmark } from "react-icons/lu";
import axiosInstance from "@utils/axiosConfig";
import useSession from "@hooks/useSession";
import { listQueries, markLedgerChanged, queryKeys, toSearch } from "@hooks/queries";
import { formatMoney } from "@utils/money";
import { formatDate } from "@utils/invoice";
import { daysBefore, today } from "@utils/days";
import {
  ROLE_LABELS,
  bankLabel,
  directionOf,
  ledgerTypeFor,
  sameCurrency,
} from "@utils/banking";
import { Button, Field, PageHeader, Panel, inputClass } from "@components/Page";
import PageLoader from "@components/Loader/PageLoader";

// Offered until the organization has used them; any other name can be typed.
const COMMON_EXPENSES = ["Office expenses", "House expenses"];

const emptyForm = (bankAccountId = "") => ({
  date: today(),
  // "received" | "paid" (to a party) | "expense" (spent on an expense head).
  direction: "received",
  vendorId: "",
  expenseHead: "",
  amount: "",
  bankAccountId,
  bankAmount: "",
  transactionId: "",
  voucherId: "",
  details: "",
});

// The calendar day an entry was recorded, on this device ("YYYY-MM-DD").
const entryDay = (t) => new Date(t.createdAt).toLocaleDateString("en-CA");

function TransactionsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { currency } = useSession();
  const [form, setForm] = useState(() => emptyForm(searchParams.get("bankAccountId") || ""));
  const [message, setMessage] = useState(null);
  const [filters, setFilters] = useState(() => ({
    from: daysBefore(today(), 30),
    to: today(),
    vendorId: "",
    bankAccountId: "",
    kind: "manual",
  }));

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery(listQueries.vendors);
  const { data: bankAccounts = [], isLoading: banksLoading } = useQuery(listQueries.bankAccounts);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...queryKeys.transactions, filters],
    queryFn: async () => (await axiosInstance.get(`/transactions?${toSearch(filters)}`)).data,
    placeholderData: (previous) => previous,
  });
  // The API widens the dates by a day for time zones; narrow to this device's days.
  const rows = (data?.transactions || []).filter(
    (t) => (!filters.from || entryDay(t) >= filters.from) && (!filters.to || entryDay(t) <= filters.to)
  );

  const isExpense = form.direction === "expense";
  const parties = vendors.filter((v) => v.role !== "expense");
  const expenseHeads = vendors.filter((v) => v.role === "expense");
  const expenseName = form.expenseHead.trim();
  const expenseSuggestions = [
    ...expenseHeads.map((v) => v.name),
    ...COMMON_EXPENSES.filter(
      (name) => !expenseHeads.some((v) => v.name.toLowerCase() === name.toLowerCase())
    ),
  ];
  // An expense name not used before gets its ledger when the entry is saved.
  const party = isExpense
    ? expenseName
      ? expenseHeads.find((v) => v.name.toLowerCase() === expenseName.toLowerCase()) || {
          name: expenseName,
          role: "expense",
          currency,
          balance: 0,
        }
      : null
    : parties.find((v) => String(v.id) === form.vendorId);
  const bank = bankAccounts.find((b) => String(b.id) === form.bankAccountId);
  const openBanks = bankAccounts.filter((b) => b.active);
  const needsBankAmount = Boolean(party && bank && !sameCurrency(party.currency, bank.currency));
  const ledgerType = party ? ledgerTypeFor(party.role, isExpense ? "paid" : form.direction) : null;
  const moneyIn = form.direction === "received";
  const amount = Number(form.amount) || 0;

  const save = useMutation({
    mutationFn: async (payload) => (await axiosInstance.post("/vendor/transactions", payload)).data,
    onSuccess: () => {
      markLedgerChanged(queryClient);
      setMessage({
        tone: "success",
        text: `Recorded: ${formatMoney(amount, party.currency, { decimals: 2 })} ${
          isExpense ? "spent on" : moneyIn ? "received from" : "paid to"
        } ${party.name}${bank ? ` through ${bankLabel(bank)}` : ""}.`,
      });
      // Keep the date, direction and bank: payments are often entered in a batch.
      setForm((f) => ({ ...emptyForm(f.bankAccountId), date: f.date, direction: f.direction }));
    },
    onError: (error) => setMessage({ tone: "error", text: error.message }),
  });

  const submit = (e) => {
    e.preventDefault();
    setMessage(null);
    if (!party) {
      return setMessage({
        tone: "error",
        text: isExpense ? "Enter what the money was spent on." : "Choose who the payment was from or to.",
      });
    }
    if (!(amount > 0)) return setMessage({ tone: "error", text: "Enter the amount." });
    if (needsBankAmount && !(Number(form.bankAmount) > 0)) {
      return setMessage({ tone: "error", text: `Enter the amount in ${bank.currency} that went through the bank.` });
    }
    if (!form.details.trim()) return setMessage({ tone: "error", text: "Add a few words of detail." });
    save.mutate({
      ...(isExpense ? { expenseHead: expenseName } : { vendorId: party.id }),
      type: ledgerType,
      amount,
      date: form.date,
      transactionId: form.transactionId,
      voucherId: form.voucherId,
      details: form.details.trim(),
      bankAccountId: bank ? bank.id : null,
      bankType: bank ? (moneyIn ? "in" : "out") : null,
      bankAmount: needsBankAmount ? Number(form.bankAmount) : null,
    });
  };

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const setFilter = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  if (vendorsLoading || banksLoading) return <PageLoader label="Loading transactions…" />;

  const received = rows.filter((t) => !t.source && directionOf(t, t.vendor.role) === "received");
  const paid = rows.filter((t) => !t.source && directionOf(t, t.vendor.role) === "paid");
  // Sums only mean something within one currency.
  const currencies = new Set(rows.map((t) => t.vendor.currency));
  const oneCurrency = currencies.size === 1 ? [...currencies][0] : null;
  const sum = (list) => list.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Transactions"
        description="Payments received from and paid to consignees, farmers, packers and agents, and money spent on expenses such as the office or house. Each one is posted to its ledger, and to the bank account it went through."
        actions={
          <Link
            href="/banking"
            className="inline-flex items-center gap-2 rounded-lg border border-text/15 bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-text/5"
          >
            <LuLandmark className="h-4 w-4" /> Banking
          </Link>
        }
      />

      <form onSubmit={submit}>
        <Panel
          title="Record a transaction"
          description="Money that came in or went out. Invoices and charges from consignments and purchases are posted to ledgers on their own."
          footer={
            <>
              {message && (
                <p
                  role={message.tone === "error" ? "alert" : "status"}
                  className={`mr-auto text-sm ${message.tone === "error" ? "text-red-600" : "text-primary"}`}
                >
                  {message.text}
                </p>
              )}
              <Button type="submit" loading={save.isPending}>Save transaction</Button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <fieldset className="sm:col-span-2 lg:col-span-3">
              <legend className="mb-1.5 text-sm font-medium text-text">Payment</legend>
              <div className="grid gap-2 sm:max-w-2xl sm:grid-cols-3">
                {[
                  ["received", "Received", "Money came in from them"],
                  ["paid", "Paid", "Money went out to them"],
                  ["expense", "Expense", "Office, house and other spending"],
                ].map(([value, label, hint]) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-lg border px-3.5 py-2.5 ${
                      form.direction === value ? "border-primary bg-primary/10" : "border-text/15 hover:bg-text/5"
                    }`}
                  >
                    <input type="radio" name="direction" value={value} checked={form.direction === value} onChange={update} className="sr-only" />
                    <span className={`block text-sm font-semibold ${form.direction === value ? "text-primary" : "text-text"}`}>{label}</span>
                    <span className="block text-xs text-text/55">{hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label="Date" htmlFor="date">
              <input id="date" name="date" type="date" required max={today()} value={form.date} onChange={update} className={inputClass} />
            </Field>
            {isExpense ? (
              <Field label="Spent on" htmlFor="expenseHead" hint="Pick one or type a new name. Each has its own ledger under Ledgers.">
                <input id="expenseHead" name="expenseHead" list="expense-heads" required maxLength={120} autoComplete="off" placeholder="e.g. Office expenses" value={form.expenseHead} onChange={update} className={inputClass} />
                <datalist id="expense-heads">
                  {expenseSuggestions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </Field>
            ) : (
              <Field label={moneyIn ? "Received from" : "Paid to"} htmlFor="vendorId">
                <select id="vendorId" name="vendorId" required value={form.vendorId} onChange={update} className={inputClass}>
                  <option value="">Choose a party</option>
                  {parties.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                      {v.role ? ` (${ROLE_LABELS[v.role]})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field
              label={`Amount${party ? ` (${party.currency})` : ""}`}
              htmlFor="amount"
              hint={party && !isExpense ? `In ${party.name}'s ledger currency.` : undefined}
            >
              <input id="amount" name="amount" type="number" min="0" step="any" inputMode="decimal" value={form.amount} onChange={update} className={inputClass} />
            </Field>
            <Field
              label="Bank account"
              htmlFor="bankAccountId"
              hint={
                openBanks.length === 0 ? (
                  <Link href="/banking" className="text-primary hover:underline">Add a bank account</Link>
                ) : undefined
              }
            >
              <select id="bankAccountId" name="bankAccountId" value={form.bankAccountId} onChange={update} className={inputClass}>
                <option value="">Not through a bank (cash)</option>
                {openBanks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {bankLabel(b)} ({b.currency})
                  </option>
                ))}
              </select>
            </Field>
            {needsBankAmount && (
              <Field label={`Amount in the bank (${bank.currency})`} htmlFor="bankAmount" hint={`The ledger is in ${party.currency}, the bank account in ${bank.currency}.`}>
                <input id="bankAmount" name="bankAmount" type="number" min="0" step="any" inputMode="decimal" value={form.bankAmount} onChange={update} className={inputClass} />
              </Field>
            )}
            <Field label="Reference / transaction ID" htmlFor="transactionId">
              <input id="transactionId" name="transactionId" maxLength={100} placeholder="Cheque or transfer no." value={form.transactionId} onChange={update} className={inputClass} />
            </Field>
            <Field label="Voucher ID" htmlFor="voucherId">
              <input id="voucherId" name="voucherId" maxLength={100} value={form.voucherId} onChange={update} className={inputClass} />
            </Field>
            <Field label="Details" htmlFor="details" className="sm:col-span-2">
              <input id="details" name="details" maxLength={500} placeholder="e.g. Advance against consignment 1042" value={form.details} onChange={update} className={inputClass} />
            </Field>
          </div>
          {party && amount > 0 && (
            <p className="mt-4 rounded-lg bg-text/[0.04] px-4 py-3 text-sm text-text/70">
              Posts a <strong className="text-text">{ledgerType}</strong> of{" "}
              {formatMoney(amount, party.currency, { decimals: 2 })} to {party.name}&apos;s ledger
              {party.balance !== null && party.balance !== undefined && (
                <>
                  {" "}(balance {formatMoney(party.balance, party.currency, { decimals: 2 })} →{" "}
                  {formatMoney(party.balance + (ledgerType === "credit" ? amount : -amount), party.currency, { decimals: 2 })})
                </>
              )}
              {bank && (
                <>
                  , and {moneyIn ? "adds" : "takes"}{" "}
                  {formatMoney(needsBankAmount ? Number(form.bankAmount) || 0 : amount, bank.currency, { decimals: 2 })}{" "}
                  {moneyIn ? "to" : "from"} {bankLabel(bank)}
                </>
              )}
              .
            </p>
          )}
        </Panel>
      </form>

      <Panel title="History">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="From" htmlFor="f-from">
            <input id="f-from" name="from" type="date" value={filters.from} onChange={setFilter} className={inputClass} />
          </Field>
          <Field label="To" htmlFor="f-to">
            <input id="f-to" name="to" type="date" value={filters.to} onChange={setFilter} className={inputClass} />
          </Field>
          <Field label="Party" htmlFor="f-vendor">
            <select id="f-vendor" name="vendorId" value={filters.vendorId} onChange={setFilter} className={inputClass}>
              <option value="">Everyone</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Bank account" htmlFor="f-bank">
            <select id="f-bank" name="bankAccountId" value={filters.bankAccountId} onChange={setFilter} className={inputClass}>
              <option value="">Any</option>
              <option value="none">Not through a bank</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>{bankLabel(b)}</option>
              ))}
            </select>
          </Field>
          <Field label="Entries" htmlFor="f-kind">
            <select id="f-kind" name="kind" value={filters.kind} onChange={setFilter} className={inputClass}>
              <option value="manual">Payments</option>
              <option value="auto">From consignments and purchases</option>
              <option value="">Everything</option>
            </select>
          </Field>
        </div>

        <div className={`mt-5 overflow-x-auto transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`} aria-busy={isFetching}>
          {isLoading ? (
            <p role="status" className="py-8 text-center text-sm text-text/55">Loading transactions…</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-text/60">Nothing in this period. Change the filters or record a transaction above.</p>
          ) : (
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="whitespace-nowrap border-b border-text/10 text-left text-xs text-text/55">
                  <th className="py-2.5 pr-3 font-medium">Date</th>
                  <th className="px-3 py-2.5 font-medium">Party</th>
                  <th className="px-3 py-2.5 font-medium">Details</th>
                  <th className="px-3 py-2.5 font-medium">Bank</th>
                  <th className="px-3 py-2.5 text-right font-medium">Received</th>
                  <th className="px-3 py-2.5 text-right font-medium">Paid</th>
                  <th className="py-2.5 pl-3 text-right font-medium">Ledger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text/10">
                {rows.map((t) => {
                  const direction = t.source ? null : directionOf(t, t.vendor.role);
                  const value = formatMoney(t.amount, t.vendor.currency, { decimals: 2 });
                  return (
                    <tr key={t.id} className="hover:bg-text/[0.02]">
                      <td className="whitespace-nowrap py-3 pr-3 tabular text-text/75">{formatDate(t.createdAt)}</td>
                      <td className="px-3 py-3">
                        <Link href={`/vendor/transaction/${t.vendor.id}`} className="font-medium text-text hover:text-primary hover:underline">
                          {t.vendor.name}
                        </Link>
                        {t.vendor.role && <span className="block text-xs text-text/50">{ROLE_LABELS[t.vendor.role]}</span>}
                      </td>
                      <td className="max-w-xs px-3 py-3 text-text/80">
                        {t.details}
                        {(t.transactionId || t.voucherId) && !t.source && (
                          <span className="block text-xs text-text/50">
                            {[t.transactionId && `Ref ${t.transactionId}`, t.voucherId && `Voucher ${t.voucherId}`].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-text/75">
                        {t.bankAccount ? (
                          <Link href={`/banking/${t.bankAccount.id}`} className="hover:text-primary hover:underline">
                            {bankLabel(t.bankAccount)}
                          </Link>
                        ) : t.source ? (
                          ""
                        ) : (
                          <span className="text-text/50">Cash</span>
                        )}
                        {t.bankAccount && !sameCurrency(t.bankAccount.currency, t.vendor.currency) && (
                          <span className="block text-xs tabular text-text/50">
                            {formatMoney(t.bankAmount, t.bankAccount.currency, { decimals: 2 })}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-medium tabular text-primary">
                        {direction === "received" ? value : ""}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-medium tabular text-red-600">
                        {direction === "paid" ? value : ""}
                      </td>
                      <td className="whitespace-nowrap py-3 pl-3 text-right text-xs text-text/60">
                        {t.type === "credit" ? "Credit" : "Debit"} {t.source ? value : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {oneCurrency && (received.length > 0 || paid.length > 0) && (
                <tfoot>
                  <tr className="border-t-2 border-text/15 font-semibold text-text">
                    <td className="py-3 pr-3" colSpan={4}>
                      {rows.length} entr{rows.length === 1 ? "y" : "ies"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular">{formatMoney(sum(received), oneCurrency, { decimals: 2 })}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular">{formatMoney(sum(paid), oneCurrency, { decimals: 2 })}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          )}
          {data?.truncated && (
            <p className="mt-3 text-sm text-text/60">Showing the latest 1,000 entries. Narrow the dates to see older ones.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}

// useSearchParams needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={<PageLoader label="Loading transactions…" />}>
      <TransactionsPage />
    </Suspense>
  );
}
