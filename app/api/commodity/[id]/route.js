import prisma from "@lib/prisma";
import { commoditySchema } from "@lib/validations/commodity";
import { NextResponse } from "next/server";
import { findOwned, ownedBy, parseId, withUser } from "@lib/session";

export const GET = withUser(async (req, { user, params }) => {
  const item = await findOwned(
    prisma.commodity,
    parseId(params.id),
    ownedBy(user)
  );
  return NextResponse.json(item);
});

export const PUT = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  await findOwned(prisma.commodity, id, ownedBy(user));

  const parsed = commoditySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const updated = await prisma.commodity.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
});

export const DELETE = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  await findOwned(prisma.commodity, id, ownedBy(user));
  await prisma.commodity.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}, { can: "delete" });
