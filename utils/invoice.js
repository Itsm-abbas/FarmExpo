// Everything an invoice shows, computed once from a consignment so the page,
// the PDF and the Excel file always agree. The formulas match the ledger
// postings in lib/ledger.js.

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (v) => num(v).toLocaleString("en-US", { maximumFractionDigits: 2 });

export function computeInvoice(consignment, utilizations = []) {
  const c = consignment || {};
  const awb = c.airwayBill;
  const gd = c.goodsDeclaration;
  const recovery = c.recoveryDone;

  const goods = (c.goods || []).map((g, index) => {
    const quantity = num(g.quantity);
    const netPerUnit = num(g.weightPerUnit);
    const tarePerUnit = num(g.packaging?.packagingWeightPerUnit);
    const netWeight = quantity * netPerUnit;
    const tareWeight = quantity * tarePerUnit;
    const ratePerKg = num(g.commodityPerUnitCost);
    return {
      index: index + 1,
      id: g.id,
      name: g.commodityItem?.name || "Item",
      packaging: g.packaging?.name || "",
      quantity,
      damage: num(g.damage),
      netPerUnit,
      netWeight,
      tareWeight,
      grossWeight: netWeight + tareWeight,
      ratePerKg,
      // Goods are costed by weight: net kg x rate per kg.
      goodsCost: netWeight * ratePerKg,
      packagingPerUnit: num(g.packagingPerUnitCost),
      packagingCost: quantity * num(g.packagingPerUnitCost),
      // Selling rate for the commercial invoice (null until it is set).
      saleRate: g.saleRate === null || g.saleRate === undefined ? null : num(g.saleRate),
    };
  });
  const sum = (key) => goods.reduce((total, g) => total + g[key], 0);

  const awbWeight = num(awb?.airwayBillWeight);
  const costs = [
    { key: "goods", label: "Goods", amount: sum("goodsCost") },
    { key: "packaging", label: "Packaging", amount: sum("packagingCost") },
    {
      key: "airwayBill",
      label: "Airway bill",
      detail: awb ? `${fmt(awbWeight)} kg x ${fmt(awb.rate)} + fee ${fmt(awb.fee)}` : "",
      amount: num(awb?.rate) * awbWeight + num(awb?.fee),
    },
    {
      key: "packing",
      label: "Packing",
      detail: c.packing ? `${fmt(awbWeight)} kg x ${fmt(c.packing.ratePerKg)}/kg` : "",
      amount: awbWeight * num(c.packing?.ratePerKg),
    },
    { key: "customClearance", label: "Custom clearance", amount: num(c.customClearance?.fee) },
    { key: "dailyExpenses", label: "Daily expenses", amount: num(c.dailyExpenses) },
    // Taxes added on the consignment page, each with its own remark.
    ...(Array.isArray(c.taxes) ? c.taxes : []).map((tax, i) => ({
      key: `tax-${i}`,
      label: tax.remark || "Tax",
      detail: "Tax",
      tax: true,
      amount: num(tax.amount),
    })),
  ];
  const totalCost = costs.reduce((total, row) => total + row.amount, 0);

  const recoveryLocal = num(recovery?.amount) * num(recovery?.exchangeRate);

  // Instruments the consignment uses; older data linked them via the GD.
  const used = Array.isArray(c.utilizations)
    ? c.utilizations
    : (utilizations || []).filter((u) => gd && u.goodsDeclarationId === gd.id);

  return {
    id: c.id,
    // The consignment number the user entered (older consignments: the id).
    number: c.number || String(c.id),
    invoiceNumber: gd?.commercialInvoiceNumber || `CONS-${c.number || c.id}`,
    date: c.date,
    status: c.status,
    trader: c.trader || null,
    consignee: c.consignee?.vendor || null,
    consigneeCurrency: c.consignee?.vendor?.currency || "",
    consigneeAmount: num(c.consigneeAmount),
    commercialCurrency: c.commercialCurrency || "",
    airwayBill: awb
      ? {
          number: awb.number,
          agent: awb.iataAgent?.vendor?.name || "",
          station: awb.iataAgent?.vendor?.station || "",
          date: awb.dateTime,
          rate: num(awb.rate),
          weight: awbWeight,
          fee: num(awb.fee),
        }
      : null,
    goodsDeclaration: gd
      ? {
          number: gd.number,
          date: gd.date,
          exchangeRate: num(gd.exchangeRate),
          currency: gd.currency || "",
          fob: num(gd.fob),
          freight: num(gd.gdFreight),
          cfr: num(gd.fob) + num(gd.gdFreight),
        }
      : null,
    customClearance: c.customClearance
      ? { agent: c.customClearance.customAgent?.vendor?.name || "", fee: num(c.customClearance.fee) }
      : null,
    packing: c.packing
      ? { packer: c.packing.packer?.vendor?.name || "", ratePerKg: num(c.packing.ratePerKg) }
      : null,
    goods,
    totals: {
      quantity: sum("quantity"),
      netWeight: sum("netWeight"),
      tareWeight: sum("tareWeight"),
      grossWeight: sum("grossWeight"),
      goodsCost: sum("goodsCost"),
      packagingCost: sum("packagingCost"),
    },
    costs,
    totalCost,
    recovery: recovery
      ? {
          amount: num(recovery.amount),
          currency: recovery.currency,
          exchangeRate: num(recovery.exchangeRate),
          local: recoveryLocal,
        }
      : null,
    // Recovered (converted) minus all costs; negative is a loss.
    result: recoveryLocal - totalCost,
    taxes: costs.filter((row) => row.tax),
    totalTaxes: costs.filter((row) => row.tax).reduce((total, row) => total + row.amount, 0),
    utilizations: used.map((u) => ({
        number: u.financialInstrument?.number || "",
        bank: u.financialInstrument?.bankName || "",
        currency: u.financialInstrument?.currency || "",
        amount: num(u.financialInstrument?.amount),
        utilized: num(u.utilized),
        balance: num(u.financialInstrument?.balance),
        expiry: u.financialInstrument?.expiryDate || null,
      })),
  };
}

