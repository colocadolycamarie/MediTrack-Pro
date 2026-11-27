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
      <div className="relative lg:w-[46%] lg:shrink-0 bg-panel-ink text-[#F5F8F6] overflow-hidden lg:overflow-y-auto flex flex-col justify-center gap-6 lg:gap-10 px-6 py-8 md:px-12 md:py-10 lg:px-14 xl:px-20">
        <div className="absolute inset-0 scanlines opacity-[0.08] pointer-events-none" aria-hidden="true" />
        <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-gintong-digit/[0.06] blur-[100px] pointer-events-none" aria-hidden="true" />

        <div className="relative shrink-0">
          <Logo markSize="sm" tone="dark" textClassName="text-xl md:text-2xl" showMark={false} />
        </div>

        <div className="relative">
          <h1 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] leading-[1.06] max-w-xl text-balance">
            {heading}
          </h1>
          <p className="text-[#F5F8F6]/70 mt-4 lg:mt-6 max-w-lg text-lg lg:text-xl leading-relaxed">
            {subcopy}
          </p>
          {panelDetail && <div className="hidden md:block mt-8 max-w-sm">{panelDetail}</div>}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8 md:px-10 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-md lg:max-w-lg">{children}</div>
      </div>
    </div>
  );
}
