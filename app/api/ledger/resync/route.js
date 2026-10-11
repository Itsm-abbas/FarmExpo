// Re-posts the ledger entries of all of the user's consignments and recomputes
// every vendor balance. Used to repair ledgers written by older versions.
import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { recomputeVendorBalance, syncConsignmentLedger } from "@lib/ledger";
import { ownedBy, withUser } from "@lib/session";

export const maxDuration = 60;

export const POST = withUser(async (req, { user }) => {
  const consignments = await prisma.consignment.findMany({
    where: ownedBy(user),
    select: { id: true },
    orderBy: { id: "asc" },
  });
  for (const { id } of consignments) {
    await prisma.$transaction(
      (tx) => syncConsignmentLedger(tx, id, user.id),
      { maxWait: 10000, timeout: 30000 }
    );
  }

  const vendors = await prisma.vendor.findMany({
    where: ownedBy(user),
    select: { id: true },
  });
  for (const { id } of vendors) {
    await recomputeVendorBalance(prisma, id);
  }

  return NextResponse.json({
    consignments: consignments.length,
    vendors: vendors.length,
  });
}, { can: "editLedger" });
