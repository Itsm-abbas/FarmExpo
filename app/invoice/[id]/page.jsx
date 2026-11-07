"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { markConsignmentChanged, queryKeys, useConsignment } from "@hooks/queries";
import {
  LuArrowLeft,
  LuDownload,
  LuFileSpreadsheet,
  LuPrinter,
} from "react-icons/lu";
import axiosInstance from "@utils/axiosConfig";
import useSession from "@hooks/useSession";
import {
  computeCommercialInvoice,
  computeInvoice,
  defaultCommercialCurrency,
  pricePerUnit,
  formatDate,
  formatKg,
  suggestedSaleRate,
} from "@utils/invoice";
import { formatMoney } from "@utils/money";
import { INVOICE_TEMPLATES } from "@constants/invoiceTemplates";
import { Button, CurrencySelect, PageHeader, Panel } from "@components/Page";
import DataLoader from "@components/Loader/dataLoader";

const money = (value, currency) => formatMoney(value, currency, { decimals: 2 });
const qty = (n) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const sameCode = (a, b) => (a || "").toUpperCase() === (b || "").toUpperCase();

const KINDS = [
  {
    id: "local",
    label: "Local invoice",
    hint: "Purchase rates, financial instruments, costs and profit. For your own records.",
  },
  {
    id: "commercial",
    label: "Commercial invoice",
    hint: "Selling rates in the buyer's currency and the consignee's account. For the consignee.",
  },
];

