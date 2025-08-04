import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  const { id } = params;
  const packaging = await prisma.packaging.findUnique({
    where: { id: Number(id) },
  });

  if (!packaging) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(packaging);
}

export async function PUT(req, { params }) {
  const { id } = params;
  const body = await req.json();
  const { name, packagingWeightPerUnit } = body;

  const updated = await prisma.packaging.update({
    where: { id: Number(id) },
    data: { name, packagingWeightPerUnit },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  const { id } = params;

  await prisma.packaging.delete({ where: { id: Number(id) } });

  return NextResponse.json({ success: true });
}
