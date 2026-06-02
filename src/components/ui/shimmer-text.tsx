import { cn } from "@/lib/utils";

/**
 * A shimmering text loader (Magic-UI style): an animated highlight sweeps across
 * muted text. Used for "thinking…"/streaming-pending states.
 */
export function ShimmerText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex animate-shimmer bg-[linear-gradient(110deg,hsl(var(--muted-foreground)),45%,hsl(var(--foreground)),55%,hsl(var(--muted-foreground)))] bg-[length:200%_100%] bg-clip-text text-transparent",
        className
      )}
    >
      {children}
    </span>
  );
}
