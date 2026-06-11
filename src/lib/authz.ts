import { prisma } from "./prisma";

/**
 * Returns the membership role ("owner" | "member") if the user belongs to the
 * class, otherwise null. Owner is also recorded as a membership row at creation.
 */
export async function getMembership(
  userId: string,
  classId: string
): Promise<{ role: string } | null> {
  const membership = await prisma.membership.findUnique({
    where: { userId_classId: { userId, classId } },
    select: { role: true },
  });
  return membership;
}

export async function isMember(userId: string, classId: string): Promise<boolean> {
  return (await getMembership(userId, classId)) !== null;
}

export async function isOwner(userId: string, classId: string): Promise<boolean> {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: { ownerId: true },
  });
  return cls?.ownerId === userId;
}
