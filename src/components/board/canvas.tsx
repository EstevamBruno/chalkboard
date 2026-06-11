"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createId } from "@paralleldrive/cuid2";
import { useI18n } from "@/components/i18n-provider";
import type { BoardElement, BoardOp, FontKey, Point, Tool } from "./types";

interface Props {
  elements: Map<string, BoardElement>;
  tool: Tool;
  color: string;
  width: number;
  font: FontKey;
  onOp: (op: BoardOp) => void;
}

const EMIT_INTERVAL = 70; // ms — throttle live updates while drawing/dragging

export function Canvas({ elements, tool, color, width, font, onOp }: Props) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  // The element currently being drawn (not yet committed elsewhere).
  const draftRef = useRef<BoardElement | null>(null);
  const drawingRef = useRef(false);
  const lastEmitRef = useRef(0);

  // Selection + drag-to-move
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dragRef = useRef<{ el: BoardElement; last: Point; moved: boolean } | null>(null);

  // Inline text editing
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(
    null
  );
  const textRef = useRef<HTMLInputElement>(null);

  const textSize = Math.max(16, width * 6);

  // Focus the text input AFTER the placing click's own focus handling settles.
  // Using autoFocus instead causes the browser's post-mousedown focus shift to
  // immediately blur (and commit) the freshly mounted input.
  useEffect(() => {
    if (!textInput) return;
    const raf = requestAnimationFrame(() => textRef.current?.focus());
    return () => cancelAnimationFrame(raf);
    // Only re-run when an input is opened/closed, not on each keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textInput !== null]);

  // Clear selection when switching to a non-select tool.
  useEffect(() => {
    if (tool !== "select") setSelectedId(null);
  }, [tool]);

  // Delete / Backspace removes the selected element.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (!selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onOp({ op: "delete", id: selectedId });
        setSelectedId(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, onOp]);

  // --- Rendering -----------------------------------------------------------
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, dpr } = sizeRef.current;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const dragging = dragRef.current;
    let selectedEl: BoardElement | null = null;

    for (const el of elements.values()) {
      // While dragging, render the live clone instead of the stored element.
      const render = dragging && dragging.el.id === el.id ? dragging.el : el;
      drawElement(ctx, render);
      if (render.id === selectedId) selectedEl = render;
    }
    if (draftRef.current) drawElement(ctx, draftRef.current);

    if (selectedEl) drawSelection(ctx, selectedEl);
  }, [elements, selectedId]);

  useEffect(() => {
    draw();
  }, [draw]);

  // --- Resize / DPR --------------------------------------------------------
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      draw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [draw]);

  // --- Pointer helpers -----------------------------------------------------
  function getPoint(e: React.PointerEvent): Point {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function maybeEmitDraft() {
    const now = Date.now();
    if (draftRef.current && now - lastEmitRef.current > EMIT_INTERVAL) {
      lastEmitRef.current = now;
      onOp({ op: "add", element: structuredClone(draftRef.current) });
    }
  }

  function maybeEmitDrag() {
    const now = Date.now();
    if (dragRef.current && now - lastEmitRef.current > EMIT_INTERVAL) {
      lastEmitRef.current = now;
      onOp({ op: "update", element: structuredClone(dragRef.current.el) });
    }
  }

  // --- Pointer events ------------------------------------------------------
  function onPointerDown(e: React.PointerEvent) {
    if (textInput) return;
    const p = getPoint(e);

    if (tool === "select") {
      const hit = hitTest(elements, p);
      setSelectedId(hit);
      if (hit) {
        canvasRef.current?.setPointerCapture(e.pointerId);
        dragRef.current = { el: structuredClone(elements.get(hit)!), last: p, moved: false };
      }
      draw();
      return;
    }

    if (tool === "text") {
      // No pointer capture here — let the inline <input> take focus.
      setTextInput({ x: p.x, y: p.y, value: "" });
      return;
    }

    if (tool === "eraser") {
      const hit = hitTest(elements, p);
      if (hit) onOp({ op: "delete", id: hit });
      return;
    }

    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const id = createId();
    if (tool === "pen") {
      draftRef.current = { id, type: "stroke", data: { points: [p], color, width } };
    } else if (tool === "line") {
      draftRef.current = {
        id,
        type: "line",
        data: { x1: p.x, y1: p.y, x2: p.x, y2: p.y, color, width },
      };
    } else {
      draftRef.current = {
        id,
        type: tool,
        data: { x: p.x, y: p.y, w: 0, h: 0, color, width },
      };
    }
    draw();
  }

  function onPointerMove(e: React.PointerEvent) {
    const p = getPoint(e);

    // Dragging a selected element
    if (dragRef.current) {
      const d = dragRef.current;
      moveInPlace(d.el, p.x - d.last.x, p.y - d.last.y);
      d.last = p;
      d.moved = true;
      draw();
      maybeEmitDrag();
      return;
    }

    if (!drawingRef.current || !draftRef.current) return;
    const d = draftRef.current;
    if (d.type === "stroke") {
      d.data.points.push(p);
    } else if (d.type === "line") {
      d.data.x2 = p.x;
      d.data.y2 = p.y;
    } else if (d.type === "rect" || d.type === "ellipse") {
      d.data.w = p.x - d.data.x;
      d.data.h = p.y - d.data.y;
    }
    draw();
    maybeEmitDraft();
  }

  function onPointerUp(e: React.PointerEvent) {
    // Finish a drag
    if (dragRef.current) {
      const d = dragRef.current;
      dragRef.current = null;
      canvasRef.current?.releasePointerCapture(e.pointerId);
      if (d.moved) onOp({ op: "update", element: d.el });
      draw();
      return;
    }

    if (!drawingRef.current || !draftRef.current) return;
    drawingRef.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);

    const el = draftRef.current;
    draftRef.current = null;

    // Discard zero-size shapes / empty strokes
    const trivial =
      (el.type === "stroke" && el.data.points.length < 2) ||
      ((el.type === "rect" || el.type === "ellipse") &&
        Math.abs(el.data.w) < 3 &&
        Math.abs(el.data.h) < 3) ||
      (el.type === "line" &&
        Math.abs(el.data.x2 - el.data.x1) < 3 &&
        Math.abs(el.data.y2 - el.data.y1) < 3);

    if (trivial) {
      onOp({ op: "delete", id: el.id }); // remove any draft echoed to peers
      draw();
      return;
    }
    onOp({ op: "add", element: el });
  }

  function commitText() {
    if (!textInput) return;
    const value = textInput.value.trim();
    if (value) {
      onOp({
        op: "add",
        element: {
          id: createId(),
          type: "text",
          data: { x: textInput.x, y: textInput.y, text: value, color, size: textSize, font },
        },
      });
    }
    setTextInput(null);
  }

  const cursor =
    tool === "select"
      ? "default"
      : tool === "text"
      ? "text"
      : tool === "eraser"
      ? "cell"
      : "crosshair";

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        style={{ cursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      {textInput && (
        <input
          ref={textRef}
          value={textInput.value}
          onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitText();
            if (e.key === "Escape") setTextInput(null);
          }}
          className="absolute z-10 rounded-sm bg-black/25 px-1 leading-tight outline-none ring-1 ring-white/30 placeholder:text-white/35"
          style={{
            left: textInput.x,
            top: textInput.y - textSize,
            minWidth: 140,
            color,
            fontSize: textSize,
            fontFamily: cssFontVar(font),
          }}
          placeholder={t("toolbar.placeholder")}
        />
      )}
    </div>
  );
}

