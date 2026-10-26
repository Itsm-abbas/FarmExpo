// app/api/vendor/transactions/route.js
// Manual ledger entries. Entries posted from consignments (source != null)
// are managed by lib/ledger.js and can only be changed via the consignment.
import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { recomputeVendorBalance } from "@lib/ledger";
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

async function findOwnedTransaction(id, user) {
  const txn = await findOwned(prisma.transaction, parseId(id), {
    vendor: ownedBy(user),
  });
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
  await findOwned(prisma.vendor, vendorId, ownedBy(user));

  let consignmentId = null;
  if (body.consignmentId) {
    consignmentId = parseId(body.consignmentId);
    await findOwned(prisma.consignment, consignmentId, ownedBy(user));
  }

  const transaction = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        ...readEntry(body),
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

  const updated = await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: existing.id },
      data: readEntry(body),
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
