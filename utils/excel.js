// Invoice and statement workbooks. Numbers are stored as numbers (with number
// formats), totals are SUM formulas, and layout is tracked as rows are added,
// so sections never drift out of place.
import XLSX from "xlsx-js-style";
import { formatDate } from "@utils/invoice";
import { formatDay } from "@utils/days";

const MONEY = "#,##0.00";
const KG = '#,##0.00" kg"';
const INT = "#,##0";

const border = (color = "D5DBD8") => ({
  top: { style: "thin", color: { rgb: color } },
  bottom: { style: "thin", color: { rgb: color } },
  left: { style: "thin", color: { rgb: color } },
  right: { style: "thin", color: { rgb: color } },
});

const colLetter = (index) => {
  let s = "";
  let n = index + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

class SheetBuilder {
  constructor(widths, brandHex) {
    this.widths = widths;
    this.cols = widths.length;
    this.brand = String(brandHex || "#1F6F4A").replace("#", "").toUpperCase();
    this.rows = [];
    this.merges = [];
    this.heights = [];
  }

  get nextRow() {
    return this.rows.length;
  }

  add(cells = []) {
    this.rows.push(cells);
    return this.rows.length - 1;
  }

  blank() {
    this.add([]);
  }

  mergeRow(row, from = 0, to = this.cols - 1) {
    this.merges.push({ s: { r: row, c: from }, e: { r: row, c: to } });
  }

  title(text, subtitle) {
    const r = this.add([
      { v: text, t: "s", s: { font: { bold: true, sz: 16, color: { rgb: this.brand } } } },
    ]);
    this.mergeRow(r);
    if (subtitle) {
      const s = this.add([{ v: subtitle, t: "s", s: { font: { sz: 10, color: { rgb: "68726D" } } } }]);
      this.mergeRow(s);
    }
  }

  section(text) {
    this.blank();
    const r = this.add(
      Array.from({ length: this.cols }, (_, i) => ({
        v: i === 0 ? text : "",
        t: "s",
        s: {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: this.brand } },
        },
      }))
    );
    this.mergeRow(r);
  }

  // Label/value pairs, two pairs per row (columns A-B and E-F, etc.).
  // A value may be { v, f } to store a formula. Returns the first row index.
  pairs(list, { half = Math.floor(this.cols / 2) } = {}) {
    const start = this.nextRow;
    for (let i = 0; i < list.length; i += 2) {
      const row = [];
      [list[i], list[i + 1]].forEach((pair, side) => {
        const base = side * half;
        if (!pair) return;
        const [label, value, numFmt] = pair;
        row[base] = { v: label, t: "s", s: { font: { bold: true, color: { rgb: "68726D" } } } };
        const numberStyle = { numFmt: numFmt || MONEY, alignment: { horizontal: "left" } };
        if (value && typeof value === "object") {
          row[base + 1] = { v: value.v, f: value.f, t: "n", s: { ...numberStyle, font: { bold: true } } };
        } else {
          row[base + 1] =
            typeof value === "number"
              ? { v: value, t: "n", s: numberStyle }
              : { v: value ?? "", t: "s" };
        }
      });
      for (let c = 0; c < this.cols; c++) if (!row[c]) row[c] = { v: "", t: "s" };
      this.add(row);
    }
    return start;
  }

  // Cell address (e.g. "C42") of a 0-based row and column.
  cell(row, col) {
    return `${colLetter(col)}${row + 1}`;
  }

  rowHeight(row, points) {
    this.heights[row] = points;
  }

  // A bordered table. `columns`: [{ header, key, format, total }] where total
  // is "sum" for a SUM formula or a fixed value/label.
  table(columns, data) {
    const headStyle = {
      font: { bold: true, color: { rgb: "18211D" } },
      fill: { fgColor: { rgb: "ECF0EE" } },
      border: border(),
      alignment: { vertical: "center", wrapText: true },
    };
    this.add(
      columns.map((col) => ({
        v: col.header,
        t: "s",
        s: { ...headStyle, alignment: { ...headStyle.alignment, horizontal: col.format ? "right" : "left" } },
      }))
    );
    const first = this.nextRow;
    data.forEach((item) => {
      this.add(
        columns.map((col) => {
          const value = typeof col.key === "function" ? col.key(item) : item[col.key];
          if (typeof value === "number") {
            return { v: value, t: "n", s: { numFmt: col.format || MONEY, border: border() } };
          }
          return { v: value ?? "", t: "s", s: { border: border(), alignment: { wrapText: true, vertical: "top" } } };
        })
      );
    });
    const last = this.nextRow - 1;

    if (columns.some((col) => col.total !== undefined)) {
      const totalStyle = {
        font: { bold: true },
        fill: { fgColor: { rgb: "F3F5F4" } },
        border: { ...border(), top: { style: "medium", color: { rgb: "18211D" } } },
      };
      this.add(
        columns.map((col, c) => {
          if (col.total === "sum") {
            const ref = `${colLetter(c)}${first + 1}:${colLetter(c)}${last + 1}`;
            const v = data.reduce((s, item) => {
              const value = typeof col.key === "function" ? col.key(item) : item[col.key];
              return s + (typeof value === "number" ? value : 0);
            }, 0);
            return { v, t: "n", f: data.length ? `SUM(${ref})` : undefined, s: { ...totalStyle, numFmt: col.format || MONEY } };
          }
          if (typeof col.total === "number") {
            return { v: col.total, t: "n", s: { ...totalStyle, numFmt: col.format || MONEY } };
          }
          return { v: col.total || "", t: "s", s: totalStyle };
        })
      );
    }
    // Row index of the totals row (or the last data row).
    return this.nextRow - 1;
  }

  toSheet() {
    const sheet = XLSX.utils.aoa_to_sheet(this.rows);
    sheet["!cols"] = this.widths.map((wch) => ({ wch }));
    sheet["!merges"] = this.merges;
    sheet["!rows"] = this.heights.map((hpt) => (hpt ? { hpt } : undefined));
    sheet["!margins"] = { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 };
    return sheet;
  }
}

