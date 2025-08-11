// app/api/vendors/transactions/route.js
import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@lib/auth";

function getUserFromCookies() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function GET() {
  const user = getUserFromCookies();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Example permission: return vendors belonging to user's account/createdBy. Adapt as needed.
  const where = {}; // if you need scoped results, add filters like { createdById: user.id } or accountId

  const vendors = await prisma.vendor.findMany({
    where,
    select: {
      id: true,
      name: true,
      balance: true,
      currency: true,
      _count: { select: { transactions: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(vendors);
}