// ----- Drawing primitives --------------------------------------------------
function drawElement(ctx: CanvasRenderingContext2D, el: BoardElement) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (el.type === "stroke") {
    const { points, color, width } = el.data;
    if (points.length === 0) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  } else if (el.type === "line") {
    const { x1, y1, x2, y2, color, width } = el.data;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  } else if (el.type === "rect") {
    const { x, y, w, h, color, width } = el.data;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.strokeRect(x, y, w, h);
  } else if (el.type === "ellipse") {
    const { x, y, w, h, color, width } = el.data;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (el.type === "text") {
    const { x, y, text, color, size, font } = el.data;
    ctx.fillStyle = color;
    ctx.font = `${size}px ${resolveFont(font ?? "sans")}`;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(text, x, y);
  }
}

// ----- Selection outline ---------------------------------------------------
function drawSelection(ctx: CanvasRenderingContext2D, el: BoardElement) {
  const b = bbox(ctx, el);
  const PAD = 6;
  ctx.save();
  ctx.strokeStyle = "hsl(38 90% 62%)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(b.x - PAD, b.y - PAD, b.w + PAD * 2, b.h + PAD * 2);
  ctx.restore();
}

function bbox(
  ctx: CanvasRenderingContext2D,
  el: BoardElement
): { x: number; y: number; w: number; h: number } {
  if (el.type === "stroke") {
    const xs = el.data.points.map((p) => p.x);
    const ys = el.data.points.map((p) => p.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  }
  if (el.type === "line") {
    const x = Math.min(el.data.x1, el.data.x2);
    const y = Math.min(el.data.y1, el.data.y2);
    return { x, y, w: Math.abs(el.data.x2 - el.data.x1), h: Math.abs(el.data.y2 - el.data.y1) };
  }
  if (el.type === "rect" || el.type === "ellipse") {
    const x = Math.min(el.data.x, el.data.x + el.data.w);
    const y = Math.min(el.data.y, el.data.y + el.data.h);
    return { x, y, w: Math.abs(el.data.w), h: Math.abs(el.data.h) };
  }
  // text — measure with the resolved font
  ctx.save();
  ctx.font = `${el.data.size}px ${resolveFont(el.data.font ?? "sans")}`;
  const w = ctx.measureText(el.data.text).width;
  ctx.restore();
  return { x: el.data.x, y: el.data.y - el.data.size, w, h: el.data.size * 1.25 };
}

// ----- Font resolution -----------------------------------------------------
const VAR_BY_KEY: Record<FontKey, string> = {
  sans: "--font-body",
  serif: "--font-display",
  mono: "--font-mono",
};
const FALLBACK_BY_KEY: Record<FontKey, string> = {
  sans: "system-ui, sans-serif",
  serif: "Georgia, serif",
  mono: "ui-monospace, monospace",
};

const fontCache: Partial<Record<FontKey, string>> = {};
function resolveFont(key: FontKey): string {
  if (fontCache[key]) return fontCache[key]!;
  let family = FALLBACK_BY_KEY[key];
  if (typeof window !== "undefined") {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(VAR_BY_KEY[key])
      .trim();
    if (v) family = `${v}, ${FALLBACK_BY_KEY[key]}`;
  }
  fontCache[key] = family;
  return family;
}

function cssFontVar(key: FontKey): string {
  return `var(${VAR_BY_KEY[key]}), ${FALLBACK_BY_KEY[key]}`;
}

// ----- Move element in place ----------------------------------------------
function moveInPlace(el: BoardElement, dx: number, dy: number) {
  if (el.type === "stroke") {
    el.data.points = el.data.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
  } else if (el.type === "line") {
    el.data.x1 += dx;
    el.data.y1 += dy;
    el.data.x2 += dx;
    el.data.y2 += dy;
  } else {
    el.data.x += dx;
    el.data.y += dy;
  }
}

// ----- Hit test (topmost first) --------------------------------------------
function hitTest(elements: Map<string, BoardElement>, p: Point): string | null {
  const list = [...elements.values()].reverse();
  const PAD = 8;
  for (const el of list) {
    if (el.type === "stroke") {
      if (el.data.points.some((pt) => Math.hypot(pt.x - p.x, pt.y - p.y) < el.data.width + PAD))
        return el.id;
    } else if (el.type === "line") {
      if (distToSegment(p, el.data) < el.data.width + PAD) return el.id;
    } else if (el.type === "rect" || el.type === "ellipse") {
      const x1 = Math.min(el.data.x, el.data.x + el.data.w) - PAD;
      const x2 = Math.max(el.data.x, el.data.x + el.data.w) + PAD;
      const y1 = Math.min(el.data.y, el.data.y + el.data.h) - PAD;
      const y2 = Math.max(el.data.y, el.data.y + el.data.h) + PAD;
      if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) return el.id;
    } else if (el.type === "text") {
      const w = el.data.text.length * el.data.size * 0.6;
      if (
        p.x >= el.data.x - PAD &&
        p.x <= el.data.x + w + PAD &&
        p.y >= el.data.y - el.data.size &&
        p.y <= el.data.y + PAD
      )
        return el.id;
    }
  }
  return null;
}

function distToSegment(
  p: Point,
  l: { x1: number; y1: number; x2: number; y2: number }
): number {
  const dx = l.x2 - l.x1;
  const dy = l.y2 - l.y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p.x - l.x1, p.y - l.y1);
  let t = ((p.x - l.x1) * dx + (p.y - l.y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (l.x1 + t * dx), p.y - (l.y1 + t * dy));
}
