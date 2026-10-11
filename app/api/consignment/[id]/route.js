// app/api/consignment/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { removeConsignmentLedger, syncConsignmentLedger } from "@lib/ledger";
import { CONSIGNMENT_INCLUDE, consignmentData } from "@lib/consignments";
import {
  TX_OPTIONS,
  findOwned,
  ownedBy,
  parseId,
  withUser,
} from "@lib/session";

// GET single consignment with nested data
export const GET = withUser(async (req, { user, params }) => {
  const consignment = await findOwned(
    prisma.consignment,
    parseId(params.id),
    ownedBy(user),
    { include: CONSIGNMENT_INCLUDE }
  );
  return NextResponse.json(consignment);
});

// Body keys that change what the consignment posts to vendor ledgers.
const LEDGER_KEYS = [
  "consignee",
  "consigneeAmount",
  "airwayBill",
  "customClearance",
  "packing",
  "recoveryDone",
];
const touchesLedger = (body) =>
  LEDGER_KEYS.some((key) => body[key] !== undefined || body[`${key}Id`] !== undefined);

// PUT - Partial update: only the fields present in the body change.
// Ledger entries for the consignment are re-posted to match.
export const PUT = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  const [current, body] = await Promise.all([
    findOwned(prisma.consignment, id, ownedBy(user)),
    req.json(),
  ]);
  // Linked records are checked before the transaction, all at once.
  const data = await consignmentData(prisma, body, user, current);

  // Saving the trader, date or goods declaration doesn't change any ledger.
  if (!touchesLedger(body)) {
    const updated = await prisma.consignment.update({
      where: { id },
      data,
      include: CONSIGNMENT_INCLUDE,
    });
    return NextResponse.json(updated);
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.consignment.update({ where: { id }, data });
    await syncConsignmentLedger(tx, id, user.id);
    return tx.consignment.findUnique({
      where: { id },
      include: CONSIGNMENT_INCLUDE,
    });
  }, TX_OPTIONS);

  return NextResponse.json(updated);
});

// Deletes `model` row `id` if no other consignment still points at it.
async function deleteIfUnused(tx, model, foreignKey, id) {
  if (!id) return;
  const stillUsed = await tx.consignment.count({ where: { [foreignKey]: id } });
  if (!stillUsed) await tx[model].delete({ where: { id } });
}

// DELETE - Delete consignment, its items, its ledger entries and its
// per-consignment records (airway bill, clearance, packing, recovery, GD).
export const DELETE = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  const consignment = await findOwned(prisma.consignment, id, ownedBy(user));

  await prisma.$transaction(async (tx) => {
    await removeConsignmentLedger(tx, id);
    await tx.consignmentItem.deleteMany({ where: { consignmentId: id } });
    await tx.consignment.delete({ where: { id } });

    await deleteIfUnused(tx, "airwayBill", "airwayBillId", consignment.airwayBillId);
    await deleteIfUnused(tx, "customClearance", "customClearanceId", consignment.customClearanceId);
    await deleteIfUnused(tx, "packing", "packingId", consignment.packingId);
    await deleteIfUnused(tx, "recoveryDone", "recoveryDoneId", consignment.recoveryDoneId);

    const gdId = consignment.goodsDeclarationId;
    if (gdId && !(await tx.consignment.count({ where: { goodsDeclarationId: gdId } }))) {
      // Give the utilized amounts back to their financial instruments.
      const utilizations = await tx.financialInstrumentUtilization.findMany({
        where: { goodsDeclarationId: gdId },
      });
      for (const u of utilizations) {
        await tx.financialInstrument.update({
          where: { id: u.financialInstrumentId },
          data: { balance: { increment: u.utilized } },
        });
      }
      await tx.financialInstrumentUtilization.deleteMany({
        where: { goodsDeclarationId: gdId },
      });
      await tx.goodsDeclaration.delete({ where: { id: gdId } });
    }
  }, TX_OPTIONS);

  return NextResponse.json({ success: true });
}, { can: "delete" });
