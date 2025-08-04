import { cookies } from "next/headers";
import { verifyToken } from "./auth";

export function requireAdminFromRequest() {
  const token = cookies().get("token")?.value;
  const user = verifyToken(token);

  if (!user || user.role !== "admin") {
    return null;
  }

  return user;
}