const round2 = (n) => Math.round(num(n) * 100) / 100;
const sameCode = (a, b) => (a || "").trim().toUpperCase() === (b || "").trim().toUpperCase();

// Currency the commercial invoice is made out in: the one saved with it, else
// the consignee's, else the goods declaration's, else the base currency.
export function defaultCommercialCurrency(invoice, baseCurrency) {
  return (
    invoice.commercialCurrency ||
    invoice.consigneeCurrency ||
    invoice.goodsDeclaration?.currency ||
    baseCurrency
  );
}

// A starting selling rate for an item that has none yet: the purchase rate,
// converted at the goods declaration's exchange rate when that is in
// `currency`. Null when it can't be converted.
export function suggestedSaleRate(good, invoice, currency, baseCurrency) {
  if (sameCode(currency, baseCurrency)) return good.ratePerKg;
  const gd = invoice.goodsDeclaration;
  if (gd?.exchangeRate > 0 && sameCode(gd.currency, currency)) {
    return Math.round((good.ratePerKg / gd.exchangeRate) * 10000) / 10000;
  }
  return null;
}

// What the commercial invoice shows: the goods at their selling rates in
// `currency` (no purchase rates, costs or financial instruments), and the
// consignee's account. `rates` maps item id -> rate per kg.
export function computeCommercialInvoice(invoice, { currency, rates = {}, account = null }) {
  const goods = invoice.goods.map((g) => {
    const rate = num(rates[g.id]);
    return { ...g, rate, amount: round2(g.netWeight * rate) };
  });
  const total = round2(goods.reduce((s, g) => s + g.amount, 0));
  return { currency, goods, total, account };
}

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "";

export const formatKg = (value) =>
  `${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} kg`;
