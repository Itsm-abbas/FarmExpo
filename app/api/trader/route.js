// app/api/trader/route.js
import prisma from "@lib/prisma";
import { traderSchema } from "@lib/validations/trader";
import { NextResponse } from "next/server";
import { ownedBy, stamp, withUser } from "@lib/session";

export const GET = withUser(async (req, { user }) => {
  const traders = await prisma.trader.findMany({
    where: ownedBy(user),
    orderBy: { id: "asc" },
  });
  return NextResponse.json(traders);
});

export const POST = withUser(async (req, { user }) => {
  const parsed = traderSchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const trader = await prisma.trader.create({
    data: { ...parsed.data, ...stamp(user) },
  });
  return NextResponse.json(trader, { status: 201 });
});
