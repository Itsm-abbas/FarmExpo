// What a vendor (ledger account) is to the organization, by which role table
// points at it: "consignee" | "packer" | "iataAgent" | "customAgent" |
// "trader" (a trader/farmer we buy from), "expense" (an expense head), or null.
const ROLES = ["consignee", "packer", "iataAgent", "customAgent"];

// Prisma `select` entries that let roleOf() tell the role.
export const ROLE_SELECT = {
  ...Object.fromEntries(ROLES.map((role) => [role, { select: { id: true }, take: 1 }])),
  trader: { select: { id: true } },
  isExpense: true,
};

export const roleOf = (vendor) =>
  (vendor.isExpense && "expense") ||
  ROLES.find((r) => vendor[r]?.length) || (vendor.trader ? "trader" : null);

// The vendor with its role, without the role lookups.
export function withRole(vendor) {
  const role = roleOf(vendor);
  const rest = { ...vendor };
  ROLES.forEach((r) => delete rest[r]);
  delete rest.trader;
  delete rest.isExpense;
  return { ...rest, role };
}
