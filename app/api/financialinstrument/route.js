import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { financialInstrumentData } from "@lib/financialInstruments";
import { ownedBy, stamp, withUser } from "@lib/session";

// Create Financial Instrument
export const POST = withUser(async (req, { user }) => {
  const data = await financialInstrumentData(await req.json(), user);
  const created = await prisma.financialInstrument.create({
    data: { ...data, ...stamp(user) },
  });
  return NextResponse.json(created);
});

// Get All Financial Instruments
export const GET = withUser(async (req, { user }) => {
  const all = await prisma.financialInstrument.findMany({
    where: ownedBy(user),
    orderBy: { id: "asc" },
    include: {
      trader: true,
      consignee: {
        include: { vendor: true },
      },
    },
  });
  return NextResponse.json(all);
});
