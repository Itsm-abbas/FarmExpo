import prisma from "@lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  const id = parseInt(params.id);
  const packer = await prisma.packer.findUnique({
    where: { id },
    include: { vendor: true },
  });
  if (!packer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(packer);
}

export async function PUT(req, { params }) {
  const id = parseInt(params.id);
  const body = await req.json();

  try {
    const packer = await prisma.packer.findUnique({ where: { id } });
    if (!packer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: packer.vendorId },
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
    const packer = await prisma.packer.findUnique({ where: { id } });
    if (!packer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.packer.delete({ where: { id } });
    await prisma.vendor.delete({ where: { id: packer.vendorId } });

    return NextResponse.json({ message: "Deleted" });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
