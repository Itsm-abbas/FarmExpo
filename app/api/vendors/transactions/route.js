// app/api/vendors/transactions/route.js
import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { ownedBy, withUser } from "@lib/session";
import { ROLE_SELECT, withRole } from "@lib/parties";

export const GET = withUser(async (req, { user }) => {
  const vendors = await prisma.vendor.findMany({
    where: ownedBy(user),
    select: {
      id: true,
      name: true,
      balance: true,
      currency: true,
      _count: { select: { transactions: true } },
      ...ROLE_SELECT,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(vendors.map(withRole));
});
