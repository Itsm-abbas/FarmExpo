import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function POST(req) {
  try {
    const { amount, currency, exchangeRate } = await req.json();

    const recovery = await prisma.recoveryDone.create({
      data: {
        amount: parseFloat(amount),
        currency,
        exchangeRate: parseFloat(exchangeRate),
      },
    });

    return NextResponse.json(recovery);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create recovery" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const allRecoveries = await prisma.recoveryDone.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(allRecoveries);
}
