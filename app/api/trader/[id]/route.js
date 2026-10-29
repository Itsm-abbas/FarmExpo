import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { traderSchema } from "@lib/validations/trader";
import {
  HttpError,
  TX_OPTIONS,
  findOwned,
  ownedBy,
  parseId,
  toNumber,
  withUser,
} from "@lib/session";
import { setTraderOpeningBalance } from "@lib/purchases";

const LEDGER = {
  vendor: { select: { id: true, balance: true, openingBalance: true, currency: true } },
};

// ✅ GET /api/trader/:id
export const GET = withUser(async (req, { user, params }) => {
  const trader = await findOwned(
    prisma.trader,
    parseId(params.id),
    ownedBy(user),
    { include: LEDGER }
  );
  return NextResponse.json(trader);
});

// ✅ PUT /api/trader/:id
export const PUT = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  const trader = await findOwned(prisma.trader, id, ownedBy(user));

  const body = await req.json();
  const parsed = traderSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }
  toNumber(body.balance, "balance"); // reject a bad amount before saving anything

  const updated = await prisma.$transaction(async (tx) => {
    // The ledger account carries the same name and details.
    if (trader.vendorId) {
      await tx.vendor.update({ where: { id: trader.vendorId }, data: parsed.data });
    }
    await tx.trader.update({ where: { id }, data: parsed.data });
    // "Opening balance" edits what we owed them before any ledger entry.
    await setTraderOpeningBalance(tx, id, body.balance, user);
    return tx.trader.findUnique({ where: { id }, include: LEDGER });
  }, TX_OPTIONS);

  return NextResponse.json(updated);
});

// ✅ DELETE /api/trader/:id
export const DELETE = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  const trader = await findOwned(prisma.trader, id, ownedBy(user));

  const [purchases, entries] = await Promise.all([
    prisma.purchase.count({ where: { traderId: id } }),
    trader.vendorId
      ? prisma.transaction.count({ where: { vendorId: trader.vendorId } })
      : 0,
  ]);
  if (purchases) {
    throw new HttpError(409, `This trader has ${purchases} purchase(s) and cannot be deleted.`);
  }
  if (entries) {
    throw new HttpError(409, `This trader has ${entries} ledger transaction(s) and cannot be deleted.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.trader.delete({ where: { id } });
    if (trader.vendorId) await tx.vendor.delete({ where: { id: trader.vendorId } });
  }, TX_OPTIONS);
  return NextResponse.json({ message: "Deleted successfully" });
}, { can: "delete" });
