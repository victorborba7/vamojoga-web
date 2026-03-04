import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          {
            "bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-600/25":
              variant === "primary",
            "bg-accent-500 text-white hover:bg-accent-400 shadow-lg shadow-accent-500/25":
              variant === "accent",
            "border border-border text-neutral-300 hover:bg-neutral-800 hover:text-white":
              variant === "outline",
            "text-neutral-400 hover:text-white hover:bg-neutral-800":
              variant === "ghost",
          },
          {
            "h-9 px-3 text-sm": size === "sm",
            "h-11 px-5 text-base": size === "md",
            "h-14 px-6 text-lg w-full": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, type ButtonProps };
