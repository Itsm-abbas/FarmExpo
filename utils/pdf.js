// Invoice and statement PDFs, drawn as real text and tables (not screenshots),
// in the organization's chosen template and, optionally, on its letterhead.
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { formatMoney } from "@utils/money";
import { formatDate, formatKg } from "@utils/invoice";

const PAGE_W = 210;
const PAGE_H = 297;
const FOOTER_SPACE = 8;

const INK = [24, 33, 29];
const MUTED = [104, 114, 109];
const RULE = [210, 215, 212];
const SOFT = [243, 245, 244];
const WHITE = [255, 255, 255];

const hexToRgb = (hex) => {
  const n = parseInt(String(hex || "#1F6F4A").replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

function templateStyle(template, brand) {
  switch (template) {
    case "modern":
      return {
        id: "modern",
        margin: 16,
        base: 9.5,
        titleSize: 20,
        headingFont: "helvetica",
        titleColor: brand,
        tableTheme: "striped",
        headFill: brand,
        headText: WHITE,
        padding: 2.4,
        lineWidth: 0,
      };
    case "compact":
      return {
        id: "compact",
        margin: 12,
        base: 8,
        titleSize: 13,
        headingFont: "helvetica",
        titleColor: INK,
        tableTheme: "plain",
        headFill: SOFT,
        headText: INK,
        padding: 1.3,
        lineWidth: { bottom: 0.1 },
      };
    default:
      return {
        id: "classic",
        margin: 18,
        base: 9.5,
        titleSize: 17,
        headingFont: "times",
        titleColor: INK,
        tableTheme: "grid",
        headFill: [236, 240, 238],
        headText: INK,
        padding: 2.2,
        lineWidth: 0.1,
      };
  }
}

const clean = (lines) => lines.filter((l) => l !== null && l !== undefined && String(l).trim() !== "");

// ---------------------------------------------------------------------------
// Branding resources

async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Re-encodes any image to PNG so jsPDF can embed it, and returns its size.
async function toPngDataUrl(src) {
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Couldn't load the logo"));
    image.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d").drawImage(img, 0, 0);
  return { dataUrl: canvas.toDataURL("image/png"), width: img.naturalWidth, height: img.naturalHeight };
}

export function dataUrlToLetterhead(dataUrl) {
  const [, type, base64] = /^data:([^;]+);base64,(.*)$/.exec(dataUrl) || [];
  if (!type) return null;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { type, bytes };
}

// Logo and (when switched on) letterhead of the organization, ready to draw.
// `overrides` lets the settings page preview unsaved uploads.
export async function loadBranding(organization, overrides = {}) {
  const branding = { logo: null, letterhead: null };
  const logoSrc = overrides.logo !== undefined ? overrides.logo : organization?.logoUrl;
  if (logoSrc) {
    try {
      const src = logoSrc.startsWith("data:")
        ? logoSrc
        : await blobToDataUrl(await (await fetch(logoSrc)).blob());
      branding.logo = await toPngDataUrl(src);
    } catch {
      branding.logo = null; // A missing logo shouldn't stop the document.
    }
  }

  const useLetterhead = overrides.useLetterhead ?? organization?.useLetterhead;
  if (useLetterhead) {
    if (overrides.letterhead) {
      branding.letterhead = dataUrlToLetterhead(overrides.letterhead);
    } else if (organization?.letterheadUrl) {
      const res = await fetch(organization.letterheadUrl);
      if (!res.ok) throw new Error("Couldn't load your letterhead.");
      branding.letterhead = {
        type: res.headers.get("content-type"),
        bytes: new Uint8Array(await res.arrayBuffer()),
      };
    }
  }
  return branding;
}

// Draws every content page on top of the letterhead (an image or the first
// page of a PDF), stretched to the full A4 page.
async function applyLetterhead(contentBytes, letterhead) {
  const { PDFDocument } = await import("pdf-lib");
  const out = await PDFDocument.create();
  const content = await PDFDocument.load(contentBytes);
  const pages = await out.embedPdf(content, content.getPageIndices());

  let drawBackground;
  try {
    if (letterhead.type === "application/pdf") {
      const source = await PDFDocument.load(letterhead.bytes, { ignoreEncryption: true });
      const [background] = await out.embedPdf(source, [0]);
      drawBackground = (page) =>
        page.drawPage(background, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
    } else {
      const image =
        letterhead.type === "image/png"
          ? await out.embedPng(letterhead.bytes)
          : await out.embedJpg(letterhead.bytes);
      drawBackground = (page) =>
        page.drawImage(image, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
    }
  } catch {
    throw new Error(
      "Your letterhead file couldn't be read. Upload it again as a PNG, JPEG or unprotected PDF."
    );
  }

  for (const embedded of pages) {
    const page = out.addPage([embedded.width, embedded.height]);
    drawBackground(page);
    page.drawPage(embedded, { x: 0, y: 0 });
  }
  return out.save();
}

// ---------------------------------------------------------------------------
// Page layout

class PdfBuilder {
  constructor({ organization, template, branding }) {
    this.org = organization || {};
    this.brand = hexToRgb(this.org.brandColor);
    this.style = templateStyle(template || this.org.invoiceTemplate, this.brand);
    this.logo = branding?.logo || null;
    this.letterhead = branding?.letterhead || null;

    this.doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    this.left = this.style.margin;
    this.right = PAGE_W - this.style.margin;
    this.width = this.right - this.left;
    this.top = this.letterhead ? this.org.letterheadTop ?? 45 : this.style.margin;
    this.bottomEdge = PAGE_H - (this.letterhead ? this.org.letterheadBottom ?? 30 : this.style.margin);
    this.bottomLimit = this.bottomEdge - FOOTER_SPACE;
    this.y = this.top;
  }

  font(size, { bold = false, heading = false, color = INK } = {}) {
    const family = heading ? this.style.headingFont : "helvetica";
    this.doc.setFont(family, bold ? "bold" : "normal");
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
  }

  ensureSpace(height) {
    if (this.y + height > this.bottomLimit) {
      this.doc.addPage();
      this.y = this.top;
    }
  }

  get tableMargin() {
    return {
      top: this.top,
      bottom: PAGE_H - this.bottomLimit,
      left: this.left,
      right: PAGE_W - this.right,
    };
  }

  detailLines() {
    const o = this.org;
    return clean([
      o.address,
      clean([o.phone, o.email]).join("    "),
      clean([o.ntn && `NTN ${o.ntn}`, o.website]).join("    "),
    ]);
  }

  logoBox(maxW, maxH) {
    if (!this.logo) return null;
    const ratio = this.logo.width / this.logo.height;
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    return { w, h };
  }

  // The organization's name, logo and details. Skipped on a letterhead,
  // which carries them already.
  header() {
    if (this.letterhead) return;
    const { doc, style } = this;
    const name = this.org.name || "FarmExpo";

    if (style.id === "modern") {
      const bandH = 32;
      doc.setFillColor(...this.brand);
      doc.rect(0, 0, PAGE_W, bandH, "F");
      let x = this.left;
      const box = this.logoBox(17, 17);
      if (box) {
        doc.setFillColor(...WHITE);
        doc.roundedRect(x, 6.5, 21, 17, 2, 2, "F");
        doc.addImage(this.logo.dataUrl, "PNG", x + (21 - box.w) / 2, 6.5 + (17 - box.h) / 2, box.w, box.h);
        x += 26;
      }
      this.font(16, { bold: true, color: WHITE });
      doc.text(name, x, 14);
      this.font(7.8, { color: WHITE });
      this.detailLines().slice(0, 3).forEach((line, i) => {
        doc.text(doc.splitTextToSize(line, this.right - x)[0], x, 19.5 + i * 3.8);
      });
      this.y = bandH + 10;
      return;
    }

    if (style.id === "compact") {
      const box = this.logoBox(20, 10);
      let x = this.left;
      if (box) {
        doc.addImage(this.logo.dataUrl, "PNG", x, this.y, box.w, box.h);
        x += box.w + 4;
      }
      this.font(11, { bold: true });
      doc.text(name, x, this.y + 4.5);
      this.font(7, { color: MUTED });
      doc.text(doc.splitTextToSize(this.detailLines().join("    "), this.right - x)[0] || "", x, this.y + 8.5);
      this.y += Math.max(box?.h || 0, 10) + 3;
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.2);
      doc.line(this.left, this.y, this.right, this.y);
      this.y += 5;
      return;
    }

    // Classic
    const box = this.logoBox(34, 20);
    let x = this.left;
    if (box) {
      doc.addImage(this.logo.dataUrl, "PNG", x, this.y, box.w, box.h);
      x += box.w + 5;
    }
    this.font(16, { bold: true, heading: true });
    doc.text(name, x, this.y + 6);
    this.font(8, { color: MUTED });
    const lines = this.detailLines();
    lines.forEach((line, i) => {
      doc.text(doc.splitTextToSize(line, this.right - x)[0], x, this.y + 11 + i * 3.8);
    });
    this.y += Math.max(box?.h || 0, 8 + lines.length * 3.8) + 4;
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.4);
    doc.line(this.left, this.y, this.right, this.y);
    this.y += 7;
  }

  // Document title on the left, its reference details on the right.
  titleBlock(title, meta) {
    const { doc, style } = this;
    this.ensureSpace(22);
    const startY = this.y;
    this.font(style.titleSize, { bold: true, heading: true, color: style.titleColor });
    doc.text(title, this.left, startY + style.titleSize * 0.36);

    const lineH = style.base * 0.48;
    meta.forEach(([label, value], i) => {
      const y = startY + 3 + i * lineH;
      this.font(style.base - 1, { color: MUTED });
      doc.text(label, this.right - 52, y);
      this.font(style.base - 1, { bold: true });
      const text = doc.splitTextToSize(String(value ?? ""), 48)[0] || "";
      doc.text(text, this.right, y, { align: "right" });
    });
    this.y = Math.max(startY + style.titleSize * 0.36 + 4, startY + 3 + meta.length * lineH) + 5;
  }

  // Side-by-side blocks such as "Trader" and "Consignee".
  parties(blocks) {
    const { doc, style } = this;
    const gap = 6;
    const colW = (this.width - gap) / blocks.length;
    const pad = style.id === "compact" ? 0 : 3.5;
    const lineH = style.base * 0.44;
    const prepared = blocks.map((b) => {
      this.font(style.base - 0.5);
      const lines = clean(b.lines).flatMap((l) => doc.splitTextToSize(String(l), colW - pad * 2));
      return { ...b, lines };
    });
    const height =
      pad * 2 + 4 + 5 + Math.max(...prepared.map((b) => b.lines.length)) * lineH;
    this.ensureSpace(height + 4);

    prepared.forEach((b, i) => {
      const x = this.left + i * (colW + gap);
      if (style.id === "classic") {
        doc.setDrawColor(...RULE);
        doc.setLineWidth(0.2);
        doc.rect(x, this.y, colW, height);
      } else if (style.id === "modern") {
        doc.setFillColor(...SOFT);
        doc.roundedRect(x, this.y, colW, height, 2, 2, "F");
      }
      let y = this.y + pad + 3;
      this.font(style.base - 2, { bold: true, color: style.id === "modern" ? this.brand : MUTED });
      doc.text(b.heading, x + pad, y);
      y += 5;
      this.font(style.base + 0.5, { bold: true });
      doc.text(doc.splitTextToSize(b.name || "Not set", colW - pad * 2)[0], x + pad, y);
      this.font(style.base - 0.5, { color: MUTED });
      b.lines.forEach((line, n) => doc.text(line, x + pad, y + 4.5 + n * lineH));
    });
    this.y += height + 6;
  }

  // Approximate height of one table row, for keeping blocks together.
  get rowHeight() {
    return this.style.base * 0.36 + this.style.padding * 2;
  }

  // `keepWith`: room (mm) needed below the heading, so a heading is never
  // left alone at the bottom of a page.
  sectionTitle(text, keepWith = 16) {
    this.ensureSpace(Math.min(keepWith + 8, this.bottomLimit - this.top));
    this.font(this.style.base + 1.5, {
      bold: true,
      heading: true,
      color: this.style.id === "modern" ? this.brand : INK,
    });
    this.doc.text(text, this.left, this.y + 3);
    this.y += this.style.id === "compact" ? 5 : 6.5;
  }

  // Height a short table will take, for sectionTitle's keepWith.
  tableHeight(rowCount) {
    return (rowCount + 2) * this.rowHeight;
  }

  table({ head, body, foot, columnStyles = {}, fontSize, keepTogether = false }) {
    const { style } = this;
    const transparent = Boolean(this.letterhead);
    // Header and total cells follow their column's alignment, like the body.
    const aligned = (cells) =>
      cells.map((cell, i) => {
        const halign = columnStyles[i]?.halign;
        if (!halign || (cell && typeof cell === "object")) return cell;
        return { content: cell, styles: { halign } };
      });
    autoTable(this.doc, {
      startY: this.y,
      head: head ? [aligned(head)] : undefined,
      body,
      foot: foot ? [aligned(foot)] : undefined,
      showFoot: "lastPage",
      theme: style.tableTheme,
      margin: this.tableMargin,
      rowPageBreak: "avoid",
      // Short tables move to the next page whole rather than splitting.
      pageBreak: keepTogether ? "avoid" : "auto",
      styles: {
        font: "helvetica",
        fontSize: fontSize || style.base - 0.8,
        cellPadding: style.padding,
        textColor: INK,
        lineColor: RULE,
        lineWidth: style.lineWidth,
        ...(transparent ? { fillColor: false } : {}),
      },
      headStyles: { fillColor: style.headFill, textColor: style.headText, fontStyle: "bold" },
      footStyles: {
        fillColor: transparent ? false : SOFT,
        textColor: INK,
        fontStyle: "bold",
      },
      alternateRowStyles: transparent
        ? { fillColor: false }
        : style.id === "modern"
        ? { fillColor: [248, 250, 249] }
        : {},
      columnStyles,
    });
    this.y = this.doc.lastAutoTable.finalY + 7;
  }

  // Label/value pairs in two columns, e.g. airway bill and GD details.
  details(pairs) {
    const rows = [];
    for (let i = 0; i < pairs.length; i += 2) {
      rows.push([...(pairs[i] || ["", ""]), ...(pairs[i + 1] || ["", ""])]);
    }
    const label = { textColor: MUTED, cellWidth: 32 };
    autoTable(this.doc, {
      startY: this.y,
      body: rows,
      theme: "plain",
      margin: this.tableMargin,
      styles: {
        font: "helvetica",
        fontSize: this.style.base - 1,
        cellPadding: { top: 0.9, bottom: 0.9, left: 0, right: 2 },
        textColor: INK,
      },
      columnStyles: { 0: label, 1: { fontStyle: "bold" }, 2: label, 3: { fontStyle: "bold" } },
    });
    this.y = this.doc.lastAutoTable.finalY + 6;
  }

  // Figures shown as a row of small boxes (statement summary).
  figures(items) {
    const { doc } = this;
    const gap = 4;
    const w = (this.width - gap * (items.length - 1)) / items.length;
    const h = 15;
    this.ensureSpace(h + 4);
    items.forEach(([label, value], i) => {
      const x = this.left + i * (w + gap);
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.2);
      if (this.style.id === "modern" && !this.letterhead) {
        doc.setFillColor(...SOFT);
        doc.roundedRect(x, this.y, w, h, 2, 2, "F");
      } else {
        doc.rect(x, this.y, w, h);
      }
      this.font(this.style.base - 2, { color: MUTED });
      doc.text(label, x + 3, this.y + 5);
      this.font(this.style.base + 1, { bold: true });
      doc.text(String(value), x + 3, this.y + 11);
    });
    this.y += h + 7;
  }

  paragraph(text) {
    this.font(this.style.base - 0.5, { color: INK });
    const lines = this.doc.splitTextToSize(String(text), this.width);
    const lineH = this.style.base * 0.45;
    for (const line of lines) {
      this.ensureSpace(lineH);
      this.doc.text(line, this.left, this.y + 3);
      this.y += lineH;
    }
    this.y += 4;
  }

  signature() {
    this.ensureSpace(24);
    const x = this.right - 62;
    const y = this.y + 14;
    this.doc.setDrawColor(...INK);
    this.doc.setLineWidth(0.2);
    this.doc.line(x, y, this.right, y);
    this.font(this.style.base - 1.5, { color: MUTED });
    this.doc.text(`For ${this.org.name || "the exporter"}`, x, y + 4);
    this.doc.text("Authorised signature", x, y + 7.5);
    this.y = y + 10;
  }

  footer(note) {
    const { doc } = this;
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      const y = this.bottomEdge - 2;
      this.font(7, { color: MUTED });
      const left = clean([this.letterhead ? null : this.org.name, note]).join("    ");
      if (left) doc.text(left, this.left, y);
      doc.text(`Page ${i} of ${total}`, this.right, y, { align: "right" });
    }
  }

  async output(note) {
    this.footer(note);
    const bytes = this.doc.output("arraybuffer");
    return this.letterhead ? applyLetterhead(bytes, this.letterhead) : new Uint8Array(bytes);
  }
}

