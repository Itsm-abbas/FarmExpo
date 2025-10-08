// app/api/iata-agent/[id]/route.js
import prisma from "@lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  let { id } = await params;
  id = Number(id);
  const iataAgent = await prisma.IATAAgent.findUnique({
    where: { id },
    include: { vendor: true },
  });
  if (!iataAgent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(iataAgent);
}

export async function PUT(req, { params }) {
  let { id } = await params;
  id = Number(id);
  const body = await req.json();

  try {
    const iataAgent = await prisma.IATAAgent.findUnique({ where: { id } });
    if (!iataAgent) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: iataAgent.vendorId },
      data: body,
    });

    return NextResponse.json({ message: "Updated", vendor: updatedVendor });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  let { id } = await params;
  id = Number(id);

  try {
    const iataAgent = await prisma.IATAAgent.findUnique({ where: { id } });
    if (!iataAgent) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.IATAAgent.delete({ where: { id } });
    await prisma.vendor.delete({ where: { id: iataAgent.vendorId } });

    return NextResponse.json({ message: "Deleted" });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
