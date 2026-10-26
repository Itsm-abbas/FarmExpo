"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { LuChevronDown, LuChevronRight, LuFileSpreadsheet, LuPlus } from "react-icons/lu";
import axiosInstance from "@utils/axiosConfig";
import useSession from "@hooks/useSession";
import { listQueries, queryKeys, toSearch } from "@hooks/queries";
import { formatMoney } from "@utils/money";
import { daysBefore, formatDay, formatKg, today } from "@utils/days";
import { Button, Field, PageHeader, Panel, inputClass } from "@components/Page";
import PageLoader from "@components/Loader/PageLoader";

// "Ali, Bashir and 2 more"
function names(traders) {
  const list = traders.map((t) => t.name);
  if (list.length <= 3) return list.join(", ");
  return `${list.slice(0, 2).join(", ")} and ${list.length - 2} more`;
}

export default function DailyPricesPage() {
  const { currency, organization, isLoading: sessionLoading } = useSession();
  const [filters, setFilters] = useState(() => ({
    from: daysBefore(today(), 13),
    to: today(),
    commodityId: "",
  }));
  const [open, setOpen] = useState(() => new Set());
  const [exporting, setExporting] = useState(false);

  const { data: commodities = [], isLoading: commoditiesLoading } = useQuery(
    listQueries.commodities
  );
  const { data: rows = [], isLoading, isFetching, isError } = useQuery({
    queryKey: [...queryKeys.dailyPrices, filters],
    queryFn: async () =>
      (await axiosInstance.get(`/purchases/daily?${toSearch(filters)}`)).data,
    placeholderData: (previous) => previous,
  });

  const setFilter = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  const toggle = (key) =>
    setOpen((current) => {
      const next = new Set(current);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const exportExcel = async () => {
    setExporting(true);
    try {
      const { exportDailyPricesExcel } = await import("@utils/excel");
      exportDailyPricesExcel({
        rows,
        organization,
        currency,
        from: filters.from,
        to: filters.to,
        filename: `daily-prices-${filters.from || "start"}-to-${filters.to || today()}.xlsx`,
      });
    } finally {
      setExporting(false);
    }
  };

  if (sessionLoading || commoditiesLoading) {
    return <PageLoader label="Loading the daily price list…" />;
  }

  // Rows arrive newest day first; group them by day for display.
  const days = [];
  for (const row of rows) {
    if (days.at(-1)?.date !== row.date) days.push({ date: row.date, rows: [] });
    days.at(-1).rows.push(row);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Daily price list"
        description="What each commodity cost per kg on each day, from everything bought that day: the total paid divided by the total kilograms."
        actions={
          <>
            <Button variant="secondary" onClick={exportExcel} loading={exporting} disabled={!rows.length || isFetching}>
              <LuFileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Link
              href="/purchases"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent"
            >
              <LuPlus className="h-4 w-4" /> Record a purchase
            </Link>
          </>
        }
      />

      <div className="grid gap-3 rounded-xl border border-text/10 bg-surface p-4 sm:grid-cols-3 sm:p-5">
        <Field label="From" htmlFor="from">
          <input id="from" name="from" type="date" value={filters.from} onChange={setFilter} className={inputClass} />
        </Field>
        <Field label="To" htmlFor="to">
          <input id="to" name="to" type="date" value={filters.to} onChange={setFilter} className={inputClass} />
        </Field>
        <Field label="Commodity" htmlFor="commodityId">
          <select id="commodityId" name="commodityId" value={filters.commodityId} onChange={setFilter} className={inputClass}>
            <option value="">All commodities</option>
            {commodities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
      </div>

      {isLoading ? (
        <PageLoader label="Working out the averages…" />
      ) : isError ? (
        <p role="alert" className="text-sm text-red-600">
          Couldn't load the price list. Check your connection and try again.
        </p>
      ) : days.length === 0 ? (
        <div className="rounded-xl border border-dashed border-text/20 px-6 py-12 text-center">
          <p className="text-text/70">No purchases in this period.</p>
          <p className="mt-1 text-sm text-text/55">
            Record what you buy from farmers and the averages appear here, day by day.
          </p>
        </div>
      ) : (
        <div className={`space-y-5 transition-opacity ${isFetching ? "opacity-60" : ""}`} aria-busy={isFetching}>
          {days.map((day) => (
            <Panel
              key={day.date}
              title={formatDay(day.date, { weekday: "long", month: "long" })}
              description={`${day.rows.reduce((n, r) => n + r.purchases.length, 0)} purchase(s), ${formatMoney(
                day.rows.reduce((s, r) => s + r.amount, 0),
                currency,
                { decimals: 2 }
              )} paid`}
            >
              <div className="-mx-5 overflow-x-auto sm:-mx-6">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="whitespace-nowrap text-left text-xs text-text/55">
                      <th className="py-2 pl-5 pr-3 font-medium sm:pl-6">Commodity</th>
                      <th className="px-3 py-2 font-medium">Bought from</th>
                      <th className="px-3 py-2 text-right font-medium">Quantity</th>
                      <th className="px-3 py-2 text-right font-medium">Total paid</th>
                      <th className="px-3 py-2 text-right font-medium">Average / kg</th>
                      <th className="py-2 pl-3 pr-5 text-right font-medium sm:pr-6">Lowest – highest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-text/10 border-t border-text/10">
                    {day.rows.map((row) => {
                      const key = `${row.date}-${row.commodity.id}`;
                      const expanded = open.has(key);
                      return (
                        <Fragment key={key}>
                          <tr className="hover:bg-text/[0.02]">
                            <td className="py-3 pl-5 pr-3 sm:pl-6">
                              <button
                                type="button"
                                onClick={() => toggle(key)}
                                aria-expanded={expanded}
                                className="flex items-center gap-1.5 font-medium text-text hover:text-primary"
                              >
                                {expanded ? <LuChevronDown className="h-4 w-4" /> : <LuChevronRight className="h-4 w-4" />}
                                {row.commodity.name}
                                {row.commodity.number && (
                                  <span className="text-xs font-normal text-text/45">{row.commodity.number}</span>
                                )}
                              </button>
                            </td>
                            <td className="px-3 py-3 text-text/75">
                              {names(row.traders)}
                              <span className="ml-1 text-text/45">({row.purchases.length})</span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-right tabular text-text">{formatKg(row.quantity)}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-right tabular text-text">{formatMoney(row.amount, currency, { decimals: 2 })}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-right">
                              <span className="font-display text-lg font-semibold tabular text-primary">
                                {formatMoney(row.averageRate, currency, { decimals: 2 })}
                              </span>
                            </td>
                            <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right tabular text-text/65 sm:pr-6">
                              {row.minRate === row.maxRate
                                ? formatMoney(row.minRate, currency)
                                : `${formatMoney(row.minRate, currency)} – ${formatMoney(row.maxRate, null)}`}
                            </td>
                          </tr>
                          {expanded &&
                            row.purchases.map((p) => (
                              <tr key={p.id} className="bg-text/[0.025] text-text/75">
                                <td className="py-2 pl-12 pr-3 text-xs sm:pl-[3.25rem]">
                                  <Link href={`/purchases?edit=${p.id}`} className="hover:text-primary hover:underline">
                                    Purchase #{p.id}
                                  </Link>
                                </td>
                                <td className="px-3 py-2">
                                  {p.trader.name}
                                  {p.notes && <span className="ml-2 text-xs text-text/50">{p.notes}</span>}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-right tabular">{formatKg(p.quantity)}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-right tabular">{formatMoney(p.amount, currency, { decimals: 2 })}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-right tabular">{formatMoney(p.rate, currency)}</td>
                                <td className="py-2 pl-3 pr-5 sm:pr-6" />
                              </tr>
                            ))}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
