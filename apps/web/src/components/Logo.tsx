import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
};

/**
 * PULSO / MediTrack Pro brand mark — the dispenser + smartwatch + QR icon.
 * Rendered plainly (no extra chip/background) since the artwork already
 * carries its own panel, so it drops cleanly onto dark or light surfaces.
 */
export function LogoMark({ className, size = "md" }: LogoMarkProps) {
  return (
    <img
      src="/brand/logo-mark.png"
      alt=""
      aria-hidden="true"
      className={cn(sizeMap[size], "object-contain shrink-0", className)}
      draggable={false}
    />
  );
}

interface LogoProps {
  className?: string;
  markSize?: "sm" | "md" | "lg";
  textClassName?: string;
  tone?: "light" | "dark";
}

/**
 * Full lockup: mark + wordmark. `tone="dark"` is for use on the dark
 * panel-ink surfaces (auth screens, footer); `tone="light"` (default)
 * is for use on the porcelain background.
 */
export function Logo({ className, markSize = "md", textClassName, tone = "light" }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={markSize} />
      <span
        className={cn(
          "font-heading font-semibold tracking-tight leading-none",
          tone === "dark" ? "text-[#F5F8F6]" : "text-foreground",
          textClassName,
        )}
      >
        MediTrack <span className={tone === "dark" ? "text-gintong-digit" : "text-accent"}>Pro</span>
      </span>
    </div>
  );
}
