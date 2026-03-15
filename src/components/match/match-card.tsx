"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Trophy, ChevronDown, ChevronUp, ExternalLink, Handshake, Share2 } from "lucide-react";
import type { MatchResponse } from "@/types";
import Link from "next/link";

interface MatchCardProps {
  match: MatchResponse;
}

export function MatchCard({ match }: MatchCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getParticipantName = (player: MatchResponse["players"][number]) =>
    player.participant_name || player.username || player.guest_name || "Jogador";

  const date = new Date(match.played_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const isPending = match.status === "pending_scores";
  const winners = match.players.filter((p) => p.is_winner);
  const losers = match.players.filter((p) => !p.is_winner);

  // Cooperative mode
  const isCooperative = match.match_mode === "cooperative";
  const cooperativeWon = isCooperative && match.players.some((p) => p.is_winner);

  // Detect individual mode: all positions are distinct
  const positions = match.players.map((p) => p.position);
  const isIndividual = !isCooperative && new Set(positions).size === match.players.length;

  // Detect draw: no winners or all players share position 1
  const isDraw = !isCooperative && (winners.length === 0 || match.players.every((p) => p.position === 1));

  // Ranking or winner_takes_all: show only positions, no numeric scores
  const positionOnly =
    match.match_mode === "ranking" || match.match_mode === "winner_takes_all";

  // For teams: use the score from the first player of each side
  const winnerScore = winners[0]?.score ?? 0;
  const loserScore = losers[0]?.score ?? 0;

  // Winner display name(s)
  const winnerNames = winners.map((p) => getParticipantName(p)).join(", ");

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
        <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${
          isPending
            ? "bg-primary-600/10"
            : isCooperative
            ? cooperativeWon ? "bg-emerald-500/10" : "bg-red-500/10"
            : "bg-yellow-500/10"
        }`}>
          {isPending
            ? <Share2 className="h-4 w-4 text-primary-400" />
            : isCooperative
            ? <Handshake className={`h-4 w-4 ${cooperativeWon ? "text-emerald-400" : "text-red-400"}`} />
            : <Trophy className="h-4 w-4 text-yellow-400" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {isPending
                ? "Aguardando pontuações"
                : isCooperative
                ? cooperativeWon
                  ? "Vitória Coletiva"
                  : "Derrota Coletiva"
                : isDraw
                ? "Empate"
                : isIndividual
                ? `${sortedPlayers[0] ? getParticipantName(sortedPlayers[0]) : "?"} venceu`
                : `${winnerNames}`}
            </span>
            {!isPending && !positionOnly && !isCooperative && (
              <span className={`text-xs font-bold shrink-0 ${isDraw ? "text-amber-400" : "text-win"}`}>
                {isDraw
                  ? `${sortedPlayers[0]?.score ?? 0} pts`
                  : isIndividual
                  ? `${sortedPlayers[0]?.score ?? 0} pts`
                  : `${winnerScore} × ${loserScore}`}
              </span>
            )}
            {isPending && (
              <span className="text-xs font-medium shrink-0 text-primary-400">
                {match.players.filter((p) => p.scores_submitted).length}/{match.players.length} enviados
              </span>
            )}
            {!isPending && positionOnly && !isCooperative && (
              <span className="text-xs font-medium shrink-0 text-muted">
                {match.players.length} jogadores
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted">{date}</span>
            {match.game_name && (
              <Badge variant="default">{match.game_name}</Badge>
            )}
            {isPending && (
              <Badge variant="default">
                {match.players.filter((p) => p.scores_submitted).length}/{match.players.length}
              </Badge>
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
          {isPending ? (
            /* Pending scores: show who submitted */
            <div className="space-y-2">
              {match.players.map((player) => (
                <div key={player.id} className="flex items-center gap-2">
                  <Avatar name={getParticipantName(player)} size="sm" />
                  <span className="text-xs text-foreground font-medium flex-1 truncate">
                    {getParticipantName(player)}
                  </span>
                  {player.scores_submitted ? (
                    <span className="text-xs font-semibold text-emerald-400">Enviado</span>
                  ) : (
                    <span className="text-xs text-muted">Pendente</span>
                  )}
                </div>
              ))}
            </div>
          ) : isCooperative ? (
            /* Cooperative: list all players with shared outcome */
            <div className="space-y-2">
              <div className={`text-center rounded-lg py-2 mb-3 ${
                cooperativeWon ? "bg-emerald-500/10" : "bg-red-500/10"
              }`}>
                <span className={`text-xs font-bold ${
                  cooperativeWon ? "text-emerald-400" : "text-red-400"
                }`}>
                  {cooperativeWon ? "O grupo venceu o jogo! 🎉" : "O jogo venceu o grupo"}
                </span>
              </div>
              {match.players.map((player) => (
                <div key={player.id} className="flex items-center gap-2">
                  <Avatar name={getParticipantName(player)} size="sm" />
                  <span className="text-xs text-foreground font-medium flex-1 truncate">
                    {getParticipantName(player)}
                  </span>
                </div>
              ))}
            </div>
          ) : isIndividual || isDraw ? (
            /* Individual or draw: show players ranked */
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
                  <Avatar name={getParticipantName(player)} size="sm" />
                  <span className="text-xs text-foreground font-medium flex-1 truncate">
                    {getParticipantName(player)}
                  </span>
                  {!positionOnly && (
                    <span className="text-xs font-bold text-muted">
                      {player.score} pts
                    </span>
                  )}
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
                    <Avatar key={player.id} name={getParticipantName(player)} size="sm" />
                  ))}
                </div>
                <div className="text-center">
                  {winners.map((p) => (
                    <p key={p.id} className="text-xs text-muted truncate">{getParticipantName(p)}</p>
                  ))}
                </div>
                <Badge variant="win">{isDraw ? "Empate" : "Vencedor"}</Badge>
              </div>

              <div className="flex items-center gap-3 px-3">
                <span className={`text-2xl font-bold ${isDraw ? "text-amber-400" : "text-win"}`}>{winnerScore}</span>
                <span className="text-neutral-600">×</span>
                <span className={`text-2xl font-bold ${isDraw ? "text-amber-400" : "text-neutral-400"}`}>{loserScore}</span>
              </div>

              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="flex -space-x-2">
                  {losers.map((player) => (
                    <Avatar key={player.id} name={getParticipantName(player)} size="sm" />
                  ))}
                </div>
                <div className="text-center">
                  {losers.map((p) => (
                    <p key={p.id} className="text-xs text-muted truncate">{getParticipantName(p)}</p>
                  ))}
                </div>
                <Badge variant="loss">{isDraw ? "Empate" : "Derrota"}</Badge>
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