function save(builder, sheetName, filename) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, builder.toSheet(), sheetName);
  XLSX.writeFile(workbook, filename, { compression: true, bookType: "xlsx" });
}

const orgSubtitle = (org) =>
  [org?.address, org?.ntn && `NTN ${org.ntn}`, org?.phone, org?.email].filter(Boolean).join("   ");

export function exportInvoiceExcel({ invoice, organization, currency, includeCosts = true, filename }) {
  const b = new SheetBuilder([6, 24, 16, 10, 12, 14, 14, 16, 18], organization?.brandColor);
  // GD amounts are in the financial instrument's currency (older GDs: the consignee's).
  const foreign = invoice.goodsDeclaration?.currency || invoice.consigneeCurrency;
  const t = invoice.trader;
  const c = invoice.consignee;

  b.title(organization?.name || "FarmExpo", orgSubtitle(organization));
  b.blank();
  b.pairs([
    ["Commercial invoice", invoice.invoiceNumber],
    ["Date", formatDate(invoice.date)],
    ["Consignment", invoice.number],
    ["Status", invoice.status || ""],
  ]);

  b.section("Parties");
  b.pairs([
    ["Trader", t?.name || ""],
    ["Consignee", c?.name || ""],
    ["Address", t?.address || ""],
    ["Address", c?.address || ""],
    ["Country", t?.country || ""],
    ["Country", [c?.station, c?.country].filter(Boolean).join(", ")],
    ["NTN", t?.ntn || ""],
    ["NTN", c?.ntn || ""],
  ]);

  const awb = invoice.airwayBill;
  const gd = invoice.goodsDeclaration;
  if (awb || gd) {
    b.section("Shipment");
    b.pairs([
      ["Airway bill", awb?.number || ""],
      ["Goods declaration", gd?.number || ""],
      ["IATA agent", [awb?.agent, awb?.station].filter(Boolean).join(", ")],
      ["GD date", formatDate(gd?.date)],
      ["Flight date", formatDate(awb?.date)],
      [`FOB (${foreign})`, gd ? gd.fob : ""],
      ["Chargeable weight", awb ? awb.weight : "", KG],
      [`Freight (${foreign})`, gd ? gd.freight : ""],
      [`Rate / kg (${currency})`, awb ? awb.rate : ""],
      [`CFR (${foreign})`, gd ? gd.cfr : ""],
      [`Agent fee (${currency})`, awb ? awb.fee : ""],
      [`Exchange rate (${currency} per ${foreign || "unit"})`, gd ? gd.exchangeRate : "", "0.0000"],
    ]);
  }

  b.section("Goods");
  b.table(
    [
      { header: "#", key: "index", format: INT },
      { header: "Item", key: "name", total: "Total" },
      { header: "Packaging", key: "packaging" },
      { header: "Qty", key: "quantity", format: INT, total: "sum" },
      { header: "Kg / unit", key: "netPerUnit", format: KG },
      { header: "Net kg", key: "netWeight", format: KG, total: "sum" },
      { header: "Gross kg", key: "grossWeight", format: KG, total: "sum" },
      { header: `Rate / kg (${currency})`, key: "ratePerKg", format: MONEY },
      { header: `Amount (${currency})`, key: "goodsCost", format: MONEY, total: "sum" },
    ],
    invoice.goods
  );

  if (invoice.utilizations.length) {
    b.section("Financial instruments used");
    b.table(
      [
        { header: "Instrument", key: "number", total: "Total" },
        { header: "Bank", key: "bank" },
        { header: "Currency", key: "currency" },
        { header: "Amount", key: "amount", format: MONEY },
        { header: "Utilized", key: "utilized", format: MONEY, total: "sum" },
        { header: "Balance", key: "balance", format: MONEY },
        { header: "Expiry", key: (u) => formatDate(u.expiry) },
      ],
      invoice.utilizations
    );
  }

  if (includeCosts) {
    b.section(`Costs and result (${currency})`);
    const rows = invoice.costs.map((row) => ({ label: row.label, basis: row.detail || "", amount: row.amount }));
    const totalRow = b.table(
      [
        { header: "Cost", key: "label", total: "Total cost" },
        { header: "Basis", key: "basis" },
        { header: `Amount (${currency})`, key: "amount", format: MONEY, total: "sum" },
      ],
      rows
    );
    const rec = invoice.recovery;
    b.blank();
    // Recovered and result are formulas, so changing a figure in Excel
    // updates them: recovered = amount x rate; result = recovered - total cost.
    const start = b.nextRow;
    const amountCell = b.cell(start, 1);
    const rateCell = b.cell(start + 1, 1);
    const recoveredCell = b.cell(start + 1, 5);
    b.pairs([
      ["Recovered", rec ? rec.amount : 0, MONEY],
      ["Recovery currency", rec?.currency || ""],
      ["Exchange rate", rec ? rec.exchangeRate : 0, "0.0000"],
      [`Recovered (${currency})`, { v: rec ? rec.local : 0, f: `${amountCell}*${rateCell}` }],
      [
        `Profit or loss (${currency})`,
        { v: invoice.result, f: `${recoveredCell}-${b.cell(totalRow, 2)}` },
        `#,##0.00;[Red]-#,##0.00`,
      ],
    ]);
  }

  if (organization?.invoiceNotes) {
    b.section("Notes");
    const r = b.add([{ v: organization.invoiceNotes, t: "s", s: { alignment: { wrapText: true, vertical: "top" } } }]);
    b.mergeRow(r);
    b.rowHeight(r, 15 * Math.max(1, organization.invoiceNotes.split("\n").length));
  }
  b.blank();
  b.add([{ v: `Generated ${formatDate(new Date())}`, t: "s", s: { font: { italic: true, color: { rgb: "68726D" } } } }]);

  save(b, "Invoice", filename);
}

