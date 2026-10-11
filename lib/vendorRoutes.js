// Route handlers shared by the four vendor roles (consignee, packer, IATA agent,
// custom agent). Each role row points at a Vendor that holds the details,
// the owner (`userId`) and the ledger balance.
import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { recomputeVendorBalance } from "@lib/ledger";
import {
  HttpError,
  TX_OPTIONS,
  findOwned,
  stamp,
  parseId,
  toNumber,
  vendorOwnedBy,
  withUser,
} from "@lib/session";

const VENDOR_TEXT_FIELDS = [
  "name",
  "ntn",
  "address",
  "country",
  "station",
  "currency",
];

function readVendorFields(body, { partial }) {
  const data = {};
  for (const field of VENDOR_TEXT_FIELDS) {
    const value = body[field];
    if (value === undefined && partial) continue;
    if (typeof value !== "string" || !value.trim()) {
      throw new HttpError(400, "Missing required fields");
    }
    data[field] = value.trim();
  }
  // The forms call the opening balance "Initial Balance" and send it as
  // `balance` (edit forms also echo back the stored `openingBalance`).
  const opening = body.balance !== undefined ? body.balance : body.openingBalance;
  if (opening !== undefined || !partial) {
    data.openingBalance = toNumber(opening, "balance") ?? 0;
  }
  return data;
}

export function vendorRoleCollectionRoutes(model, { label, idKey }) {
  const GET = withUser(async (req, { user }) => {
    const rows = await prisma[model].findMany({
      where: vendorOwnedBy(user),
      include: { vendor: true },
      orderBy: { id: "asc" },
    });
    return NextResponse.json(rows);
  });

  const POST = withUser(async (req, { user }) => {
    const data = readVendorFields(await req.json(), { partial: false });

    const { vendor, role } = await prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.create({
        data: { ...data, balance: data.openingBalance, ...stamp(user) },
      });
      const role = await tx[model].create({ data: { vendorId: vendor.id } });
      return { vendor, role };
    }, TX_OPTIONS);

    return NextResponse.json({
      message: `${label} created`,
      vendorId: vendor.id,
      [idKey]: role.id,
    });
  });

  return { GET, POST };
}

export function vendorRoleItemRoutes(model, { label }) {
  const GET = withUser(async (req, { user, params }) => {
    const row = await findOwned(
      prisma[model],
      parseId(params.id),
      vendorOwnedBy(user),
      { include: { vendor: true } }
    );
    return NextResponse.json(row);
  });

  const PUT = withUser(async (req, { user, params }) => {
    const row = await findOwned(
      prisma[model],
      parseId(params.id),
      vendorOwnedBy(user)
    );
    const data = readVendorFields(await req.json(), { partial: true });

    const vendor = await prisma.$transaction(async (tx) => {
      await tx.vendor.update({ where: { id: row.vendorId }, data });
      // A new opening balance shifts every running balance after it.
      if (data.openingBalance !== undefined) {
        await recomputeVendorBalance(tx, row.vendorId);
      }
      return tx.vendor.findUnique({ where: { id: row.vendorId } });
    }, TX_OPTIONS);

    return NextResponse.json({ message: "Updated", vendor });
  });

  const DELETE = withUser(async (req, { user, params }) => {
    const id = parseId(params.id);
    const row = await findOwned(prisma[model], id, vendorOwnedBy(user));

    const ledgerEntries = await prisma.transaction.count({
      where: { vendorId: row.vendorId },
    });
    if (ledgerEntries > 0) {
      throw new HttpError(
        409,
        `This ${label.toLowerCase()} has ${ledgerEntries} ledger transaction(s) and cannot be deleted.`
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx[model].delete({ where: { id } });
      await tx.vendor.delete({ where: { id: row.vendorId } });
    }, TX_OPTIONS);

    return NextResponse.json({ message: "Deleted" });
  }, { can: "delete" });

  return { GET, PUT, DELETE };
}
