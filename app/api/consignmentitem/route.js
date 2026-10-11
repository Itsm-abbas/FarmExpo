import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { consignmentItemData } from "@lib/consignments";
import {
  HttpError,
  findOwned,
  ownedBy,
  parseId,
  withUser,
} from "@lib/session";

const ITEM_INCLUDE = { commodityItem: true, packaging: true };

export const POST = withUser(async (req, { user }) => {
  const body = await req.json();
  if (!body.consignmentId) throw new HttpError(400, "Missing consignmentId");
  const consignmentId = parseId(body.consignmentId);
  const [, data] = await Promise.all([
    findOwned(prisma.consignment, consignmentId, ownedBy(user)),
    consignmentItemData(prisma, body, user, { partial: false }),
  ]);
  const savedItem = await prisma.consignmentItem.create({
    data: { damage: 0, ...data, consignmentId },
    include: ITEM_INCLUDE,
  });

  return NextResponse.json(savedItem);
});

export const GET = withUser(async (req, { user }) => {
  const consignmentId = new URL(req.url).searchParams.get("consignmentId");

  const items = await prisma.consignmentItem.findMany({
    where: {
      consignment: ownedBy(user),
      ...(consignmentId ? { consignmentId: parseId(consignmentId) } : {}),
    },
    include: ITEM_INCLUDE,
    orderBy: { id: "desc" },
  });

  return NextResponse.json(items);
});
