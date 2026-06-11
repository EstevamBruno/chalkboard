"use client";

import {
  MousePointer2,
  Pen,
  Minus,
  Square,
  Circle,
  Type,
  Eraser,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import type { FontKey, Tool } from "./types";

const TOOLS: { tool: Tool; icon: React.ElementType; labelKey: string }[] = [
  { tool: "select", icon: MousePointer2, labelKey: "toolbar.select" },
  { tool: "pen", icon: Pen, labelKey: "toolbar.pen" },
  { tool: "line", icon: Minus, labelKey: "toolbar.line" },
  { tool: "rect", icon: Square, labelKey: "toolbar.rect" },
  { tool: "ellipse", icon: Circle, labelKey: "toolbar.ellipse" },
  { tool: "text", icon: Type, labelKey: "toolbar.text" },
  { tool: "eraser", icon: Eraser, labelKey: "toolbar.eraser" },
];

const CHALK_COLORS = ["#f4f1e8", "#e8b04b", "#e2725b", "#7fb685", "#6ea8d6", "#d98cb3"];

const FONTS: { key: FontKey; labelKey: string; className: string }[] = [
  { key: "sans", labelKey: "toolbar.fontSans", className: "font-sans" },
  { key: "serif", labelKey: "toolbar.fontSerif", className: "font-serif" },
  { key: "mono", labelKey: "toolbar.fontMono", className: "font-mono" },
];

export function Toolbar({
  tool,
  setTool,
  color,
  setColor,
  width,
  setWidth,
  font,
  setFont,
  onClear,
}: {
  tool: Tool;
  setTool: (t: Tool) => void;
  color: string;
  setColor: (c: string) => void;
  width: number;
  setWidth: (w: number) => void;
  font: FontKey;
  setFont: (f: FontKey) => void;
  onClear: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[hsl(162_12%_26%)] bg-[hsl(162_16%_13%)] p-2 shadow-lift">
      {/* Tools */}
      <div className="flex items-center gap-1">
        {TOOLS.map(({ tool: tl, icon: Icon, labelKey }) => (
          <button
            key={tl}
            title={t(labelKey)}
            onClick={() => setTool(tl)}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-md text-[hsl(42_30%_82%)] transition-colors",
              tool === tl ? "bg-accent text-accent-foreground" : "hover:bg-[hsl(162_12%_20%)]"
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-[hsl(162_12%_26%)]" />

      {/* Colors */}
      <div className="flex items-center gap-1.5">
        {CHALK_COLORS.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => setColor(c)}
            className={cn(
              "h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-[hsl(162_16%_13%)] transition-transform hover:scale-110",
              color === c ? "ring-[hsl(42_38%_92%)]" : "ring-transparent"
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      {/* Font picker — shown for the text tool */}
      {tool === "text" && (
        <>
          <div className="h-6 w-px bg-[hsl(162_12%_26%)]" />
          <div className="flex items-center gap-1">
            {FONTS.map((f) => (
              <button
                key={f.key}
                title={t("toolbar.fontTitle", { name: t(f.labelKey) })}
                onClick={() => setFont(f.key)}
                className={cn(
                  "h-8 rounded-md px-2.5 text-sm transition-colors",
                  f.className,
                  font === f.key
                    ? "bg-accent text-accent-foreground"
                    : "text-[hsl(42_30%_82%)] hover:bg-[hsl(162_12%_20%)]"
                )}
              >
                {t(f.labelKey)}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="h-6 w-px bg-[hsl(162_12%_26%)]" />

      {/* Size */}
      <label className="flex items-center gap-2 text-xs text-[hsl(42_30%_78%)]">
        <span className="hidden sm:inline">
          {tool === "text" ? t("toolbar.textSize") : t("toolbar.size")}
        </span>
        <input
          type="range"
          min={1}
          max={24}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="h-1 w-24 cursor-pointer accent-[hsl(38_74%_55%)]"
        />
      </label>

      <div className="ml-auto">
        <button
          onClick={onClear}
          title={t("toolbar.clear")}
          className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-[hsl(4_70%_72%)] transition-colors hover:bg-[hsl(162_12%_20%)]"
        >
          <Trash2 className="h-4 w-4" /> {t("toolbar.clear")}
        </button>
      </div>
    </div>
  );
}
