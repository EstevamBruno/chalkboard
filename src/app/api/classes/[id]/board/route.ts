import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { isMember } from "@/lib/authz";
import { forbidden, unauthorized } from "@/lib/http";

// GET /api/classes/:id/board — full element snapshot for members only.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();

  if (!(await isMember(user.id, params.id))) return forbidden();

  const rows = await prisma.boardElement.findMany({
    where: { classId: params.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, type: true, data: true, authorId: true, updatedAt: true },
  });

  const elements = rows.map((r) => ({
    id: r.id,
    type: r.type,
    data: r.data,
    authorId: r.authorId,
    updatedAt: r.updatedAt,
  }));

  return NextResponse.json({ elements });
}
