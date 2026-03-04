import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "win" | "loss" | "gold" | "silver" | "bronze";
}

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        {
          "bg-neutral-700 text-neutral-300": variant === "default",
          "bg-win/15 text-win": variant === "win",
          "bg-loss/15 text-loss": variant === "loss",
          "bg-gold/15 text-gold": variant === "gold",
          "bg-silver/15 text-silver": variant === "silver",
          "bg-bronze/15 text-bronze": variant === "bronze",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
