import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

interface AuthSidePanelProps {
  heading: ReactNode;
  subcopy: ReactNode;
  /** Optional supporting content rendered below the subcopy (recovery methods, setup steps). */
  panelDetail?: ReactNode;
  /** The actual form content. */
  children: ReactNode;
}

/**
 * Shared shell for Login / Register / Forgot Password.
 *
 * Two columns, each sized to its own content and vertically centered, so
 * the page fits a normal desktop viewport without scrolling — no stacked
 * zones, no duplicated labels, no decorative numbering. On small screens
 * it becomes a single centered column and scrolls naturally if the content
 * genuinely needs more height than the viewport gives it.
 */
export function AuthSidePanel({ heading, subcopy, panelDetail, children }: AuthSidePanelProps) {
  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-background">
      <div className="relative lg:w-[42%] lg:shrink-0 bg-panel-ink text-[#F5F8F6] overflow-hidden flex flex-col justify-center gap-8 px-6 py-8 md:px-10 lg:px-12">
        <div className="absolute inset-0 scanlines opacity-[0.08] pointer-events-none" aria-hidden="true" />
        <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-gintong-digit/[0.06] blur-[100px] pointer-events-none" aria-hidden="true" />

        <div className="relative shrink-0">
          <Logo markSize="sm" tone="dark" textClassName="text-lg" showMark={false} />
        </div>

        <div className="relative">
          <h1 className="font-heading font-semibold text-3xl sm:text-4xl lg:text-[2.65rem] leading-[1.1] max-w-md">
            {heading}
          </h1>
          <p className="text-[#F5F8F6]/60 mt-4 max-w-sm text-base leading-relaxed">
            {subcopy}
          </p>
          {panelDetail && <div className="mt-6 max-w-xs">{panelDetail}</div>}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8 md:px-10 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
