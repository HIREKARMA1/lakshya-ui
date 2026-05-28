import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

/** Primary circular loader used across LAKSHYA (home, dashboard, forms). */
export function Spinner({ size = 32, className, label }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
      className={cn("inline-flex flex-col items-center justify-center gap-2", className)}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        className="animate-spin text-primary"
        aria-hidden
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="5"
        />
        <path
          d="M25 5 a20 20 0 0 1 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      {label ? <span className="text-xs font-medium text-muted-foreground">{label}</span> : null}
    </div>
  );
}

type PageLoaderProps = {
  label?: string;
  className?: string;
  /** Full viewport, content section, or compact inline block */
  variant?: "page" | "section" | "inline";
};

/** Centered page/section loading state with spinner + optional label. */
export function PageLoader({ label, className, variant = "page" }: PageLoaderProps) {
  const variantCls =
    variant === "page"
      ? "min-h-screen bg-[#f4f6f9]"
      : variant === "section"
        ? "min-h-[40vh] py-16"
        : "py-12";

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3", variantCls, className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner size={variant === "inline" ? 40 : 56} />
      {label ? <span className="text-sm font-semibold text-muted-foreground">{label}</span> : null}
    </div>
  );
}

export function SectionLoader({ label, className }: { label?: string; className?: string }) {
  return <PageLoader label={label} variant="section" className={className} />;
}

export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-sm"
      aria-busy="true"
    >
      <Spinner size={48} label={label} />
    </div>
  );
}

export function RouteChangeIndicator({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="fixed inset-0 z-[101] flex items-center justify-center bg-white/80 backdrop-blur-md"
      aria-busy="true"
      role="status"
    >
      <div className="flex flex-col items-center gap-3">
        <Spinner size={56} />
        <span className="text-sm font-semibold text-ink">{label}</span>
      </div>
    </div>
  );
}
