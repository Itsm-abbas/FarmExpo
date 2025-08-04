import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

// Create Financial Instrument
export async function POST(req) {
  try {
    const data = await req.json();
    const created = await prisma.financialInstrument.create({
      data: {
        number: data.number,
        traderId: data.traderId,
        bankName: data.bankName,
        mode: data.mode,
        consigneeId: data.consigneeId,
        deliveryTerm: data.deliveryTerm,
        currency: data.currency,
        localDate: new Date(data.localDate),
        expiryDate: new Date(data.expiryDate),
        status: data.status,
        amount: data.amount,
        balance: data.balance,
        iban: data.iban,
      },
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create financial instrument" },
      { status: 500 }
    );
  }
}

// Get All Financial Instruments
export async function GET() {
  try {
    const all = await prisma.financialInstrument.findMany({
      include: {
        trader: true,
        consignee: {
          include: { vendor: true },
        },
      },
    });
    return NextResponse.json(all);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch financial instruments" },
      { status: 500 }
    );
  }
}
