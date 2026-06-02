import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface NumberTickerProps {
  value: number;
  decimalPlaces?: number;
  className?: string;
  suffix?: string;
}

/** Magic-UI style animated counter: springs from the previous value to the new one. */
export function NumberTicker({
  value,
  decimalPlaces = 0,
  className,
  suffix = "",
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 30, stiffness: 120 });
  const inView = useInView(ref, { once: false, margin: "0px" });

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [motionValue, value, inView]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent =
          Intl.NumberFormat("en-US", {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(Number(latest.toFixed(decimalPlaces))) + suffix;
      }
    });
  }, [spring, decimalPlaces, suffix]);

  return (
    <span ref={ref} className={cn("tabular-nums tracking-tight", className)}>
      0{suffix}
    </span>
  );
}
