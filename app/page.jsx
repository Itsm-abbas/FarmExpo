"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  LuArrowDownLeft,
  LuArrowUpRight,
  LuFileText,
  LuPencil,
  LuPlus,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import axiosInstance from "@utils/axiosConfig";
import { fetchConsignments } from "@constants/consignmentAPI";
import { listQueries, queryKeys } from "@hooks/queries";
import useSession from "@hooks/useSession";
import { formatMoney } from "@utils/money";
import { Button, Field, inputClass } from "@components/Page";

const STAGES = [
  { status: "Not started", label: "Not started", note: "Dated, waiting for items and partners" },
  { status: "Pending", label: "Pending", note: "Partners and paperwork in progress" },
  { status: "Custom Cleared", label: "Custom cleared", note: "Through customs, awaiting payment" },
  { status: "Fulfilled", label: "Fulfilled", note: "Payment recovered" },
];
const stageIndex = (status) => {
  const i = STAGES.findIndex((s) => s.status.toLowerCase() === (status || "").toLowerCase());
  return i === -1 ? 0 : i;
};

const swalTheme = {
  background: "rgb(var(--color-surface))",
  color: "rgb(var(--color-text))",
  confirmButtonColor: "rgb(var(--color-primary))",
};

function greeting(date) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  return "Good evening";
}

// Sums balances per currency: { PKR: 1200, USD: 300 }.
function totalsByCurrency(vendors) {
  return vendors.reduce((acc, v) => {
    acc[v.currency] = (acc[v.currency] || 0) + (v.balance || 0);
    return acc;
  }, {});
}

