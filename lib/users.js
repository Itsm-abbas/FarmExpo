import prisma from "@lib/prisma";
import { HttpError, parseId } from "@lib/session";

// A member of the admin's organization, other than the admin themselves.
export async function findMember(admin, id) {
  const userId = parseId(id);
  if (userId === admin.id) {
    throw new HttpError(
      400,
      "You can't change your own account here. Use your profile instead."
    );
  }
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId: admin.organizationId },
  });
  if (!user) throw new HttpError(404, "User not found");
  return user;
}

// Emails are stored as typed; look them up without regard to case.
export function findUserByEmail(email) {
  return prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
}
