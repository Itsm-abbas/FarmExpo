import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function GET(_, { params }) {
  let { id } = await params;
  id = Number(id);
  const bill = await prisma.airwayBill.findUnique({
    where: { id },
    include: { iataAgent: true },
  });

  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(bill);
}

export async function PUT(req, { params }) {
  let { id } = await params;
  id = Number(id);
  try {
    const { number, iataAgentId, dateTime, rate, airwayBillWeight, fee } =
      await req.json();

    const updated = await prisma.airwayBill.update({
      where: { id },
      data: {
        number,
        iataAgentId,
        dateTime: new Date(dateTime),
        rate: parseFloat(rate),
        airwayBillWeight: parseFloat(airwayBillWeight),
        fee: parseFloat(fee),
      },
      include: { iataAgent: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  let { id } = await params;
  id = Number(id);
  await prisma.airwayBill.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
