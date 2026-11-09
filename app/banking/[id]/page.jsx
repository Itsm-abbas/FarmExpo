"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { LuArrowLeft, LuFileSpreadsheet, LuFileText, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import axiosInstance from "@utils/axiosConfig";
import useSession from "@hooks/useSession";
import { queryKeys } from "@hooks/queries";
import { formatMoney } from "@utils/money";
import { entryNote, formatDate } from "@utils/invoice";
import { ROLE_LABELS } from "@utils/banking";
import { Button, Field, PageHeader, Panel, inputClass } from "@components/Page";
import PageLoader from "@components/Loader/PageLoader";
import BankAccountFields, { bankAccountForm } from "@components/Forms/BankAccount";
import EditPayment from "@components/Forms/EditPayment";

const swalTheme = {
  background: "rgb(var(--color-surface))",
  color: "rgb(var(--color-text))",
  confirmButtonColor: "rgb(var(--color-primary))",
};

// The calendar day an entry was recorded, on this device ("YYYY-MM-DD").
const entryDay = (t) => new Date(t.createdAt).toLocaleDateString("en-CA");

const NO_FILTERS = { text: "", note: "", vendorId: "", direction: "", from: "", to: "" };

const partyLabel = (t) =>
  t.bankType === "in" ? "Received from" : t.vendor?.role === "expense" ? "Spent on" : "Paid to";

// Every word of `query` appears somewhere in `fields`.
const matchesWords = (query, fields) => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return words.every((w) => haystack.includes(w));
};

