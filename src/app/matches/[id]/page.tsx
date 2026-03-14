"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft, Calendar, Clock, Users, ChevronDown, ChevronUp, Share2, Check, ClipboardEdit, Loader2 } from "lucide-react";
import { useAuthGuard } from "@/lib/hooks";
import { getMatch, finalizeMatch, submitPlayerScores, getScoringTemplate } from "@/lib/api";
import type { MatchResponse, MatchPlayerResponse, ScoringTemplateResponse, TemplateScoreEntry } from "@/types";

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuthGuard();
  const router = useRouter();
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [template, setTemplate] = useState<ScoringTemplateResponse | null>(null);
  const [scoringForPlayer, setScoringForPlayer] = useState<string | null>(null);
  const [organizerScores, setOrganizerScores] = useState<Record<string, TemplateScoreEntry>>({});
  const [submittingFor, setSubmittingFor] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (!id) return;

    (async () => {
      try {
        const m = await getMatch(id);
        setMatch(m);
        if (m.status === "pending_scores" && m.scoring_template_id) {
          const t = await getScoringTemplate(m.scoring_template_id);
          setTemplate(t);
        }
      } catch {
        setError("Partida não encontrada");
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, authLoading]);

  async function handleFinalize() {
    if (!id) return;
    setFinalizing(true);
    setError("");
    try {
      const result = await finalizeMatch(id);
      setMatch(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao finalizar partida");
    } finally {
      setFinalizing(false);
    }
  }

  function updateOrganizerScore(fieldId: string, entry: Partial<TemplateScoreEntry>) {
    setOrganizerScores((prev) => ({
      ...prev,
      [fieldId]: {
        ...(prev[fieldId] || {}),
        ...entry,
        template_field_id: fieldId,
      },
    }));
  }

  async function handleSubmitForPlayer() {
    if (!id || !scoringForPlayer) return;
    setSubmittingFor(true);
    setError("");
    try {
      const result = await submitPlayerScores(id, scoringForPlayer, {
        template_scores: Object.values(organizerScores),
      });
      setMatch(result);
      setScoringForPlayer(null);
      setOrganizerScores({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar pontuação");
    } finally {
      setSubmittingFor(false);
    }
  }

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
  const isDraw = winners.length === 0 || match.players.every((p) => p.position === 1);
  const positionOnly =
    match.match_mode === "ranking" || match.match_mode === "winner_takes_all";

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

      {/* PENDING SCORES VIEW */}
      {match.status === "pending_scores" ? (
        <div className="space-y-4">
          <Card className="border-primary-600/30 bg-primary-600/5">
            <div className="flex items-center gap-3 mb-3">
              <Share2 className="h-5 w-5 text-primary-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Pontuação Colaborativa
                </p>
                <p className="text-[10px] text-muted mt-0.5">
                  {match.scoring_template_name && `Template: ${match.scoring_template_name}`}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {match.players.map((player) => {
                const isMe = player.user_id === user?.id;
                const isOrganizer = match.created_by === user?.id;

                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 rounded-lg p-2.5 ${
                      player.scores_submitted
                        ? "bg-emerald-500/5 border border-emerald-500/20"
                        : "bg-neutral-800/50 border border-border"
                    }`}
                  >
                    <Avatar name={player.username || "?"} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {player.username || "Jogador"}
                        {isMe && <span className="text-xs text-muted ml-1">(você)</span>}
                      </p>
                    </div>
                    {player.scores_submitted ? (
                      <Badge variant="win">
                        <Check className="h-3 w-3 mr-1" />
                        Enviado
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">Pendente</span>
                        {isMe && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => router.push(`/matches/${id}/score`)}
                          >
                            Registrar
                          </Button>
                        )}
                        {isOrganizer && !isMe && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setScoringForPlayer(player.user_id);
                              setOrganizerScores({});
                            }}
                          >
                            <ClipboardEdit className="h-3 w-3" />
                            Preencher
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted mb-1">
                <span>Progresso</span>
                <span>
                  {match.players.filter((p) => p.scores_submitted).length}/{match.players.length}
                </span>
              </div>
              <div className="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{
                    width: `${(match.players.filter((p) => p.scores_submitted).length / match.players.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Live ranking preview */}
          {match.players.some((p) => p.scores_submitted && p.template_scores?.length > 0) && template && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-muted">Ranking Parcial</h2>
                <span className="text-[10px] text-muted">
                  {match.players.filter((p) => p.scores_submitted).length}/{match.players.length} jogadores
                </span>
              </div>
              <div className="space-y-2">
                {(() => {
                  const tiebreakerIds = new Set(
                    template.fields.filter((f) => f.is_tiebreaker).map((f) => f.id)
                  );
                  const withTotals = match.players
                    .filter((p) => p.scores_submitted && p.template_scores?.length > 0)
                    .map((p) => {
                      let total = 0;
                      for (const ts of p.template_scores) {
                        if (tiebreakerIds.has(ts.template_field_id)) continue;
                        if (ts.field_type === "numeric") total += ts.numeric_value ?? 0;
                        else if (ts.field_type === "boolean") total += ts.boolean_value ? 1 : 0;
                      }
                      return { ...p, calculatedTotal: total };
                    })
                    .sort((a, b) => b.calculatedTotal - a.calculatedTotal);

                  let rank = 1;
                  return withTotals.map((p, i) => {
                    if (i > 0 && p.calculatedTotal < withTotals[i - 1].calculatedTotal) {
                      rank = i + 1;
                    }
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 rounded-lg p-2.5 ${
                          rank === 1 ? "bg-yellow-500/10" : ""
                        }`}
                      >
                        <span
                          className={`text-sm font-bold w-6 text-center ${
                            rank === 1
                              ? "text-yellow-400"
                              : rank === 2
                              ? "text-neutral-300"
                              : rank === 3
                              ? "text-amber-600"
                              : "text-neutral-500"
                          }`}
                        >
                          {rank}º
                        </span>
                        <Avatar name={p.username || "?"} size="sm" />
                        <span className="text-sm text-foreground font-medium flex-1 truncate">
                          {p.username || "Jogador"}
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {p.calculatedTotal} pts
                        </span>
                        {rank === 1 && (
                          <Trophy className="h-4 w-4 text-yellow-400" />
                        )}
                      </div>
                    );
                  });
                })()}
                {match.players.some((p) => !p.scores_submitted) && (
                  <div className="flex items-center gap-3 rounded-lg p-2.5 opacity-50">
                    <span className="text-xs text-neutral-500 w-6 text-center">—</span>
                    <span className="text-xs text-neutral-500">
                      {match.players.filter((p) => !p.scores_submitted).length} jogador(es) pendente(s)
                    </span>
                  </div>
                )}
              </div>

              {/* Expandable score breakdown */}
              {match.players
                .filter((p) => p.scores_submitted && p.template_scores?.length > 0)
                .map((player) => (
                  <div key={player.id} className="mt-3 pt-3 border-t border-border">
                    <button
                      className="flex items-center gap-2 w-full text-left cursor-pointer"
                      onClick={() =>
                        setExpandedPlayer(expandedPlayer === player.id ? null : player.id)
                      }
                    >
                      <Avatar name={player.username || "?"} size="sm" />
                      <span className="text-xs font-semibold text-foreground flex-1 truncate">
                        {player.username || "Jogador"}
                      </span>
                      {expandedPlayer === player.id ? (
                        <ChevronUp className="h-3.5 w-3.5 text-neutral-500" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
                      )}
                    </button>
                    {expandedPlayer === player.id && (
                      <div className="mt-2 space-y-1.5 pl-8">
                        {player.template_scores.map((ts) => (
                          <div
                            key={ts.template_field_id}
                            className="flex items-center justify-between"
                          >
                            <span className="text-xs text-muted">
                              {ts.field_name || "Campo"}
                            </span>
                            <span className="text-xs font-semibold text-foreground">
                              {ts.field_type === "boolean"
                                ? ts.boolean_value
                                  ? "Sim"
                                  : "Não"
                                : ts.field_type === "ranking"
                                ? `${ts.ranking_value ?? 0}º`
                                : ts.numeric_value ?? 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </Card>
          )}

          {/* Organizer fill-in form */}
          {scoringForPlayer && template && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">
                  Preencher para: {match.players.find((p) => p.user_id === scoringForPlayer)?.username}
                </p>
                <button
                  onClick={() => setScoringForPlayer(null)}
                  className="text-neutral-400 hover:text-foreground p-1 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                </button>
              </div>
              <div className="space-y-3">
                {template.fields.map((f) => (
                  <div key={f.id}>
                    <label className="text-xs text-muted mb-1 block">
                      {f.name}
                      {!f.is_required && " (opcional)"}
                    </label>
                    {f.field_type === "numeric" && (
                      <input
                        type="number"
                        min={f.min_value ?? undefined}
                        max={f.max_value ?? undefined}
                        className="w-full rounded-lg border border-border bg-neutral-800 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary-600 focus:outline-none"
                        placeholder={
                          f.min_value != null && f.max_value != null
                            ? `${f.min_value} — ${f.max_value}`
                            : "0"
                        }
                        value={organizerScores[f.id]?.numeric_value ?? ""}
                        onChange={(e) =>
                          updateOrganizerScore(f.id, {
                            numeric_value: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                    )}
                    {f.field_type === "ranking" && (
                      <input
                        type="number"
                        min={1}
                        className="w-full rounded-lg border border-border bg-neutral-800 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary-600 focus:outline-none"
                        placeholder="Posição (1, 2, 3...)"
                        value={organizerScores[f.id]?.ranking_value ?? ""}
                        onChange={(e) =>
                          updateOrganizerScore(f.id, {
                            ranking_value: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                    )}
                    {f.field_type === "boolean" && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-primary-600 h-4 w-4"
                          checked={organizerScores[f.id]?.boolean_value ?? false}
                          onChange={(e) =>
                            updateOrganizerScore(f.id, {
                              boolean_value: e.target.checked,
                            })
                          }
                        />
                        <span className="text-sm text-foreground">Sim</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="primary"
                size="lg"
                className="w-full mt-4"
                onClick={handleSubmitForPlayer}
                disabled={submittingFor}
              >
                <Check className="h-5 w-5" />
                {submittingFor ? "Enviando..." : "Enviar Pontuação"}
              </Button>
            </Card>
          )}

          {/* Finalize button (organizer only) */}
          {match.created_by === user?.id && (
            <Button
              variant="accent"
              size="lg"
              className="w-full"
              onClick={handleFinalize}
              disabled={finalizing}
            >
              {finalizing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Finalizar Partida
                </>
              )}
            </Button>
          )}

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
      ) : isIndividual || isDraw ? (
        /* --- INDIVIDUAL VIEW --- */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted">Classificação</h2>
            {match.scoring_template_name && (
              <span className="text-xs text-muted">
                Template: {match.scoring_template_name}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {[...match.players]
              .sort((a, b) => a.position - b.position)
              .map((player) => (
                <Card
                  key={player.id}
                  className={`p-3! ${player.position === 1 ? "border-yellow-500/40 bg-yellow-500/5" : ""}`}
                >
                  <button
                    className={`flex items-center gap-3 w-full text-left ${player.template_scores?.length ? "cursor-pointer" : ""}`}
                    onClick={() => {
                      if (!player.template_scores?.length) return;
                      setExpandedPlayer(expandedPlayer === player.id ? null : player.id);
                    }}
                  >
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
                    <div className="text-right flex items-center gap-2">
                      {!positionOnly && (
                        <div>
                          <p className="text-lg font-bold text-foreground">
                            {player.score}
                          </p>
                          <p className="text-xs text-muted">pts</p>
                        </div>
                      )}
                      {player.template_scores?.length > 0 && (
                        expandedPlayer === player.id
                          ? <ChevronUp className="h-4 w-4 text-neutral-500" />
                          : <ChevronDown className="h-4 w-4 text-neutral-500" />
                      )}
                    </div>
                  </button>
                  {expandedPlayer === player.id && player.template_scores?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                      {player.template_scores.map((ts) => (
                        <div key={ts.template_field_id} className="flex items-center justify-between px-2">
                          <span className="text-xs text-muted">{ts.field_name || "Campo"}</span>
                          <span className="text-xs font-semibold text-foreground">
                            {ts.field_type === "boolean"
                              ? (ts.boolean_value ? "Sim" : "Não")
                              : ts.field_type === "ranking"
                              ? `${ts.ranking_value ?? 0}º`
                              : ts.numeric_value ?? 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
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
                      {!positionOnly && (
                        <p className="text-xs text-win font-medium">
                          {player.score} pts
                        </p>
                      )}
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
                      {!positionOnly && (
                        <p className="text-xs text-neutral-400 font-medium">
                          {player.score} pts
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pontuação detalhada por template */}
      {match.scoring_template_id && match.players.some((p) => p.template_scores?.length > 0) && (
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted">Pontuação Detalhada</h2>
            {match.scoring_template_name && (
              <span className="text-xs text-muted">{match.scoring_template_name}</span>
            )}
          </div>

          {[...match.players]
            .sort((a, b) => a.position - b.position)
            .map((player) => (
              <Card key={player.id} className="p-3!">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar name={player.username || "?"} size="sm" />
                  <span className="text-sm font-semibold text-foreground flex-1 truncate">
                    {player.username || "Jogador"}
                  </span>
                  {!positionOnly && (
                    <span className="text-sm font-bold text-foreground">
                      {player.score} pts
                    </span>
                  )}
                </div>
                {player.template_scores?.length > 0 && (
                  <div className="space-y-1 border-t border-border pt-2">
                    {player.template_scores.map((ts) => (
                      <div key={ts.template_field_id} className="flex items-center justify-between px-1">
                        <span className="text-xs text-muted">{ts.field_name || "Campo"}</span>
                        <span className="text-xs font-semibold text-foreground">
                          {ts.field_type === "boolean"
                            ? (ts.boolean_value ? "Sim" : "Não")
                            : ts.field_type === "ranking"
                            ? `${ts.ranking_value ?? 0}º`
                            : ts.numeric_value ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
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
