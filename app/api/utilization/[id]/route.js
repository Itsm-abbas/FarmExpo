import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

// UPDATE a Utilization
export async function PUT(req, { params }) {
  try {
    let { id } = await params;
    id = Number(id);
    const data = await req.json();
    const existingUtil = await prisma.financialInstrumentUtilization.findUnique(
      {
        where: { id },
      }
    );

    if (!existingUtil) {
      return NextResponse.json(
        { error: "Utilization not found" },
        { status: 404 }
      );
    }

    const financialInstrument = await prisma.financialInstrument.findUnique({
      where: { id: data.financialInstrument.id },
    });

    if (!financialInstrument) {
      return NextResponse.json(
        { error: "Financial Instrument not found" },
        { status: 404 }
      );
    }

    // Restore previous utilization
    const restoredBalance = financialInstrument.balance + existingUtil.utilized;

    // Calculate new balance
    const newBalance = restoredBalance - data.utilized;

    if (newBalance < 0) {
      return NextResponse.json(
        { error: "Insufficient balance after update" },
        { status: 400 }
      );
    }

    // Update financial instrument balance
    await prisma.financialInstrument.update({
      where: { id: data.financialInstrument.id },
      data: { balance: newBalance },
    });

    // Update the utilization
    const updated = await prisma.financialInstrumentUtilization.update({
      where: { id },
      data: {
        financialInstrumentId: data.financialInstrumentId,
        goodsDeclarationId: data.goodsDeclarationId,
        utilized: data.utilized,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update utilization" },
      { status: 500 }
    );
  }
}
