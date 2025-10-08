// app/api/consignee/[id]/route.js
import prisma from "@lib/prisma";

import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  let { id } = await params;
  id = Number(id);
  const consignee = await prisma.consignee.findUnique({
    where: { id },
    include: { vendor: true },
  });
  if (!consignee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(consignee);
}

export async function PUT(req, { params }) {
  const id = parseInt(params.id);
  const body = await req.json();
  console.log("PUT /api/consignee/[id] body:", body);
  try {
    const consignee = await prisma.consignee.findUnique({ where: { id } });
    if (!consignee) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.log("Found consignee:", consignee);
    const updatedConsignee = await prisma.vendor.update({
      where: { id: consignee.vendorId },
      data: body,
    });

    return NextResponse.json({
      message: "Updated",
      consignee: updatedConsignee,
    });
  } catch (error) {
    console.error("Consignee update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  let { id } = await params;
  id = Number(id);

  try {
    const consignee = await prisma.consignee.findUnique({ where: { id } });
    if (!consignee) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.consignee.delete({ where: { id } });
    await prisma.vendor.delete({ where: { id: consignee.vendorId } });

    return NextResponse.json({ message: "Deleted" });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
