import { z } from "zod";

// ---- Element data shapes ----------------------------------------------------

const point = z.object({ x: z.number(), y: z.number() });

const baseStyle = {
  color: z.string().max(32).default("#1c1917"),
  width: z.number().min(0.5).max(64).default(3),
};

export const strokeData = z.object({
  points: z.array(point).min(1).max(5000),
  ...baseStyle,
});

export const rectData = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  ...baseStyle,
  fill: z.string().max(32).optional(),
});

export const ellipseData = rectData; // same bounding-box geometry

export const lineData = z.object({
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
  ...baseStyle,
});

export const textData = z.object({
  x: z.number(),
  y: z.number(),
  text: z.string().max(2000),
  color: z.string().max(32).default("#1c1917"),
  size: z.number().min(8).max(200).default(24),
  font: z.enum(["sans", "serif", "mono"]).optional().default("sans"),
});

// ---- Element discriminated union -------------------------------------------

export const elementSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string().min(1).max(64), type: z.literal("stroke"), data: strokeData }),
  z.object({ id: z.string().min(1).max(64), type: z.literal("rect"), data: rectData }),
  z.object({ id: z.string().min(1).max(64), type: z.literal("ellipse"), data: ellipseData }),
  z.object({ id: z.string().min(1).max(64), type: z.literal("line"), data: lineData }),
  z.object({ id: z.string().min(1).max(64), type: z.literal("text"), data: textData }),
]);

export type BoardElementInput = z.infer<typeof elementSchema>;

// ---- Board operations (real-time + REST) -----------------------------------

export const boardOpSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("add"), element: elementSchema }),
  z.object({ op: z.literal("update"), element: elementSchema }),
  z.object({ op: z.literal("delete"), id: z.string().min(1).max(64) }),
  z.object({ op: z.literal("clear") }),
]);

export type BoardOp = z.infer<typeof boardOpSchema>;
