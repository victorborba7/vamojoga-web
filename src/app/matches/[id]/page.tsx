"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft, Calendar, Clock, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getMatch } from "@/lib/api";
import type { MatchResponse, MatchPlayerResponse } from "@/types";

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!id) return;

    getMatch(id)
      .then(setMatch)
      .catch(() => setError("Partida não encontrada"))
      .finally(() => setLoading(false));
  }, [id, user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <PageContainer>
        <PageHeader title="Detalhes da Partida" subtitle="Carregando..." />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted">Carregando...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !match) {
    return (
      <PageContainer>
        <PageHeader title="Partida" subtitle="Erro" />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-neutral-400">
            {error || "Partida não encontrada"}
          </p>
          <Button
            variant="outline"
            size="lg"
            className="mt-4"
            onClick={() => router.push("/matches")}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </PageContainer>
    );
  }

  const winners = match.players.filter((p) => p.is_winner);
  const losers = match.players.filter((p) => !p.is_winner);
  const isIndividual = hasDistinctPositions(match.players);

  const playedAt = new Date(match.played_at);
  const dateStr = playedAt.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = playedAt.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <PageContainer>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => router.push("/matches")}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">
            {match.game_name || "Partida"}
          </h1>
          <p className="text-xs text-muted">Detalhes da partida</p>
        </div>
      </div>

      {/* Info */}
      <Card className="mb-4">
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {dateStr}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {timeStr}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {match.players.length} jogadores
          </span>
        </div>
      </Card>

      {isIndividual ? (
        /* --- INDIVIDUAL VIEW --- */
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted">Classificação</h2>
          <div className="space-y-2">
            {[...match.players]
              .sort((a, b) => a.position - b.position)
              .map((player) => (
                <Card
                  key={player.id}
                  className={`p-3! ${player.position === 1 ? "border-yellow-500/40 bg-yellow-500/5" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-base font-bold w-7 text-center ${
                        player.position === 1
                          ? "text-yellow-400"
                          : player.position === 2
                          ? "text-neutral-300"
                          : player.position === 3
                          ? "text-amber-600"
                          : "text-neutral-500"
                      }`}
                    >
                      {player.position}º
                    </span>
                    <Avatar name={player.username || "?"} size="md" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {player.username || "Jogador"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {player.is_winner && (
                          <Badge variant="win">
                            <Trophy className="h-3 w-3 mr-1" />
                            Vencedor
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        {player.score}
                      </p>
                      <p className="text-xs text-muted">pts</p>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      ) : (
        /* --- TEAMS VIEW --- */
        <div className="space-y-4">
          {/* Placar Central */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="flex -space-x-2">
                  {winners.map((p) => (
                    <Avatar key={p.id} name={p.username || "?"} size="md" />
                  ))}
                </div>
                <Badge variant="win">
                  <Trophy className="h-3 w-3 mr-1" />
                  Vencedores
                </Badge>
              </div>

              <div className="flex items-center gap-4 px-4">
                <span className="text-5xl font-bold text-win">
                  {winners[0]?.score ?? 0}
                </span>
                <span className="text-2xl font-bold text-neutral-600">×</span>
                <span className="text-5xl font-bold text-neutral-400">
                  {losers[0]?.score ?? 0}
                </span>
              </div>

              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="flex -space-x-2">
                  {losers.map((p) => (
                    <Avatar key={p.id} name={p.username || "?"} size="md" />
                  ))}
                </div>
                <Badge variant="loss">Derrota</Badge>
              </div>
            </div>
          </Card>

          {/* Jogadores detalhados */}
          <h2 className="text-sm font-semibold text-muted">Jogadores</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-xs text-muted font-medium text-center">Vencedores</p>
              {winners.map((player) => (
                <Card key={player.id} className="p-3!">
                  <div className="flex items-center gap-2">
                    <Avatar name={player.username || "?"} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {player.username || "Jogador"}
                      </p>
                      <p className="text-xs text-win font-medium">
                        {player.score} pts
                      </p>
                    </div>
                    <Trophy className="h-4 w-4 text-yellow-400 shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted font-medium text-center">Perdedores</p>
              {losers.map((player) => (
                <Card key={player.id} className="p-3!">
                  <div className="flex items-center gap-2">
                    <Avatar name={player.username || "?"} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {player.username || "Jogador"}
                      </p>
                      <p className="text-xs text-neutral-400 font-medium">
                        {player.score} pts
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notas */}
      {match.notes && (
        <Card className="mt-4">
          <p className="text-xs text-muted font-medium mb-1">Notas</p>
          <p className="text-sm text-foreground">{match.notes}</p>
        </Card>
      )}
    </PageContainer>
  );
}

/**
 * Detect if this match is "individual" mode by checking if positions
 * are all distinct (1, 2, 3...) vs teams where multiple players share
 * the same position.
 */
function hasDistinctPositions(players: MatchPlayerResponse[]): boolean {
  if (players.length <= 2) {
    // 2 players: could be individual or 1v1 teams — check if positions differ
    const positions = players.map((p) => p.position);
    return new Set(positions).size === players.length;
  }
  const positions = players.map((p) => p.position);
  return new Set(positions).size === players.length;
}