function Figure({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-text/10 bg-surface px-4 py-3">
      <p className="text-xs text-text/55">{label}</p>
      <p
        className={`mt-0.5 font-display text-xl font-semibold tabular ${
          tone === "good" ? "text-primary" : tone === "bad" ? "text-red-600" : "text-text"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// A label/value line inside the paper preview.
function Line({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between gap-4 py-0.5">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="mb-2 font-display text-base font-semibold text-gray-900">{children}</h3>;
}

// Header, title and parties: the same on both invoices.
function PaperTop({ title, invoice, organization, onLetterhead }) {
  const awb = invoice.airwayBill;
  const t = invoice.trader;
  const c = invoice.consignee;
  return (
    <>
      {!onLetterhead && (
        <header className="flex flex-col gap-4 border-b border-gray-900 pb-5 sm:flex-row sm:items-center">
          {organization?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={organization.logoUrl} alt="" className="h-14 w-auto max-w-[8rem] object-contain" />
          )}
          <div>
            <p className="font-display text-xl font-bold text-gray-900">{organization?.name}</p>
            <p className="flex flex-wrap gap-x-4 text-xs text-gray-500">
              {[organization?.address, organization?.ntn && `NTN ${organization.ntn}`, organization?.phone, organization?.email]
                .filter(Boolean)
                .map((part) => (
                  <span key={part}>{part}</span>
                ))}
            </p>
          </div>
        </header>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="font-display text-2xl font-semibold text-gray-900">{title}</h2>
        <dl className="min-w-[14rem] text-sm">
          <Line label="Invoice no." value={invoice.invoiceNumber} />
          <Line label="Date" value={formatDate(invoice.date)} />
          <Line label="Consignment" value={invoice.number} />
          <Line label="Airway bill" value={awb?.number} />
        </dl>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { heading: "Trader", name: t?.name, lines: [t?.address, t?.country, t?.ntn && `NTN ${t.ntn}`] },
          { heading: "Consignee", name: c?.name, lines: [c?.address, [c?.station, c?.country].filter(Boolean).join(", "), c?.ntn && `NTN ${c.ntn}`] },
        ].map((p) => (
          <div key={p.heading} className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500">{p.heading}</p>
            <p className="mt-1 font-semibold text-gray-900">{p.name || "Not set"}</p>
            {p.lines.filter(Boolean).map((line, i) => (
              <p key={i} className="text-gray-600">{line}</p>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function Shipment({ invoice }) {
  const awb = invoice.airwayBill;
  const gd = invoice.goodsDeclaration;
  // GD amounts are in the financial instrument's currency (older GDs: the consignee's).
  const foreign = gd?.currency || invoice.consigneeCurrency;
  if (!awb && !gd) return null;
  return (
    <section>
      <SectionTitle>Shipment</SectionTitle>
      <dl className="grid gap-x-10 sm:grid-cols-2">
        <div>
          <Line label="Airway bill" value={awb?.number} />
          <Line label="IATA agent" value={[awb?.agent, awb?.station].filter(Boolean).join(", ")} />
          <Line label="Flight date" value={formatDate(awb?.date)} />
          <Line label="Chargeable weight" value={awb && formatKg(awb.weight)} />
        </div>
        <div>
          <Line label="Goods declaration" value={gd?.number} />
          <Line label="GD date" value={formatDate(gd?.date)} />
          <Line label="FOB" value={gd && money(gd.fob, foreign)} />
          <Line label="Freight" value={gd && money(gd.freight, foreign)} />
          <Line label="CFR" value={gd && money(gd.cfr, foreign)} />
        </div>
      </dl>
    </section>
  );
}

// Goods table; `rows` carry `rate` and `amount` in `currency`. `boxPrice`
// adds the packaging cost per box (local invoice only).
function GoodsTable({ rows, totals, total, currency, boxPrice = false }) {
  if (rows.length === 0) return <p className="text-gray-500">No items on this consignment yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100 text-left text-xs text-gray-600">
            <th className="px-2 py-2 font-semibold">#</th>
            <th className="px-2 py-2 font-semibold">Item</th>
            <th className="px-2 py-2 font-semibold">Packaging</th>
            <th className="px-2 py-2 text-right font-semibold">Qty</th>
            <th className="px-2 py-2 text-right font-semibold">Net kg</th>
            <th className="px-2 py-2 text-right font-semibold">Gross kg</th>
            <th className="px-2 py-2 text-right font-semibold">Rate / kg ({currency})</th>
            {boxPrice && <th className="px-2 py-2 text-right font-semibold">Box price ({currency})</th>}
            <th className="px-2 py-2 text-right font-semibold">Price / qty ({currency})</th>
            <th className="px-2 py-2 text-right font-semibold">Amount ({currency})</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {rows.map((g) => (
            <tr key={g.id ?? g.index} className="border-b border-gray-200">
              <td className="px-2 py-2 text-gray-500">{g.index}</td>
              <td className="px-2 py-2 font-medium text-gray-900">{g.name}</td>
              <td className="px-2 py-2">{g.packaging}</td>
              <td className="px-2 py-2 text-right">{g.quantity.toLocaleString("en-US")}</td>
              <td className="px-2 py-2 text-right">{qty(g.netWeight)}</td>
              <td className="px-2 py-2 text-right">{qty(g.grossWeight)}</td>
              <td className="px-2 py-2 text-right">{money(g.rate)}</td>
              {boxPrice && <td className="px-2 py-2 text-right">{money(g.packagingPerUnit)}</td>}
              <td className="px-2 py-2 text-right">{money(pricePerUnit(g))}</td>
              <td className="px-2 py-2 text-right font-medium text-gray-900">{money(g.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="tabular">
          <tr className="border-t-2 border-gray-900 font-semibold text-gray-900">
            <td className="px-2 py-2" />
            <td className="px-2 py-2">Total</td>
            <td className="px-2 py-2" />
            <td className="px-2 py-2 text-right">{totals.quantity.toLocaleString("en-US")}</td>
            <td className="px-2 py-2 text-right">{qty(totals.netWeight)}</td>
            <td className="px-2 py-2 text-right">{qty(totals.grossWeight)}</td>
            <td className="px-2 py-2" />
            {boxPrice && <td className="px-2 py-2" />}
            <td className="px-2 py-2" />
            <td className="px-2 py-2 text-right">{money(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function Notes({ organization }) {
  if (!organization?.invoiceNotes) return null;
  return (
    <section>
      <h3 className="mb-1 font-display text-base font-semibold text-gray-900">Notes</h3>
      <p className="whitespace-pre-line text-gray-700">{organization.invoiceNotes}</p>
    </section>
  );
}

// The commercial invoice's currency and selling rates, saved with the
// consignment. Starts from the saved values, or suggestions for new ones.
function useCommercialDraft(invoice, baseCurrency) {
  const initial = useMemo(() => {
    if (!invoice) return null;
    const currency = defaultCommercialCurrency(invoice, baseCurrency);
    const rates = {};
    for (const g of invoice.goods) {
      const rate = g.saleRate ?? suggestedSaleRate(g, invoice, currency, baseCurrency);
      rates[g.id] = rate === null || rate === undefined ? "" : String(rate);
    }
    // Bill the invoice total to the consignee unless they are billed
    // something else already, or their ledger is in another currency.
    const savedTotal = computeCommercialInvoice(invoice, {
      currency,
      rates: Object.fromEntries(invoice.goods.map((g) => [g.id, g.saleRate ?? 0])),
    }).total;
    const billConsignee =
      Boolean(invoice.consignee) &&
      sameCode(invoice.consigneeCurrency, currency) &&
      (!invoice.consigneeAmount || Math.abs(invoice.consigneeAmount - savedTotal) < 0.005);
    return { currency, rates, billConsignee };
  }, [invoice, baseCurrency]);

  const [draft, setDraft] = useState(null);
  const [draftFor, setDraftFor] = useState(null);
  if (initial && draftFor !== initial) {
    setDraftFor(initial);
    setDraft(initial);
  }

  const dirty =
    Boolean(invoice && draft) &&
    (!invoice.commercialCurrency ||
      draft.currency !== invoice.commercialCurrency ||
      invoice.goods.some((g) => {
        const value = draft.rates[g.id];
        const drafted = value === "" ? null : Number(value);
        return drafted !== g.saleRate;
      }));

  const setCurrency = (currency) =>
    setDraft((d) => {
      // Rates still at their suggestion follow the new currency.
      const rates = { ...d.rates };
      for (const g of invoice.goods) {
        const before = suggestedSaleRate(g, invoice, d.currency, baseCurrency);
        if (rates[g.id] === (before === null ? "" : String(before))) {
          const after = suggestedSaleRate(g, invoice, currency, baseCurrency);
          rates[g.id] = after === null ? "" : String(after);
        }
      }
      const canBill = Boolean(invoice.consignee) && sameCode(invoice.consigneeCurrency, currency);
      return { ...d, currency, rates, billConsignee: canBill && d.billConsignee };
    });
  const setRate = (id, value) => setDraft((d) => ({ ...d, rates: { ...d.rates, [id]: value } }));
  const setBill = (billConsignee) => setDraft((d) => ({ ...d, billConsignee }));

  return { draft, dirty, setCurrency, setRate, setBill };
}

function InvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const kind = searchParams.get("type") === "commercial" ? "commercial" : "local";
  const queryClient = useQueryClient();
  const { organization, currency, isAdmin, isLoading: sessionLoading } = useSession();
  const [includeCosts, setIncludeCosts] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const { data: consignment, isLoading, isFetching, isError } = useConsignment(id);
  const { data: accountData, isFetching: accountFetching } = useQuery({
    queryKey: queryKeys.consignmentAccount(id),
    queryFn: async () => (await axiosInstance.get(`/consignment/${id}/commercial`)).data,
    enabled: Boolean(id) && kind === "commercial",
  });
  const account = accountData?.account || null;

  const invoice = useMemo(
    () => (consignment ? computeInvoice(consignment) : null),
    [consignment]
  );
  const { draft, dirty, setCurrency, setRate, setBill } = useCommercialDraft(
    sessionLoading ? null : invoice,
    currency
  );
  const commercial = useMemo(
    () =>
      invoice && draft
        ? computeCommercialInvoice(invoice, { currency: draft.currency, rates: draft.rates, account })
        : null,
    [invoice, draft, account]
  );

  const saveRates = useMutation({
    mutationFn: async () =>
      (
        await axiosInstance.put(`/consignment/${id}/commercial`, {
          currency: draft.currency,
          rates: invoice.goods.map((g) => ({ id: g.id, saleRate: draft.rates[g.id] })),
          billConsignee: draft.billConsignee,
        })
      ).data,
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.consignment(id), updated);
      markConsignmentChanged(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.consignmentAccount(id) });
      setError("");
      setSaved(
        draft.billConsignee
          ? "Rates saved. The invoice total is now the consignee's bill on their ledger."
          : "Rates saved."
      );
    },
    onError: (err) => setError(err.message || "Couldn't save the rates. Try again."),
  });

  // Files are made only from the saved figures and the organization's
  // template, never from a copy that is still being refreshed. The
  // financial instruments come with the consignment.
  const ready =
    !isFetching &&
    !sessionLoading &&
    (kind === "local" || (!dirty && !accountFetching && !saveRates.isPending));

  const template =
    INVOICE_TEMPLATES.find((t) => t.id === organization?.invoiceTemplate) ||
    INVOICE_TEMPLATES[0];
  const onLetterhead = Boolean(organization?.useLetterhead && organization?.letterheadUrl);
  const baseName = invoice
    ? `${kind === "commercial" ? "commercial" : "local"}-invoice-${invoice.invoiceNumber}`
    : "invoice";

  const buildPdf = async () => {
    const pdf = await import("@utils/pdf");
    const branding = await pdf.loadBranding(organization);
    return {
      pdf,
      bytes: await pdf.buildInvoicePdf({
        invoice,
        organization,
        branding,
        currency,
        includeCosts,
        commercial: kind === "commercial" ? commercial : null,
      }),
    };
  };

  const run = async (task, label) => {
    setError("");
    setSaved("");
    setBusy(label);
    try {
      await task();
    } catch (err) {
      console.error(err);
      setError(err.message || "Couldn't create the file. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const downloadPdf = () =>
    run(async () => {
      const { pdf, bytes } = await buildPdf();
      pdf.downloadFile(bytes, `${pdf.fileSlug(baseName)}.pdf`);
    }, "pdf");

  const printPdf = () =>
    run(async () => {
      const pdf = await import("@utils/pdf");
      await pdf.openPdfInNewTab(async () => (await buildPdf()).bytes);
    }, "print");

  const downloadExcel = () =>
    run(async () => {
      const [{ exportInvoiceExcel }, { fileSlug }] = await Promise.all([
        import("@utils/excel"),
        import("@utils/pdf"),
      ]);
      exportInvoiceExcel({
        invoice,
        organization,
        currency,
        includeCosts,
        commercial: kind === "commercial" ? commercial : null,
        filename: `${fileSlug(baseName)}.xlsx`,
      });
    }, "excel");

  const switchKind = (next) => {
    setError("");
    setSaved("");
    router.replace(next === "commercial" ? `/invoice/${id}?type=commercial` : `/invoice/${id}`, {
      scroll: false,
    });
  };

  if (isLoading) return <DataLoader />;
  if (isError || !invoice) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <PageHeader
          title="Invoice not found"
          description="This consignment doesn't exist or you don't have access to it."
        />
      </div>
    );
  }

  const current = KINDS.find((k) => k.id === kind);
  const canBill = Boolean(invoice.consignee) && draft && sameCode(invoice.consigneeCurrency, draft.currency);
  const localRows = invoice.goods.map((g) => ({ ...g, rate: g.ratePerKg, amount: g.goodsCost }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
      <Link
        href={`/startconsignment/${invoice.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text/60 hover:text-text"
      >
        <LuArrowLeft className="h-4 w-4" /> Consignment {invoice.number}
      </Link>

      <PageHeader
        title={`${current.label} ${invoice.invoiceNumber}`}
        description={`Consignment ${invoice.number}, ${formatDate(invoice.date)}`}
        actions={
          <>
            <Button variant="secondary" onClick={printPdf} loading={busy === "print"} disabled={!ready}>
              <LuPrinter className="h-4 w-4" /> Print
            </Button>
            <Button variant="secondary" onClick={downloadExcel} loading={busy === "excel"} disabled={!ready}>
              <LuFileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Button onClick={downloadPdf} loading={busy === "pdf"} disabled={!ready}>
              <LuDownload className="h-4 w-4" /> Download PDF
            </Button>
          </>
        }
      />

      <div role="tablist" aria-label="Invoice" className="grid gap-2 sm:grid-cols-2">
        {KINDS.map((k) => {
          const active = k.id === kind;
          return (
            <button
              key={k.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchKind(k.id)}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                active
                  ? "border-primary bg-primary/10"
                  : "border-text/10 bg-surface hover:bg-text/5"
              }`}
            >
              <span className={`block text-sm font-semibold ${active ? "text-primary" : "text-text"}`}>
                {k.label}
              </span>
              <span className="mt-0.5 block text-xs text-text/60">{k.hint}</span>
            </button>
          );
        })}
      </div>

      {!ready && !(kind === "commercial" && dirty) && (
        <p role="status" className="flex items-center gap-2 text-sm text-text/60">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          Getting the latest figures. Downloads are ready in a moment.
        </p>
      )}

      {kind === "local" ? (
        <div className="flex flex-col gap-3 rounded-xl border border-text/10 bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2.5 text-sm text-text">
            <input
              type="checkbox"
              checked={includeCosts}
              onChange={(e) => setIncludeCosts(e.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--color-primary))]"
            />
            Include costs and profit
          </label>
          <TemplateNote template={template} onLetterhead={onLetterhead} isAdmin={isAdmin} />
        </div>
      ) : (
        draft && (
          <Panel
            title="Selling rates"
            description={`What the consignee pays per kg. Purchase rates (${currency}) stay on the local invoice only.`}
            footer={
              <>
                {dirty && !saveRates.isPending && (
                  <p className="mr-auto text-sm text-amber-700 dark:text-amber-300">
                    Save the rates to print or download this invoice.
                  </p>
                )}
                {saved && !dirty && (
                  <p role="status" className="mr-auto text-sm text-primary">{saved}</p>
                )}
                <Button onClick={() => saveRates.mutate()} loading={saveRates.isPending}>
                  Save rates
                </Button>
              </>
            }
          >
            <div className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-start">
              <div>
                <label htmlFor="commercial-currency" className="mb-1.5 block text-sm font-medium text-text">
                  Invoice currency
                </label>
                <CurrencySelect
                  id="commercial-currency"
                  value={draft.currency}
                  onChange={(e) => setCurrency(e.target.value)}
                />
                {invoice.goodsDeclaration?.exchangeRate > 0 && invoice.goodsDeclaration.currency && (
                  <p className="mt-1.5 text-xs text-text/55">
                    GD rate: {currency} {invoice.goodsDeclaration.exchangeRate} per {invoice.goodsDeclaration.currency}
                  </p>
                )}
              </div>
              {invoice.goods.length === 0 ? (
                <p className="text-sm text-text/60">Add items to the consignment to price them.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="border-b border-text/10 text-left text-xs text-text/55">
                        <th className="py-2 pr-3 font-medium">Item</th>
                        <th className="px-3 py-2 text-right font-medium">Net kg</th>
                        <th className="px-3 py-2 text-right font-medium">Bought at ({currency})</th>
                        <th className="py-2 pl-3 text-right font-medium">Sell at ({draft.currency}) / kg</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-text/10">
                      {invoice.goods.map((g) => (
                        <tr key={g.id}>
                          <td className="py-2 pr-3 text-text">{g.name}</td>
                          <td className="px-3 py-2 text-right tabular text-text/75">{qty(g.netWeight)}</td>
                          <td className="px-3 py-2 text-right tabular text-text/75">{money(g.ratePerKg)}</td>
                          <td className="py-2 pl-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              inputMode="decimal"
                              aria-label={`Selling rate per kg for ${g.name}`}
                              value={draft.rates[g.id]}
                              onChange={(e) => setRate(g.id, e.target.value)}
                              className="w-32 rounded-lg border border-text/15 bg-surface px-3 py-1.5 text-right text-sm tabular text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="mt-4 border-t border-text/10 pt-4">
              {canBill ? (
                <label className="flex items-start gap-2.5 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={draft.billConsignee}
                    onChange={(e) => setBill(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[rgb(var(--color-primary))]"
                  />
                  <span>
                    Bill {money(commercial.total, draft.currency)} to {invoice.consignee.name}&apos;s ledger
                    <span className="block text-text/55">
                      {invoice.consigneeAmount
                        ? `Currently billed ${money(invoice.consigneeAmount, invoice.consigneeCurrency)}.`
                        : "Nothing is billed for this consignment yet."}
                    </span>
                  </span>
                </label>
              ) : (
                <p className="text-sm text-text/60">
                  {invoice.consignee
                    ? `${invoice.consignee.name}'s ledger is in ${invoice.consigneeCurrency}, so this total isn't posted to it. Their bill stays as entered on the consignment.`
                    : "Choose the consignee on the consignment to show their account on this invoice."}
                </p>
              )}
            </div>
          </Panel>
        )
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      {kind === "local" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Figure label="Total cost" value={money(invoice.totalCost, currency)} />
          <Figure
            label={`Recovered${invoice.recovery ? ` (${invoice.recovery.currency} at ${invoice.recovery.exchangeRate})` : ""}`}
            value={money(invoice.recovery?.local || 0, currency)}
          />
          <Figure
            label={invoice.result >= 0 ? "Profit" : "Loss"}
            value={money(Math.abs(invoice.result), currency)}
            tone={invoice.result >= 0 ? "good" : "bad"}
          />
        </div>
      ) : (
        commercial && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Figure label="Invoice total" value={money(commercial.total, commercial.currency)} />
            <Figure
              label="Total bill (with previous balance)"
              value={account ? money(account.totalBill, account.currency) : "—"}
            />
            <Figure
              label="Outstanding today"
              value={account ? money(account.outstanding, account.currency) : "—"}
              tone={account && account.outstanding > 0 ? "bad" : undefined}
            />
          </div>
        )
      )}

      {kind === "commercial" && (
        <div className="flex justify-end">
          <TemplateNote template={template} onLetterhead={onLetterhead} isAdmin={isAdmin} />
        </div>
      )}

      {/* Paper preview: always printed colors, whatever the app theme. */}
      <article className="overflow-hidden rounded-xl border border-text/10 bg-white text-[13px] leading-relaxed text-gray-800 shadow-sm">
        <div className="space-y-7 p-6 sm:p-10">
          <PaperTop
            title={kind === "commercial" ? "Commercial invoice" : "Local invoice"}
            invoice={invoice}
            organization={organization}
            onLetterhead={onLetterhead}
          />
          {kind !== "commercial" && <Shipment invoice={invoice} />}

          <section>
            <SectionTitle>Goods</SectionTitle>
            {kind === "commercial" && commercial ? (
              <GoodsTable rows={commercial.goods} totals={invoice.totals} total={commercial.total} currency={commercial.currency} />
            ) : (
              <GoodsTable rows={localRows} totals={invoice.totals} total={invoice.totals.goodsCost} currency={currency} boxPrice />
            )}
          </section>

          {kind === "local" && invoice.utilizations.length > 0 && (
            <section>
              <SectionTitle>Financial instruments used</SectionTitle>
              <dl className="max-w-md">
                {invoice.utilizations.map((u, i) => (
                  <Line key={i} label={u.bank ? `${u.number} (${u.bank})` : u.number} value={`${money(u.utilized, u.currency)} of ${money(u.amount, u.currency)}`} />
                ))}
              </dl>
            </section>
          )}

          {kind === "local" && includeCosts && (
            <section>
              <SectionTitle>Costs and result</SectionTitle>
              <dl className="max-w-md tabular">
                {invoice.costs.map((row) => (
                  <Line key={row.key} label={row.detail ? `${row.label} (${row.detail})` : row.label} value={money(row.amount, currency)} />
                ))}
                <div className="mt-1 flex justify-between border-t border-gray-300 pt-1 font-semibold text-gray-900">
                  <span>Total cost</span>
                  <span>{money(invoice.totalCost, currency)}</span>
                </div>
                <Line
                  label={invoice.recovery ? `Recovered (${money(invoice.recovery.amount, invoice.recovery.currency)} at ${invoice.recovery.exchangeRate})` : "Recovered"}
                  value={money(invoice.recovery?.local || 0, currency)}
                />
                <div className={`mt-1 flex justify-between border-t-2 border-gray-900 pt-1 font-bold ${invoice.result >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  <span>{invoice.result >= 0 ? "Profit" : "Loss"}</span>
                  <span>{money(Math.abs(invoice.result), currency)}</span>
                </div>
              </dl>
            </section>
          )}

          {kind === "commercial" && account && (
            <section>
              <SectionTitle>Account of {account.name}</SectionTitle>
              <dl className="max-w-md tabular">
                <Line label="Previous balance" value={money(account.previousBalance, account.currency)} />
                <Line label="Current bill (this invoice)" value={money(account.currentBill, account.currency)} />
                <div className="mt-1 flex justify-between border-t border-gray-300 pt-1 font-semibold text-gray-900">
                  <span>Total bill</span>
                  <span>{money(account.totalBill, account.currency)}</span>
                </div>
                <div className="mt-1 flex justify-between border-t-2 border-gray-900 pt-1 font-bold text-gray-900">
                  <span>Outstanding balance as of {formatDate(new Date())}</span>
                  <span>{money(account.outstanding, account.currency)}</span>
                </div>
              </dl>
              {!account.posted && (
                <p className="mt-2 text-xs text-gray-500">
                  This invoice isn&apos;t on the consignee&apos;s ledger yet, so the outstanding balance doesn&apos;t include it.
                </p>
              )}
            </section>
          )}

          <Notes organization={organization} />
        </div>
      </article>
    </div>
  );
}

function TemplateNote({ template, onLetterhead, isAdmin }) {
  return (
    <p className="text-sm text-text/60">
      {template.name} template{onLetterhead ? ", on your letterhead" : ""}
      {isAdmin && (
        <>
          {" "}
          <Link href="/settings/organization#invoices" className="font-medium text-primary hover:underline">
            Change
          </Link>
        </>
      )}
    </p>
  );
}

// useSearchParams needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={<DataLoader />}>
      <InvoicePage />
    </Suspense>
  );
}
