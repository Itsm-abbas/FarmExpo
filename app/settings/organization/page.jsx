"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LuImage, LuTrash2, LuUpload } from "react-icons/lu";
import useSession, { SESSION_QUERY_KEY } from "@hooks/useSession";
import { brandColors } from "@utils/theme";
import { OrgMark } from "@components/Shell";
import PageLoader from "@components/Loader/PageLoader";
import { INVOICE_TEMPLATES } from "@constants/invoiceTemplates";
import {
  Button,
  CurrencySelect,
  Field,
  PageHeader,
  Panel,
  inputClass,
} from "@components/Page";

const BRAND_PRESETS = [
  { name: "Orchard", hex: "#1F6F4A" },
  { name: "Ocean", hex: "#1F5F99" },
  { name: "Indigo", hex: "#3B4BA8" },
  { name: "Plum", hex: "#7A3E73" },
  { name: "Terracotta", hex: "#A2442B" },
  { name: "Saffron", hex: "#9A6A00" },
  { name: "Slate", hex: "#334155" },
];

const MAX_LOGO_SIDE = 512;

// Scales the picked image down to at most 512px and re-encodes it as PNG
// (keeps transparency), so logos stay small however large the original was.
function readLogo(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      reject(new Error("Choose a PNG, JPEG or WebP image."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_LOGO_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/png");
      if (dataUrl.length > 680 * 1024) {
        resolve(canvas.toDataURL("image/webp", 0.9));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file couldn't be read as an image."));
    };
    img.src = url;
  });
}

const MAX_LETTERHEAD_BYTES = 3 * 1024 * 1024;

const readAsDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("That file couldn't be read."));
    reader.readAsDataURL(blob);
  });

// A letterhead page: PDF as is, or an image (re-encoded as JPEG at print
// resolution if it is too big to upload).
async function readLetterhead(file) {
  if (file.type === "application/pdf") {
    if (file.size > MAX_LETTERHEAD_BYTES) {
      throw new Error("Make the PDF smaller than 3 MB, or upload it as a PNG or JPEG.");
    }
    return readAsDataUrl(file);
  }
  if (!/^image\/(png|jpeg)$/.test(file.type)) {
    throw new Error("Choose a PDF, PNG or JPEG file.");
  }
  if (file.size <= MAX_LETTERHEAD_BYTES * 0.7) return readAsDataUrl(file);

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("That file couldn't be read as an image."));
      image.src = url;
    });
    const scale = Math.min(1, 2480 / img.width); // A4 width at 300 dpi
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Data used for "Preview a sample invoice".
const SAMPLE_CONSIGNMENT = {
  id: 1024,
  date: new Date().toISOString(),
  status: "Fulfilled",
  dailyExpenses: 8000,
  trader: { name: "Sample Traders (Pvt) Ltd", address: "12 Market Road, Multan", country: "Pakistan", ntn: "1234567-8" },
  consignee: { vendor: { name: "Fresh Fruits LLC", address: "Al Aweer Central Market", station: "DXB", country: "United Arab Emirates", currency: "AED" } },
  airwayBill: { number: "214-55551234", dateTime: new Date().toISOString(), rate: 180, airwayBillWeight: 1300, fee: 15000, iataAgent: { vendor: { name: "Sky Cargo Agents", station: "MUX" } } },
  goodsDeclaration: { id: 1, number: "KAPE-HC-1001", date: new Date().toISOString(), exchangeRate: 76.2, commercialInvoiceNumber: "INV-1024", fob: 8200, gdFreight: 800 },
  customClearance: { fee: 12000, customAgent: { vendor: { name: "Swift Customs" } } },
  packing: { ratePerKg: 12, packer: { vendor: { name: "Valley Packers" } } },
  recoveryDone: { amount: 9500, currency: "AED", exchangeRate: 76.2 },
  goods: [
    { id: 1, commodityItem: { name: "Kinnow mandarin" }, packaging: { name: "Carton 10 kg", packagingWeightPerUnit: "0.8" }, quantity: 100, weightPerUnit: 10, commodityPerUnitCost: 90, packagingPerUnitCost: 120 },
    { id: 2, commodityItem: { name: "Sindhri mango" }, packaging: { name: "Carton 5 kg", packagingWeightPerUnit: "0.5" }, quantity: 40, weightPerUnit: 5, commodityPerUnitCost: 160, packagingPerUnitCost: 90 },
  ],
};

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  address: "",
  ntn: "",
  website: "",
  baseCurrency: "PKR",
  brandColor: "",
  invoiceTemplate: "classic",
  useLetterhead: false,
  letterheadTop: 45,
  letterheadBottom: 30,
  invoiceNotes: "",
};

