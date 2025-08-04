import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function GET(_, { params }) {
  const item = await prisma.customClearance.findUnique({
    where: { id: Number(params.id) },
    include: { customAgent: true },
  });

  return item
    ? NextResponse.json(item)
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PUT(req, { params }) {
  try {
    const { customAgentId, fee } = await req.json();

    const updated = await prisma.customClearance.update({
      where: { id: Number(params.id) },
      data: {
        customAgentId,
        fee: parseFloat(fee),
      },
      include: { customAgent: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  await prisma.customClearance.delete({
    where: { id: Number(params.id) },
  });

  return NextResponse.json({ success: true });
}
