import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { saveUtilization } from "@lib/financialInstruments";
import { findOwned, ownedBy, parseId, withUser } from "@lib/session";

// UPDATE a Utilization
export const PUT = withUser(async (req, { user, params }) => {
  const existing = await findOwned(
    prisma.financialInstrumentUtilization,
    parseId(params.id),
    { financialInstrument: ownedBy(user) }
  );
  return NextResponse.json(
    await saveUtilization(await req.json(), user, existing)
  );
});