// Miniature of each template's layout, for the picker.
function TemplateThumb({ id, color }) {
  const bar = "h-1 rounded-full bg-gray-300";
  return (
    <div className="flex h-24 w-full flex-col gap-1.5 overflow-hidden rounded-md border border-gray-200 bg-white p-2">
      {id === "modern" ? (
        <div className="-mx-2 -mt-2 mb-1 h-5" style={{ backgroundColor: color }} />
      ) : (
        <div className="flex items-center gap-1.5 border-b pb-1.5" style={{ borderColor: id === "classic" ? "#111" : "#ddd" }}>
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
          <span className={`${bar} w-1/2`} />
        </div>
      )}
      <span className={`${bar} w-1/3 bg-gray-500`} />
      <div className={`grid grid-cols-4 gap-px ${id === "compact" ? "mt-0" : "mt-1"}`}>
        {Array.from({ length: id === "compact" ? 16 : 12 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 ${i < 4 ? "" : "bg-gray-100"}`}
            style={i < 4 ? { backgroundColor: id === "modern" ? color : "#d1d5db" } : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export default function OrganizationSettings() {
  const queryClient = useQueryClient();
  const { organization, isAdmin, isLoading } = useSession();
  const [form, setForm] = useState(EMPTY);
  // undefined: unchanged, null: remove, string: new data URL
  const [logo, setLogo] = useState(undefined);
  const [letterhead, setLetterhead] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInput = useRef(null);
  const letterheadInput = useRef(null);

  // Filled in during render (not in an effect), so the form never shows
  // empty for a moment; refilled with the saved values after each save.
  const [formFor, setFormFor] = useState(null);
  if (organization && formFor !== organization) {
    setFormFor(organization);
    setForm({
      ...EMPTY,
      ...Object.fromEntries(
        Object.keys(EMPTY).map((k) => [k, organization[k] ?? EMPTY[k]])
      ),
    });
    setLogo(undefined);
    setLetterhead(undefined);
  }

  // The letterhead as it will be saved: a new upload, removed, or the stored one.
  const letterheadType =
    letterhead === undefined
      ? organization?.letterheadType
      : letterhead
      ? /^data:([^;]+);/.exec(letterhead)?.[1]
      : null;
  const letterheadImage =
    letterheadType?.startsWith("image/")
      ? letterhead || organization?.letterheadUrl
      : null;

  const pickLetterhead = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setLetterhead(await readLetterhead(file));
      setForm((f) => ({ ...f, useLetterhead: true }));
      setMessage(null);
    } catch (err) {
      setMessage({ tone: "error", text: err.message });
    }
  };

  const previewSample = async () => {
    setPreviewing(true);
    setMessage(null);
    try {
      const [pdf, { computeInvoice }] = await Promise.all([
        import("@utils/pdf"),
        import("@utils/invoice"),
      ]);
      const draft = {
        ...organization,
        ...form,
        brandColor: form.brandColor || null,
        letterheadTop: Number(form.letterheadTop),
        letterheadBottom: Number(form.letterheadBottom),
      };
      await pdf.openPdfInNewTab(async () => {
        const branding = await pdf.loadBranding(draft, {
          logo: logo === undefined ? undefined : logo,
          useLetterhead: form.useLetterhead && Boolean(letterheadType),
          letterhead: letterhead || undefined,
        });
        return pdf.buildInvoicePdf({
          invoice: computeInvoice(SAMPLE_CONSIGNMENT, []),
          organization: draft,
          branding,
          currency: form.baseCurrency,
        });
      });
    } catch (err) {
      setMessage({ tone: "error", text: err.message || "Couldn't build the preview." });
    } finally {
      setPreviewing(false);
    }
  };

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const pickLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setLogo(await readLogo(file));
      setMessage(null);
    } catch (err) {
      setMessage({ tone: "error", text: err.message });
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          brandColor: form.brandColor || null,
          letterheadTop: Number(form.letterheadTop),
          letterheadBottom: Number(form.letterheadBottom),
          useLetterhead: form.useLetterhead && Boolean(letterheadType),
          ...(logo !== undefined && { logo }),
          ...(letterhead !== undefined && { letterhead }),
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "Couldn't save the changes.");
      queryClient.setQueryData(SESSION_QUERY_KEY, (me) =>
        me ? { ...me, organization: result } : me
      );
      setMessage({ tone: "success", text: "Organization settings saved." });
    } catch (err) {
      setMessage({ tone: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <PageLoader label="Loading organization settings…" />;

  if (organization && !isAdmin) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
        <PageHeader
          title="Organization settings"
          description="Only an admin can change the organization's details and branding."
        />
      </div>
    );
  }

  const previewLogoUrl =
    logo === undefined ? organization?.logoUrl : logo || null;
  const preview = form.brandColor ? brandColors(form.brandColor, "light") : null;
  const previewPrimary = preview ? `rgb(${preview.primary})` : "rgb(var(--color-primary))";

  return (
    <form onSubmit={save} className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Organization settings"
        description="Your organization's name, logo and colors appear across the app for everyone on your team, and on invoices."
      />

      <Panel
        title="Brand"
        description="Shown in the sidebar for your whole team, and on invoices."
      >
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            <p className="mb-2 text-sm font-medium text-text">Logo</p>
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-text/25 bg-background">
                {previewLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewLogoUrl} alt="Logo preview" className="h-full w-full object-contain p-1.5" />
                ) : (
                  <LuImage className="h-7 w-7 text-text/30" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={pickLogo}
                  className="sr-only"
                  id="logo"
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => fileInput.current?.click()}>
                    <LuUpload className="h-4 w-4" />
                    {previewLogoUrl ? "Replace" : "Upload logo"}
                  </Button>
                  {previewLogoUrl && (
                    <Button variant="ghost" onClick={() => setLogo(null)}>
                      <LuTrash2 className="h-4 w-4" /> Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-text/55">PNG, JPEG or WebP. Square works best.</p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-text">Brand color</p>
            <div className="flex flex-wrap items-center gap-2">
              {BRAND_PRESETS.map((p) => (
                <button
                  key={p.hex}
                  type="button"
                  title={p.name}
                  aria-label={p.name}
                  aria-pressed={form.brandColor?.toUpperCase() === p.hex}
                  onClick={() => setForm({ ...form, brandColor: p.hex })}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    form.brandColor?.toUpperCase() === p.hex ? "border-text" : "border-transparent"
                  }`}
                  style={{ backgroundColor: p.hex }}
                />
              ))}
              {/* Any other color: a spectrum swatch that opens the system picker */}
              <label
                className="relative grid h-8 w-8 cursor-pointer place-items-center rounded-full ring-1 ring-text/20 focus-within:ring-2 focus-within:ring-primary"
                style={{
                  background:
                    "conic-gradient(#e11d48, #f59e0b, #84cc16, #10b981, #0ea5e9, #6366f1, #d946ef, #e11d48)",
                }}
                title="Pick any color"
              >
                <span className="sr-only">Pick any color</span>
                <span className="h-3.5 w-3.5 rounded-full bg-surface" />
                <input
                  type="color"
                  value={form.brandColor || "#1F6F4A"}
                  onChange={(e) => setForm({ ...form, brandColor: e.target.value.toUpperCase() })}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
              {form.brandColor && (
                <span className="tabular text-xs text-text/60">{form.brandColor}</span>
              )}
              {form.brandColor && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, brandColor: "" })}
                  className="ml-1 text-xs font-medium text-text/60 underline-offset-2 hover:underline"
                >
                  Use default
                </button>
              )}
            </div>

            {/* Preview of how the brand reads in the app */}
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-text/10 bg-background p-3">
              <OrgMark
                organization={{ name: form.name, logoUrl: previewLogoUrl }}
                className="h-9 w-9"
              />
              <span className="min-w-0 flex-1 truncate font-display text-sm font-bold text-text">
                {form.name || "Your organization"}
              </span>
              <span
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                style={{ backgroundColor: previewPrimary }}
              >
                Start consignment
              </span>
            </div>
            <p className="mt-2 text-xs text-text/55">
              {form.brandColor
                ? "Text on buttons stays readable: very light colors are deepened automatically."
                : "No brand color: the app uses the Orchard theme."}
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Details" description="Printed on invoices and documents.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Organization name" htmlFor="name" className="sm:col-span-2">
            <input id="name" name="name" value={form.name} onChange={update} required className={inputClass} />
          </Field>
          <Field label="Email" htmlFor="email">
            <input id="email" name="email" type="email" value={form.email} onChange={update} className={inputClass} />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <input id="phone" name="phone" type="tel" value={form.phone} onChange={update} className={inputClass} />
          </Field>
          <Field label="Address" htmlFor="address" className="sm:col-span-2">
            <textarea id="address" name="address" rows={2} value={form.address} onChange={update} className={inputClass} />
          </Field>
          <Field label="NTN" htmlFor="ntn" hint="National tax number">
            <input id="ntn" name="ntn" value={form.ntn} onChange={update} className={inputClass} />
          </Field>
          <Field label="Website" htmlFor="website">
            <input id="website" name="website" value={form.website} onChange={update} placeholder="https://" className={inputClass} />
          </Field>
        </div>
      </Panel>

      <Panel title="Money">
        <Field
          label="Base currency"
          htmlFor="baseCurrency"
          hint="Used for consignment costs, daily expenses and invoice totals, and suggested for new partners."
          className="max-w-sm"
        >
          <CurrencySelect id="baseCurrency" name="baseCurrency" value={form.baseCurrency} onChange={update} />
        </Field>
      </Panel>

      <div id="invoices" className="scroll-mt-6">
        <Panel
          title="Invoices and statements"
          description="How invoice and ledger statement PDFs look when you download or print them."
          footer={
            <Button variant="secondary" onClick={previewSample} loading={previewing}>
              Preview a sample invoice
            </Button>
          }
        >
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-text">Template</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {INVOICE_TEMPLATES.map((tpl) => (
                <label
                  key={tpl.id}
                  className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                    form.invoiceTemplate === tpl.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-text/15 hover:border-text/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="invoiceTemplate"
                    value={tpl.id}
                    checked={form.invoiceTemplate === tpl.id}
                    onChange={update}
                    className="sr-only"
                  />
                  <TemplateThumb id={tpl.id} color={previewPrimary} />
                  <span className="mt-2 block text-sm font-semibold text-text">{tpl.name}</span>
                  <span className="block text-xs leading-relaxed text-text/60">{tpl.description}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-8 grid gap-6 md:grid-cols-[9rem_minmax(0,1fr)]">
            {/* The letterhead page, with the bands kept clear shaded */}
            <div
              className="relative aspect-[210/297] w-36 overflow-hidden rounded-md border border-text/15 bg-white"
              aria-hidden="true"
            >
              {letterheadImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={letterheadImage} alt="" className="h-full w-full object-fill" />
              ) : (
                <div className="grid h-full place-items-center px-2 text-center text-[11px] text-gray-400">
                  {letterheadType === "application/pdf" ? "PDF letterhead" : "No letterhead"}
                </div>
              )}
              {letterheadType && (
                <>
                  <div
                    className="absolute inset-x-0 top-0 bg-primary/25"
                    style={{ height: `${(Number(form.letterheadTop) / 297) * 100}%` }}
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 bg-primary/25"
                    style={{ height: `${(Number(form.letterheadBottom) / 297) * 100}%` }}
                  />
                </>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-text">Letterhead</p>
                <p className="mt-0.5 text-xs leading-relaxed text-text/60">
                  An A4 page (210 × 297 mm) with your printed header and footer, as a PDF,
                  PNG or JPEG up to 3 MB. Documents are printed on top of it.
                </p>
                <input
                  ref={letterheadInput}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={pickLetterhead}
                  className="sr-only"
                  id="letterhead"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => letterheadInput.current?.click()}>
                    <LuUpload className="h-4 w-4" />
                    {letterheadType ? "Replace letterhead" : "Upload letterhead"}
                  </Button>
                  {letterheadType && (
                    <Button variant="ghost" onClick={() => { setLetterhead(null); setForm((f) => ({ ...f, useLetterhead: false })); }}>
                      <LuTrash2 className="h-4 w-4" /> Remove
                    </Button>
                  )}
                </div>
              </div>

              <label className={`flex items-start gap-2.5 text-sm ${letterheadType ? "text-text" : "text-text/45"}`}>
                <input
                  type="checkbox"
                  checked={form.useLetterhead && Boolean(letterheadType)}
                  disabled={!letterheadType}
                  onChange={(e) => setForm({ ...form, useLetterhead: e.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-[rgb(var(--color-primary))]"
                />
                <span>
                  Print invoices and statements on the letterhead
                  <span className="block text-xs text-text/55">
                    Your logo and details are then left to the letterhead instead of being printed again.
                  </span>
                </span>
              </label>

              <div className="grid max-w-sm grid-cols-2 gap-4">
                <Field label="Clear at top (mm)" htmlFor="letterheadTop">
                  <input id="letterheadTop" name="letterheadTop" type="number" min="0" max="120" value={form.letterheadTop} onChange={update} disabled={!letterheadType} className={inputClass} />
                </Field>
                <Field label="Clear at bottom (mm)" htmlFor="letterheadBottom">
                  <input id="letterheadBottom" name="letterheadBottom" type="number" min="0" max="120" value={form.letterheadBottom} onChange={update} disabled={!letterheadType} className={inputClass} />
                </Field>
              </div>
              <p className="-mt-2 text-xs text-text/55">
                The shaded bands: content starts below your header and stays above your footer.
              </p>
            </div>
          </div>

          <Field
            label="Notes printed on invoices"
            htmlFor="invoiceNotes"
            hint="For example bank details and payment terms. Shown at the end of every invoice."
            className="mt-8"
          >
            <textarea
              id="invoiceNotes"
              name="invoiceNotes"
              rows={4}
              value={form.invoiceNotes || ""}
              onChange={update}
              className={inputClass}
              placeholder={"Bank: …\nAccount title: …\nIBAN: …"}
            />
          </Field>
        </Panel>
      </div>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-4 border-t border-text/10 bg-background/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-5">
        {message && (
          <p
            role={message.tone === "error" ? "alert" : "status"}
            className={`mr-auto text-sm ${message.tone === "error" ? "text-red-600" : "text-primary"}`}
          >
            {message.text}
          </p>
        )}
        <Button type="submit" loading={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
