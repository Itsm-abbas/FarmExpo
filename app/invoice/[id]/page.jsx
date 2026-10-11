"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { listQueries, useConsignment } from "@hooks/queries";
import {
  LuArrowLeft,
  LuDownload,
  LuFileSpreadsheet,
  LuPrinter,
} from "react-icons/lu";
import useSession from "@hooks/useSession";
import { computeInvoice, formatDate, formatKg } from "@utils/invoice";
import { formatMoney } from "@utils/money";
import { INVOICE_TEMPLATES } from "@constants/invoiceTemplates";
import { Button, PageHeader } from "@components/Page";
import DataLoader from "@components/Loader/dataLoader";

const money = (value, currency) => formatMoney(value, currency, { decimals: 2 });

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

export default function InvoicePage() {
  const { id } = useParams();
  const { organization, currency, isAdmin, isLoading: sessionLoading } = useSession();
  const [includeCosts, setIncludeCosts] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const { data: consignment, isLoading, isFetching, isError } = useConsignment(id);
  const { data: utilizations = [], isFetching: utilizationsFetching } = useQuery(
    listQueries.utilization
  );
  // Files are made only from the saved figures and the organization's
  // template, never from a copy that is still being refreshed.
  const ready = !isFetching && !utilizationsFetching && !sessionLoading;

  const invoice = useMemo(
    () => (consignment ? computeInvoice(consignment, utilizations) : null),
    [consignment, utilizations]
  );

  const template =
    INVOICE_TEMPLATES.find((t) => t.id === organization?.invoiceTemplate) ||
    INVOICE_TEMPLATES[0];
  const onLetterhead = Boolean(organization?.useLetterhead && organization?.letterheadUrl);
  const baseName = invoice ? `invoice-${invoice.invoiceNumber}` : "invoice";

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
      }),
    };
  };

  const run = async (kind, task) => {
    setError("");
    setBusy(kind);
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
    run("pdf", async () => {
      const { pdf, bytes } = await buildPdf();
      pdf.downloadFile(bytes, `${pdf.fileSlug(baseName)}.pdf`);
    });

  const printPdf = () =>
    run("print", async () => {
      const pdf = await import("@utils/pdf");
      await pdf.openPdfInNewTab(async () => (await buildPdf()).bytes);
    });

  const downloadExcel = () =>
    run("excel", async () => {
      const [{ exportInvoiceExcel }, { fileSlug }] = await Promise.all([
        import("@utils/excel"),
        import("@utils/pdf"),
      ]);
      exportInvoiceExcel({
        invoice,
        organization,
        currency,
        includeCosts,
        filename: `${fileSlug(baseName)}.xlsx`,
      });
    });

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

  const awb = invoice.airwayBill;
  const gd = invoice.goodsDeclaration;
  const foreign = invoice.consigneeCurrency;
  const t = invoice.trader;
  const c = invoice.consignee;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
      <Link
        href={`/startconsignment/${invoice.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text/60 hover:text-text"
      >
        <LuArrowLeft className="h-4 w-4" /> Consignment #{invoice.id}
      </Link>

      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description={`Consignment #${invoice.id}, ${formatDate(invoice.date)}`}
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

      {!ready && (
        <p role="status" className="flex items-center gap-2 text-sm text-text/60">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          Getting the latest figures. Downloads are ready in a moment.
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-text/10 bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2.5 text-sm text-text">
          <input
            type="checkbox"
            checked={includeCosts}
            onChange={(e) => setIncludeCosts(e.target.checked)}
            className="h-4 w-4 accent-[rgb(var(--color-primary))]"
          />
          Include costs and profit
          <span className="text-text/50">(turn off for copies you send out)</span>
        </label>
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
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

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

      {/* Paper preview: always printed colors, whatever the app theme. */}
      <article className="overflow-hidden rounded-xl border border-text/10 bg-white text-[13px] leading-relaxed text-gray-800 shadow-sm">
        <div className="space-y-7 p-6 sm:p-10">
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
            <h2 className="font-display text-2xl font-semibold text-gray-900">Commercial invoice</h2>
            <dl className="min-w-[14rem] text-sm">
              <Line label="Invoice no." value={invoice.invoiceNumber} />
              <Line label="Date" value={formatDate(invoice.date)} />
              <Line label="Consignment" value={`#${invoice.id}`} />
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

          {(awb || gd) && (
            <section>
              <h3 className="mb-2 font-display text-base font-semibold text-gray-900">Shipment</h3>
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
          )}

          <section>
            <h3 className="mb-2 font-display text-base font-semibold text-gray-900">Goods</h3>
            {invoice.goods.length === 0 ? (
              <p className="text-gray-500">No items on this consignment yet.</p>
            ) : (
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
                      <th className="px-2 py-2 text-right font-semibold">Rate / kg</th>
                      <th className="px-2 py-2 text-right font-semibold">Amount ({currency})</th>
                    </tr>
                  </thead>
                  <tbody className="tabular">
                    {invoice.goods.map((g) => (
                      <tr key={g.id ?? g.index} className="border-b border-gray-200">
                        <td className="px-2 py-2 text-gray-500">{g.index}</td>
                        <td className="px-2 py-2 font-medium text-gray-900">{g.name}</td>
                        <td className="px-2 py-2">{g.packaging}</td>
                        <td className="px-2 py-2 text-right">{g.quantity.toLocaleString("en-US")}</td>
                        <td className="px-2 py-2 text-right">{g.netWeight.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                        <td className="px-2 py-2 text-right">{g.grossWeight.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                        <td className="px-2 py-2 text-right">{money(g.ratePerKg)}</td>
                        <td className="px-2 py-2 text-right font-medium text-gray-900">{money(g.goodsCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="tabular">
                    <tr className="border-t-2 border-gray-900 font-semibold text-gray-900">
                      <td className="px-2 py-2" />
                      <td className="px-2 py-2">Total</td>
                      <td className="px-2 py-2" />
                      <td className="px-2 py-2 text-right">{invoice.totals.quantity.toLocaleString("en-US")}</td>
                      <td className="px-2 py-2 text-right">{invoice.totals.netWeight.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                      <td className="px-2 py-2 text-right">{invoice.totals.grossWeight.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                      <td className="px-2 py-2" />
                      <td className="px-2 py-2 text-right">{money(invoice.totals.goodsCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>

          {invoice.utilizations.length > 0 && (
            <section>
              <h3 className="mb-2 font-display text-base font-semibold text-gray-900">Financial instruments used</h3>
              <dl className="max-w-md">
                {invoice.utilizations.map((u, i) => (
                  <Line key={i} label={u.number} value={`${money(u.utilized, u.currency)} of ${money(u.amount, u.currency)}`} />
                ))}
              </dl>
            </section>
          )}

          {includeCosts && (
            <section>
              <h3 className="mb-2 font-display text-base font-semibold text-gray-900">Costs and result</h3>
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

          {organization?.invoiceNotes && (
            <section>
              <h3 className="mb-1 font-display text-base font-semibold text-gray-900">Notes</h3>
              <p className="whitespace-pre-line text-gray-700">{organization.invoiceNotes}</p>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
