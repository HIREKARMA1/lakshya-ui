import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

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

export function RouteChangeIndicator() {
  return (
    <div
      className="fixed inset-0 z-[101] flex items-center justify-center bg-white/80 backdrop-blur-md"
      aria-busy="true"
      role="status"
    >
      <div className="flex flex-col items-center gap-3">
        <Spinner size={56} />
        <span className="text-sm font-semibold text-ink">Loading…</span>
      </div>
    </div>
  );
}

