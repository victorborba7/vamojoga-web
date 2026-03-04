"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { RankingRow } from "@/components/leaderboard/ranking-row";
import { useAuth } from "@/lib/auth-context";
import { getGlobalRanking } from "@/lib/api";
import type { RankingEntry } from "@/types";
import { useRouter } from "next/navigation";

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    getGlobalRanking()
      .then(setRanking)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <PageContainer>
        <PageHeader title="Ranking" subtitle="Classificação entre você e seus amigos" />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted">Carregando...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Ranking"
        subtitle="Classificação entre você e seus amigos"
      />

      {ranking.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-neutral-400">
            Nenhum jogador no ranking
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Registre partidas para gerar o ranking!
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Destaque */}
          {ranking.length >= 3 && (
            <div className="mb-6 flex items-end justify-center gap-3">
              {/* 2º Lugar */}
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-silver/20 border-2 border-silver text-xl font-bold text-silver">
                    {ranking[1].username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-silver text-xs font-bold text-neutral-900">
                    2
                  </span>
                </div>
                <p className="text-xs text-muted font-medium mt-1 max-w-[80px] truncate text-center">
                  {ranking[1].username}
                </p>
                <p className="text-xs text-silver font-bold">
                  {Math.round(ranking[1].win_rate)}%
                </p>
              </div>

              {/* 1º Lugar */}
              <div className="flex flex-col items-center gap-1 -mt-4">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/20 border-2 border-gold text-2xl font-bold text-gold">
                    {ranking[0].username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gold text-sm font-bold text-neutral-900">
                    1
                  </span>
                </div>
                <p className="text-sm text-foreground font-semibold mt-1 max-w-[80px] truncate text-center">
                  {ranking[0].username}
                </p>
                <p className="text-sm text-gold font-bold">
                  {Math.round(ranking[0].win_rate)}%
                </p>
              </div>

              {/* 3º Lugar */}
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bronze/20 border-2 border-bronze text-xl font-bold text-bronze">
                    {ranking[2].username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-bronze text-xs font-bold text-white">
                    3
                  </span>
                </div>
                <p className="text-xs text-muted font-medium mt-1 max-w-[80px] truncate text-center">
                  {ranking[2].username}
                </p>
                <p className="text-xs text-bronze font-bold">
                  {Math.round(ranking[2].win_rate)}%
                </p>
              </div>
            </div>
          )}

          {/* Lista completa */}
          <div className="space-y-2">
            {ranking.map((entry, index) => (
              <RankingRow key={entry.user_id} entry={entry} position={index + 1} />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
