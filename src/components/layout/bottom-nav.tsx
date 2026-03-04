"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Trophy, History, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/matches", label: "Partidas", icon: History },
  { href: "/matches/new", label: "Nova", icon: PlusCircle },
  { href: "/friends", label: "Amigos", icon: Users },
  { href: "/leaderboard", label: "Ranking", icon: Trophy },
];

const hiddenRoutes = ["/login", "/register"];

export function BottomNav() {
  const pathname = usePathname();

  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/matches"
                ? pathname === "/matches" || (pathname.startsWith("/matches/") && !pathname.startsWith("/matches/new"))
                : pathname.startsWith(item.href);
          const Icon = item.icon;
          const isMainAction = item.href === "/matches/new";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200",
                isMainAction
                  ? "relative -top-3"
                  : "",
                isActive
                  ? "text-primary-400"
                  : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              {isMainAction ? (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/30">
                  <Icon className="h-7 w-7" />
                </div>
              ) : (
                <Icon className={cn("h-5 w-5", isActive && "text-primary-400")} />
              )}
              <span className={cn(
                "text-[10px] font-medium",
                isMainAction && "mt-1"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
