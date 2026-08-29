import React from "react";
import { cn } from "@/lib/utils";

interface ReadoutProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number;
  label?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Readout({ value, label, size = "md", className, ...props }: ReadoutProps) {
  return (
    <div
      className={cn(
        "bg-panel-ink rounded-2xl shadow-[inset_0_1px_6px_rgba(0,0,0,0.3)] border border-white/10 flex flex-col items-center justify-center gap-1.5 p-4 md:p-5",
        className
      )}
      {...props}
    >
      {label && (
        <span className="text-[10px] sm:text-xs uppercase tracking-widest text-gintong-digit/70 font-sans font-semibold">
          {label}
        </span>
      )}

      <div
        className={cn(
          "font-mono text-gintong-digit tabular-nums leading-none",
          {
            "text-xl sm:text-2xl": size === "sm",
            "text-3xl sm:text-4xl font-medium": size === "md",
            "text-5xl sm:text-6xl font-medium": size === "lg",
            "text-7xl sm:text-8xl font-bold": size === "xl",
          }
        )}
      >
        {value}
      </div>
    </div>
  );
}
