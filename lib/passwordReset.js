import crypto from "crypto";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESEND_AFTER_MS = 60 * 1000;

// Only the hash is stored, so a leaked database can't be used to reset passwords.
export const hashResetToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

export function newResetToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  return {
    token,
    resetTokenHash: hashResetToken(token),
    resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  };
}

// True if a reset email went out less than a minute ago.
export function recentlySent(user) {
  if (!user.resetTokenExpiresAt) return false;
  const sentAt = user.resetTokenExpiresAt.getTime() - RESET_TOKEN_TTL_MS;
  return Date.now() - sentAt < RESEND_AFTER_MS;
}

// Base URL for links in emails. APP_URL must be set in production: deriving
// it from the request would let a forged Host header redirect reset links.
export function appUrl(req) {
  const configured = process.env.APP_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : req.nextUrl.origin;
}
