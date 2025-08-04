import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function GET(req, { params }) {
  let { id } = await params;
  id = Number(id);
  const packing = await prisma.packing.findUnique({
    where: { id },
    include: { packer: true },
  });

  if (!packing) {
    return NextResponse.json({ error: "Packing not found" }, { status: 404 });
  }

  return NextResponse.json(packing);
}

export async function PUT(req, { params }) {
  try {
    let { id } = await params;
    id = Number(id);
    const { packer, ratePerKg } = await req.json();

    const updated = await prisma.packing.update({
      where: { id },
      data: {
        packerId: packer.id,
        ratePerKg: parseFloat(ratePerKg),
      },
      include: { packer: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  let { id } = await params;
  id = Number(id);
  await prisma.packing.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
