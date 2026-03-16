"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserRoundPlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { authRoutesHiddenFromMainNav, routes } from "@/lib/navigation";

export function TopBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (authRoutesHiddenFromMainNav.includes(pathname as (typeof authRoutesHiddenFromMainNav)[number])) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 group"
          aria-label="Ir para o início"
        >
          <Image
            src="/logo.png"
            alt="VamoJogá"
            width={32}
            height={32}
            className="rounded-xl shadow-md shadow-primary-500/20 transition-transform group-hover:scale-105"
          />
          <span className="text-sm font-bold tracking-tight bg-linear-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            VamoJogá
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-2">
            <Link
              href={routes.guests}
              aria-label="Gerenciar convidados"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-primary-400 hover:bg-primary-600/10 transition-colors"
            >
              <UserRoundPlus className="h-4.5 w-4.5" />
            </Link>
            <Link href={routes.profile} aria-label="Meu perfil">
              <Avatar
                name={user.full_name || user.username}
                size="sm"
                className="ring-2 ring-transparent hover:ring-primary-400 transition-all cursor-pointer"
              />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
