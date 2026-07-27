import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Consistent "Back to X" affordance used across the auth screens.
 * A quiet pill chip rather than a bare text+arrow link, with a short,
 * purposeful hover shift on the icon.
 */
export function BackLink({ href, children, className }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center gap-2 rounded-full pl-2.5 pr-4 py-1.5 text-sm font-semibold",
        "text-[#F5F8F6]/65 hover:text-[#F5F8F6] bg-white/0 hover:bg-white/10",
        "transition-colors duration-200 w-fit",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gintong-digit/50 focus-visible:ring-offset-2 focus-visible:ring-offset-panel-ink",
        className,
      )}
    >
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/10 group-hover:bg-white/15 transition-colors duration-200">
        <ArrowLeft className="w-3 h-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
      </span>
      {children}
    </Link>
  );
}
