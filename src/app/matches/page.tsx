"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { MatchCard } from "@/components/match/match-card";
import { useAuth } from "@/lib/auth-context";
import { getUserMatches } from "@/lib/api";
import type { MatchResponse } from "@/types";
import { useRouter } from "next/navigation";

export default function MatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    getUserMatches(user.id)
      .then(setMatches)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <PageContainer>
        <PageHeader title="Partidas" subtitle="Histórico de todas as partidas registradas" />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted">Carregando...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Partidas"
        subtitle="Histórico de todas as partidas registradas"
      />

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-neutral-400">
            Nenhuma partida ainda
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Registre a primeira partida para começar!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
