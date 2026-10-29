// Purchases of produce from traders and farmers.
//
// Each purchase posts what we owe the trader (quantity x rate) to the trader's
// ledger as an automatic credit entry, kept in step on every edit and removed
// with the purchase. The daily price list averages purchases per day and
// commodity, weighted by quantity.
import { recomputeVendorBalance } from "@lib/ledger";
import { HttpError, ownedBy, toNumber } from "@lib/session";

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const PURCHASE_INCLUDE = {
  trader: { select: { id: true, name: true, vendorId: true } },
  commodity: { select: { id: true, name: true, number: true } },
};

// A purchase date ("2026-10-26", or a full timestamp) as that day at
// midnight UTC, so every purchase of a day groups together.
export function dayOf(value, field = "date") {
  if (value === undefined || value === null || value === "") {
    throw new HttpError(400, `${field} is required`);
  }
  const text = typeof value === "string" ? value.slice(0, 10) : "";
  const day = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T00:00:00.000Z`)
    : new Date(value);
  if (Number.isNaN(day.getTime())) throw new HttpError(400, `Invalid ${field}`);
  day.setUTCHours(0, 0, 0, 0);
  return day;
}

export const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

// Validates a purchase body. With `partial`, absent fields are kept.
export async function purchaseData(db, body, user, { partial }) {
  const data = {};
  if (body.date !== undefined || !partial) data.date = dayOf(body.date);

  for (const field of ["quantity", "rate"]) {
    if (body[field] === undefined && partial) continue;
    const value = toNumber(body[field], field);
    if (!(value > 0)) throw new HttpError(400, `${field} must be more than 0`);
    data[field] = value;
  }

  if (body.notes !== undefined) {
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";
    if (notes.length > 500) throw new HttpError(400, "Notes are too long");
    data.notes = notes || null;
  }

  const links = {
    traderId: ["trader", body.traderId ?? body.trader?.id],
    commodityId: ["commodity", body.commodityId ?? body.commodity?.id],
  };
  await Promise.all(
    Object.entries(links).map(async ([column, [model, id]]) => {
      if (id === undefined && partial) return;
      const linkedId = Number(id);
      const linked =
        Number.isInteger(linkedId) &&
        (await db[model].findFirst({
          where: { id: linkedId, ...ownedBy(user) },
          select: { id: true },
        }));
      if (!linked) throw new HttpError(400, `Choose a valid ${model}`);
      data[column] = linkedId;
    })
  );
  return data;
}

// The trader's ledger account, created the first time we buy from them,
// in the organization's base currency.
export async function ensureTraderVendor(db, traderId, user) {
  const trader = await db.trader.findUnique({ where: { id: traderId } });
  if (trader.vendorId) return trader.vendorId;

  const organization = await db.organization.findUnique({
    where: { id: trader.organizationId ?? user.organizationId },
    select: { baseCurrency: true },
  });
  const vendor = await db.vendor.create({
    data: {
      name: trader.name,
      ntn: trader.ntn,
      address: trader.address,
      country: trader.country,
      station: "",
      currency: organization?.baseCurrency || "PKR",
      openingBalance: 0,
      balance: 0,
      organizationId: trader.organizationId ?? user.organizationId,
      userId: user.id,
    },
  });
  // Only link it if no other request linked one first.
  const { count } = await db.trader.updateMany({
    where: { id: traderId, vendorId: null },
    data: { vendorId: vendor.id },
  });
  if (count) return vendor.id;
  await db.vendor.delete({ where: { id: vendor.id } });
  return (await db.trader.findUnique({ where: { id: traderId } })).vendorId;
}

const formatDay = (date) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const formatNumber = (n) =>
  Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

export function purchaseDetails(purchase) {
  return `Purchase #${purchase.id}: ${formatNumber(purchase.quantity)} kg ${
    purchase.commodity?.name || "produce"
  } @ ${formatNumber(purchase.rate)}/kg on ${formatDay(purchase.date)}`;
}

// Brings the ledger entry for one purchase in line with the purchase (or
// removes it if the purchase is gone), then fixes the affected balances.
export async function syncPurchaseLedger(db, purchaseId, userId) {
  const purchase = await db.purchase.findUnique({
    where: { id: purchaseId },
    include: PURCHASE_INCLUDE,
  });
  const [current, ...duplicates] = await db.transaction.findMany({
    where: { purchaseId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const touched = new Set();

  for (const dup of duplicates) {
    await db.transaction.delete({ where: { id: dup.id } });
    touched.add(dup.vendorId);
  }

  const vendorId = purchase?.trader.vendorId;
  if (!purchase || !vendorId) {
    if (current) {
      await db.transaction.delete({ where: { id: current.id } });
      touched.add(current.vendorId);
    }
  } else {
    const want = {
      vendorId,
      type: "credit",
      amount: round2(purchase.amount),
      details: purchaseDetails(purchase),
    };
    if (!current) {
      await db.transaction.create({
        data: {
          ...want,
          purchaseId,
          source: "purchase",
          transactionId: `PUR-${purchaseId}`,
          voucherId: `PUR-${purchaseId}`,
          createdBy: userId ?? null,
          balanceAfter: 0, // set by recomputeVendorBalance below
        },
      });
      touched.add(vendorId);
    } else if (
      current.vendorId !== want.vendorId ||
      current.type !== want.type ||
      current.amount !== want.amount ||
      current.details !== want.details
    ) {
      await db.transaction.update({ where: { id: current.id }, data: want });
      touched.add(current.vendorId);
      touched.add(vendorId);
    }
  }

  for (const id of [...touched].sort((a, b) => a - b)) await recomputeVendorBalance(db, id);
}

// Purchases grouped by day and commodity, newest day first. The average cost
// is weighted by quantity: total amount / total kg.
export function dailyPrices(purchases) {
  const groups = new Map();
  for (const p of purchases) {
    const key = `${dayKey(p.date)}|${p.commodityId}`;
    if (!groups.has(key)) {
      groups.set(key, {
        date: dayKey(p.date),
        commodity: p.commodity,
        quantity: 0,
        amount: 0,
        minRate: Infinity,
        maxRate: -Infinity,
        traders: new Map(),
        purchases: [],
      });
    }
    const g = groups.get(key);
    g.quantity += p.quantity;
    g.amount += p.amount;
    g.minRate = Math.min(g.minRate, p.rate);
    g.maxRate = Math.max(g.maxRate, p.rate);
    g.traders.set(p.trader.id, { id: p.trader.id, name: p.trader.name });
    g.purchases.push({
      id: p.id,
      trader: { id: p.trader.id, name: p.trader.name },
      quantity: p.quantity,
      rate: p.rate,
      amount: p.amount,
      notes: p.notes,
    });
  }

  return [...groups.values()]
    .map(({ traders, ...g }) => ({
      ...g,
      quantity: round2(g.quantity),
      amount: round2(g.amount),
      averageRate: g.quantity ? round2(g.amount / g.quantity) : 0,
      traders: [...traders.values()],
    }))
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        (a.commodity?.name || "").localeCompare(b.commodity?.name || "")
    );
}

// ?from=YYYY-MM-DD&to=YYYY-MM-DD as a Prisma date filter (both inclusive).
export function dateRange(searchParams) {
  const range = {};
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from) range.gte = dayOf(from, "from");
  if (to) range.lte = dayOf(to, "to");
  return Object.keys(range).length ? range : undefined;
}

// Sets what we already owed the trader before using the app (the `balance`
// field of the trader form, as for packers). The ledger account is created
// for a non-zero amount; every running balance shifts with it.
export async function setTraderOpeningBalance(db, traderId, value, user) {
  if (value === undefined) return;
  const opening = toNumber(value, "balance") ?? 0;
  const trader = await db.trader.findUnique({ where: { id: traderId } });
  if (!trader.vendorId && opening === 0) return;
  const vendorId = trader.vendorId ?? (await ensureTraderVendor(db, traderId, user));
  await db.vendor.update({ where: { id: vendorId }, data: { openingBalance: opening } });
  await recomputeVendorBalance(db, vendorId);
}
