import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-8 w-8 border-2",
};

export function Spinner({ size = "lg", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-full border-primary-400 border-t-transparent animate-spin",
        sizes[size],
        className,
      )}
    />
  );
}
