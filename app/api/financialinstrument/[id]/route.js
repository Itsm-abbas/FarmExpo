import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { financialInstrumentData } from "@lib/financialInstruments";
import { findOwned, ownedBy, parseId, withUser } from "@lib/session";

export const GET = withUser(async (req, { user, params }) => {
  const instrument = await findOwned(
    prisma.financialInstrument,
    parseId(params.id),
    ownedBy(user),
    { include: { trader: true, consignee: { include: { vendor: true } } } }
  );
  return NextResponse.json(instrument);
});

export const PUT = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  await findOwned(prisma.financialInstrument, id, ownedBy(user));

  const updated = await prisma.financialInstrument.update({
    where: { id },
    data: await financialInstrumentData(await req.json(), user),
  });

  return NextResponse.json(updated);
});

export const DELETE = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  await findOwned(prisma.financialInstrument, id, ownedBy(user));
  await prisma.financialInstrument.delete({ where: { id } });
  return NextResponse.json({ success: true });
}, { can: "delete" });