const right = { halign: "right" };
const money = (value, currency) => formatMoney(value, currency, { decimals: 2 });
const generatedNote = () => `Generated ${formatDate(new Date())}`;

// ---------------------------------------------------------------------------
// Documents

export async function buildInvoicePdf({ invoice, organization, branding, currency, includeCosts = true, template }) {
  const pdf = new PdfBuilder({ organization, branding, template });
  const awb = invoice.airwayBill;
  const gd = invoice.goodsDeclaration;
  // GD amounts are in the financial instrument's currency (older GDs: the consignee's).
  const foreign = invoice.goodsDeclaration?.currency || invoice.consigneeCurrency;

  pdf.header();
  pdf.titleBlock("Commercial invoice", [
    ["Invoice no.", invoice.invoiceNumber],
    ["Date", formatDate(invoice.date)],
    ["Consignment", invoice.number],
    ...(awb?.number ? [["Airway bill", awb.number]] : []),
  ]);

  const t = invoice.trader;
  const c = invoice.consignee;
  pdf.parties([
    {
      heading: "Trader",
      name: t?.name,
      lines: [t?.address, t?.country, t?.ntn && `NTN ${t.ntn}`],
    },
    {
      heading: "Consignee",
      name: c?.name,
      lines: [c?.address, clean([c?.station, c?.country]).join(", "), c?.ntn && `NTN ${c.ntn}`],
    },
  ]);

  const shipment = [];
  if (awb) {
    shipment.push(
      ["Airway bill", awb.number],
      ["IATA agent", clean([awb.agent, awb.station]).join(", ")],
      ["Flight date", formatDate(awb.date)],
      ["Chargeable weight", formatKg(awb.weight)]
    );
  }
  if (gd) {
    shipment.push(
      ["Goods declaration", gd.number],
      ["GD date", formatDate(gd.date)],
      ["FOB", money(gd.fob, foreign)],
      ["Freight", money(gd.freight, foreign)],
      ["CFR", money(gd.cfr, foreign)],
      ["Exchange rate", gd.exchangeRate ? `${currency} ${gd.exchangeRate} per ${foreign || "unit"}` : ""]
    );
  }
  if (shipment.length) {
    pdf.sectionTitle("Shipment", Math.ceil(shipment.length / 2) * 5.5);
    pdf.details(shipment);
  }

  pdf.sectionTitle("Goods", pdf.tableHeight(Math.min(invoice.goods.length, 3)));
  pdf.table({
    head: ["#", "Item", "Packaging", "Qty", "Kg / unit", "Net kg", "Gross kg", `Rate / kg (${currency})`, `Amount (${currency})`],
    body: invoice.goods.map((g) => [
      g.index,
      g.name,
      g.packaging,
      g.quantity.toLocaleString("en-US"),
      g.netPerUnit.toLocaleString("en-US"),
      g.netWeight.toLocaleString("en-US", { maximumFractionDigits: 2 }),
      g.grossWeight.toLocaleString("en-US", { maximumFractionDigits: 2 }),
      money(g.ratePerKg),
      money(g.goodsCost),
    ]),
    foot: [
      "",
      "Total",
      "",
      invoice.totals.quantity.toLocaleString("en-US"),
      "",
      invoice.totals.netWeight.toLocaleString("en-US", { maximumFractionDigits: 2 }),
      invoice.totals.grossWeight.toLocaleString("en-US", { maximumFractionDigits: 2 }),
      "",
      money(invoice.totals.goodsCost),
    ],
    columnStyles: {
      0: { cellWidth: 10, halign: "right" },
      3: right,
      4: right,
      5: right,
      6: right,
      7: right,
      8: right,
    },
  });

  if (invoice.utilizations.length) {
    pdf.sectionTitle("Financial instruments used", pdf.tableHeight(invoice.utilizations.length));
    pdf.table({
      head: ["Instrument", "Bank", "Amount", "Utilized", "Balance", "Expiry"],
      body: invoice.utilizations.map((u) => [
        u.number,
        u.bank,
        money(u.amount, u.currency),
        money(u.utilized, u.currency),
        money(u.balance, u.currency),
        formatDate(u.expiry),
      ]),
      columnStyles: { 2: right, 3: right, 4: right },
      keepTogether: true,
    });
  }

  if (includeCosts) {
    pdf.sectionTitle("Costs and result", pdf.tableHeight(invoice.costs.length + 3));
    const rec = invoice.recovery;
    pdf.table({
      head: ["", "Basis", `Amount (${currency})`],
      body: [
        ...invoice.costs.map((row) => [row.label, row.detail || "", money(row.amount)]),
        [{ content: "Total cost", styles: { fontStyle: "bold" } }, "", { content: money(invoice.totalCost), styles: { fontStyle: "bold" } }],
        [
          "Recovered",
          rec ? `${money(rec.amount, rec.currency)} at ${rec.exchangeRate}` : "Not recorded yet",
          money(rec?.local || 0),
        ],
      ],
      foot: [invoice.result >= 0 ? "Profit" : "Loss", "", money(Math.abs(invoice.result))],
      columnStyles: { 0: { cellWidth: 45 }, 2: { ...right, cellWidth: 40 } },
      keepTogether: true,
    });
  }

  if (organization?.invoiceNotes) {
    pdf.sectionTitle("Notes", 18);
    pdf.paragraph(organization.invoiceNotes);
  }
  pdf.signature();
  return pdf.output(generatedNote());
}

