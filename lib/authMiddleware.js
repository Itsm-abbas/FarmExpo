import { cookies } from "next/headers";
import { getCookie } from "cookies-next";
import { verifyToken } from "./auth";

export async function requireAdminFromRequest() {
  const token = getCookie("token");
  const user = verifyToken(token);
  console.log("User from authMiddleware:", user);
  if (!user || user.role !== "admin") {
    return null;
  }

  return user;
}
