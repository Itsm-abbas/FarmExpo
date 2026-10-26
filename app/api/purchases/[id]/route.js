import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { recomputeVendorBalance } from "@lib/ledger";
import {
  PURCHASE_INCLUDE,
  ensureTraderVendor,
  purchaseData,
  syncPurchaseLedger,
} from "@lib/purchases";
import { TX_OPTIONS, findOwned, ownedBy, parseId, withUser } from "@lib/session";

const round2 = (n) => Math.round(n * 100) / 100;

export const GET = withUser(async (req, { user, params }) => {
  const purchase = await findOwned(
    prisma.purchase,
    parseId(params.id),
    ownedBy(user),
    { include: PURCHASE_INCLUDE }
  );
  return NextResponse.json(purchase);
});

// Partial update; the ledger entry follows (to a new trader too).
export const PUT = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  const body = await req.json();
  const [current, data] = await Promise.all([
    findOwned(prisma.purchase, id, ownedBy(user)),
    purchaseData(prisma, body, user, { partial: true }),
  ]);
  const quantity = data.quantity ?? current.quantity;
  const rate = data.rate ?? current.rate;

  const purchase = await prisma.$transaction(async (tx) => {
    await ensureTraderVendor(tx, data.traderId ?? current.traderId, user);
    await tx.purchase.update({
      where: { id },
      data: { ...data, amount: round2(quantity * rate) },
    });
    await syncPurchaseLedger(tx, id, user.id);
    return tx.purchase.findUnique({ where: { id }, include: PURCHASE_INCLUDE });
  }, TX_OPTIONS);

  return NextResponse.json(purchase);
});

// Removes the purchase and its ledger entry.
export const DELETE = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  await findOwned(prisma.purchase, id, ownedBy(user));

  await prisma.$transaction(async (tx) => {
    const entries = await tx.transaction.findMany({
      where: { purchaseId: id },
      select: { vendorId: true },
    });
    await tx.transaction.deleteMany({ where: { purchaseId: id } });
    await tx.purchase.delete({ where: { id } });
    for (const vendorId of [...new Set(entries.map((e) => e.vendorId))].sort((a, b) => a - b)) {
      await recomputeVendorBalance(tx, vendorId);
    }
  }, TX_OPTIONS);

  return NextResponse.json({ success: true });
}, { can: "delete" });