export async function buildStatementPdf({ vendor, transactions, organization, branding, template }) {
  const pdf = new PdfBuilder({ organization, branding, template });
  const currency = vendor.currency;
  const rows = [...transactions].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt) || a.id - b.id
  );
  const credits = rows.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const debits = rows.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  const opening = vendor.openingBalance || 0;
  const period = rows.length
    ? `${formatDate(rows[0].createdAt)} to ${formatDate(rows[rows.length - 1].createdAt)}`
    : "No entries";

  pdf.header();
  pdf.titleBlock("Statement of account", [
    ["Partner", vendor.name],
    ["Currency", currency],
    ["Period", period],
    ["Date", formatDate(new Date())],
  ]);
  pdf.figures([
    ["Opening balance", money(opening, currency)],
    ["Credits", money(credits, currency)],
    ["Debits", money(debits, currency)],
    ["Closing balance", money(vendor.balance, currency)],
  ]);
  pdf.table({
    head: ["Date", "Reference", "Details", "Cons.", "Credit", "Debit", "Balance"],
    body: [
      ["", "", { content: "Opening balance", styles: { fontStyle: "italic" } }, "", "", "", money(opening)],
      ...rows.map((t) => [
        formatDate(t.createdAt),
        clean([t.transactionId, t.voucherId]).join("\n"),
        t.details || "",
        t.consignmentId ? t.consignment?.number || `#${t.consignmentId}` : "",
        t.type === "credit" ? money(t.amount) : "",
        t.type === "debit" ? money(t.amount) : "",
        money(t.balanceAfter),
      ]),
    ],
    foot: ["", "", "Totals", "", money(credits), money(debits), money(vendor.balance)],
    columnStyles: {
      0: { cellWidth: 23 },
      1: { cellWidth: 33 },
      3: { cellWidth: 12 },
      4: { ...right, cellWidth: 22 },
      5: { ...right, cellWidth: 22 },
      6: { ...right, cellWidth: 24 },
    },
  });
  return pdf.output(generatedNote());
}

// ---------------------------------------------------------------------------
// Delivering the file

export function downloadFile(bytes, filename, type = "application/pdf") {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

// Opens a tab straight away (so it isn't blocked as a pop-up) and shows the
// PDF in it once ready; the browser's viewer then prints it as laid out.
export async function openPdfInNewTab(build) {
  const tab = window.open("", "_blank");
  if (tab) {
    tab.document.title = "Preparing PDF…";
    tab.document.body.style.font = "15px system-ui, sans-serif";
    tab.document.body.textContent = "Preparing the PDF…";
  }
  try {
    const bytes = await build();
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    if (tab) tab.location.href = url;
    else window.location.href = url;
  } catch (err) {
    tab?.close();
    throw err;
  }
}

export const fileSlug = (text) =>
  String(text || "document")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "document";
