import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { getMembership } from "@/lib/authz";
import { forbidden, notFound, unauthorized } from "@/lib/http";

// GET /api/classes/:id — class details for members/owner only.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();

  const cls = await prisma.class.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      ownerId: true,
      createdAt: true,
      owner: { select: { id: true, name: true, email: true } },
      memberships: {
        select: { role: true, user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!cls) return notFound("Class not found");

  const membership = await getMembership(user.id, params.id);
  if (!membership) return forbidden();

  return NextResponse.json({
    class: {
      id: cls.id,
      name: cls.name,
      ownerId: cls.ownerId,
      isOwner: cls.ownerId === user.id,
      createdAt: cls.createdAt,
      owner: cls.owner,
      members: cls.memberships.map((m) => ({ role: m.role, ...m.user })),
    },
  });
}

// DELETE /api/classes/:id — owner only. Cascades to memberships,
// invitations, and board elements via the schema's onDelete rules.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();

  const cls = await prisma.class.findUnique({
    where: { id: params.id },
    select: { ownerId: true },
  });
  if (!cls) return notFound("Class not found");
  if (cls.ownerId !== user.id) return forbidden();

  await prisma.class.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true, id: params.id });
}
