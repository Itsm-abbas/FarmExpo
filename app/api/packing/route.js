import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function POST(req) {
  try {
    const { packer, ratePerKg } = await req.json();

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