// The filters in words, printed on exported statements.
function describeFilters(f, parties) {
  return [
    f.from && f.to ? `${formatDate(f.from)} to ${formatDate(f.to)}` : f.from ? `from ${formatDate(f.from)}` : f.to && `up to ${formatDate(f.to)}`,
    f.direction && (f.direction === "in" ? "money in only" : "money out only"),
    f.vendorId && `party: ${parties.find((p) => String(p.id) === f.vendorId)?.name || ""}`,
    f.note.trim() && `note contains "${f.note.trim()}"`,
    f.text.trim() && `search "${f.text.trim()}"`,
  ]
    .filter(Boolean)
    .join(", ");
}

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
  const { permissions, organization } = useSession();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(NO_FILTERS);
  const [exporting, setExporting] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);

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

  // Oldest first, as exported; the table shows it newest first.
  const matching = useMemo(
    () =>
      (data?.statement || []).filter(
        (t) =>
          (!filters.direction || t.bankType === filters.direction) &&
          (!filters.vendorId || String(t.vendor?.id) === filters.vendorId) &&
          (!filters.from || entryDay(t) >= filters.from) &&
          (!filters.to || entryDay(t) <= filters.to) &&
          matchesWords(filters.note, [entryNote(t)]) &&
          matchesWords(filters.text, [t.vendor?.name, entryNote(t), t.transactionId, t.voucherId, String(t.bankAmount)])
      ),
    [data, filters]
  );
  const statement = useMemo(() => [...matching].reverse(), [matching]);
  // Everyone money went to or came from through this account.
  const parties = useMemo(
    () =>
      [...new Map((data?.statement || []).map((t) => [t.vendor.id, t.vendor])).values()].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    [data]
  );

  if (isLoading) return <PageLoader label="Loading the account…" variant="ledger" />;
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
  const filtering = Object.entries(filters).some(([key, value]) => value !== NO_FILTERS[key]);
  const moneyIn = matching.filter((t) => t.bankType === "in").reduce((s, t) => s + t.bankAmount, 0);
  const moneyOut = matching.filter((t) => t.bankType === "out").reduce((s, t) => s + t.bankAmount, 0);

  // The statement as filtered, in the organization's template and letterhead.
  const exportStatement = async (kind) => {
    setExporting(kind);
    try {
      const pdf = await import("@utils/pdf");
      const name = pdf.fileSlug(
        `bank-statement-${account.bankName}-${account.accountNumber}-${new Date().toISOString().slice(0, 10)}`
      );
      const args = {
        account,
        rows: matching,
        filters: describeFilters(filters, parties),
        partyLabel,
        organization,
      };
      if (kind === "excel") {
        const { exportBankStatementExcel } = await import("@utils/excel");
        exportBankStatementExcel({ ...args, filename: `${name}.xlsx` });
      } else {
        const branding = await pdf.loadBranding(organization);
        pdf.downloadFile(await pdf.buildBankStatementPdf({ ...args, branding }), `${name}.pdf`);
      }
    } catch (err) {
      console.error("Bank statement export failed:", err);
      Swal.fire({ ...swalTheme, icon: "error", title: "Export failed", text: err.message || "Couldn't create the file. Try again." });
    } finally {
      setExporting(null);
    }
  };

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

      <Panel
        title="Statement"
        description="Every payment recorded through this account. Exports include only the entries the filters show."
        footer={
          hasEntries && (
            <>
              <Button variant="secondary" onClick={() => exportStatement("excel")} loading={exporting === "excel"} disabled={!matching.length || Boolean(exporting)}>
                <LuFileSpreadsheet className="h-4 w-4" /> Excel
              </Button>
              <Button onClick={() => exportStatement("pdf")} loading={exporting === "pdf"} disabled={!matching.length || Boolean(exporting)}>
                <LuFileText className="h-4 w-4" /> PDF
              </Button>
            </>
          )
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Note" htmlFor="statement-note">
            <input id="statement-note" name="note" type="search" placeholder="Words in the note" value={filters.note} onChange={setFilter} className={inputClass} />
          </Field>
          <Field label="Search" htmlFor="statement-text">
            <input id="statement-text" name="text" type="search" placeholder="Party, note, reference, amount" value={filters.text} onChange={setFilter} className={inputClass} />
          </Field>
          <Field label="From / to" htmlFor="statement-party">
            <select id="statement-party" name="vendorId" value={filters.vendorId} onChange={setFilter} className={inputClass}>
              <option value="">Everyone</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.role ? ` (${ROLE_LABELS[p.role]})` : ""}
                </option>
              ))}
            </select>
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
        {hasEntries && (
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm" role="status" aria-live="polite">
            <span className="text-text/70">
              {filtering ? `${matching.length} of ${data.statement.length} entries match` : `${data.statement.length} entries`}
            </span>
            <span className="text-text/70">
              In <strong className="tabular text-text">{money(moneyIn)}</strong>
            </span>
            <span className="text-text/70">
              Out <strong className="tabular text-text">{money(moneyOut)}</strong>
            </span>
            {filtering && (
              <button type="button" onClick={() => setFilters(NO_FILTERS)} className="font-medium text-primary hover:underline">
                Clear filters
              </button>
            )}
          </div>
        )}

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
                  <th className="px-3 py-2.5 font-medium">Note</th>
                  <th className="px-3 py-2.5 text-right font-medium">Money in</th>
                  <th className="px-3 py-2.5 text-right font-medium">Money out</th>
                  <th className="py-2.5 pl-3 text-right font-medium">Balance</th>
                  {permissions.editLedger && <th className="w-10 py-2.5 pl-2"><span className="sr-only">Actions</span></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-text/10">
                {statement.map((t) => (
                  <tr key={t.id} className="hover:bg-text/[0.02]">
                    <td className="whitespace-nowrap py-3 pr-3 tabular text-text/75">{formatDate(t.createdAt)}</td>
                    <td className="px-3 py-3 text-text">
                      <span className="text-xs text-text/55">{partyLabel(t)}</span>
                      <Link href={`/vendor/transaction/${t.vendor.id}`} className="block font-medium hover:text-primary hover:underline">
                        {t.vendor.name}
                      </Link>
                      {t.vendor.role && <span className="text-xs text-text/50">{ROLE_LABELS[t.vendor.role]}</span>}
                    </td>
                    <td className="max-w-xs px-3 py-3 text-text/80">
                      {entryNote(t)}
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
                    {permissions.editLedger && (
                      <td className="py-3 pl-2 text-right">
                        {t.source ? (
                          <span className="text-xs text-text/40" title="Posted from a consignment or purchase. Change it there.">Auto</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingEntry(t)}
                            aria-label={`Edit or delete the payment for ${t.vendor.name}`}
                            title="Edit or delete"
                            className="rounded-lg p-1.5 text-text/50 hover:bg-text/5 hover:text-primary"
                          >
                            <LuPencil className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Panel>
      {editingEntry && <EditPayment entry={editingEntry} onClose={() => setEditingEntry(null)} />}
    </div>
  );
}
