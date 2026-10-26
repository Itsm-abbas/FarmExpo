// Purchases from traders/farmers. Each one posts to the trader's ledger.
import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import {
  PURCHASE_INCLUDE,
  dateRange,
  ensureTraderVendor,
  purchaseData,
  syncPurchaseLedger,
} from "@lib/purchases";
import { TX_OPTIONS, ownedBy, parseId, stamp, withUser } from "@lib/session";

const round2 = (n) => Math.round(n * 100) / 100;

// ?from, ?to (YYYY-MM-DD, inclusive), ?traderId, ?commodityId
export const GET = withUser(async (req, { user }) => {
  const params = new URL(req.url).searchParams;
  const where = { ...ownedBy(user) };
  const date = dateRange(params);
  if (date) where.date = date;
  if (params.get("traderId")) where.traderId = parseId(params.get("traderId"));
  if (params.get("commodityId")) where.commodityId = parseId(params.get("commodityId"));

  const purchases = await prisma.purchase.findMany({
    where,
    include: PURCHASE_INCLUDE,
    orderBy: [{ date: "desc" }, { id: "desc" }],
  });
  return NextResponse.json(purchases);
});

export const POST = withUser(async (req, { user }) => {
  const data = await purchaseData(prisma, await req.json(), user, {
    partial: false,
  });

  const purchase = await prisma.$transaction(async (tx) => {
    await ensureTraderVendor(tx, data.traderId, user);
    const created = await tx.purchase.create({
      data: { ...data, amount: round2(data.quantity * data.rate), ...stamp(user) },
    });
    await syncPurchaseLedger(tx, created.id, user.id);
    return tx.purchase.findUnique({
      where: { id: created.id },
      include: PURCHASE_INCLUDE,
    });
  }, TX_OPTIONS);

  return NextResponse.json(purchase, { status: 201 });
});
