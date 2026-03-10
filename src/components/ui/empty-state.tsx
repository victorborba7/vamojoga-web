import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon: Icon, label, sublabel, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="h-12 w-12 text-neutral-600 mb-3" />
      <p className="text-lg font-semibold text-neutral-400">{label}</p>
      {sublabel && <p className="mt-1 text-sm text-neutral-500">{sublabel}</p>}
      {children}
    </div>
  );
}
