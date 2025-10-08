// app/api/packing/route.js
import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function POST(req) {
  try {
    const { packer, ratePerKg, totalCost } = await req.json();
    console.log("Received data:", { packer, ratePerKg, totalCost });
    if (!packer?.id || !ratePerKg) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newPacking = await prisma.packing.create({
      data: {
        packerId: packer.id,
        ratePerKg: parseFloat(ratePerKg),
        totalCost: totalCost ? parseFloat(totalCost) : null,
      },
      include: { packer: true },
    });

    return NextResponse.json(newPacking);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const allPackings = await prisma.packing.findMany({
    include: { packer: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(allPackings);
}
