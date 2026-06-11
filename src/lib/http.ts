import { NextResponse } from "next/server";

/** Standard JSON error helper. */
export function error(message: string, status: number, fields?: unknown) {
  return NextResponse.json({ error: message, ...(fields ? { fields } : {}) }, { status });
}

export const unauthorized = () => error("Unauthorized", 401);
export const forbidden = () => error("Forbidden", 403);
export const notFound = (msg = "Not found") => error(msg, 404);
export const conflict = (msg = "Conflict") => error(msg, 409);
