import prisma from "@lib/prisma";
import { commoditySchema } from "@lib/validations/commodity";
import { NextResponse } from "next/server";
import { ownedBy, stamp, withUser } from "@lib/session";

export const GET = withUser(async (req, { user }) => {
  const commodities = await prisma.commodity.findMany({
    where: ownedBy(user),
    orderBy: { id: "asc" },
  });
  return NextResponse.json(commodities);
});

export const POST = withUser(async (req, { user }) => {
  const parsed = commoditySchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const commodity = await prisma.commodity.create({
    data: { ...parsed.data, ...stamp(user) },
  });
  return NextResponse.json(commodity, { status: 201 });
});
