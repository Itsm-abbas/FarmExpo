import prisma from "@lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  const id = parseInt(params.id);
  const customAgent = await prisma.customAgent.findUnique({
    where: { id },
    include: { vendor: true },
  });
  if (!customAgent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(customAgent);
}

export async function PUT(req, { params }) {
  const id = parseInt(params.id);
  const body = await req.json();

  try {
    const customAgent = await prisma.customAgent.findUnique({ where: { id } });
    if (!customAgent) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: customAgent.vendorId },
      data: body,
    });

    return NextResponse.json({ message: "Updated", vendor: updatedVendor });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  const id = parseInt(params.id);

  try {
    const customAgent = await prisma.customAgent.findUnique({ where: { id } });
    if (!customAgent) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.customAgent.delete({ where: { id } });
    await prisma.vendor.delete({ where: { id: customAgent.vendorId } });

    return NextResponse.json({ message: "Deleted" });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
