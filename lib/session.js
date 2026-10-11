import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@lib/prisma";
import { verifyToken } from "@lib/auth";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Reads the JWT from the `token` cookie (the browser session) or, failing that,
// an `Authorization: Bearer` header, and returns the matching user from the DB.
// Looking the user up means deleted users, role changes and password resets
// take effect at once.
export async function getSessionUser(req) {
  const bearer = req?.headers
    ?.get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  const token = req?.cookies?.get("token")?.value || bearer;
  if (!token || token === "undefined") return null;

  const payload = verifyToken(token);
  if (!payload?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      organizationId: true,
      passwordChangedAt: true,
    },
  });
  if (!user?.organizationId) return null;
  // Sessions from before the last password change/reset are no longer valid.
  // (Tokens from before issuedAtMs existed fall back to the whole-second iat.)
  const issuedAt = payload.issuedAtMs ?? payload.iat * 1000;
  if (user.passwordChangedAt && issuedAt < user.passwordChangedAt.getTime()) {
    return null;
  }
  return user;
}

// What each role may do. Staff ("user") run day-to-day work — create and edit
// consignments, records and ledger entries — but cannot delete, correct posted
// ledger entries, manage users or change the organization.
export const ROLE_PERMISSIONS = {
  admin: {
    delete: true,
    editLedger: true,
    manageUsers: true,
    manageOrganization: true,
  },
  user: {
    delete: false,
    editLedger: false,
    manageUsers: false,
    manageOrganization: false,
  },
};

export function permissionsFor(user) {
  return ROLE_PERMISSIONS[user?.role] || ROLE_PERMISSIONS.user;
}

export function errorResponse(err) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    if (err.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "This record is linked to other records (consignments, ledger entries, etc.) and cannot be removed.",
        },
        { status: 409 }
      );
    }
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "A record with these details already exists." },
        { status: 409 }
      );
    }
  }
  if (err instanceof SyntaxError) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

// Wraps a route handler so it only runs for a logged-in user. The handler gets
// `{ user, params }` (params already awaited) and may throw HttpError.
// `can` names a permission from ROLE_PERMISSIONS the user must have.
export function withUser(handler, { can } = {}) {
  return async (req, ctx) => {
    try {
      const user = await getSessionUser(req);
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (can && !permissionsFor(user)[can]) {
        return NextResponse.json(
          { error: "Only an admin can do this." },
          { status: 403 }
        );
      }
      const params = (await ctx?.params) || {};
      return await handler(req, { user, params });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

// Records visible to `user`: everything in their organization.
export const ownedBy = (user) => ({ organizationId: user.organizationId });

// Ownership columns for a record `user` creates.
export const stamp = (user) => ({
  organizationId: user.organizationId,
  userId: user.id,
});

// Packer / Consignee / IATAAgent / CustomAgent are owned through their vendor.
export const vendorOwnedBy = (user) => ({ vendor: ownedBy(user) });

export function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "Invalid id");
  }
  return id;
}

// Optional numeric input: "", null and undefined become null; garbage is rejected.
export function toNumber(value, field = "value") {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new HttpError(400, `Invalid ${field}`);
  return n;
}

export function requireNumber(value, field) {
  const n = toNumber(value, field);
  if (n === null) throw new HttpError(400, `${field} is required`);
  return n;
}

// Optional date input: "", null and undefined become null; garbage is rejected.
export function toDate(value, field = "date") {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new HttpError(400, `Invalid ${field}`);
  return d;
}

export function requireDate(value, field) {
  const d = toDate(value, field);
  if (!d) throw new HttpError(400, `${field} is required`);
  return d;
}

// Fetches a record by id, but only if `where` (an ownership filter) matches.
export async function findOwned(delegate, id, where, args = {}) {
  const record = await delegate.findFirst({ where: { id, ...where }, ...args });
  if (!record) throw new HttpError(404, "Not found");
  return record;
}

// Interactive transactions do several round trips to the DB; give them room.
export const TX_OPTIONS = { maxWait: 10000, timeout: 30000 };
