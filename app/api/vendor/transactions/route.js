// app/api/vendor/transactions/route.js
import prisma from "@lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { vendorId, type, amount, note } = await req.json();
  const parsedAmount = parseFloat(amount);

  const transaction = await prisma.transaction.create({
    data: { vendorId, type, amount: parsedAmount, note },
  });

  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      balance: {
        increment: type === "credit" ? parsedAmount : -parsedAmount,
      },
    },
  });

  return NextResponse.json(transaction);
}

export async function PUT(req) {
  const { id, type, amount, note } = await req.json();
  const parsedAmount = parseFloat(amount);

  // Find the existing transaction
  const existing = await prisma.transaction.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  // Reverse old effect on balance
  await prisma.vendor.update({
    where: { id: existing.vendorId },
    data: {
      balance: {
        decrement:
          existing.type === "credit" ? existing.amount : -existing.amount,
      },
    },
  });

  // Update transaction
  const updated = await prisma.transaction.update({
    where: { id },
    data: { type, amount: parsedAmount, note },
  });

  // Apply new effect
  await prisma.vendor.update({
    where: { id: updated.vendorId },
    data: {
      balance: {
        increment: updated.type === "credit" ? parsedAmount : -parsedAmount,
      },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req) {
  const { id } = await req.json();

  const existing = await prisma.transaction.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  // Reverse balance effect
  await prisma.vendor.update({
    where: { id: existing.vendorId },
    data: {
      balance: {
        decrement:
          existing.type === "credit" ? existing.amount : -existing.amount,
      },
    },
  });

  await prisma.transaction.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
