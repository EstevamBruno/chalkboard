import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, verifyPassword } from "@/lib/auth";
import { error } from "@/lib/http";

const schema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
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

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Always run a compare-ish path to reduce trivial timing differences, but the
  // simple approach below is acceptable for v1.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return error("Invalid email or password", 401);
  }

  const token = signToken(user.id);
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
  });
}
