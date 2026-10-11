import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { traderSchema } from "@lib/validations/trader";
import { findOwned, ownedBy, parseId, withUser } from "@lib/session";

// ✅ GET /api/trader/:id
export const GET = withUser(async (req, { user, params }) => {
  const trader = await findOwned(
    prisma.trader,
    parseId(params.id),
    ownedBy(user)
  );
  return NextResponse.json(trader);
});

// ✅ PUT /api/trader/:id
export const PUT = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  await findOwned(prisma.trader, id, ownedBy(user));

  const parsed = traderSchema.partial().safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const updated = await prisma.trader.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
});

// ✅ DELETE /api/trader/:id
export const DELETE = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  await findOwned(prisma.trader, id, ownedBy(user));
  await prisma.trader.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted successfully" });
}, { can: "delete" });
