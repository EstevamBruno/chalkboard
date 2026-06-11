import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { conflict, forbidden, notFound, unauthorized } from "@/lib/http";

// POST /api/invitations/:id/accept — invitee joins the class.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();

  const invitation = await prisma.invitation.findUnique({ where: { id: params.id } });
  if (!invitation) return notFound("Invitation not found");
  if (invitation.inviteeId !== user.id) return forbidden();
  if (invitation.status !== "pending") {
    return conflict(`Invitation already ${invitation.status}`);
  }

  await prisma.$transaction([
    prisma.membership.upsert({
      where: { userId_classId: { userId: user.id, classId: invitation.classId } },
      create: { userId: user.id, classId: invitation.classId, role: "member" },
      update: {},
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "accepted" },
    }),
  ]);

  return NextResponse.json({ classId: invitation.classId, status: "accepted" });
}
