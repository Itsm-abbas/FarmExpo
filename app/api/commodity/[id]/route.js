import prisma from "@lib/prisma";
import { commoditySchema } from "@lib/validations/commodity";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const id = parseInt(params.id);
  const item = await prisma.commodity.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PUT(req, { params }) {
  const id = parseInt(params.id);
  const body = await req.json();
  const parsed = commoditySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const updated = await prisma.commodity.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  let { id } = await params;
  id = Number(id);

  try {
    await prisma.commodity.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
