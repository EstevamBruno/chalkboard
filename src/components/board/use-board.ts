"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getToken, api } from "@/lib/api";
import type { BoardElement, BoardOp } from "./types";

export type ConnState = "connecting" | "connected" | "denied" | "error";

/**
 * Manages board element state for a class:
 *  - fetches the initial snapshot over REST
 *  - opens a Socket.IO connection, authenticates, and subscribes to the room
 *  - applies inbound ops and exposes a `send` to broadcast local ops
 */
export function useBoard(classId: string) {
  const [elements, setElements] = useState<Map<string, BoardElement>>(new Map());
  const [conn, setConn] = useState<ConnState>("connecting");
  const socketRef = useRef<Socket | null>(null);

  const applyLocal = useCallback((op: BoardOp) => {
    setElements((prev) => {
      const next = new Map(prev);
      switch (op.op) {
        case "add":
        case "update":
          next.set(op.element.id, op.element);
          break;
        case "delete":
          next.delete(op.id);
          break;
        case "clear":
          next.clear();
          break;
      }
      return next;
    });
  }, []);

  // Send an op locally + over the wire.
  const send = useCallback(
    (op: BoardOp) => {
      applyLocal(op);
      socketRef.current?.emit("board:op", { classId, op });
    },
    [applyLocal, classId]
  );

  useEffect(() => {
    let cancelled = false;

    // 1) Initial snapshot
    (async () => {
      try {
        const { elements } = await api<{ elements: BoardElement[] }>(
          `/api/classes/${classId}/board`
        );
        if (cancelled) return;
        setElements(new Map(elements.map((el) => [el.id, el])));
      } catch {
        if (!cancelled) setConn("denied");
      }
    })();

    // 2) Realtime channel
    const socket = io({
      path: "/api/socket",
      auth: { token: getToken() ?? "" },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("subscribe", classId, (res: { ok: boolean; error?: string }) => {
        if (cancelled) return;
        setConn(res?.ok ? "connected" : "denied");
      });
    });

    socket.on("connect_error", () => {
      if (!cancelled) setConn("error");
    });

    // Inbound ops from other members
    socket.on("board:op", (payload: { classId: string } & BoardOp) => {
      if (payload.classId !== classId) return;
      applyLocal(payload as BoardOp);
    });

    return () => {
      cancelled = true;
      socket.emit("unsubscribe", classId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [classId, applyLocal]);

  return { elements, conn, send };
}