function BalancePanel({ title, icon: Icon, vendors, empty, loading }) {
  const totals = Object.entries(totalsByCurrency(vendors));
  const top = [...vendors].sort((a, b) => b.balance - a.balance).slice(0, 4);
  return (
    <section className="rounded-xl border border-text/10 bg-surface p-5" aria-busy={loading}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
          <Icon className="h-4 w-4 text-text/50" /> {title}
        </h2>
        <Link href="/vendors/transactions" className="text-xs font-medium text-primary hover:underline">
          Ledgers
        </Link>
      </div>
      {loading ? (
        <div className="animate-pulse" aria-hidden="true">
          <div className="mt-4 h-7 w-40 rounded bg-text/10" />
          <div className="mt-5 space-y-3 border-t border-text/10 pt-4">
            <div className="h-3.5 w-full rounded bg-text/[0.07]" />
            <div className="h-3.5 w-4/5 rounded bg-text/[0.07]" />
          </div>
        </div>
      ) : totals.length === 0 ? (
        <p className="mt-4 text-sm text-text/55">{empty}</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
            {totals.map(([currency, amount]) => (
              <p key={currency} className="font-display text-2xl font-semibold tabular text-text">
                {formatMoney(amount, currency)}
              </p>
            ))}
          </div>
          <ul className="mt-4 space-y-2 border-t border-text/10 pt-3">
            {top.map((v) => (
              <li key={v.id}>
                <Link href={`/vendor/transaction/${v.id}`} className="flex items-center justify-between gap-3 text-sm hover:text-primary">
                  <span className="truncate text-text/75">{v.name}</span>
                  <span className="shrink-0 tabular text-text">{formatMoney(v.balance, v.currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, organization, isAdmin } = useSession();
  const [stageFilter, setStageFilter] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: consignments = [], isLoading } = useQuery({
    queryKey: queryKeys.consignments,
    queryFn: fetchConsignments,
  });
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: queryKeys.vendors,
    queryFn: async () => (await axiosInstance.get("/vendors/transactions")).data,
  });

  // The items page needs these lists; fetch them while the date is picked.
  const openStartDialog = () => {
    setDialogOpen(true);
    queryClient.prefetchQuery(listQueries.commodities);
    queryClient.prefetchQuery(listQueries.packaging);
  };

  const counts = useMemo(() => {
    const c = STAGES.map(() => 0);
    consignments.forEach((item) => c[stageIndex(item.status)]++);
    return c;
  }, [consignments]);

  const payables = vendors.filter((v) => v.role && v.role !== "consignee" && v.balance > 0);
  const receivables = vendors.filter((v) => v.role === "consignee" && v.balance > 0);

  const visible = consignments
    .filter((c) => stageFilter === null || stageIndex(c.status) === stageFilter)
    .slice(0, 8);

  const startConsignment = useMutation({
    mutationFn: async (date) =>
      (await axiosInstance.post(`/consignment`, { date, status: "Not started" })).data,
    onSuccess: (data) => {
      // The new consignment is already in hand, so the items page opens
      // without fetching it again.
      queryClient.setQueryData(queryKeys.consignment(data.id), data);
      queryClient.setQueryData(queryKeys.consignments, (prev) => (prev ? [data, ...prev] : prev));
      router.push(`/items-selection/${data.id}`);
    },
    onError: (error) => Swal.fire({ ...swalTheme, icon: "error", title: "Couldn't start the consignment", text: error.message }),
  });
  // Stays true after the consignment is created, until the items page replaces this one.
  const starting = startConsignment.isPending || startConsignment.isSuccess;

  const deleteConsignment = useMutation({
    mutationFn: (id) => axiosInstance.delete(`/consignment/${id}`),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.consignment(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.consignments });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorTransactions, refetchType: "none" });
    },
    onError: (error) => Swal.fire({ ...swalTheme, icon: "error", title: "Couldn't delete it", text: error.message }),
  });

  const confirmDelete = async (item) => {
    const { isConfirmed } = await Swal.fire({
      ...swalTheme,
      icon: "warning",
      title: `Delete consignment #${item.id}?`,
      text: "Its items, airway bill, packing, clearance and ledger entries are removed too. This can't be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (isConfirmed) deleteConsignment.mutate(item.id);
  };

  const today = new Date();
  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-8 sm:py-10">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-text/55">
            {today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mt-1 font-display text-[2rem] font-semibold leading-tight tracking-tight text-text sm:text-[2.4rem]">
            {greeting(today)}
            {firstName ? `, ${firstName}` : ""}
          </h1>
        </div>
        <Button onClick={openStartDialog} className="px-5 py-2.5 text-[15px]">
          <LuPlus className="h-4 w-4" /> Start consignment
        </Button>
      </div>

      {/* Pipeline: the consignment lifecycle, one stage per column */}
      <section aria-labelledby="pipeline-title" className="rounded-2xl border border-text/10 bg-surface">
        <div className="flex items-center justify-between px-5 pt-5 sm:px-7">
          <h2 id="pipeline-title" className="text-sm font-semibold text-text">
            Consignment pipeline
          </h2>
          {stageFilter !== null && (
            <button onClick={() => setStageFilter(null)} className="flex items-center gap-1 text-xs font-medium text-text/60 hover:text-text">
              <LuX className="h-3.5 w-3.5" /> Show all
            </button>
          )}
        </div>
        <ol className="grid grid-cols-2 gap-px overflow-hidden rounded-b-2xl md:grid-cols-4">
          {STAGES.map((stage, i) => {
            const selected = stageFilter === i;
            const isPending = i === 1;
            return (
              <li key={stage.status} className="relative">
                <button
                  onClick={() => setStageFilter(selected ? null : i)}
                  aria-pressed={selected}
                  className={`group flex h-full w-full flex-col items-start px-5 pb-6 pt-5 text-left transition-colors sm:px-7 ${
                    selected ? "bg-primary/[0.07]" : "hover:bg-text/[0.03]"
                  }`}
                >
                  {/* Track: dot on a line that runs between the stages */}
                  <span aria-hidden="true" className="relative mb-5 flex h-3 w-full items-center">
                    <span
                      className={`absolute h-px bg-text/15 ${i === 0 ? "left-1.5" : "-left-5 sm:-left-7"} ${
                        i === STAGES.length - 1 ? "right-[calc(100%-0.375rem)]" : "-right-5 sm:-right-7"
                      }`}
                    />
                    <span
                      className={`relative h-3 w-3 rounded-full ring-4 ring-surface ${
                        i === 3 ? "bg-primary" : isPending ? "bg-highlight" : i === 2 ? "bg-primary/60" : "bg-text/30"
                      }`}
                    />
                  </span>
                  <span className="font-display text-[3.25rem] font-semibold leading-none tabular text-text">
                    {isLoading ? "–" : counts[i]}
                  </span>
                  <span className={`mt-3 text-sm font-semibold ${selected ? "text-primary" : "text-text"}`}>
                    {stage.label}
                  </span>
                  <span className="mt-0.5 text-xs leading-snug text-text/55">{stage.note}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Money in both directions */}
      <div className="grid gap-4 md:grid-cols-2">
        <BalancePanel
          title="You owe partners"
          icon={LuArrowUpRight}
          vendors={payables}
          loading={vendorsLoading}
          empty="Nothing owed to packers, IATA agents or custom agents."
        />
        <BalancePanel
          title="Consignees owe you"
          icon={LuArrowDownLeft}
          vendors={receivables}
          loading={vendorsLoading}
          empty="No consignee has an outstanding balance."
        />
      </div>

      {/* Recent consignments */}
      <section className="rounded-xl border border-text/10 bg-surface">
        <div className="flex items-center justify-between border-b border-text/10 px-5 py-4">
          <h2 className="text-sm font-semibold text-text">
            {stageFilter === null ? "Recent consignments" : `${STAGES[stageFilter].label} consignments`}
          </h2>
          <Link href="/consignment/all-consignments" className="text-xs font-medium text-primary hover:underline">
            All consignments
          </Link>
        </div>
        {isLoading ? (
          <p className="px-5 py-8 text-sm text-text/55">Loading consignments…</p>
        ) : visible.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-text/65">
              {consignments.length === 0
                ? "No consignments yet. Start one to add items, partners and costs."
                : "No consignments at this stage."}
            </p>
            {consignments.length === 0 && (
              <Button onClick={openStartDialog} className="mt-4">
                <LuPlus className="h-4 w-4" /> Start consignment
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-text/55">
                  <th className="px-5 py-2.5 font-medium">No.</th>
                  <th className="px-3 py-2.5 font-medium">Date</th>
                  <th className="px-3 py-2.5 font-medium">Consignee</th>
                  <th className="px-3 py-2.5 font-medium">Destination</th>
                  <th className="px-3 py-2.5 font-medium">Stage</th>
                  <th className="px-5 py-2.5 text-right font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text/10">
                {visible.map((item) => {
                  const i = stageIndex(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-text/[0.02]">
                      <td className="px-5 py-3 font-medium tabular text-text">#{item.id}</td>
                      <td className="px-3 py-3 tabular text-text/75">
                        {item.date ? new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-3 py-3 text-text">{item.consignee?.vendor?.name || <span className="text-text/40">Not set</span>}</td>
                      <td className="px-3 py-3 text-text/75">
                        {[item.consignee?.vendor?.station, item.consignee?.vendor?.country].filter(Boolean).join(", ") || <span className="text-text/40">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            i === 3 ? "bg-primary/10 text-primary" : i === 1 ? "bg-highlight/15 text-text" : "bg-text/[0.07] text-text/75"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${i === 3 ? "bg-primary" : i === 1 ? "bg-highlight" : i === 2 ? "bg-primary/60" : "bg-text/35"}`} />
                          {STAGES[i].label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Link href={`/startconsignment/${item.id}`} title="Open" aria-label={`Open consignment ${item.id}`} className="grid h-8 w-8 place-items-center rounded-lg text-text/60 hover:bg-text/5 hover:text-text">
                            <LuPencil className="h-4 w-4" />
                          </Link>
                          <Link href={`/invoice/${item.id}`} title="Invoice" aria-label={`Invoice for consignment ${item.id}`} className="grid h-8 w-8 place-items-center rounded-lg text-text/60 hover:bg-text/5 hover:text-text">
                            <LuFileText className="h-4 w-4" />
                          </Link>
                          {isAdmin && (
                            <button onClick={() => confirmDelete(item)} title="Delete" aria-label={`Delete consignment ${item.id}`} className="grid h-8 w-8 place-items-center rounded-lg text-text/60 hover:bg-red-500/10 hover:text-red-600">
                              <LuTrash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Start consignment dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="start-title">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!starting) startConsignment.mutate(newDate);
            }}
            className="w-full max-w-sm rounded-2xl border border-text/10 bg-surface p-6 shadow-2xl"
            aria-busy={starting}
          >
            <h2 id="start-title" className="font-display text-xl font-semibold text-text">Start a consignment</h2>
            <p className="mt-1 text-sm text-text/60">
              Pick the shipping date. You'll add items next{organization?.name ? ` for ${organization.name}` : ""}.
            </p>
            <Field label="Date" htmlFor="consignment-date" className="mt-5">
              <input id="consignment-date" type="date" required value={newDate} onChange={(e) => setNewDate(e.target.value)} disabled={starting} className={inputClass} autoFocus />
            </Field>
            <p role="status" className="mt-4 min-h-5 text-sm text-text/60">
              {startConsignment.isPending
                ? "Creating the consignment…"
                : startConsignment.isSuccess
                  ? `Consignment #${startConsignment.data.id} created. Opening item selection…`
                  : ""}
            </p>
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={starting}>Cancel</Button>
              <Button type="submit" loading={starting}>{starting ? "Starting…" : "Start consignment"}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
