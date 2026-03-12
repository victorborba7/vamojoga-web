import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto min-h-screen max-w-md px-4 pb-32 pt-20",
        className
      )}
    >
      {children}
    </main>
  );
}
