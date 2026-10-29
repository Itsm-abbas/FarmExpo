// app/api/trader/route.js
import prisma from "@lib/prisma";
import { traderSchema } from "@lib/validations/trader";
import { NextResponse } from "next/server";
import { TX_OPTIONS, ownedBy, stamp, toNumber, withUser } from "@lib/session";
import { setTraderOpeningBalance } from "@lib/purchases";

const LEDGER = {
  vendor: { select: { id: true, balance: true, openingBalance: true, currency: true } },
};

export const GET = withUser(async (req, { user }) => {
  const traders = await prisma.trader.findMany({
    where: ownedBy(user),
    // Traders we buy from have a ledger account.
    include: LEDGER,
    orderBy: { id: "asc" },
  });
  return NextResponse.json(traders);
});

export const POST = withUser(async (req, { user }) => {
  const body = await req.json();
  const parsed = traderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }
  toNumber(body.balance, "balance"); // reject a bad amount before saving anything

  const trader = await prisma.$transaction(async (tx) => {
    const created = await tx.trader.create({
      data: { ...parsed.data, ...stamp(user) },
    });
    // Opening balance: what we already owe them (as for packers).
    await setTraderOpeningBalance(tx, created.id, body.balance, user);
    return tx.trader.findUnique({ where: { id: created.id }, include: LEDGER });
  }, TX_OPTIONS);
  return NextResponse.json(trader, { status: 201 });
});
