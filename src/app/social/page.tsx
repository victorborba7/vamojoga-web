"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import {
  Users,
  Trophy,
  ChevronRight,
  History,
  UserPlus,
} from "lucide-react";
import { useAuthGuard } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";
import {
  getFriends,
  getGlobalRanking,
  getUserMatches,
} from "@/lib/api";
import type { FriendResponse, RankingEntry, MatchResponse } from "@/types";
import { MatchCard } from "@/components/match/match-card";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function SocialHubPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const { pendingFriendsCount } = useAuth();
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    Promise.all([
      getFriends(),
      getGlobalRanking(5),
      getUserMatches(user.id),
    ])
      .then(([f, r, m]) => {
        setFriends(f);
        setRanking(r);
        setMatches(m.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || !user) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Social" subtitle="Amigos, ranking e partidas" />

      {/* Quick counts */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/friends">
          <Card className="flex flex-col items-center gap-2 py-5 hover:bg-card-hover transition-colors cursor-pointer relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/15">
              <Users className="h-5 w-5 text-primary-400" />
            </div>
            <p className="text-sm font-semibold text-foreground">Amigos</p>
            <p className="text-xs text-muted">
              {loading ? "…" : `${friends.length} ${friends.length === 1 ? "amigo" : "amigos"}`}
            </p>
            {pendingFriendsCount > 0 && (
              <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {pendingFriendsCount > 9 ? "9+" : pendingFriendsCount}
              </span>
            )}
          </Card>
        </Link>
        <Link href="/leaderboard">
          <Card className="flex flex-col items-center gap-2 py-5 hover:bg-card-hover transition-colors cursor-pointer">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-sm font-semibold text-foreground">Ranking</p>
            <p className="text-xs text-muted">Classificação global</p>
          </Card>
        </Link>
      </div>

      {/* Ranking preview */}
      {!loading && ranking.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Top ranking
            </p>
            <Link
              href="/leaderboard"
              className="flex items-center gap-0.5 text-xs text-primary-400 hover:underline"
            >
              Ver completo <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <Card className="divide-y divide-white/5">
            {ranking.map((entry, i) => (
              <Link key={entry.user_id} href={`/friends/${entry.user_id}`}>
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-card-hover transition-colors">
                  <span className="text-base w-6 text-center">
                    {i < 3 ? MEDAL[i] : `${i + 1}`}
                  </span>
                  <Avatar name={entry.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {entry.username}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-foreground">
                      {Math.round(entry.win_rate)}%
                    </p>
                    <p className="text-[10px] text-muted">
                      {entry.total_wins}V / {entry.total_matches}P
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </Card>
        </div>
      )}

      {/* Friends preview */}
      {!loading && friends.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Amigos
            </p>
            <Link
              href="/friends"
              className="flex items-center gap-0.5 text-xs text-primary-400 hover:underline"
            >
              Ver todos <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {friends.slice(0, 8).map((f) => (
              <Link
                key={f.user_id}
                href={`/friends/${f.user_id}`}
                className="flex flex-col items-center gap-1.5 shrink-0 w-16"
              >
                <Avatar name={f.full_name || f.username} size="md" />
                <p className="text-[10px] text-muted text-center truncate w-full">
                  {f.username}
                </p>
              </Link>
            ))}
            <Link
              href="/friends"
              className="flex flex-col items-center gap-1.5 shrink-0 w-16"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <UserPlus className="h-4 w-4 text-muted" />
              </div>
              <p className="text-[10px] text-primary-400 text-center">
                Adicionar
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* Recent matches */}
      {!loading && (
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Partidas recentes
            </p>
            <Link
              href="/matches"
              className="flex items-center gap-0.5 text-xs text-primary-400 hover:underline"
            >
              Ver todas <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {matches.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 py-8 text-center">
              <History className="h-8 w-8 text-muted" />
              <p className="text-sm text-muted">Nenhuma partida ainda</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
