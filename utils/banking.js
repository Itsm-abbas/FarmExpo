// Payments in ledger terms.
//
// A consignee's ledger counts what they owe us (their bill is a credit), so a
// payment received from them is a debit. Every other ledger (packers, agents,
// traders and farmers) counts what we owe them (their charges are credits),
// so a payment we send them is a debit. The other direction is a credit.

export const ROLE_LABELS = {
  consignee: "Consignee",
  packer: "Packer",
  iataAgent: "IATA agent",
  customAgent: "Custom agent",
  trader: "Trader / farmer",
  expense: "Expense",
};

// An expense head counts what was spent, so spending is a credit, like a bill.
const owesUs = (role) => role === "consignee" || role === "expense";

// "received" | "paid" -> the ledger entry's type.
export const ledgerTypeFor = (role, direction) =>
  (direction === "received") === owesUs(role) ? "debit" : "credit";

// The reverse: was a manual entry money received or paid? Entries through a
// bank account say so themselves.
export function directionOf(entry, role) {
  if (entry.bankType) return entry.bankType === "in" ? "received" : "paid";
  return (entry.type === "debit") === owesUs(role) ? "received" : "paid";
}

// Bank side of a ledger entry: "in" | "out".
export const bankTypeFor = (role, ledgerType) =>
  directionOf({ type: ledgerType }, role) === "received" ? "in" : "out";

export const bankLabel = (account) =>
  account ? `${account.bankName} ${account.accountNumber}` : "";

export const sameCurrency = (a, b) => (a || "").toUpperCase() === (b || "").toUpperCase();
