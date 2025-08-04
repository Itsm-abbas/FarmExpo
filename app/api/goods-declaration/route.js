import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function POST(req) {
  try {
    const data = await req.json();
    console.log("Creating Goods Declaration with data:", data);
    const newItem = await prisma.goodsDeclaration.create({
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

    return NextResponse.json(newItem);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create Goods Declaration" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const data = await prisma.goodsDeclaration.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(data);
}
