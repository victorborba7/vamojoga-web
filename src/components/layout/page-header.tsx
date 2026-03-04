"use client";

import Link from "next/link";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
}

export function PageHeader({ title, subtitle, backHref }: PageHeaderProps) {
  return (
    <header className="mb-6">
      {backHref && (
        <Link href={backHref} className="text-sm text-muted hover:text-foreground mb-2 inline-block">
          ← Voltar
        </Link>
      )}
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      )}
    </header>
  );
}
