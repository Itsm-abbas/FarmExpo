"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { LuArrowLeft, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import axiosInstance from "@utils/axiosConfig";
import useSession from "@hooks/useSession";
import { queryKeys } from "@hooks/queries";
import { formatMoney } from "@utils/money";
import { formatDate } from "@utils/invoice";
import { ROLE_LABELS } from "@utils/banking";
import { Button, Field, PageHeader, Panel, inputClass } from "@components/Page";
import PageLoader from "@components/Loader/PageLoader";
import BankAccountFields, { bankAccountForm } from "@components/Forms/BankAccount";

const swalTheme = {
  background: "rgb(var(--color-surface))",
  color: "rgb(var(--color-text))",
  confirmButtonColor: "rgb(var(--color-primary))",
};

// The calendar day an entry was recorded, on this device ("YYYY-MM-DD").
const entryDay = (t) => new Date(t.createdAt).toLocaleDateString("en-CA");

function Detail({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-text/55">{label}</dt>
      <dd className="text-sm font-medium tabular text-text">{value}</dd>
    </div>
  );
}

export default function BankAccountPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { permissions } = useSession();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ text: "", direction: "", from: "", to: "" });

  const { data, isLoading, isError } = useQuery({
    queryKey: [...queryKeys.bankAccounts, Number(id)],
    queryFn: async () => (await axiosInstance.get(`/bank-accounts/${id}`)).data,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });

  const save = useMutation({
    mutationFn: async (payload) => (await axiosInstance.put(`/bank-accounts/${id}`, payload)).data,
    onSuccess: () => {
      refresh();
      setEditing(false);
    },
    onError: (err) => setError(err.message),
  });

  const remove = useMutation({
    mutationFn: () => axiosInstance.delete(`/bank-accounts/${id}`),
    onSuccess: () => {
      refresh();
      router.replace("/banking");
    },
    onError: (err) => Swal.fire({ ...swalTheme, icon: "error", title: "Couldn't delete it", text: err.message }),
  });

  const statement = useMemo(() => {
    const rows = data?.statement || [];
    const words = filters.text.toLowerCase().split(/\s+/).filter(Boolean);
    return rows
      .filter((t) => {
        if (filters.direction && t.bankType !== filters.direction) return false;
        if (filters.from && entryDay(t) < filters.from) return false;
        if (filters.to && entryDay(t) > filters.to) return false;
        if (words.length) {
          const haystack = [t.vendor?.name, t.details, t.transactionId, t.voucherId, String(t.bankAmount)]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!words.every((w) => haystack.includes(w))) return false;
        }
        return true;
      })
      .reverse(); // newest first
  }, [data, filters]);

  if (isLoading) return <PageLoader label="Loading the account…" />;
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <PageHeader title="Bank account not found" description="It doesn't exist or you don't have access to it." />
      </div>
    );
  }

  const { account } = data;
  const hasEntries = data.statement.length > 0;
  const money = (v) => formatMoney(v, account.currency, { decimals: 2 });
  const setFilter = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  const startEdit = () => {
    setError("");
    setForm(bankAccountForm(account));
    setEditing(true);
  };

  const toggleActive = async () => {
    const closing = account.active;
    const { isConfirmed } = await Swal.fire({
      ...swalTheme,
      icon: "question",
      title: closing ? "Close this account?" : "Reopen this account?",
      text: closing
        ? "Its statement stays, but it can't be chosen for new transactions."
        : "It can be chosen for new transactions again.",
      showCancelButton: true,
      confirmButtonText: closing ? "Close account" : "Reopen",
    });
    if (isConfirmed) save.mutate({ active: !closing });
  };

  const confirmDelete = async () => {
    const { isConfirmed } = await Swal.fire({
      ...swalTheme,
      icon: "warning",
      title: "Delete this bank account?",
      text: `${account.bankName} ${account.accountNumber} is removed for good.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (isConfirmed) remove.mutate();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
      <Link href="/banking" className="inline-flex items-center gap-1.5 text-sm font-medium text-text/60 hover:text-text">
        <LuArrowLeft className="h-4 w-4" /> Banking
      </Link>

      <PageHeader
        title={`${account.bankName} ${account.accountNumber}`}
        description={`${account.accountTitle}${account.active ? "" : " (closed)"}`}
        actions={
          <>
            {account.active && (
              <Link
                href={`/transactions?bankAccountId=${account.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent"
              >
                <LuPlus className="h-4 w-4" /> Record a transaction
              </Link>
            )}
            {!editing && (
              <Button variant="secondary" onClick={startEdit}>
                <LuPencil className="h-4 w-4" /> Edit
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Opening balance", account.openingBalance],
          ["Money in", account.moneyIn],
          ["Money out", account.moneyOut],
          ["Balance", account.balance],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-text/10 bg-surface px-4 py-3">
            <p className="text-xs text-text/55">{label}</p>
            <p className={`mt-0.5 font-display text-xl font-semibold tabular ${label === "Balance" && value < 0 ? "text-red-600" : "text-text"}`}>
              {money(value)}
            </p>
          </div>
        ))}
      </div>

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            save.mutate(form);
          }}
        >
          <Panel
            title="Edit bank account"
            footer={
              <>
                {error && <p role="alert" className="mr-auto text-sm text-red-600">{error}</p>}
                <Button variant="ghost" onClick={toggleActive} disabled={save.isPending} className="mr-auto">
                  {account.active ? "Close account" : "Reopen account"}
                </Button>
                {permissions.delete && !hasEntries && (
                  <Button variant="ghost" onClick={confirmDelete} loading={remove.isPending} className="text-red-600">
                    <LuTrash2 className="h-4 w-4" /> Delete
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setEditing(false)} disabled={save.isPending}>
                  Cancel
                </Button>
                <Button type="submit" loading={save.isPending}>Save changes</Button>
              </>
            }
          >
            <BankAccountFields form={form} setForm={setForm} lockCurrency={hasEntries} idPrefix="edit-bank" />
          </Panel>
        </form>
      ) : (
        <Panel>
          <dl className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Detail label="Account title" value={account.accountTitle} />
            <Detail label="Account number" value={account.accountNumber} />
            <Detail label="IBAN" value={account.iban} />
            <Detail label="Branch" value={account.branch} />
            <Detail label="SWIFT / BIC" value={account.swift} />
            <Detail label="Currency" value={account.currency} />
          </dl>
          {account.notes && <p className="mt-4 text-sm text-text/70">{account.notes}</p>}
        </Panel>
      )}

      <Panel title="Statement" description="Every payment recorded through this account. Received is money in from the party; paid is money out to them.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Search" htmlFor="statement-text">
            <input id="statement-text" name="text" type="search" placeholder="Party, details, reference" value={filters.text} onChange={setFilter} className={inputClass} />
          </Field>
          <Field label="Direction" htmlFor="statement-direction">
            <select id="statement-direction" name="direction" value={filters.direction} onChange={setFilter} className={inputClass}>
              <option value="">In and out</option>
              <option value="in">Money in</option>
              <option value="out">Money out</option>
            </select>
          </Field>
          <Field label="From" htmlFor="statement-from">
            <input id="statement-from" name="from" type="date" value={filters.from} onChange={setFilter} className={inputClass} />
          </Field>
          <Field label="To" htmlFor="statement-to">
            <input id="statement-to" name="to" type="date" value={filters.to} onChange={setFilter} className={inputClass} />
          </Field>
        </div>

        <div className="mt-5 overflow-x-auto">
          {!hasEntries ? (
            <p className="py-8 text-center text-sm text-text/60">
              Nothing recorded through this account yet.
            </p>
          ) : statement.length === 0 ? (
            <p className="py-8 text-center text-sm text-text/60">No entries match. Change or clear the filters.</p>
          ) : (
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="whitespace-nowrap border-b border-text/10 text-left text-xs text-text/55">
                  <th className="py-2.5 pr-3 font-medium">Date</th>
                  <th className="px-3 py-2.5 font-medium">From / to</th>
                  <th className="px-3 py-2.5 font-medium">Details</th>
                  <th className="px-3 py-2.5 text-right font-medium">Money in</th>
                  <th className="px-3 py-2.5 text-right font-medium">Money out</th>
                  <th className="py-2.5 pl-3 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text/10">
                {statement.map((t) => (
                  <tr key={t.id} className="hover:bg-text/[0.02]">
                    <td className="whitespace-nowrap py-3 pr-3 tabular text-text/75">{formatDate(t.createdAt)}</td>
                    <td className="px-3 py-3 text-text">
                      <span className="text-xs text-text/55">{t.bankType === "in" ? "Received from" : t.vendor.role === "expense" ? "Spent on" : "Paid to"}</span>
                      <Link href={`/vendor/transaction/${t.vendor.id}`} className="block font-medium hover:text-primary hover:underline">
                        {t.vendor.name}
                      </Link>
                      {t.vendor.role && <span className="text-xs text-text/50">{ROLE_LABELS[t.vendor.role]}</span>}
                    </td>
                    <td className="max-w-xs px-3 py-3 text-text/80">
                      {t.details}
                      {(t.transactionId || t.voucherId) && (
                        <span className="block text-xs text-text/50">
                          {[t.transactionId && `Ref ${t.transactionId}`, t.voucherId && `Voucher ${t.voucherId}`].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-medium tabular text-primary">
                      {t.bankType === "in" ? money(t.bankAmount) : ""}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-medium tabular text-red-600">
                      {t.bankType === "out" ? money(t.bankAmount) : ""}
                    </td>
                    <td className={`whitespace-nowrap py-3 pl-3 text-right font-semibold tabular ${t.bankBalance < 0 ? "text-red-600" : "text-text"}`}>
                      {money(t.bankBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Panel>
    </div>
  );
}
