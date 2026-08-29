import { cn } from "@/lib/utils";
import { Link } from "wouter";

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
 * MediTrack Pro brand mark — the dispenser + smartwatch + QR icon.
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
  /** Where the mark links to. Pass `null` to render a plain, non-interactive lockup. */
  href?: string | null;
  /** Set false to render the wordmark only, without the icon mark. */
  showMark?: boolean;
}

/**
 * Full lockup: mark + wordmark. `tone="dark"` is for use on the dark
 * panel-ink surfaces (auth screens, footer); `tone="light"` (default)
 * is for use on the porcelain background.
 *
 * Links to `href` (the landing page's hero by default) so the wordmark
 * behaves the way a brand mark should everywhere it appears — pass
 * `href={null}` for the rare case it needs to render as plain text.
 */
export function Logo({ className, markSize = "md", textClassName, tone = "light", href = "/", showMark = true }: LogoProps) {
  const lockup = (
    <div className={cn("flex items-center gap-2.5", className)}>
      {showMark && <LogoMark size={markSize} />}
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

  if (!href) return lockup;

  return (
    <Link
      href={href}
      aria-label="MediTrack Pro — go to home"
      className={cn(
        "inline-flex rounded-lg transition-opacity hover:opacity-75 active:opacity-60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        tone === "dark"
          ? "focus-visible:ring-gintong-digit/50 focus-visible:ring-offset-panel-ink"
          : "focus-visible:ring-primary/50 focus-visible:ring-offset-background",
      )}
    >
      {lockup}
    </Link>
  );
}
