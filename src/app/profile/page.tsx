"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Heart,
  Trophy,
  Sword,
  Percent,
  LogOut,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getUserStats, getMyLibrary, getMyWishlist } from "@/lib/api";
import type { UserStats } from "@/types";

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [libraryCount, setLibraryCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    Promise.all([
      getUserStats(user.id),
      getMyLibrary(),
      getMyWishlist(),
    ])
      .then(([s, lib, wish]) => {
        setStats(s);
        setLibraryCount(lib.length);
        setWishlistCount(wish.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (authLoading || !user) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
        </div>
      </PageContainer>
    );
  }

  const joinDate = new Date(user.created_at).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <PageContainer>
      <PageHeader title="Perfil" />

      {/* Identity */}
      <Card className="flex items-center gap-4 mb-4">
        <Avatar name={user.full_name || user.username} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate">
            {user.full_name || user.username}
          </p>
          {user.full_name && (
            <p className="text-sm text-muted truncate">@{user.username}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <CalendarDays className="h-3.5 w-3.5 text-muted" />
            <p className="text-xs text-muted">Membro desde {joinDate}</p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="flex flex-col items-center justify-center text-center p-3">
            <Sword className="h-5 w-5 text-primary-400 mb-1" />
            <p className="text-xl font-bold text-foreground">{stats?.total_matches ?? 0}</p>
            <p className="text-[10px] text-muted">Partidas</p>
          </Card>
          <Card className="flex flex-col items-center justify-center text-center p-3">
            <Trophy className="h-5 w-5 text-yellow-400 mb-1" />
            <p className="text-xl font-bold text-foreground">{stats?.total_wins ?? 0}</p>
            <p className="text-[10px] text-muted">Vitórias</p>
          </Card>
          <Card className="flex flex-col items-center justify-center text-center p-3">
            <Percent className="h-5 w-5 text-accent-400 mb-1" />
            <p className="text-xl font-bold text-foreground">
              {stats ? Math.round(stats.win_rate) : 0}%
            </p>
            <p className="text-[10px] text-muted">Win rate</p>
          </Card>
        </div>
      )}

      {/* Collection links */}
      <div className="space-y-2 mb-6">
        <Link href="/library">
          <Card className="flex items-center gap-3 hover:bg-card-hover transition-colors cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 shrink-0">
              <BookOpen className="h-5 w-5 text-primary-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Minha Biblioteca</p>
              <p className="text-xs text-muted">
                {loading ? "…" : `${libraryCount} ${libraryCount === 1 ? "jogo" : "jogos"}`}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Card>
        </Link>

        <Link href="/library?tab=wishlist">
          <Card className="flex items-center gap-3 hover:bg-card-hover transition-colors cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/15 shrink-0">
              <Heart className="h-5 w-5 text-accent-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Wishlist</p>
              <p className="text-xs text-muted">
                {loading ? "…" : `${wishlistCount} ${wishlistCount === 1 ? "jogo" : "jogos"}`}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Card>
        </Link>
      </div>

      {/* Top games by matches */}
      {!loading && stats && stats.matches_by_game.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 px-1">
            Jogos mais jogados
          </p>
          <div className="space-y-2">
            {stats.matches_by_game
              .sort((a, b) => b.total_matches - a.total_matches)
              .slice(0, 5)
              .map((g) => (
                <Link key={g.game_id} href={`/games/${g.game_id}`}>
                  <Card className="flex items-center gap-3 hover:bg-card-hover transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{g.game_name}</p>
                      <p className="text-xs text-muted">
                        {g.total_matches} {g.total_matches === 1 ? "partida" : "partidas"} · {Math.round(g.win_rate)}% vitórias
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted shrink-0" />
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 hover:text-red-400 border border-red-500/20"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </PageContainer>
  );
}
