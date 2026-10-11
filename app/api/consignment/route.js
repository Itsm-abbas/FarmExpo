import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { syncConsignmentLedger } from "@lib/ledger";
import { CONSIGNMENT_INCLUDE, consignmentData } from "@lib/consignments";
import { HttpError, TX_OPTIONS, ownedBy, stamp, withUser } from "@lib/session";

export const POST = withUser(async (req, { user }) => {
  const body = await req.json();
  if (!body.date) throw new HttpError(400, "date is required");

  const created = await prisma.$transaction(async (tx) => {
    const data = await consignmentData(tx, body, user);
    const consignment = await tx.consignment.create({
      data: { ...data, ...stamp(user) },
    });
    await syncConsignmentLedger(tx, consignment.id, user.id);
    return tx.consignment.findUnique({
      where: { id: consignment.id },
      include: CONSIGNMENT_INCLUDE,
    });
  }, TX_OPTIONS);

  return NextResponse.json(created);
});

export const GET = withUser(async (req, { user }) => {
  const consignments = await prisma.consignment.findMany({
    where: ownedBy(user),
    orderBy: { createdAt: "desc" },
    include: CONSIGNMENT_INCLUDE,
  });

  return NextResponse.json(consignments);
});
