"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { MatchCard } from "@/components/match/match-card";
import { useAuthGuard } from "@/lib/hooks";
import { getUserMatches } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { MatchResponse } from "@/types";

const LIMIT = 20;

export default function MatchesPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    getUserMatches(user.id, 0, LIMIT)
      .then((data) => {
        setMatches(data);
        setHasMore(data.length === LIMIT);
        setSkip(LIMIT);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  async function loadMore() {
    if (!user) return;
    setLoadingMore(true);
    try {
      const data = await getUserMatches(user.id, skip, LIMIT);
      setMatches((prev) => [...prev, ...data]);
      setHasMore(data.length === LIMIT);
      setSkip((prev) => prev + LIMIT);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }

  if (authLoading || loading) {
    return (
      <PageContainer>
        <PageHeader title="Partidas" subtitle="Seu histórico de partidas" />
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-1">
        <PageHeader
          title="Partidas"
          subtitle="Seu histórico de partidas"
        />
        <Link href="/matches/new">
          <Button size="sm" className="flex items-center gap-1.5 shrink-0">
            <Plus className="h-4 w-4" />
            Nova partida
          </Button>
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-neutral-400">
            Nenhuma partida ainda
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Registre a primeira partida para começar!
          </p>
          <Link href="/matches/new" className="mt-4">
            <Button size="sm" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Registrar partida
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2 pb-4">
              <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <Spinner size="sm" /> : "Carregar mais"}
              </Button>
            </div>
          )}
          {!hasMore && matches.length > 0 && (
            <p className="text-center text-xs text-muted py-4">
              {matches.length} {matches.length === 1 ? "partida" : "partidas"} no total
            </p>
          )}
        </div>
      )}
    </PageContainer>
  );
}
