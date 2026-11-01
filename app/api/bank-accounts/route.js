// The organization's bank accounts, with their balances.
import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { bankAccountData, bankTotals, withBalance } from "@lib/banking";
import { ownedBy, stamp, withUser } from "@lib/session";

export const GET = withUser(async (req, { user }) => {
  const accounts = await prisma.bankAccount.findMany({
    where: ownedBy(user),
    include: { _count: { select: { transactions: true } } },
    orderBy: [{ active: "desc" }, { bankName: "asc" }, { id: "asc" }],
  });
  const totals = await bankTotals(prisma, accounts.map((a) => a.id));
  return NextResponse.json(accounts.map((a) => withBalance(a, totals[a.id])));
});

export const POST = withUser(async (req, { user }) => {
  const data = bankAccountData(await req.json(), { partial: false });
  const account = await prisma.bankAccount.create({ data: { ...data, ...stamp(user) } });
  return NextResponse.json(withBalance(account), { status: 201 });
});