export function exportStatementExcel({ vendor, transactions, organization, filename }) {
  const b = new SheetBuilder([14, 18, 14, 40, 12, 16, 16, 16], organization?.brandColor);
  const currency = vendor.currency;
  const rows = [...transactions].sort(
    (a, c) => new Date(a.createdAt) - new Date(c.createdAt) || a.id - c.id
  );

  b.title(organization?.name || "FarmExpo", orgSubtitle(organization));
  b.blank();
  b.pairs(
    [
      ["Statement of account", vendor.name],
      ["Currency", currency],
      ["Opening balance", vendor.openingBalance || 0],
      ["Closing balance", vendor.balance || 0],
      ["Entries", rows.length, INT],
      ["Date", formatDate(new Date())],
    ],
    { half: 4 }
  );
  b.blank();
  b.table(
    [
      { header: "Date", key: (t) => formatDate(t.createdAt) },
      { header: "Transaction", key: "transactionId" },
      { header: "Voucher", key: "voucherId" },
      { header: "Details", key: (t) => t.details || "", total: "Totals" },
      { header: "Consignment", key: (t) => (t.consignmentId ? t.consignment?.number || `#${t.consignmentId}` : "") },
      { header: `Credit (${currency})`, key: (t) => (t.type === "credit" ? t.amount : ""), format: MONEY, total: "sum" },
      { header: `Debit (${currency})`, key: (t) => (t.type === "debit" ? t.amount : ""), format: MONEY, total: "sum" },
      { header: `Balance (${currency})`, key: "balanceAfter", format: MONEY, total: vendor.balance || 0 },
    ],
    // The running balance starts from the opening balance.
    [
      { id: 0, createdAt: null, transactionId: "", voucherId: "", details: "Opening balance", balanceAfter: vendor.openingBalance || 0 },
      ...rows,
    ]
  );

  save(b, "Statement", filename);
}

