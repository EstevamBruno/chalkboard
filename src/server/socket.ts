import type { Server as HttpServer } from "http";
import { Server as IOServer, type Socket } from "socket.io";
import { verifyToken } from "@/lib/auth";
import { isMember } from "@/lib/authz";
import { applyOp } from "./board-store";

interface SocketData {
  userId: string;
}

const room = (classId: string) => `class:${classId}`;

export function attachSocketServer(httpServer: HttpServer): IOServer {
  const io = new IOServer(httpServer, {
    path: "/api/socket",
    cors: { origin: true, credentials: true },
  });

  // --- Auth middleware: validate bearer token from the handshake. ----------
  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ||
      extractFromHeader(socket.handshake.headers.authorization);
    const userId = token ? verifyToken(token) : null;
    if (!userId) {
      return next(new Error("unauthorized"));
    }
    (socket.data as SocketData).userId = userId;
    next();
  });

  io.on("connection", (socket: Socket) => {
    const userId = (socket.data as SocketData).userId;

    // Subscribe to a class board the user is a member of.
    socket.on("subscribe", async (classId: string, ack?: (res: unknown) => void) => {
      try {
        if (typeof classId !== "string" || !classId) {
          return ack?.({ ok: false, error: "invalid classId" });
        }
        if (!(await isMember(userId, classId))) {
          return ack?.({ ok: false, error: "forbidden" });
        }
        await socket.join(room(classId));
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false, error: "subscribe failed" });
      }
    });

    socket.on("unsubscribe", (classId: string) => {
      if (typeof classId === "string") socket.leave(room(classId));
    });

    // Apply and broadcast a board operation.
    socket.on(
      "board:op",
      async (
        payload: { classId: string; op: unknown },
        ack?: (res: unknown) => void
      ) => {
        try {
          const { classId, op } = payload ?? {};
          if (typeof classId !== "string" || !classId) {
            return ack?.({ ok: false, error: "invalid payload" });
          }
          // Re-verify membership AND that the socket joined the room.
          if (!socket.rooms.has(room(classId)) || !(await isMember(userId, classId))) {
            return ack?.({ ok: false, error: "forbidden" });
          }

          const applied = await applyOp(classId, userId, op);
          // Broadcast to everyone else in the room.
          socket.to(room(classId)).emit("board:op", { classId, ...applied });
          ack?.({ ok: true, applied });
        } catch (err) {
          ack?.({ ok: false, error: (err as Error).message || "op failed" });
        }
      }
    );
  });

  return io;
}

function extractFromHeader(header?: string): string | undefined {
  if (!header) return undefined;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m ? m[1].trim() : undefined;
}
