import { prisma } from "@/lib/prisma";
import { boardOpSchema, type BoardOp } from "@/lib/board";

export type AppliedOp =
  | { op: "add"; element: { id: string; type: string; data: unknown; authorId: string; updatedAt: Date } }
  | { op: "update"; element: { id: string; type: string; data: unknown; authorId: string; updatedAt: Date } }
  | { op: "delete"; id: string }
  | { op: "clear" };

/**
 * Validate, persist, and normalize a board operation. Returns the op to
 * broadcast to other room members, or throws on invalid input.
 *
 * Conflict policy: last-write-wins per element (update overwrites the row).
 */
export async function applyOp(
  classId: string,
  userId: string,
  raw: unknown
): Promise<AppliedOp> {
  const parsed = boardOpSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Invalid board operation");
  }
  const op: BoardOp = parsed.data;

  switch (op.op) {
    case "add":
    case "update": {
      const { id, type, data } = op.element;
      const row = await prisma.boardElement.upsert({
        where: { id },
        create: { id, classId, type, data: data as object, authorId: userId },
        update: { type, data: data as object, authorId: userId },
        select: { id: true, type: true, data: true, authorId: true, updatedAt: true },
      });
      return { op: op.op, element: row };
    }
    case "delete": {
      // deleteMany avoids throwing if the element was already removed.
      await prisma.boardElement.deleteMany({ where: { id: op.id, classId } });
      return { op: "delete", id: op.id };
    }
    case "clear": {
      await prisma.boardElement.deleteMany({ where: { classId } });
      return { op: "clear" };
    }
  }
}
