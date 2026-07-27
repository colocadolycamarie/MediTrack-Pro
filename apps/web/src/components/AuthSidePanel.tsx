import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { BackLink } from "@/components/BackLink";

interface AuthSidePanelProps {
  backHref: string;
  backLabel: string;
  heading: ReactNode;
  subcopy: ReactNode;
  children?: ReactNode;
}

/**
 * Shared left-hand panel for Login / Register / Forgot Password.
 * Flat, solid instrument-teal background (no photo, no texture) so the
 * centered logo + heading + supporting content reads clean at any size.
 */
export function AuthSidePanel({ backHref, backLabel, heading, subcopy, children }: AuthSidePanelProps) {
  return (
    <div className="relative lg:w-[42%] lg:min-h-screen bg-panel-ink text-[#F5F8F6] flex flex-col px-6 py-6 md:px-12 md:py-10">
      <BackLink href={backHref}>{backLabel}</BackLink>

      <div className="flex-1 flex flex-col items-start justify-start text-left pt-10 lg:pt-14">
        <div className="mb-8 lg:mb-10">
          <Logo markSize="md" tone="dark" textClassName="text-xl" />
        </div>

        <h1 className="font-heading font-semibold text-4xl sm:text-5xl xl:text-[3.25rem] leading-[1.1] max-w-md">
          {heading}
        </h1>
        <p className="text-[#F5F8F6]/60 mt-5 max-w-sm text-lg lg:text-xl leading-relaxed">
          {subcopy}
        </p>

        {children && <div className="mt-10 lg:mt-12 w-full max-w-xs">{children}</div>}
      </div>
    </div>
  );
}
