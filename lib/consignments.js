import { HttpError, ownedBy, toDate, toNumber, vendorOwnedBy } from "@lib/session";

export const CONSIGNMENT_INCLUDE = {
  trader: true,
  consignee: { include: { vendor: true } },
  airwayBill: { include: { iataAgent: { include: { vendor: true } } } },
  goodsDeclaration: true,
  customClearance: { include: { customAgent: { include: { vendor: true } } } },
  packing: { include: { packer: { include: { vendor: true } } } },
  recoveryDone: true,
  goods: {
    include: { commodityItem: true, packaging: true },
    orderBy: { id: "asc" },
  },
  // Financial instruments the consignment uses (several are allowed).
  utilizations: {
    include: {
      financialInstrument: {
        include: { trader: true, consignee: { include: { vendor: true } } },
      },
    },
    orderBy: { id: "asc" },
  },
};

const MAX_TAXES = 50;

// [{ remark, amount }] -> validated list (amounts in the base currency).
export function readTaxes(value) {
  if (value === null) return [];
  if (!Array.isArray(value)) throw new HttpError(400, "taxes must be a list");
  if (value.length > MAX_TAXES) throw new HttpError(400, `At most ${MAX_TAXES} taxes`);
  return value.map((tax, i) => {
    const remark = typeof tax?.remark === "string" ? tax.remark.trim() : "";
    if (!remark) throw new HttpError(400, `Tax ${i + 1}: enter a remark`);
    if (remark.length > 200) throw new HttpError(400, `Tax ${i + 1}: the remark is too long`);
    const amount = toNumber(tax?.amount, "tax amount");
    if (amount === null || amount < 0) {
      throw new HttpError(400, `Tax ${i + 1}: enter an amount of 0 or more`);
    }
    return { remark, amount: Math.round(amount * 100) / 100 };
  });
}

// A consignment number, unique within the organization.
export async function readNumber(db, value, user, currentId = null) {
  const number = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  if (!number) throw new HttpError(400, "Enter the consignment number");
  if (number.length > 50) throw new HttpError(400, "The consignment number is too long");
  const taken = await db.consignment.findFirst({
    where: { ...ownedBy(user), number, ...(currentId ? { id: { not: currentId } } : {}) },
    select: { id: true },
  });
  if (taken) throw new HttpError(409, `Consignment number ${number} is already used.`);
  return number;
}

// Relation key on Consignment -> how to check the linked record belongs to the user.
const LINKS = {
  trader: { model: "trader", owner: ownedBy },
  consignee: { model: "consignee", owner: vendorOwnedBy },
  airwayBill: { model: "airwayBill", owner: ownedBy },
  goodsDeclaration: { model: "goodsDeclaration", owner: ownedBy },
  customClearance: { model: "customClearance", owner: ownedBy },
  packing: { model: "packing", owner: ownedBy },
  recoveryDone: { model: "recoveryDone", owner: ownedBy },
};

// Statuses only move forward, so saving an earlier step again
// (e.g. the consignee) cannot knock a fulfilled consignment back to "Pending".
const STATUS_ORDER = ["Not started", "Pending", "Custom Cleared", "Fulfilled"];

function nextStatus(current, requested) {
  if (!requested) return undefined;
  const from = STATUS_ORDER.indexOf(current);
  const to = STATUS_ORDER.indexOf(requested);
  if (to === -1 || from === -1 || to > from) return requested;
  return undefined;
}

// Builds Prisma `data` for creating/updating a consignment from a request body.
// Only keys present in the body are touched. Linked records are accepted as
// `{ trader: { id } }` (what the forms send) or `{ traderId }`, and must be owned
// by the user. `goods` is ignored: items have their own /api/consignmentitem routes.
export async function consignmentData(db, body, user, current = null) {
  const data = {};

  if (body.date !== undefined) {
    const date = toDate(body.date, "date");
    if (!date) throw new HttpError(400, "date is required");
    data.date = date;
  }

  const status = current
    ? nextStatus(current.status, body.status)
    : body.status || "Not started";
  if (status !== undefined) data.status = status;

  for (const field of ["localInvoiceWeight", "dailyExpenses", "consigneeAmount"]) {
    if (body[field] !== undefined) data[field] = toNumber(body[field], field);
  }

  // Required when creating; renaming checks it is still unique.
  if (body.number !== undefined || !current) {
    data.number = await readNumber(db, body.number, user, current?.id);
  }
  if (body.taxes !== undefined) data.taxes = readTaxes(body.taxes);

  // The ownership checks run together; a full save sends up to seven links.
  await Promise.all(
    Object.entries(LINKS).map(async ([key, { model, owner }]) => {
      let id;
      if (body[key] !== undefined) id = body[key]?.id ?? null;
      else if (body[`${key}Id`] !== undefined) id = body[`${key}Id`];
      else return;

      if (id === null || id === "") {
        if (current) data[key] = { disconnect: true };
        return;
      }

      const linkedId = Number(id);
      const linked =
        Number.isInteger(linkedId) &&
        (await db[model].findFirst({
          where: { id: linkedId, ...owner(user) },
          select: { id: true },
        }));
      if (!linked) throw new HttpError(400, `Invalid ${key}`);
      data[key] = { connect: { id: linkedId } };
    })
  );

  return data;
}

// Validates a consignment item body: numeric fields, plus the commodity and
// packaging, which must belong to the user. With `partial`, absent fields are
// skipped. `damage` is only written when sent.
export async function consignmentItemData(db, body, user, { partial }) {
  const data = {};
  const numbers = {
    weightPerUnit: false,
    commodityPerUnitCost: false,
    packagingPerUnitCost: false,
    quantity: true, // integer columns
    damage: true,
  };
  for (const [field, integer] of Object.entries(numbers)) {
    if (body[field] === undefined && (partial || field === "damage")) continue;
    const value = toNumber(body[field], field) ?? 0;
    if (value < 0) throw new HttpError(400, `${field} cannot be negative`);
    data[field] = integer ? Math.round(value) : value;
  }

  const links = {
    commodityItemId: ["commodity", body.commodityItem?.id ?? body.commodityItemId],
    packagingId: ["packaging", body.packaging?.id ?? body.packagingId],
  };
  // Both links are checked at the same time rather than one after the other.
  await Promise.all(
    Object.entries(links).map(async ([column, [model, id]]) => {
      if (id === undefined && partial) return;
      const linkedId = Number(id);
      const linked =
        Number.isInteger(linkedId) &&
        (await db[model].findFirst({
          where: { id: linkedId, ...ownedBy(user) },
          select: { id: true },
        }));
      if (!linked) throw new HttpError(400, `Invalid ${model}`);
      data[column] = linkedId;
    })
  );
  return data;
}
