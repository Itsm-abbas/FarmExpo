import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function POST(req) {
  try {
    const { number, iataAgent, dateTime, rate, airwayBillWeight, fee } =
      await req.json();
    const created = await prisma.airwayBill.create({
      data: {
        number,
        iataAgentId: iataAgent?.id,
        dateTime: new Date(dateTime),
        rate: parseFloat(rate),
        airwayBillWeight: parseFloat(airwayBillWeight),
        fee: parseFloat(fee),
      },
      include: { iataAgent: true },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create airway bill" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const bills = await prisma.airwayBill.findMany({
    orderBy: { createdAt: "desc" },
    include: { iataAgent: true },
  });

  return NextResponse.json(bills);
}
