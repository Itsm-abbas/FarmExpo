// app/api/vendor/transactions/[id]/route.js — `id` is the vendor id.
import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { ROLE_SELECT, withRole } from "@lib/parties";
import { findOwned, ownedBy, parseId, withUser } from "@lib/session";

export const GET = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  const vendor = await findOwned(prisma.vendor, id, ownedBy(user), {
    select: {
      id: true,
      name: true,
      balance: true,
      openingBalance: true,
      currency: true,
      ...ROLE_SELECT,
    },
  });

  const transactions = await prisma.transaction.findMany({
    where: { vendorId: id },
    include: {
      consignment: {
        select: {
          id: true,
          number: true,
          date: true,
          status: true,
        },
      },
      purchase: { select: { id: true, date: true } },
      bankAccount: {
        select: { id: true, bankName: true, accountNumber: true, currency: true },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return NextResponse.json({ vendor: withRole(vendor), transactions });
});
