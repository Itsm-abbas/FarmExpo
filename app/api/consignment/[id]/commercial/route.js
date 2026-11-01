// The commercial invoice of a consignment.
// GET: the consignee's account for the invoice (previous balance, this bill,
// total, outstanding), in the currency of the consignee's ledger.
// PUT { currency, rates: [{ id, saleRate }], billConsignee }: saves the
// selling rates; with billConsignee, the invoice total also becomes the
// consignee's bill (posted to their ledger).
import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { syncConsignmentLedger } from "@lib/ledger";
import { CONSIGNMENT_INCLUDE } from "@lib/consignments";
import {
  HttpError,
  TX_OPTIONS,
  findOwned,
  ownedBy,
  parseId,
  toNumber,
  withUser,
} from "@lib/session";

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const code = (currency) => (currency || "").trim().toUpperCase();

export const GET = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  const consignment = await findOwned(prisma.consignment, id, ownedBy(user), {
    select: {
      consigneeAmount: true,
      consignee: {
        select: {
          vendor: { select: { id: true, name: true, currency: true, balance: true, openingBalance: true } },
        },
      },
    },
  });
  const vendor = consignment.consignee?.vendor;
  if (!vendor) return NextResponse.json({ account: null });

  const entries = await prisma.transaction.findMany({
    where: { consignmentId: id, vendorId: vendor.id },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  // The bill posted to the consignee's ledger for this consignment.
  const bill = entries.find((t) => t.source === "consignee");
  const received = entries
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = round2(vendor.balance ?? vendor.openingBalance);

  // Before the bill was posted, the balance was its running balance less the bill.
  const previousBalance = bill ? round2(bill.balanceAfter - bill.amount) : balance;
  const currentBill = round2(bill ? bill.amount : consignment.consigneeAmount);

  return NextResponse.json({
    account: {
      vendorId: vendor.id,
      name: vendor.name,
      currency: vendor.currency,
      posted: Boolean(bill),
      previousBalance,
      currentBill,
      totalBill: round2(previousBalance + currentBill),
      received: round2(received),
      outstanding: balance,
    },
  });
});

export const PUT = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  const [consignment, body] = await Promise.all([
    findOwned(prisma.consignment, id, ownedBy(user), {
      include: {
        goods: { select: { id: true, quantity: true, weightPerUnit: true, saleRate: true } },
        consignee: { include: { vendor: { select: { currency: true } } } },
      },
    }),
    req.json(),
  ]);

  const currency = code(body.currency);
  if (!/^[A-Z]{3}$/.test(currency)) throw new HttpError(400, "Choose the invoice currency");
  if (!Array.isArray(body.rates)) throw new HttpError(400, "rates must be a list");

  const items = new Map(consignment.goods.map((g) => [g.id, g]));
  const rates = body.rates.map((r) => {
    const item = items.get(Number(r?.id));
    if (!item) throw new HttpError(400, "An item is not on this consignment");
    const saleRate = toNumber(r.saleRate, "rate");
    if (saleRate !== null && saleRate < 0) throw new HttpError(400, "Rates can't be negative");
    return { id: item.id, saleRate };
  });

  const billConsignee = Boolean(body.billConsignee);
  if (billConsignee) {
    if (!consignment.consignee) throw new HttpError(400, "Choose the consignee first");
    if (code(consignment.consignee.vendor?.currency) !== currency) {
      throw new HttpError(
        400,
        `The consignee's ledger is in ${consignment.consignee.vendor?.currency}. Make the invoice out in that currency to bill it to their ledger.`
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    for (const { id: itemId, saleRate } of rates) {
      await tx.consignmentItem.update({ where: { id: itemId }, data: { saleRate } });
    }
    const data = { commercialCurrency: currency };
    if (billConsignee) {
      // Amount = net kg x selling rate, as on the invoice.
      const rateOf = new Map(rates.map((r) => [r.id, r.saleRate]));
      data.consigneeAmount = round2(
        consignment.goods.reduce(
          (sum, g) =>
            sum +
            round2(g.quantity * g.weightPerUnit * ((rateOf.has(g.id) ? rateOf.get(g.id) : g.saleRate) ?? 0)),
          0
        )
      );
    }
    await tx.consignment.update({ where: { id }, data });
    if (billConsignee) await syncConsignmentLedger(tx, id, user.id);
    return tx.consignment.findUnique({ where: { id }, include: CONSIGNMENT_INCLUDE });
  }, TX_OPTIONS);

  return NextResponse.json(updated);
});
