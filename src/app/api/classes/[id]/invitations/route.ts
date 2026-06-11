import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { isOwner } from "@/lib/authz";
import { conflict, error, forbidden, notFound, unauthorized } from "@/lib/http";

const schema = z.object({ email: z.string().email().max(255) });

// POST /api/classes/:id/invitations — owner invites an existing user by email.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();

  if (!(await isOwner(user.id, params.id))) return forbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return error("Validation failed", 422, parsed.error.flatten().fieldErrors);
  }

  const invitee = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true, name: true, email: true },
  });
  if (!invitee) return notFound("No registered user with that email");

  if (invitee.id === user.id) {
    return conflict("You are already the owner of this class");
  }

  // Already a member?
  const existingMembership = await prisma.membership.findUnique({
    where: { userId_classId: { userId: invitee.id, classId: params.id } },
  });
  if (existingMembership) {
    return conflict("That user is already a member of this class");
  }

  // Existing invitation row (unique per class+invitee). Re-open if declined.
  const existing = await prisma.invitation.findUnique({
    where: { classId_inviteeId: { classId: params.id, inviteeId: invitee.id } },
  });

  if (existing) {
    if (existing.status === "pending") {
      return conflict("That user already has a pending invitation");
    }
    const reopened = await prisma.invitation.update({
      where: { id: existing.id },
      data: { status: "pending", inviterId: user.id },
    });
    return NextResponse.json(
      { invitation: { id: reopened.id, invitee, status: reopened.status } },
      { status: 201 }
    );
  }

  const invitation = await prisma.invitation.create({
    data: {
      classId: params.id,
      inviteeId: invitee.id,
      inviterId: user.id,
      status: "pending",
    },
  });

  return NextResponse.json(
    { invitation: { id: invitation.id, invitee, status: invitation.status } },
    { status: 201 }
  );
}
