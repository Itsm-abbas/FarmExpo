import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { findOwned, ownedBy, parseId, withUser } from "@lib/session";

export const GET = withUser(async (req, { user, params }) => {
  const packaging = await findOwned(
    prisma.packaging,
    parseId(params.id),
    ownedBy(user)
  );
  return NextResponse.json(packaging);
});

export const PUT = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  await findOwned(prisma.packaging, id, ownedBy(user));
  const { name, packagingWeightPerUnit } = await req.json();

  const updated = await prisma.packaging.update({
    where: { id },
    data: {
      name,
      packagingWeightPerUnit:
        packagingWeightPerUnit === undefined
          ? undefined
          : String(packagingWeightPerUnit),
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  await findOwned(prisma.packaging, id, ownedBy(user));
  await prisma.packaging.delete({ where: { id } });
  return NextResponse.json({ success: true });
}, { can: "delete" });
