// Ledger entries across every vendor, newest first, for the Transactions page.
// ?from, ?to (YYYY-MM-DD, inclusive), ?vendorId, ?bankAccountId ("none" for
// entries not through a bank), ?kind ("manual" | "auto"). New entries are
// added through /api/vendor/transactions.
import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { ROLE_SELECT, withRole } from "@lib/parties";
import { HttpError, ownedBy, parseId, withUser } from "@lib/session";

const LIMIT = 1000;
const DAY = 24 * 60 * 60 * 1000;

function day(value, field) {
  const d = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(d.getTime())) {
    throw new HttpError(400, `Invalid ${field}`);
  }
  return d;
}

export const GET = withUser(async (req, { user }) => {
  const params = new URL(req.url).searchParams;
  const where = { vendor: ownedBy(user) };

  // A day around the edges, so entries made late or early in the user's own
  // time zone still count; the page narrows by its own calendar day.
  const createdAt = {};
  if (params.get("from")) createdAt.gte = new Date(day(params.get("from"), "from") - DAY);
  if (params.get("to")) createdAt.lt = new Date(day(params.get("to"), "to").getTime() + 2 * DAY);
  if (createdAt.gte || createdAt.lt) where.createdAt = createdAt;

  if (params.get("vendorId")) where.vendorId = parseId(params.get("vendorId"));
  const bank = params.get("bankAccountId");
  if (bank === "none") where.bankAccountId = null;
  else if (bank) where.bankAccountId = parseId(bank);
  if (params.get("kind") === "manual") where.source = null;
  if (params.get("kind") === "auto") where.source = { not: null };

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      vendor: { select: { id: true, name: true, currency: true, ...ROLE_SELECT } },
      bankAccount: {
        select: { id: true, bankName: true, accountNumber: true, currency: true },
      },
      consignment: { select: { id: true, number: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: LIMIT + 1,
  });

  return NextResponse.json({
    transactions: transactions.slice(0, LIMIT).map((t) => ({ ...t, vendor: withRole(t.vendor) })),
    truncated: transactions.length > LIMIT,
  });
});
