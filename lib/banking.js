// The organization's bank accounts, entered and kept by hand.
//
// A bank account holds no running balance of its own: its balance is
// openingBalance + money in - money out over the ledger entries recorded
// through it (Transaction.bankAccountId), so editing or deleting an entry
// can never leave it stale.
import { HttpError, ownedBy, parseId, toNumber } from "@lib/session";

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const code = (currency) => (currency || "").trim().toUpperCase();

export const BANK_TYPES = ["in", "out"];

// The amount an entry moved in its bank account's own currency.
export const bankAmountOf = (t) => (t.bankAmount ?? t.amount) || 0;

// { [bankAccountId]: { moneyIn, moneyOut } } for the given accounts.
export async function bankTotals(db, accountIds) {
  if (!accountIds.length) return {};
  const rows = await db.transaction.groupBy({
    by: ["bankAccountId", "bankType"],
    where: { bankAccountId: { in: accountIds } },
    _sum: { bankAmount: true },
  });
  const totals = {};
  for (const id of accountIds) totals[id] = { moneyIn: 0, moneyOut: 0 };
  for (const row of rows) {
    const key = row.bankType === "out" ? "moneyOut" : "moneyIn";
    totals[row.bankAccountId][key] = round2(row._sum.bankAmount);
  }
  return totals;
}

export const withBalance = (account, { moneyIn = 0, moneyOut = 0 } = {}) => ({
  ...account,
  moneyIn,
  moneyOut,
  balance: round2((account.openingBalance || 0) + moneyIn - moneyOut),
});

const TEXT_FIELDS = ["bankName", "accountTitle", "accountNumber", "currency"];
const OPTIONAL_FIELDS = ["iban", "branch", "swift", "notes"];

// Prisma data for creating (partial: false) or updating a bank account.
export function bankAccountData(body, { partial }) {
  const data = {};
  for (const field of TEXT_FIELDS) {
    const value = body[field];
    if (value === undefined && partial) continue;
    if (typeof value !== "string" || !value.trim()) {
      throw new HttpError(400, "Enter the bank, account title, account number and currency");
    }
    data[field] = field === "currency" ? code(value) : value.trim();
  }
  for (const field of OPTIONAL_FIELDS) {
    if (body[field] === undefined) continue;
    data[field] = typeof body[field] === "string" && body[field].trim() ? body[field].trim() : null;
  }
  if (body.openingBalance !== undefined || !partial) {
    data.openingBalance = toNumber(body.openingBalance, "opening balance") ?? 0;
  }
  if (body.active !== undefined) data.active = Boolean(body.active);
  return data;
}

// The bank side of a manual ledger entry: { bankAccountId, bankType,
// bankAmount }, all null when the money didn't go through a bank account.
// `vendor` is the entry's vendor (for its ledger currency) and `amount` the
// entry's amount in that currency. `current` is the entry being edited:
// an account that has since been closed may stay on it.
export async function readBankSide(db, body, user, { vendor, amount, current = null }) {
  const none = { bankAccountId: null, bankType: null, bankAmount: null };
  if (body.bankAccountId === undefined && current) {
    // Not sent: keep what the entry had, rescaled only if it used the same currency.
    if (!current.bankAccountId) return none;
    const sameAmount = current.bankAmount === null || current.bankAmount === current.amount;
    return {
      bankAccountId: current.bankAccountId,
      bankType: current.bankType,
      bankAmount: sameAmount ? amount : current.bankAmount,
    };
  }
  if (body.bankAccountId === null || body.bankAccountId === "" || body.bankAccountId === undefined) {
    return none;
  }

  const id = parseId(body.bankAccountId);
  const account = await db.bankAccount.findFirst({ where: { id, ...ownedBy(user) } });
  if (!account) throw new HttpError(404, "Bank account not found");
  if (!account.active && current?.bankAccountId !== id) {
    throw new HttpError(400, `${account.bankName} ${account.accountNumber} is closed. Choose another account.`);
  }
  if (!BANK_TYPES.includes(body.bankType)) {
    throw new HttpError(400, "Say whether the money came into the bank or went out of it");
  }

  let bankAmount = amount;
  if (code(account.currency) !== code(vendor.currency)) {
    bankAmount = toNumber(body.bankAmount, "bank amount");
    if (!bankAmount || bankAmount <= 0) {
      throw new HttpError(
        400,
        `The ledger is in ${vendor.currency} and the bank account in ${account.currency}: enter the amount in ${account.currency}.`
      );
    }
  }
  return { bankAccountId: id, bankType: body.bankType, bankAmount: round2(bankAmount) };
}
