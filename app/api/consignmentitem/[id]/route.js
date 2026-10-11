import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { findOwned, ownedBy, parseId, withUser } from "@lib/session";
import { consignmentItemData } from "@lib/consignments";

const ITEM_INCLUDE = { commodityItem: true, packaging: true };
const itemOwnedBy = (user) => ({ consignment: ownedBy(user) });

export const GET = withUser(async (req, { user, params }) => {
  const item = await findOwned(
    prisma.consignmentItem,
    parseId(params.id),
    itemOwnedBy(user),
    { include: ITEM_INCLUDE }
  );
  return NextResponse.json(item);
});

// Partial update: fields that are not sent (e.g. `damage` from the item
// editor, or quantities from the damage form) keep their current values.
export const PUT = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  const body = await req.json();
  const [, data] = await Promise.all([
    findOwned(prisma.consignmentItem, id, itemOwnedBy(user)),
    consignmentItemData(prisma, body, user, { partial: true }),
  ]);

  const updated = await prisma.consignmentItem.update({
    where: { id },
    data,
    include: ITEM_INCLUDE,
  });

  return NextResponse.json(updated);
});

export const DELETE = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  await findOwned(prisma.consignmentItem, id, itemOwnedBy(user));
  await prisma.consignmentItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
