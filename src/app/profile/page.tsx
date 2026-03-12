"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StatsGrid } from "@/components/ui/stats-grid";
import { TopGamesList } from "@/components/ui/top-games-list";
import {
  LogOut,
  ChevronRight,
  CalendarDays,
  FileText,
  Trophy,
  History,
} from "lucide-react";
import { useAuthGuard } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";
import { getUserStats, getMyAchievements, getUserMatches } from "@/lib/api";
import type { UserStats } from "@/types";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuthGuard();
  const { logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievementCount, setAchievementCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    Promise.all([
      getUserStats(user.id),
      getMyAchievements(),
      getUserMatches(user.id),
    ])
      .then(([s, achievements, matches]) => {
        setStats(s);
        setAchievementCount(achievements.length);
        setMatchCount(matches.length);
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
          <Spinner />
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
      <StatsGrid stats={stats} loading={loading} />

      {/* Quick links */}
      <div className="flex flex-col gap-2 mb-6">
        <Link href="/matches" className="block">
          <Card className="flex items-center gap-3 hover:bg-card-hover transition-colors cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 shrink-0">
              <History className="h-5 w-5 text-primary-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Minhas Partidas</p>
              <p className="text-xs text-muted">
                {loading ? "…" : `${matchCount} ${matchCount === 1 ? "partida" : "partidas"}`}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Card>
        </Link>

        <Link href="/scoring-templates" className="block">
          <Card className="flex items-center gap-3 hover:bg-card-hover transition-colors cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/15 shrink-0">
              <FileText className="h-5 w-5 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Templates de Pontuação</p>
              <p className="text-xs text-muted">Crie e explore templates</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Card>
        </Link>

        <Link href="/achievements" className="block">
          <Card className="flex items-center gap-3 hover:bg-card-hover transition-colors cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 shrink-0">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Conquistas</p>
              <p className="text-xs text-muted">
                {loading ? "…" : `${achievementCount} desbloqueada${achievementCount !== 1 ? "s" : ""}`}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Card>
        </Link>
      </div>

      {/* Top games by matches */}
      {!loading && stats && (
        <TopGamesList
          games={[...stats.matches_by_game]
            .sort((a, b) => b.total_matches - a.total_matches)
            .slice(0, 5)}
        />
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
