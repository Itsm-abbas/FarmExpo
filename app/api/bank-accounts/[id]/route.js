// One bank account: its details and statement (every ledger entry recorded
// through it, oldest first, with a running balance).
import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { bankAccountData, bankAmountOf, bankTotals, withBalance } from "@lib/banking";
import { ROLE_SELECT, withRole } from "@lib/parties";
import { HttpError, findOwned, ownedBy, parseId, withUser } from "@lib/session";

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const GET = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  const account = await findOwned(prisma.bankAccount, id, ownedBy(user));
  const entries = await prisma.transaction.findMany({
    where: { bankAccountId: id },
    include: {
      vendor: { select: { id: true, name: true, currency: true, ...ROLE_SELECT } },
      consignment: { select: { id: true, number: true } },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  let balance = account.openingBalance || 0;
  const statement = entries.map((t) => {
    const amount = bankAmountOf(t);
    balance = round2(balance + (t.bankType === "out" ? -amount : amount));
    return { ...t, vendor: withRole(t.vendor), bankAmount: amount, bankBalance: balance };
  });
  const totals = await bankTotals(prisma, [id]);

  return NextResponse.json({ account: withBalance(account, totals[id]), statement });
});

export const PUT = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  const account = await findOwned(prisma.bankAccount, id, ownedBy(user), {
    include: { _count: { select: { transactions: true } } },
  });
  const data = bankAccountData(await req.json(), { partial: true });
  // Amounts already recorded are in the account's currency.
  if (data.currency && data.currency !== account.currency && account._count.transactions) {
    throw new HttpError(
      409,
      `This account has ${account._count.transactions} entries in ${account.currency}, so its currency can't change.`
    );
  }
  const updated = await prisma.bankAccount.update({ where: { id }, data });
  const totals = await bankTotals(prisma, [id]);
  return NextResponse.json(withBalance(updated, totals[id]));
});

export const DELETE = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  await findOwned(prisma.bankAccount, id, ownedBy(user));
  const entries = await prisma.transaction.count({ where: { bankAccountId: id } });
  if (entries) {
    throw new HttpError(
      409,
      `${entries} ledger ${entries === 1 ? "entry was" : "entries were"} recorded through this account. Close it instead, to keep its history.`
    );
  }
  await prisma.bankAccount.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}, { can: "delete" });
