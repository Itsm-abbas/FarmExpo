import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
async function GET(_, { params }) {
  let { id } = await params;
  id = Number(id);
  const recovery = await prisma.recoveryDone.findUnique({
    where: { id },
  });

  if (!recovery) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(recovery);
}

export async function PUT(req, { params }) {
  try {
    const { amount, currency, exchangeRate } = await req.json();
    let { id } = await params;
    id = Number(id);
    const updated = await prisma.recoveryDone.update({
      where: { id },
      data: {
        amount: parseFloat(amount),
        currency,
        exchangeRate: parseFloat(exchangeRate),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_) {
  let { id } = await params;
  id = Number(id);
  await prisma.recoveryDone.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
