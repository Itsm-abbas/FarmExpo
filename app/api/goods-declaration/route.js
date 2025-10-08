import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function POST(req) {
  try {
    const data = await req.json();

    // Helper function to safely parse date
    const parseDate = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    };

    // Helper function to safely parse float
    const parseFloatSafe = (value) => {
      if (value === null || value === undefined || value === "") return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    const newItem = await prisma.goodsDeclaration.create({
      data: {
        number: data.number,
        date: new Date(data.date), // This is required, so it should always be valid
        exchangeRate: parseFloatSafe(data.exchangeRate),
        commercialInvoiceNumber: data.commercialInvoiceNumber,
        fob: parseFloatSafe(data.fob),
        gdFreight: parseFloatSafe(data.gdFreight),
        r1: parseFloatSafe(data.r1),
        dateR1: parseDate(data.dateR1),
        r2: parseFloatSafe(data.r2),
        dateR2: parseDate(data.dateR2),
        r3: parseFloatSafe(data.r3),
        dateR3: parseDate(data.dateR3),
        r4: parseFloatSafe(data.r4),
        dateR4: parseDate(data.dateR4),
      },
    });

    console.log("Created Goods Declaration:", newItem);
    return NextResponse.json(newItem);
  } catch (err) {
    console.error("Error creating Goods Declaration:", err);
    return NextResponse.json(
      { error: "Failed to create Goods Declaration", details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const url = new URL(req.url);
    const id = parseInt(url.pathname.split("/").pop());
    const data = await req.json();

    // Helper function to safely parse date
    const parseDate = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    };

    // Helper function to safely parse float
    const parseFloatSafe = (value) => {
      if (value === null || value === undefined || value === "") return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    const updatedItem = await prisma.goodsDeclaration.update({
      where: { id },
      data: {
        number: data.number,
        date: new Date(data.date),
        exchangeRate: parseFloatSafe(data.exchangeRate),
        commercialInvoiceNumber: data.commercialInvoiceNumber,
        fob: parseFloatSafe(data.fob),
        gdFreight: parseFloatSafe(data.gdFreight),
        r1: parseFloatSafe(data.r1),
        dateR1: parseDate(data.dateR1),
        r2: parseFloatSafe(data.r2),
        dateR2: parseDate(data.dateR2),
        r3: parseFloatSafe(data.r3),
        dateR3: parseDate(data.dateR3),
        r4: parseFloatSafe(data.r4),
        dateR4: parseDate(data.dateR4),
      },
    });

    console.log("Updated Goods Declaration:", updatedItem);
    return NextResponse.json(updatedItem);
  } catch (err) {
    console.error("Error updating Goods Declaration:", err);
    return NextResponse.json(
      { error: "Failed to update Goods Declaration", details: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const data = await prisma.goodsDeclaration.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching Goods Declarations:", err);
    return NextResponse.json(
      { error: "Failed to fetch Goods Declarations" },
      { status: 500 }
    );
  }
}
