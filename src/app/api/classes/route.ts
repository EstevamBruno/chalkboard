import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { error, unauthorized } from "@/lib/http";

const createSchema = z.object({ name: z.string().min(1).max(120) });

// GET /api/classes — list classes the user owns or is a member of.
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    select: {
      role: true,
      class: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          createdAt: true,
          _count: { select: { memberships: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const classes = memberships.map((m) => ({
    id: m.class.id,
    name: m.class.name,
    ownerId: m.class.ownerId,
    isOwner: m.class.ownerId === user.id,
    memberCount: m.class._count.memberships,
    createdAt: m.class.createdAt,
  }));

  return NextResponse.json({ classes });
}

// POST /api/classes — create a class; creator becomes owner + member.
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body", 400);
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return error("Validation failed", 422, parsed.error.flatten().fieldErrors);
  }

  const cls = await prisma.class.create({
    data: {
      name: parsed.data.name,
      ownerId: user.id,
      memberships: { create: { userId: user.id, role: "owner" } },
    },
    select: { id: true, name: true, ownerId: true, createdAt: true },
  });

  return NextResponse.json(
    { class: { ...cls, isOwner: true, memberCount: 1 } },
    { status: 201 }
  );
}