// Daily price list: one row per day and commodity with the weighted average
// cost per kg, plus a sheet with every purchase behind the averages.
export function exportDailyPricesExcel({ rows, organization, currency, from, to, filename }) {
  const period = `${from ? formatDay(from) : "the first purchase"} to ${to ? formatDay(to) : "today"}`;

  const daily = new SheetBuilder([14, 20, 36, 15, 17, 17, 14, 14], organization?.brandColor);
  daily.title(organization?.name || "FarmExpo", orgSubtitle(organization));
  daily.blank();
  daily.pairs([["Daily price list", period], ["Currency", currency]], { half: 4 });
  daily.blank();
  daily.table(
    [
      { header: "Date", key: (r) => formatDay(r.date) },
      { header: "Commodity", key: (r) => r.commodity?.name || "" },
      { header: "Bought from", key: (r) => r.traders.map((t) => t.name).join(", ") },
      { header: "Quantity", key: "quantity", format: KG },
      { header: `Total paid (${currency})`, key: "amount", format: MONEY },
      { header: `Average per kg (${currency})`, key: "averageRate", format: MONEY },
      { header: "Lowest per kg", key: "minRate", format: MONEY },
      { header: "Highest per kg", key: "maxRate", format: MONEY },
    ],
    rows
  );

  const detail = new SheetBuilder([14, 20, 28, 15, 15, 17, 30], organization?.brandColor);
  detail.title("Purchases", period);
  detail.blank();
  detail.table(
    [
      { header: "Date", key: (p) => formatDay(p.date) },
      { header: "Commodity", key: (p) => p.commodity },
      { header: "Farmer / trader", key: (p) => p.trader, total: "Totals" },
      { header: "Quantity", key: "quantity", format: KG, total: "sum" },
      { header: `Rate per kg (${currency})`, key: "rate", format: MONEY },
      { header: `Amount (${currency})`, key: "amount", format: MONEY, total: "sum" },
      { header: "Notes", key: (p) => p.notes || "" },
    ],
    rows.flatMap((r) =>
      r.purchases.map((p) => ({
        ...p,
        date: r.date,
        commodity: r.commodity?.name || "",
        trader: p.trader.name,
      }))
    )
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, daily.toSheet(), "Daily prices");
  XLSX.utils.book_append_sheet(workbook, detail.toSheet(), "Purchases");
  XLSX.writeFile(workbook, filename, { compression: true, bookType: "xlsx" });
}
