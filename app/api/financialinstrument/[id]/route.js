import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function GET(_, { params }) {
  let { id } = await params;
  id = Number(id);
  try {
    const instrument = await prisma.financialInstrument.findUnique({
      where: { id },
      include: { trader: true, consignee: true },
    });

    if (!instrument)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(instrument);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch instrument" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  let { id } = await params;
  id = Number(id);
  const data = await req.json();

  try {
    const updated = await prisma.financialInstrument.update({
      where: { id },
      data: {
        number: data.number,
        traderId: data.traderId || null,
        bankName: data.bankName || null,
        mode: data.mode || null,
        consigneeId: data.consigneeId || null,
        deliveryTerm: data.deliveryTerm || null,
        currency: data.currency || null,
        localDate: data.localDate ? new Date(data.localDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        status: data.status || null,
        amount: data.amount || 0,
        balance: data.balance || 0,
        iban: data.iban || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update instrument" },
      { status: 500 }
    );
  }
}

export async function DELETE(_, { params }) {
  let { id } = await params;
  id = Number(id);

  try {
    await prisma.financialInstrument.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete instrument" },
      { status: 500 }
    );
  }
}
