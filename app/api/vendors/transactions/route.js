// app/api/vendors/transactions/route.js
import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { ownedBy, withUser } from "@lib/session";

// What a vendor is to the organization, by which role table points at it.
const ROLES = ["consignee", "packer", "iataAgent", "customAgent"];

export const GET = withUser(async (req, { user }) => {
  const vendors = await prisma.vendor.findMany({
    where: ownedBy(user),
    select: {
      id: true,
      name: true,
      balance: true,
      currency: true,
      _count: { select: { transactions: true } },
      ...Object.fromEntries(
        ROLES.map((role) => [role, { select: { id: true }, take: 1 }])
      ),
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    vendors.map((vendor) => {
      const role = ROLES.find((r) => vendor[r].length) || null;
      const rest = { ...vendor };
      ROLES.forEach((r) => delete rest[r]);
      return { ...rest, role };
    })
  );
});
