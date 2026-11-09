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

// Only what lists show (the dashboard), much smaller than full records.
const SUMMARY_SELECT = {
  id: true,
  number: true,
  date: true,
  status: true,
  createdAt: true,
  consignee: {
    select: { id: true, vendor: { select: { id: true, name: true, station: true, country: true } } },
  },
};

// ?view=summary returns SUMMARY_SELECT; otherwise full records.
export const GET = withUser(async (req, { user }) => {
  const summary = new URL(req.url).searchParams.get("view") === "summary";
  const consignments = await prisma.consignment.findMany({
    where: ownedBy(user),
    orderBy: { createdAt: "desc" },
    ...(summary ? { select: SUMMARY_SELECT } : { include: CONSIGNMENT_INCLUDE }),
  });

  return NextResponse.json(consignments);
});
