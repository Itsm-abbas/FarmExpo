// app/api/vendor/transactions/[id]/route.js
import prisma from "@lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  let { id } = await params;
  id = Number(id);
  const transactions = await prisma.transaction.findMany({
    where: { vendorId: id },
    orderBy: { createdAt: "desc" },
  });
  const vendor = await prisma.vendor.findUnique({
    where: { id: id },
    select: { id: true, name: true, balance: true, currency: true },
  });

  return NextResponse.json({ vendor, transactions });
}
