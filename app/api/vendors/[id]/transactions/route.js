// app/api/vendors/[id]/transactions/route.js
import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@lib/auth";

/* helper */
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

export async function GET(req, { params }) {
  const user = getUserFromCookies();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendorId = parseInt(params.id, 10);
  if (Number.isNaN(vendorId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor)
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  // permission check (adapt to your model)
  const allowed =
    user.role === "admin" ||
    vendor.createdById === user.id ||
    vendor.createdById === user.accountId;
  if (!allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const transactions = await prisma.transaction.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ vendor, transactions });
}

export async function POST(req, { params }) {
  const user = getUserFromCookies();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendorId = parseInt(params.id, 10);
  if (Number.isNaN(vendorId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json();
  const { type, amount, note } = body;

  if (!["credit", "debit"].includes(type)) {
    return NextResponse.json(
      { error: "Type must be 'credit' or 'debit'" },
      { status: 400 }
    );
  }
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor)
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  // permission check (adapt)
  const allowed =
    user.role === "admin" ||
    vendor.createdById === user.id ||
    vendor.createdById === user.accountId;
  if (!allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const txRecord = await tx.transaction.create({
        data: {
          vendorId,
          type,
          amount: numericAmount,
          note: note || null,
          createdBy: user.id,
        },
      });

      const newBalance =
        type === "credit"
          ? vendor.balance + numericAmount
          : vendor.balance - numericAmount;

      // optional: prevent negative balances
      // if (newBalance < 0) throw new Error("Insufficient balance");

      const updatedVendor = await tx.vendor.update({
        where: { id: vendorId },
        data: { balance: newBalance },
      });

      return { txRecord, updatedVendor };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("Transaction error:", err);
    return NextResponse.json(
      { error: err.message || "Failed" },
      { status: 500 }
    );
  }
}
