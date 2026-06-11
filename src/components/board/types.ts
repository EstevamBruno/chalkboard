export type Point = { x: number; y: number };

export type StrokeEl = {
  id: string;
  type: "stroke";
  data: { points: Point[]; color: string; width: number };
};
export type RectEl = {
  id: string;
  type: "rect";
  data: { x: number; y: number; w: number; h: number; color: string; width: number };
};
export type EllipseEl = {
  id: string;
  type: "ellipse";
  data: { x: number; y: number; w: number; h: number; color: string; width: number };
};
export type LineEl = {
  id: string;
  type: "line";
  data: { x1: number; y1: number; x2: number; y2: number; color: string; width: number };
};
export type FontKey = "sans" | "serif" | "mono";

export type TextEl = {
  id: string;
  type: "text";
  data: { x: number; y: number; text: string; color: string; size: number; font?: FontKey };
};

export type BoardElement = StrokeEl | RectEl | EllipseEl | LineEl | TextEl;

export type Tool = "select" | "pen" | "rect" | "ellipse" | "line" | "text" | "eraser";

export type BoardOp =
  | { op: "add"; element: BoardElement }
  | { op: "update"; element: BoardElement }
  | { op: "delete"; id: string }
  | { op: "clear" };
