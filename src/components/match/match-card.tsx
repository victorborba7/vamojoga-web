"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Trophy, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { MatchResponse } from "@/types";
import Link from "next/link";

interface MatchCardProps {
  match: MatchResponse;
}

export function MatchCard({ match }: MatchCardProps) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(match.played_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const winners = match.players.filter((p) => p.is_winner);
  const losers = match.players.filter((p) => !p.is_winner);

  // Detect individual mode: all positions are distinct
  const positions = match.players.map((p) => p.position);
  const isIndividual = new Set(positions).size === match.players.length && match.players.length > 2;

  // For teams: use the score from the first player of each side
  const winnerScore = winners[0]?.score ?? 0;
  const loserScore = losers[0]?.score ?? 0;

  // Winner display name(s)
  const winnerNames = winners.map((p) => p.username || "?").join(", ");

  // Sorted players for expanded view
  const sortedPlayers = [...match.players].sort((a, b) => a.position - b.position);

  return (
    <Card className="transition-colors">
      {/* Summary row — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full text-left cursor-pointer"
      >
        {/* Position icon / trophy */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500/10 shrink-0">
          <Trophy className="h-4 w-4 text-yellow-400" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {isIndividual
                ? `${sortedPlayers[0]?.username || "?"} venceu`
                : `${winnerNames}`}
            </span>
            <span className="text-xs font-bold text-win shrink-0">
              {isIndividual
                ? `${sortedPlayers[0]?.score ?? 0} pts`
                : `${winnerScore} × ${loserScore}`}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted">{date}</span>
            {match.game_name && (
              <Badge variant="default">{match.game_name}</Badge>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <div className="shrink-0 text-neutral-500">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 pt-3 border-t border-border space-y-3">
          {isIndividual ? (
            /* Individual: show top 3 ranking */
            <div className="space-y-2">
              {sortedPlayers.slice(0, 3).map((player) => (
                <div key={player.id} className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold w-5 text-center ${
                      player.position === 1
                        ? "text-yellow-400"
                        : player.position === 2
                        ? "text-neutral-300"
                        : "text-amber-600"
                    }`}
                  >
                    {player.position}º
                  </span>
                  <Avatar name={player.username || "?"} size="sm" />
                  <span className="text-xs text-foreground font-medium flex-1 truncate">
                    {player.username || "Jogador"}
                  </span>
                  <span className="text-xs font-bold text-muted">
                    {player.score} pts
                  </span>
                  {player.position === 1 && (
                    <Trophy className="h-3 w-3 text-yellow-400" />
                  )}
                </div>
              ))}
              {match.players.length > 3 && (
                <p className="text-xs text-neutral-500 text-center">
                  +{match.players.length - 3} jogador{match.players.length - 3 > 1 ? "es" : ""}
                </p>
              )}
            </div>
          ) : (
            /* Teams: show both sides */
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="flex -space-x-2">
                  {winners.map((player) => (
                    <Avatar key={player.id} name={player.username || "?"} size="sm" />
                  ))}
                </div>
                <div className="text-center">
                  {winners.map((p) => (
                    <p key={p.id} className="text-xs text-muted truncate">{p.username}</p>
                  ))}
                </div>
                <Badge variant="win">Vencedor</Badge>
              </div>

              <div className="flex items-center gap-3 px-3">
                <span className="text-2xl font-bold text-win">{winnerScore}</span>
                <span className="text-neutral-600">×</span>
                <span className="text-2xl font-bold text-neutral-400">{loserScore}</span>
              </div>

              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="flex -space-x-2">
                  {losers.map((player) => (
                    <Avatar key={player.id} name={player.username || "?"} size="sm" />
                  ))}
                </div>
                <div className="text-center">
                  {losers.map((p) => (
                    <p key={p.id} className="text-xs text-muted truncate">{p.username}</p>
                  ))}
                </div>
                <Badge variant="loss">Derrota</Badge>
              </div>
            </div>
          )}

          {match.notes && (
            <p className="text-xs text-muted text-center">{match.notes}</p>
          )}

          {/* Detalhes button */}
          <Link
            href={`/matches/${match.id}`}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-border py-2 text-xs font-medium text-primary-400 hover:bg-card-hover transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Detalhes
          </Link>
        </div>
      )}
    </Card>
  );
}
