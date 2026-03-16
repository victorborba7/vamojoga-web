"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  authRoutesHiddenFromMainNav,
  mainNavItems,
  routes,
} from "@/lib/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const { pendingFriendsCount } = useAuth();

  if (authRoutesHiddenFromMainNav.includes(pathname as (typeof authRoutesHiddenFromMainNav)[number])) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {mainNavItems.map((item) => {
          const isActive =
            item.href === routes.home
              ? pathname === routes.home
              : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const showBadge = item.href === routes.social && pendingFriendsCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary-400"
                  : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "text-primary-400")} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {pendingFriendsCount > 9 ? "9+" : pendingFriendsCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium"
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
