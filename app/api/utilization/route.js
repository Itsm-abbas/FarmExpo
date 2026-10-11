import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { saveUtilization } from "@lib/financialInstruments";
import { ownedBy, withUser } from "@lib/session";

// Create, or update the existing utilization of the same instrument + GD.
export const POST = withUser(async (req, { user }) => {
  const body = await req.json();
  const existing = await prisma.financialInstrumentUtilization.findFirst({
    where: {
      financialInstrumentId: Number(body.financialInstrument?.id),
      goodsDeclarationId: Number(body.goodsDeclaration?.id),
      financialInstrument: ownedBy(user),
    },
  });
  return NextResponse.json(await saveUtilization(body, user, existing));
});

export const GET = withUser(async (req, { user }) => {
  const utilizations = await prisma.financialInstrumentUtilization.findMany({
    where: { financialInstrument: ownedBy(user) },
    include: {
      financialInstrument: true,
      goodsDeclaration: true,
    },
  });

  return NextResponse.json(utilizations);
});
