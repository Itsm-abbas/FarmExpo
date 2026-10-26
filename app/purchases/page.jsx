"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { LuChartLine, LuPencil, LuTrash2 } from "react-icons/lu";
import axiosInstance from "@utils/axiosConfig";
import useSession from "@hooks/useSession";
import { listQueries, markPurchasesChanged, queryKeys, toSearch } from "@hooks/queries";
import { formatMoney } from "@utils/money";
import { daysBefore, formatDay, formatKg, today } from "@utils/days";
import { Button, Field, PageHeader, Panel, inputClass } from "@components/Page";
import PageLoader from "@components/Loader/PageLoader";

const swalTheme = {
  background: "rgb(var(--color-surface))",
  color: "rgb(var(--color-text))",
  confirmButtonColor: "rgb(var(--color-primary))",
};

const emptyForm = (date, commodityId = "") => ({
  date,
  traderId: "",
  commodityId,
  quantity: "",
  rate: "",
  notes: "",
});

function PurchasesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency, permissions } = useSession();

  const [form, setForm] = useState(() => emptyForm(today()));
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [filters, setFilters] = useState(() => ({
    from: daysBefore(today(), 30),
    to: today(),
    traderId: "",
    commodityId: "",
  }));

  const { data: traders = [], isLoading: tradersLoading } = useQuery(listQueries.traders);
  const { data: commodities = [], isLoading: commoditiesLoading } = useQuery(
    listQueries.commodities
  );
  const { data: purchases = [], isLoading, isFetching } = useQuery({
    queryKey: [...queryKeys.purchases, filters],
    queryFn: async () => (await axiosInstance.get(`/purchases?${toSearch(filters)}`)).data,
    // Keep showing the last results while new filters load.
    placeholderData: (previous) => previous,
  });

  const startEdit = (purchase) => {
    setEditingId(purchase.id);
    setMessage(null);
    setForm({
      date: purchase.date.slice(0, 10),
      traderId: String(purchase.traderId),
      commodityId: String(purchase.commodityId),
      quantity: String(purchase.quantity),
      rate: String(purchase.rate),
      notes: purchase.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ?edit=ID (from a farmer's ledger) opens that purchase for editing.
  const editParam = searchParams.get("edit");
  const { data: linked, isLoading: linkedLoading } = useQuery({
    queryKey: [...queryKeys.purchases, "one", Number(editParam)],
    queryFn: async () => (await axiosInstance.get(`/purchases/${editParam}`)).data,
    enabled: Boolean(editParam),
  });
  const [openedLinked, setOpenedLinked] = useState(null);
  if (linked && openedLinked !== linked.id) {
    setOpenedLinked(linked.id);
    startEdit(linked);
  }

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm(form.date, form.commodityId));
    if (editParam) router.replace("/purchases");
  };

  const quantity = Number(form.quantity) || 0;
  const rate = Number(form.rate) || 0;
  const amount = Math.round(quantity * rate * 100) / 100;
  const trader = traders.find((t) => String(t.id) === form.traderId);

  const save = useMutation({
    mutationFn: async (payload) =>
      editingId
        ? (await axiosInstance.put(`/purchases/${editingId}`, payload)).data
        : (await axiosInstance.post("/purchases", payload)).data,
    onSuccess: (saved) => {
      markPurchasesChanged(queryClient);
      setMessage({
        tone: "success",
        text: `${editingId ? "Updated" : "Saved"} purchase #${saved.id}: ${formatMoney(
          saved.amount,
          currency,
          { decimals: 2 }
        )} on ${saved.trader.name}'s ledger.`,
      });
      // Keep the day and commodity: purchases are usually entered in a batch.
      setEditingId(null);
      setForm(emptyForm(form.date, form.commodityId));
      if (editParam) router.replace("/purchases");
    },
    onError: (error) => setMessage({ tone: "error", text: error.message }),
  });

  const submit = (e) => {
    e.preventDefault();
    setMessage(null);
    if (!form.date || !form.traderId || !form.commodityId) {
      return setMessage({ tone: "error", text: "Choose the date, farmer and commodity." });
    }
    if (!(quantity > 0) || !(rate > 0)) {
      return setMessage({ tone: "error", text: "Enter the kilograms bought and the rate per kg." });
    }
    save.mutate({
      date: form.date,
      traderId: Number(form.traderId),
      commodityId: Number(form.commodityId),
      quantity,
      rate,
      notes: form.notes,
    });
  };

  const remove = useMutation({
    mutationFn: (id) => axiosInstance.delete(`/purchases/${id}`),
    onSuccess: (_, id) => {
      markPurchasesChanged(queryClient);
      if (editingId === id) cancelEdit();
    },
    onError: (error) =>
      Swal.fire({ ...swalTheme, icon: "error", title: "Couldn't delete it", text: error.message }),
  });

  const confirmRemove = async (purchase) => {
    const { isConfirmed } = await Swal.fire({
      ...swalTheme,
      icon: "warning",
      title: `Delete purchase #${purchase.id}?`,
      text: `${formatMoney(purchase.amount, currency, { decimals: 2 })} is taken off ${purchase.trader.name}'s ledger and out of the daily price list.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (isConfirmed) remove.mutate(purchase.id);
  };

  const setFilter = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  if (tradersLoading || commoditiesLoading || (editParam && linkedLoading)) {
    return <PageLoader label="Loading purchases…" />;
  }

  const totalKg = purchases.reduce((s, p) => s + p.quantity, 0);
  const totalAmount = purchases.reduce((s, p) => s + p.amount, 0);
  // An average only means something for a single commodity.
  const oneCommodity = new Set(purchases.map((p) => p.commodityId)).size === 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Purchases"
        description="Produce bought from farmers and traders. Each purchase is added to the farmer's ledger as money you owe them; record payments on their ledger."
        actions={
          <Link
            href="/purchases/daily-prices"
            className="inline-flex items-center gap-2 rounded-lg border border-text/15 bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-text/5"
          >
            <LuChartLine className="h-4 w-4" /> Daily price list
          </Link>
        }
      />

      <form onSubmit={submit}>
        <Panel
          title={editingId ? `Edit purchase #${editingId}` : "Record a purchase"}
          description={
            editingId
              ? "The farmer's ledger and the daily price list update when you save."
              : "For several farmers on the same day, the date and commodity stay filled in after each save."
          }
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
              {editingId && (
                <Button variant="secondary" onClick={cancelEdit} disabled={save.isPending}>
                  Cancel
                </Button>
              )}
              <Button type="submit" loading={save.isPending}>
                {editingId ? "Save changes" : "Save purchase"}
              </Button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Date" htmlFor="date">
              <input id="date" name="date" type="date" required value={form.date} onChange={update} className={inputClass} />
            </Field>
            <Field
              label="Farmer / trader"
              htmlFor="traderId"
              hint={
                <Link href="/consignment/trader/add-trader?returnTo=/purchases" className="text-primary hover:underline">
                  Add a farmer
                </Link>
              }
            >
              <select id="traderId" name="traderId" required value={form.traderId} onChange={update} className={inputClass}>
                <option value="">Choose a farmer</option>
                {traders.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Commodity"
              htmlFor="commodityId"
              hint={
                <Link href="/consignment/commodity/add-commodity" className="text-primary hover:underline">
                  Add a commodity
                </Link>
              }
            >
              <select id="commodityId" name="commodityId" required value={form.commodityId} onChange={update} className={inputClass}>
                <option value="">Choose a commodity</option>
                {commodities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.number ? ` (${c.number})` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantity (kg)" htmlFor="quantity">
              <input id="quantity" name="quantity" type="number" min="0" step="any" inputMode="decimal" placeholder="200" value={form.quantity} onChange={update} className={inputClass} />
            </Field>
            <Field label={`Rate per kg (${currency})`} htmlFor="rate">
              <input id="rate" name="rate" type="number" min="0" step="any" inputMode="decimal" placeholder="50" value={form.rate} onChange={update} className={inputClass} />
            </Field>
            <div className="rounded-lg bg-text/[0.04] px-4 py-3">
              <p className="text-sm text-text/60">Amount owed{trader ? ` to ${trader.name}` : ""}</p>
              <p className="mt-0.5 font-display text-2xl font-semibold tabular text-text">
                {formatMoney(amount, currency, { decimals: 2 })}
              </p>
              <p className="text-xs text-text/50 tabular">
                {formatKg(quantity)} × {formatMoney(rate, currency)}
              </p>
            </div>
            <Field label="Notes" htmlFor="notes" className="sm:col-span-2 lg:col-span-3">
              <input id="notes" name="notes" maxLength={500} placeholder="Optional, e.g. grade or vehicle number" value={form.notes} onChange={update} className={inputClass} />
            </Field>
          </div>
        </Panel>
      </form>

      <Panel title="Purchase history">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="From" htmlFor="from">
            <input id="from" name="from" type="date" value={filters.from} onChange={setFilter} className={inputClass} />
          </Field>
          <Field label="To" htmlFor="to">
            <input id="to" name="to" type="date" value={filters.to} onChange={setFilter} className={inputClass} />
          </Field>
          <Field label="Farmer / trader" htmlFor="filter-trader">
            <select id="filter-trader" name="traderId" value={filters.traderId} onChange={setFilter} className={inputClass}>
              <option value="">Everyone</option>
              {traders.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Commodity" htmlFor="filter-commodity">
            <select id="filter-commodity" name="commodityId" value={filters.commodityId} onChange={setFilter} className={inputClass}>
              <option value="">All commodities</option>
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className={`mt-5 overflow-x-auto transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`} aria-busy={isFetching}>
          {isLoading ? (
            <p role="status" className="py-8 text-center text-sm text-text/55">Loading purchases…</p>
          ) : purchases.length === 0 ? (
            <p className="py-8 text-center text-sm text-text/60">
              No purchases in this period. Record one above.
            </p>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="whitespace-nowrap border-b border-text/10 text-left text-xs text-text/55">
                  <th className="py-2.5 pr-3 font-medium">Date</th>
                  <th className="px-3 py-2.5 font-medium">Farmer / trader</th>
                  <th className="px-3 py-2.5 font-medium">Commodity</th>
                  <th className="px-3 py-2.5 text-right font-medium">Quantity</th>
                  <th className="px-3 py-2.5 text-right font-medium">Rate / kg</th>
                  <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                  <th className="py-2.5 pl-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text/10">
                {purchases.map((p) => (
                  <tr key={p.id} className={editingId === p.id ? "bg-primary/[0.06]" : "hover:bg-text/[0.02]"}>
                    <td className="whitespace-nowrap py-3 pr-3 tabular text-text/75">{formatDay(p.date)}</td>
                    <td className="px-3 py-3 text-text">
                      {p.trader.vendorId ? (
                        <Link href={`/vendor/transaction/${p.trader.vendorId}`} className="hover:text-primary hover:underline" title="Open their ledger">
                          {p.trader.name}
                        </Link>
                      ) : (
                        p.trader.name
                      )}
                      {p.notes && <span className="block text-xs text-text/50">{p.notes}</span>}
                    </td>
                    <td className="px-3 py-3 text-text">{p.commodity.name}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular text-text">{formatKg(p.quantity)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular text-text">{formatMoney(p.rate, currency)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-medium tabular text-text">
                      {formatMoney(p.amount, currency, { decimals: 2 })}
                    </td>
                    <td className="py-3 pl-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => startEdit(p)} title="Edit" aria-label={`Edit purchase ${p.id}`} className="grid h-8 w-8 place-items-center rounded-lg text-text/60 hover:bg-text/5 hover:text-text">
                          <LuPencil className="h-4 w-4" />
                        </button>
                        {permissions.delete && (
                          <button type="button" onClick={() => confirmRemove(p)} title="Delete" aria-label={`Delete purchase ${p.id}`} className="grid h-8 w-8 place-items-center rounded-lg text-text/60 hover:bg-red-500/10 hover:text-red-600">
                            <LuTrash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-text/15 font-semibold text-text">
                  <td className="py-3 pr-3" colSpan={3}>
                    {purchases.length} purchase{purchases.length === 1 ? "" : "s"}
                    {oneCommodity && (
                      <span className="ml-2 font-normal text-text/55">
                        average {formatMoney(totalAmount / totalKg, currency, { decimals: 2 })}/kg
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right tabular">{formatKg(totalKg)}</td>
                  <td />
                  <td className="whitespace-nowrap px-3 py-3 text-right tabular">{formatMoney(totalAmount, currency, { decimals: 2 })}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </Panel>
    </div>
  );
}

// useSearchParams needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={<PageLoader label="Loading purchases…" />}>
      <PurchasesPage />
    </Suspense>
  );
}
