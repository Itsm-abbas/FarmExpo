import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

// Create or update FIU
export async function POST(req) {
  try {
    const data = await req.json();
    const { financialInstrument, goodsDeclaration, utilized } = data;

    if (!financialInstrument?.id || !goodsDeclaration?.id || !utilized) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const fiId = financialInstrument.id;
    const gdId = goodsDeclaration.id;
    const newUtilized = parseFloat(utilized);

    // Fetch the financial instrument from DB
    const fi = await prisma.financialInstrument.findUnique({
      where: { id: fiId },
    });

    if (!fi) {
      return NextResponse.json(
        { error: "Financial Instrument not found" },
        { status: 404 }
      );
    }

    // Find existing utilization for this pair
    const existingUtil = await prisma.financialInstrumentUtilization.findFirst({
      where: {
        financialInstrumentId: fiId,
        goodsDeclarationId: gdId,
      },
    });

    let updatedBalance = fi.balance;

    if (existingUtil) {
      // Restore old utilized amount
      updatedBalance += existingUtil.utilized;
    }

    // Deduct new utilized amount
    updatedBalance -= newUtilized;

    if (updatedBalance < 0) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Update financial instrument balance
    await prisma.financialInstrument.update({
      where: { id: fiId },
      data: { balance: updatedBalance },
    });

    let updatedUtilization;
    if (existingUtil) {
      // Update existing
      updatedUtilization = await prisma.financialInstrumentUtilization.update({
        where: { id: existingUtil.id },
        data: {
          utilized: newUtilized,
        },
      });
    } else {
      // Create new
      updatedUtilization = await prisma.financialInstrumentUtilization.create({
        data: {
          financialInstrumentId: fiId,
          goodsDeclarationId: gdId,
          utilized: newUtilized,
        },
      });
    }

    return NextResponse.json(updatedUtilization);
  } catch (error) {
    console.error("FIU POST error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
export async function GET() {
  try {
    const utilizations = await prisma.financialInstrumentUtilization.findMany({
      include: {
        financialInstrument: true,
        goodsDeclaration: true,
      },
    });

    return NextResponse.json(utilizations);
  } catch (error) {
    console.error("FIU GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch utilizations" },
      { status: 500 }
    );
  }
}
