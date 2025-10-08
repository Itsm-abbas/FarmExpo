// app/api/vendor/transactions/route.js
import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
// app/api/vendor/transactions/route.js - Update POST handler

export async function POST(req) {
  const {
    vendorId,
    transactionId,
    voucherId,
    type,
    amount,
    details,
    consignmentId,
  } = await req.json();
  const parsedAmount = parseFloat(amount);

  // Get vendor current balance
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { balance: true },
  });

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  // Compute new balance (ADD to existing balance)
  const newBalance =
    type === "credit"
      ? vendor.balance + parsedAmount
      : vendor.balance - parsedAmount;

  // Create transaction with balanceAfter and consignmentId
  const transaction = await prisma.transaction.create({
    data: {
      vendorId,
      transactionId,
      voucherId,
      type,
      amount: parsedAmount,
      details,
      balanceAfter: newBalance,
      consignmentId: consignmentId ? parseInt(consignmentId) : null, // Add consignment reference
    },
  });

  // Update vendor balance (this adds to existing balance)
  await prisma.vendor.update({
    where: { id: vendorId },
    data: { balance: newBalance },
  });

  return NextResponse.json(transaction);
}
export async function PUT(req) {
  const { id, type, amount, details, transactionId, voucherId } =
    await req.json();
  const parsedAmount = parseFloat(amount);

  // Find the existing transaction
  const existing = await prisma.transaction.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  // Check if this is the latest transaction for that vendor
  const lastTransaction = await prisma.transaction.findFirst({
    where: { vendorId: existing.vendorId },
    orderBy: { createdAt: "desc" },
  });

  // if (!lastTransaction || lastTransaction.id !== existing.id) {
  //   return NextResponse.json(
  //     { error: "Only the most recent transaction can be updated" },
  //     { status: 400 }
  //   );
  // }

  // Reverse old effect on vendor balance
  await prisma.vendor.update({
    where: { id: existing.vendorId },
    data: {
      balance: {
        decrement:
          existing.type === "credit" ? existing.amount : -existing.amount,
      },
    },
  });

  // Update transaction (without afterBalance yet)
  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      type,
      amount: parsedAmount,
      details,
      transactionId,
      voucherId,
    },
  });

  // Apply new effect to vendor balance
  const vendor = await prisma.vendor.update({
    where: { id: updated.vendorId },
    data: {
      balance: {
        increment: updated.type === "credit" ? parsedAmount : -parsedAmount,
      },
    },
  });

  // Update transaction.afterBalance with latest vendor balance
  const finalTransaction = await prisma.transaction.update({
    where: { id },
    data: {
      balanceAfter: vendor.balance,
    },
  });

  return NextResponse.json(finalTransaction);
}

export async function DELETE(req) {
  const { id } = await req.json();

  // Find the transaction
  const existing = await prisma.transaction.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  // Check if this is the latest transaction for that vendor
  const lastTransaction = await prisma.transaction.findFirst({
    where: { vendorId: existing.vendorId },
    orderBy: { createdAt: "desc" },
  });

  // if (!lastTransaction || lastTransaction.id !== existing.id) {
  //   return NextResponse.json(
  //     { error: "Only the latest transaction can be deleted" },
  //     { status: 400 }
  //   );
  // }

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

  // Delete transaction
  await prisma.transaction.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
