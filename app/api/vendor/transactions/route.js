// app/api/vendor/transactions/route.js
// Manual ledger entries. Entries posted from consignments (source != null)
// are managed by lib/ledger.js and can only be changed via the consignment.
// A manual entry may name the bank account the money went through
// (bankAccountId, bankType "in" | "out", bankAmount; see lib/banking.js).
import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { recomputeVendorBalance } from "@lib/ledger";
import { readBankSide } from "@lib/banking";
import {
  HttpError,
  TX_OPTIONS,
  findOwned,
  ownedBy,
  parseId,
  toNumber,
  withUser,
} from "@lib/session";

function readEntry(body) {
  if (!["credit", "debit"].includes(body.type)) {
    throw new HttpError(400, "Type must be 'credit' or 'debit'");
  }
  const amount = toNumber(body.amount, "amount");
  if (!amount || amount <= 0) throw new HttpError(400, "Invalid amount");
  return {
    type: body.type,
    amount,
    details: body.details ?? null,
    transactionId: String(body.transactionId ?? ""),
    voucherId: String(body.voucherId ?? ""),
  };
}

const DAY = 24 * 60 * 60 * 1000;

// Optional `date` ("YYYY-MM-DD", the user's calendar day): the day the money
// moved. Today keeps the current time, so the entry still sorts after
// today's earlier ones. (The user's today may be a day ahead of UTC's.)
function readDate(value) {
  if (!value) return undefined;
  const day = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value)) || Number.isNaN(day.getTime())) {
    throw new HttpError(400, "Invalid date");
  }
  const now = new Date();
  const daysAhead = (day - new Date(`${now.toISOString().slice(0, 10)}T00:00:00Z`)) / DAY;
  if (daysAhead > 1) throw new HttpError(400, "The date can't be in the future");
  if (daysAhead >= 0) return now;
  return new Date(day.getTime() + DAY / 2);
}

async function findOwnedTransaction(id, user) {
  const txn = await findOwned(prisma.transaction, parseId(id), {
    vendor: ownedBy(user),
  }, { include: { vendor: true } });
  if (txn.source) {
    throw new HttpError(
      400,
      txn.source === "purchase"
        ? `This entry was posted automatically from purchase #${txn.purchaseId}. Edit the purchase instead.`
        : `This entry was posted automatically from consignment #${txn.consignmentId}. Edit the consignment instead.`
    );
  }
  return txn;
}

export const POST = withUser(async (req, { user }) => {
  const body = await req.json();
  const vendorId = parseId(body.vendorId);
  const vendor = await findOwned(prisma.vendor, vendorId, ownedBy(user));

  let consignmentId = null;
  if (body.consignmentId) {
    consignmentId = parseId(body.consignmentId);
    await findOwned(prisma.consignment, consignmentId, ownedBy(user));
  }

  const entry = readEntry(body);
  const bank = await readBankSide(prisma, body, user, { vendor, amount: entry.amount });
  const createdAt = readDate(body.date);

  const transaction = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        ...entry,
        ...bank,
        ...(createdAt ? { createdAt } : {}),
        vendorId,
        consignmentId,
        createdBy: user.id,
        balanceAfter: 0, // set by recomputeVendorBalance
      },
    });
    await recomputeVendorBalance(tx, vendorId);
    return tx.transaction.findUnique({ where: { id: created.id } });
  }, TX_OPTIONS);

  return NextResponse.json(transaction);
});

export const PUT = withUser(async (req, { user }) => {
  const body = await req.json();
  const existing = await findOwnedTransaction(body.id, user);
  const entry = readEntry(body);
  const bank = await readBankSide(prisma, body, user, {
    vendor: existing.vendor,
    amount: entry.amount,
    current: existing,
  });

  const updated = await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: existing.id },
      data: { ...entry, ...bank },
    });
    // Recomputing fixes balanceAfter on this entry and every later one.
    await recomputeVendorBalance(tx, existing.vendorId);
    return tx.transaction.findUnique({ where: { id: existing.id } });
  }, TX_OPTIONS);

  return NextResponse.json(updated);
}, { can: "editLedger" });

export const DELETE = withUser(async (req, { user }) => {
  const { id } = await req.json();
  const existing = await findOwnedTransaction(id, user);

  await prisma.$transaction(async (tx) => {
    await tx.transaction.delete({ where: { id: existing.id } });
    await recomputeVendorBalance(tx, existing.vendorId);
  }, TX_OPTIONS);

  return NextResponse.json({ success: true });
}, { can: "editLedger" });
