import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import { conflict, error } from "@/lib/http";

const schema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(200),
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

  const { email, name, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return conflict("An account with this email already exists");
  }

  const user = await prisma.user.create({
    data: { email: normalizedEmail, name, passwordHash: await hashPassword(password) },
    select: { id: true, email: true, name: true },
  });

  const token = signToken(user.id);
  return NextResponse.json({ user, token }, { status: 201 });
}
