// app/api/vendor/transactions/[id]/route.js — `id` is the vendor id.
import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { ROLE_SELECT, withRole } from "@lib/parties";
import { HttpError, findOwned, ownedBy, parseId, withUser } from "@lib/session";

export const GET = withUser(async (req, { user, params }) => {
  const id = parseId(params.id);
  const vendor = await findOwned(prisma.vendor, id, ownedBy(user), {
    select: {
      id: true,
      name: true,
      balance: true,
      openingBalance: true,
      currency: true,
      ...ROLE_SELECT,
    },
  });

  const transactions = await prisma.transaction.findMany({
    where: { vendorId: id },
    include: {
      consignment: {
        select: {
          id: true,
          number: true,
          date: true,
          status: true,
        },
      },
      purchase: { select: { id: true, date: true } },
      bankAccount: {
        select: { id: true, bankName: true, accountNumber: true, currency: true },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return NextResponse.json({ vendor: withRole(vendor), transactions });
});

// Expense heads (Office expenses, House expenses…) exist only as ledgers, so
// they are renamed and deleted here. Other parties are managed on their own
// pages (consignees, packers, agents, traders).
async function findExpenseHead(id, user) {
  const vendor = await findOwned(prisma.vendor, parseId(id), ownedBy(user));
  if (!vendor.isExpense) {
    throw new HttpError(400, "Only expense ledgers are changed here. Edit the party on its own page.");
  }
  return vendor;
}

export const PUT = withUser(async (req, { user, params }) => {
  const vendor = await findExpenseHead(params.id, user);
  const { name: value } = await req.json();
  const name = typeof value === "string" ? value.trim() : "";
  if (!name) throw new HttpError(400, "Enter a name");
  if (name.length > 120) throw new HttpError(400, "The name is too long");
  const clash = await prisma.vendor.findFirst({
    where: {
      ...ownedBy(user),
      isExpense: true,
      id: { not: vendor.id },
      name: { equals: name, mode: "insensitive" },
    },
  });
  if (clash) throw new HttpError(409, `There is already an expense called ${clash.name}.`);
  await prisma.vendor.update({ where: { id: vendor.id }, data: { name } });
  return NextResponse.json({ success: true });
}, { can: "editLedger" });

export const DELETE = withUser(async (req, { user, params }) => {
  const vendor = await findExpenseHead(params.id, user);
  const entries = await prisma.transaction.count({ where: { vendorId: vendor.id } });
  if (entries) {
    throw new HttpError(
      409,
      `This expense has ${entries} entr${entries === 1 ? "y" : "ies"}. Delete or move them first.`
    );
  }
  await prisma.vendor.delete({ where: { id: vendor.id } });
  return NextResponse.json({ success: true });
}, { can: "editLedger" });
