// The financial instruments a consignment uses, saved as a whole list:
// PUT { instruments: [{ financialInstrumentId, utilized }] }.
import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { CONSIGNMENT_INCLUDE } from "@lib/consignments";
import { setConsignmentInstruments } from "@lib/financialInstruments";
import { TX_OPTIONS, findOwned, ownedBy, parseId, withUser } from "@lib/session";

export const PUT = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  const [, body] = await Promise.all([
    findOwned(prisma.consignment, id, ownedBy(user)),
    req.json(),
  ]);

  const consignment = await prisma.$transaction(async (tx) => {
    await setConsignmentInstruments(tx, id, body.instruments, user);
    return tx.consignment.findUnique({ where: { id }, include: CONSIGNMENT_INCLUDE });
  }, TX_OPTIONS);

  return NextResponse.json(consignment);
});
