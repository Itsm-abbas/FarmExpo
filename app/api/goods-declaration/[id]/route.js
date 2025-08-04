import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function GET(_, { params }) {
  let { id } = await params;
  id = Number(id);
  const item = await prisma.goodsDeclaration.findUnique({
    where: { id },
  });
  return item
    ? NextResponse.json(item)
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PUT(req, { params }) {
  try {
    const data = await req.json();
    let { id } = await params;
    id = Number(id);
    const updated = await prisma.goodsDeclaration.update({
      where: { id },
      data: {
        number: data.number,
        date: new Date(data.date),
        exchangeRate: parseFloat(data.exchangeRate),
        commercialInvoiceNumber: data.commercialInvoiceNumber,
        fob: parseFloat(data.fob),
        gdFreight: parseFloat(data.gdFreight),
        r1: parseFloat(data.r1),
        dateR1: new Date(data.dateR1),
        r2: parseFloat(data.r2),
        dateR2: new Date(data.dateR2),
        r3: parseFloat(data.r3),
        dateR3: new Date(data.dateR3),
        r4: parseFloat(data.r4),
        dateR4: new Date(data.dateR4),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
