"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Check, Minus, Plus, UserPlus, Users, User, X, Trophy, Hash, BarChart3, ToggleLeft, Trash2, GripVertical } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createMatch, getScoringTemplatesByGame, getScoringTemplate, createScoringTemplate, ApiError } from "@/lib/api";
import type {
  UserResponse,
  GameResponse,
  MatchPlayerCreate,
  ScoringTemplateListResponse,
  ScoringTemplateResponse,
  ScoringTemplateFieldCreate,
  ScoringFieldType,
  TemplateScoreEntry,
} from "@/types";
import { GameAutocomplete } from "@/components/match/game-autocomplete";
import { PlayerAutocomplete } from "@/components/match/player-autocomplete";

type Step = "game" | "mode" | "players" | "score" | "confirm";
type MatchMode = "teams" | "individual";

interface IndividualPlayer {
  user: UserResponse;
  score: number;
  position: number;
}

interface InlineFieldDraft {
  key: number;
  name: string;
  field_type: ScoringFieldType;
  min_value: string;
  max_value: string;
  is_required: boolean;
  is_tiebreaker: boolean;
}

let inlineFieldKey = 0;
function newInlineField(): InlineFieldDraft {
  return { key: ++inlineFieldKey, name: "", field_type: "numeric", min_value: "", max_value: "", is_required: true, is_tiebreaker: false };
}

const FIELD_TYPE_OPTIONS: { value: ScoringFieldType; label: string; icon: typeof Hash }[] = [
  { value: "numeric", label: "Numérico", icon: Hash },
  { value: "ranking", label: "Ranking", icon: BarChart3 },
  { value: "boolean", label: "Sim/Não", icon: ToggleLeft },
];

export default function NewMatchPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loadingData] = useState(false);

  const [step, setStep] = useState<Step>("game");
  const [mode, setMode] = useState<MatchMode>("teams");
  const [selectedGame, setSelectedGame] = useState<GameResponse | null>(null);

  // Teams mode
  const [teamA, setTeamA] = useState<UserResponse[]>([]);
  const [teamB, setTeamB] = useState<UserResponse[]>([]);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [selectingFor, setSelectingFor] = useState<"A" | "B">("A");

  // Individual mode
  const [individualPlayers, setIndividualPlayers] = useState<IndividualPlayer[]>([]);

  // Scoring template
  const [availableTemplates, setAvailableTemplates] = useState<ScoringTemplateListResponse[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ScoringTemplateResponse | null>(null);
  const [useTemplate, setUseTemplate] = useState(false);
  // templateScores: { [userId]: { [fieldId]: TemplateScoreEntry } }
  const [templateScores, setTemplateScores] = useState<
    Record<string, Record<string, TemplateScoreEntry>>
  >({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Inline template creation
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateFields, setNewTemplateFields] = useState<InlineFieldDraft[]>([]);
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, authLoading, router]);

  // Fetch available templates when game is selected
  useEffect(() => {
    if (!selectedGame) {
      setAvailableTemplates([]);
      setSelectedTemplate(null);
      setUseTemplate(false);
      return;
    }
    (async () => {
      try {
        const templates = await getScoringTemplatesByGame(selectedGame.id);
        setAvailableTemplates(templates);
      } catch {
        setAvailableTemplates([]);
      }
    })();
  }, [selectedGame]);

  const selectedIds =
    mode === "teams"
      ? [...teamA, ...teamB].map((p) => p.id)
      : individualPlayers.map((p) => p.user.id);

  // --- Teams helpers ---
  function addPlayer(player: UserResponse) {
    if (selectingFor === "A") {
      setTeamA((prev) => [...prev, player]);
    } else {
      setTeamB((prev) => [...prev, player]);
    }
  }

  function removePlayer(playerId: string, team: "A" | "B") {
    if (team === "A") {
      setTeamA((prev) => prev.filter((p) => p.id !== playerId));
    } else {
      setTeamB((prev) => prev.filter((p) => p.id !== playerId));
    }
  }

  // --- Individual helpers ---
  function addIndividualPlayer(player: UserResponse) {
    setIndividualPlayers((prev) => [
      ...prev,
      { user: player, score: 0, position: prev.length + 1 },
    ]);
  }

  function removeIndividualPlayer(playerId: string) {
    setIndividualPlayers((prev) => {
      const filtered = prev.filter((p) => p.user.id !== playerId);
      return filtered.map((p, i) => ({ ...p, position: i + 1 }));
    });
  }

  function rankWithTies(players: IndividualPlayer[]): IndividualPlayer[] {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    let rank = 1;
    return sorted.map((p, i) => {
      if (i > 0 && sorted[i].score < sorted[i - 1].score) rank = i + 1;
      return { ...p, position: rank };
    });
  }

  function updateIndividualScore(playerId: string, score: number) {
    setIndividualPlayers((prev) => {
      const updated = prev.map((p) =>
        p.user.id === playerId ? { ...p, score } : p
      );
      return rankWithTies(updated);
    });
  }

  function autoRankByScore() {
    setIndividualPlayers((prev) => rankWithTies(prev));
  }

  function movePosition(playerId: string, direction: "up" | "down") {
    setIndividualPlayers((prev) => {
      const idx = prev.findIndex((p) => p.user.id === playerId);
      if (idx < 0) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const updated = [...prev];
      [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
      return updated.map((p, i) => ({ ...p, position: i + 1 }));
    });
  }

  function breakTiesSequentially() {
    setIndividualPlayers((prev) => prev.map((p, i) => ({ ...p, position: i + 1 })));
  }

  function applyTiebreaker(
    players: IndividualPlayer[],
    tbField: { id: string; field_type: string }
  ): IndividualPlayer[] {
    const byPos: Record<number, IndividualPlayer[]> = {};
    for (const p of players) {
      if (!byPos[p.position]) byPos[p.position] = [];
      byPos[p.position].push(p);
    }
    const result: IndividualPlayer[] = [];
    let pos = 1;
    for (const k of Object.keys(byPos).map(Number).sort((a, b) => a - b)) {
      const group = byPos[k];
      if (group.length === 1) {
        result.push({ ...group[0], position: pos });
        pos++;
      } else {
        const sorted = [...group].sort((a, b) => {
          const ae = templateScores[a.user.id]?.[tbField.id];
          const be = templateScores[b.user.id]?.[tbField.id];
          if (tbField.field_type === "numeric")
            return (be?.numeric_value ?? 0) - (ae?.numeric_value ?? 0);
          if (tbField.field_type === "ranking")
            return (ae?.ranking_value ?? Infinity) - (be?.ranking_value ?? Infinity);
          if (tbField.field_type === "boolean")
            return (be?.boolean_value ? 1 : 0) - (ae?.boolean_value ? 1 : 0);
          return 0;
        });
        for (const p of sorted) {
          result.push({ ...p, position: pos });
          pos++;
        }
      }
    }
    return result;
  }

  function resolveTiesWithTiebreaker() {
    if (!selectedTemplate) return;
    const tbField = selectedTemplate.fields.find((f) => f.is_tiebreaker);
    if (!tbField) return;
    setIndividualPlayers((prev) => applyTiebreaker(prev, tbField));
  }

  function prepareAndConfirm() {
    if (useTemplate && selectedTemplate) {
      setIndividualPlayers((prev) => {
        let players = prev.map((p) => {
          const userScores = templateScores[p.user.id] || {};
          let total = 0;
          for (const field of selectedTemplate.fields) {
            if (field.is_tiebreaker) continue;
            const entry = userScores[field.id];
            if (!entry) continue;
            if (field.field_type === "numeric") total += entry.numeric_value ?? 0;
            else if (field.field_type === "boolean") total += entry.boolean_value ? 1 : 0;
          }
          return { ...p, score: total };
        });
        players = rankWithTies(players);
        const tbField = selectedTemplate.fields.find((f) => f.is_tiebreaker);
        if (tbField) {
          players = applyTiebreaker(players, tbField);
        }
        return players;
      });
    } else {
      autoRankByScore();
    }
    setStep("confirm");
  }

  // Template score helpers
  async function handleSelectTemplate(templateId: string) {
    try {
      const t = await getScoringTemplate(templateId);
      setSelectedTemplate(t);
      setUseTemplate(true);
      setTemplateScores({});
    } catch {
      setSelectedTemplate(null);
      setUseTemplate(false);
    }
  }

  function handleClearTemplate() {
    setSelectedTemplate(null);
    setUseTemplate(false);
    setTemplateScores({});
  }

  function openCreateTemplate() {
    setShowCreateTemplate(true);
    setNewTemplateName("");
    setNewTemplateFields([newInlineField()]);
  }

  async function handleCreateTemplateInline() {
    if (!selectedGame || !newTemplateName.trim()) return;
    for (const f of newTemplateFields) {
      if (!f.name.trim()) {
        setError("Todos os campos do template precisam ter um nome");
        return;
      }
    }
    setCreatingTemplate(true);
    setError("");
    const fields: ScoringTemplateFieldCreate[] = newTemplateFields.map((f, i) => ({
      name: f.name.trim(),
      field_type: f.field_type,
      min_value: f.min_value !== "" ? Number(f.min_value) : null,
      max_value: f.max_value !== "" ? Number(f.max_value) : null,
      display_order: i,
      is_required: f.is_required,
      is_tiebreaker: f.is_tiebreaker,
    }));
    try {
      const created = await createScoringTemplate({
        game_id: selectedGame.id,
        name: newTemplateName.trim(),
        fields,
      });
      // Refresh list and auto-select
      const templates = await getScoringTemplatesByGame(selectedGame.id);
      setAvailableTemplates(templates);
      setSelectedTemplate(created);
      setUseTemplate(true);
      setTemplateScores({});
      setShowCreateTemplate(false);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Erro ao criar template");
    } finally {
      setCreatingTemplate(false);
    }
  }

  function updateTemplateScore(
    userId: string,
    fieldId: string,
    entry: Partial<TemplateScoreEntry>
  ) {
    setTemplateScores((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [fieldId]: {
          ...(prev[userId]?.[fieldId] || {}),
          ...entry,
          template_field_id: fieldId,
        },
      },
    }));
  }

  // --- Submit ---
  async function handleConfirm() {
    if (!selectedGame || !user) return;
    setSubmitting(true);
    setError("");

    let players: MatchPlayerCreate[];

    if (mode === "teams") {
      const isTeamAWinner = scoreA > scoreB;
      players = [
        ...teamA.map((p) => ({
          user_id: p.id,
          position: isTeamAWinner ? 1 : 2,
          score: scoreA,
          is_winner: isTeamAWinner,
          template_scores: useTemplate && selectedTemplate
            ? Object.values(templateScores[p.id] || {})
            : [],
        })),
        ...teamB.map((p) => ({
          user_id: p.id,
          position: isTeamAWinner ? 2 : 1,
          score: scoreB,
          is_winner: !isTeamAWinner,
          template_scores: useTemplate && selectedTemplate
            ? Object.values(templateScores[p.id] || {})
            : [],
        })),
      ];
    } else {
      players = individualPlayers.map((p) => ({
        user_id: p.user.id,
        position: p.position,
        score: p.score,
        is_winner: p.position === 1,
        template_scores: useTemplate && selectedTemplate
          ? Object.values(templateScores[p.user.id] || {})
          : [],
      }));
    }

    try {
      await createMatch({
        game_id: selectedGame.id,
        scoring_template_id: useTemplate && selectedTemplate ? selectedTemplate.id : undefined,
        players,
      });
      router.push("/matches");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erro ao registrar partida");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Tie detection
  const tiedGroups = (() => {
    const byPos: Record<number, IndividualPlayer[]> = {};
    for (const p of individualPlayers) {
      if (!byPos[p.position]) byPos[p.position] = [];
      byPos[p.position].push(p);
    }
    return Object.values(byPos).filter((g) => g.length > 1);
  })();
  const hasTies = tiedGroups.length > 0;
  const tiebreakerField =
    selectedTemplate?.fields.find((f) => f.is_tiebreaker) ?? null;

  // --- Validations ---
  const canGoToScore =
    mode === "teams"
      ? teamA.length >= 1 && teamB.length >= 1
      : individualPlayers.length >= 2;

  const canConfirmIndividual = individualPlayers.length >= 2;

  const steps: Step[] =
    mode === "teams"
      ? ["game", "mode", "players", "score", "confirm"]
      : ["game", "mode", "players", "score", "confirm"];

  const stepIndex = steps.indexOf(step);

  if (authLoading || loadingData) {
    return (
      <PageContainer>
        <PageHeader title="Nova Partida" subtitle="Carregando..." />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted">Carregando...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Nova Partida"
        subtitle={
          step === "game"
            ? "Escolha o jogo"
            : step === "mode"
            ? "Modo de jogo"
            : step === "players"
            ? mode === "teams"
              ? "Monte os times"
              : "Adicione os jogadores"
            : step === "score"
            ? "Qual foi o placar?"
            : "Confirme os dados"
        }
      />

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                stepIndex >= i ? "bg-primary-500" : "bg-neutral-700"
              }`}
            />
          </div>
        ))}
      </div>

      {/* STEP: Selecionar Jogo */}
      {step === "game" && (
        <div className="space-y-4">
          <p className="text-xs text-muted mb-2 font-medium">Busque e selecione um jogo</p>
          <GameAutocomplete
            selectedGame={selectedGame}
            onSelect={(game) => {
              setSelectedGame(game);
              setStep("mode");
            }}
            onClear={() => setSelectedGame(null)}
          />
        </div>
      )}

      {/* STEP: Modo de Jogo */}
      {step === "mode" && (
        <div className="space-y-4">
          <p className="text-xs text-muted mb-2 font-medium">Como será a partida?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setMode("teams");
                setIndividualPlayers([]);
                if (user) {
                  setTeamA([user]);
                  setTeamB([]);
                } else {
                  setTeamA([]);
                  setTeamB([]);
                }
                setScoreA(0);
                setScoreB(0);
                setStep("players");
              }}
              className="flex flex-col items-center gap-3 rounded-xl border border-border p-6 transition-colors cursor-pointer hover:bg-card-hover hover:border-primary-600"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600/20">
                <Users className="h-7 w-7 text-primary-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Times</p>
                <p className="text-xs text-muted mt-1">Time A vs Time B</p>
              </div>
            </button>
            <button
              onClick={() => {
                setMode("individual");
                setTeamA([]);
                setTeamB([]);
                setScoreA(0);
                setScoreB(0);
                if (user) {
                  setIndividualPlayers([
                    { user, score: 0, position: 1 },
                  ]);
                } else {
                  setIndividualPlayers([]);
                }
                setStep("players");
              }}
              className="flex flex-col items-center gap-3 rounded-xl border border-border p-6 transition-colors cursor-pointer hover:bg-card-hover hover:border-primary-600"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-500/20">
                <User className="h-7 w-7 text-accent-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Individual</p>
                <p className="text-xs text-muted mt-1">Cada um por si</p>
              </div>
            </button>
          </div>

          <Button variant="outline" size="lg" onClick={() => setStep("game")}>
            Voltar
          </Button>
        </div>
      )}

      {/* STEP: Selecionar Jogadores — TIMES */}
      {step === "players" && mode === "teams" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectingFor("A")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                selectingFor === "A"
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-800 text-neutral-400"
              }`}
            >
              Time A ({teamA.length})
            </button>
            <button
              onClick={() => setSelectingFor("B")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                selectingFor === "B"
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-800 text-neutral-400"
              }`}
            >
              Time B ({teamB.length})
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="min-h-25">
              <p className="text-xs text-muted mb-2 font-medium">Time A</p>
              {teamA.length === 0 ? (
                <p className="text-xs text-neutral-600">Sem jogadores</p>
              ) : (
                <div className="space-y-2">
                  {teamA.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Avatar name={p.username} size="sm" />
                      <span className="text-xs text-foreground flex-1 truncate">
                        {p.username}
                      </span>
                      <button
                        onClick={() => removePlayer(p.id, "A")}
                        className="text-neutral-500 hover:text-loss cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="min-h-25">
              <p className="text-xs text-muted mb-2 font-medium">Time B</p>
              {teamB.length === 0 ? (
                <p className="text-xs text-neutral-600">Sem jogadores</p>
              ) : (
                <div className="space-y-2">
                  {teamB.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Avatar name={p.username} size="sm" />
                      <span className="text-xs text-foreground flex-1 truncate">
                        {p.username}
                      </span>
                      <button
                        onClick={() => removePlayer(p.id, "B")}
                        className="text-neutral-500 hover:text-loss cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div>
            <p className="text-xs text-muted mb-2 font-medium flex items-center gap-1">
              <UserPlus className="h-3.5 w-3.5" />
              Selecione para o Time {selectingFor}
            </p>
            <PlayerAutocomplete
              onSelect={(player) => addPlayer(player)}
              excludeIds={selectedIds}
              placeholder={`Buscar jogador para o Time ${selectingFor}...`}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={() => setStep("mode")}>
              Voltar
            </Button>
            <Button
              variant="primary"
              size="lg"
              disabled={!canGoToScore}
              onClick={() => setStep("score")}
            >
              Próximo: Placar
            </Button>
          </div>
        </div>
      )}

      {/* STEP: Selecionar Jogadores — INDIVIDUAL */}
      {step === "players" && mode === "individual" && (
        <div className="space-y-4">
          {/* Jogadores adicionados */}
          <Card className="min-h-25">
            <p className="text-xs text-muted mb-2 font-medium">
              Jogadores ({individualPlayers.length})
            </p>
            {individualPlayers.length === 0 ? (
              <p className="text-xs text-neutral-600">Nenhum jogador adicionado</p>
            ) : (
              <div className="space-y-2">
                {individualPlayers.map((p, idx) => (
                  <div key={p.user.id} className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 w-5 text-center font-mono">
                      {idx + 1}
                    </span>
                    <Avatar name={p.user.username} size="sm" />
                    <span className="text-xs text-foreground flex-1 truncate">
                      {p.user.username}
                    </span>
                    <button
                      onClick={() => removeIndividualPlayer(p.user.id)}
                      className="text-neutral-500 hover:text-loss cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Autocomplete para adicionar jogadores */}
          <div>
            <p className="text-xs text-muted mb-2 font-medium flex items-center gap-1">
              <UserPlus className="h-3.5 w-3.5" />
              Adicionar jogador
            </p>
            <PlayerAutocomplete
              onSelect={(player) => addIndividualPlayer(player)}
              excludeIds={selectedIds}
              placeholder="Buscar jogador..."
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={() => setStep("mode")}>
              Voltar
            </Button>
            <Button
              variant="primary"
              size="lg"
              disabled={!canGoToScore}
              onClick={() => setStep("score")}
            >
              Próximo: Placar
            </Button>
          </div>
        </div>
      )}

      {/* STEP: Placar — TIMES */}
      {step === "score" && mode === "teams" && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center gap-3 flex-1">
                <div className="flex -space-x-2">
                  {teamA.map((p) => (
                    <Avatar key={p.id} name={p.username} size="sm" />
                  ))}
                </div>
                <span className="text-xs text-muted font-medium">Time A</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={scoreA}
                    onChange={(e) => setScoreA(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-4xl font-bold text-foreground w-16 text-center bg-transparent border-b-2 border-neutral-700 focus:border-primary-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => setScoreA(scoreA + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-500 transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <span className="text-2xl font-bold text-neutral-600">×</span>

              <div className="flex flex-col items-center gap-3 flex-1">
                <div className="flex -space-x-2">
                  {teamB.map((p) => (
                    <Avatar key={p.id} name={p.username} size="sm" />
                  ))}
                </div>
                <span className="text-xs text-muted font-medium">Time B</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={scoreB}
                    onChange={(e) => setScoreB(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-4xl font-bold text-foreground w-16 text-center bg-transparent border-b-2 border-neutral-700 focus:border-primary-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => setScoreB(scoreB + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-500 transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={() => setStep("players")}>
              Voltar
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setStep("confirm")}
              disabled={scoreA === scoreB}
            >
              Confirmar
            </Button>
          </div>

          {scoreA === scoreB && scoreA > 0 && (
            <p className="text-center text-xs text-loss">
              Empate não é permitido. Defina um vencedor!
            </p>
          )}
        </div>
      )}

      {/* STEP: Placar — INDIVIDUAL */}
      {step === "score" && mode === "individual" && (
        <div className="space-y-4">
          {/* Template selector */}
          <Card>
            <p className="text-xs text-muted font-medium mb-2">Método de pontuação</p>
            <div className="flex gap-2 mb-2">
              <button
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  !useTemplate
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-800 text-neutral-400"
                }`}
                onClick={() => { handleClearTemplate(); setShowCreateTemplate(false); }}
              >
                Padrão
              </button>
              <button
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  useTemplate
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-800 text-neutral-400"
                }`}
                onClick={() => {
                  if (!selectedTemplate && availableTemplates.length > 0) {
                    handleSelectTemplate(availableTemplates[0].id);
                  } else if (availableTemplates.length === 0) {
                    openCreateTemplate();
                  } else {
                    setUseTemplate(true);
                  }
                }}
              >
                Template
              </button>
            </div>
            {useTemplate && availableTemplates.length > 0 && (
              <div className="space-y-2">
                <select
                  className="w-full rounded-lg border border-border bg-neutral-800 px-3 py-2 text-sm text-foreground focus:border-primary-600 focus:outline-none"
                  value={selectedTemplate?.id ?? ""}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                >
                  {availableTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.field_count} campos)
                    </option>
                  ))}
                </select>
                {!showCreateTemplate && (
                  <button
                    onClick={openCreateTemplate}
                    className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    Criar novo template
                  </button>
                )}
              </div>
            )}
            {!useTemplate && !showCreateTemplate && (
              <button
                onClick={openCreateTemplate}
                className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer mt-1"
              >
                <Plus className="h-3 w-3" />
                Criar template para este jogo
              </button>
            )}
          </Card>

          {/* Inline template creation */}
          {showCreateTemplate && (
            <Card className="border-primary-600/30 bg-primary-600/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">Novo Template</p>
                <button
                  onClick={() => setShowCreateTemplate(false)}
                  className="text-neutral-400 hover:text-foreground p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <input
                className="w-full rounded-lg border border-border bg-neutral-800 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary-600 focus:outline-none mb-3"
                placeholder="Nome do template"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />

              <div className="space-y-2">
                {newTemplateFields.map((f, idx) => (
                  <div key={f.key} className="rounded-lg border border-border bg-neutral-800/50 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className="text-muted" />
                      <span className="text-[10px] text-muted">Campo {idx + 1}</span>
                      <div className="flex-1" />
                      {newTemplateFields.length > 1 && (
                        <button
                          className="text-red-400 hover:text-red-300 p-0.5 cursor-pointer"
                          onClick={() => setNewTemplateFields((prev) => prev.filter((x) => x.key !== f.key))}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    <input
                      className="w-full rounded-md border border-border bg-neutral-800 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-primary-600 focus:outline-none"
                      placeholder="Nome do campo (ex: Pontos de Vitória)"
                      value={f.name}
                      onChange={(e) =>
                        setNewTemplateFields((prev) =>
                          prev.map((x) => (x.key === f.key ? { ...x, name: e.target.value } : x))
                        )
                      }
                    />

                    <div className="flex gap-1.5">
                      {FIELD_TYPE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            className={`flex-1 flex items-center justify-center gap-1 rounded-md border px-1.5 py-1.5 text-[10px] font-medium transition-colors cursor-pointer ${
                              f.field_type === opt.value
                                ? "border-primary-600 bg-primary-600/10 text-primary-400"
                                : "border-border text-muted hover:text-foreground"
                            }`}
                            onClick={() =>
                              setNewTemplateFields((prev) =>
                                prev.map((x) => (x.key === f.key ? { ...x, field_type: opt.value } : x))
                              )
                            }
                          >
                            <Icon size={11} />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-primary-600"
                          checked={f.is_required}
                          onChange={(e) =>
                            setNewTemplateFields((prev) =>
                              prev.map((x) => (x.key === f.key ? { ...x, is_required: e.target.checked } : x))
                            )
                          }
                        />
                        <span className="text-[10px] text-muted">Obrigatório</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-amber-500"
                          checked={f.is_tiebreaker}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewTemplateFields((prev) =>
                                prev.map((x) => ({ ...x, is_tiebreaker: x.key === f.key }))
                              );
                            } else {
                              setNewTemplateFields((prev) =>
                                prev.map((x) => (x.key === f.key ? { ...x, is_tiebreaker: false } : x))
                              );
                            }
                          }}
                        />
                        <span className="text-[10px] text-amber-400">Desempate</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => setNewTemplateFields((prev) => [...prev, newInlineField()])}
                  className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar campo
                </button>
                <Button
                  size="sm"
                  onClick={handleCreateTemplateInline}
                  disabled={creatingTemplate || !newTemplateName.trim() || newTemplateFields.length === 0}
                >
                  {creatingTemplate ? "Criando..." : "Criar e usar"}
                </Button>
              </div>
            </Card>
          )}

          {/* Template fields per player */}
          {useTemplate && selectedTemplate && (
            <div className="space-y-3">
              {individualPlayers.map((p) => (
                <Card key={p.user.id}>
                  <p className="text-sm font-semibold text-foreground mb-2">
                    {p.user.username}
                  </p>
                  <div className="space-y-2">
                    {selectedTemplate.fields.map((f) => (
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
                            value={templateScores[p.user.id]?.[f.id]?.numeric_value ?? ""}
                            onChange={(e) =>
                              updateTemplateScore(p.user.id, f.id, {
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
                            value={templateScores[p.user.id]?.[f.id]?.ranking_value ?? ""}
                            onChange={(e) =>
                              updateTemplateScore(p.user.id, f.id, {
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
                              checked={templateScores[p.user.id]?.[f.id]?.boolean_value ?? false}
                              onChange={(e) =>
                                updateTemplateScore(p.user.id, f.id, {
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
                </Card>
              ))}
            </div>
          )}

          {/* Default scoring */}
          {!useTemplate && (
            <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted font-medium">Defina a pontuação de cada jogador</p>
            <button
              onClick={autoRankByScore}
              className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
            >
              <Trophy className="h-3 w-3" />
              Ordenar por pontuação
            </button>
          </div>

          <div className="space-y-2">
            {individualPlayers.map((p, idx) => (
              <Card key={p.user.id} className="p-3!">
                <div className="flex items-center gap-3">
                  {/* Position */}
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      onClick={() => movePosition(p.user.id, "up")}
                      disabled={idx === 0}
                      className="text-neutral-500 hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="h-3 w-3 rotate-0" />
                    </button>
                    <span
                      className={`text-sm font-bold w-6 text-center ${
                        p.position === 1
                          ? "text-yellow-400"
                          : p.position === 2
                          ? "text-neutral-300"
                          : p.position === 3
                          ? "text-amber-600"
                          : "text-neutral-500"
                      }`}
                    >
                      {p.position}º
                    </span>
                    <button
                      onClick={() => movePosition(p.user.id, "down")}
                      disabled={idx === individualPlayers.length - 1}
                      className="text-neutral-500 hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Player */}
                  <Avatar name={p.user.username} size="sm" />
                  <span className="text-sm text-foreground font-medium flex-1 truncate">
                    {p.user.username}
                  </span>

                  {/* Score */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateIndividualScore(p.user.id, Math.max(0, p.score - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={p.score}
                      onChange={(e) => updateIndividualScore(p.user.id, Math.max(0, parseInt(e.target.value) || 0))}
                      className="text-lg font-bold text-foreground w-12 text-center bg-transparent border-b-2 border-neutral-700 focus:border-primary-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => updateIndividualScore(p.user.id, p.score + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white hover:bg-primary-500 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
            </>
          )}

          {/* Tie detection */}
          {hasTies && !useTemplate && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-400 text-lg">⚖️</span>
                <p className="text-sm font-semibold text-amber-400">Empate detectado</p>
              </div>
              {tiedGroups.map((group, i) => (
                <p key={i} className="text-xs text-muted mb-1">
                  {group.map((g) => g.user.username).join(" e ")} — {group[0].position}º lugar ({group[0].score} pts)
                </p>
              ))}
              <div className="flex flex-wrap gap-2 mt-3">
                {tiebreakerField && useTemplate && (
                  <Button size="sm" variant="primary" onClick={resolveTiesWithTiebreaker}>
                    Resolver com &quot;{tiebreakerField.name}&quot;
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={breakTiesSequentially}>
                  Definir ranking manual
                </Button>
              </div>
              <p className="text-xs text-muted mt-2">
                Ou clique em &quot;Confirmar&quot; para manter o empate.
              </p>
            </Card>
          )}

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={() => setStep("players")}>
              Voltar
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={prepareAndConfirm}
              disabled={!canConfirmIndividual}
            >
              Confirmar
            </Button>
          </div>
        </div>
      )}

      {/* STEP: Confirmação — TIMES */}
      {step === "confirm" && mode === "teams" && (
        <div className="space-y-6">
          <Card>
            <p className="text-xs text-muted mb-1 font-medium text-center">
              {selectedGame?.name}
            </p>
            <p className="text-xs text-muted mb-4 font-medium text-center">
              Resumo da Partida
            </p>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="flex -space-x-2">
                  {teamA.map((p) => (
                    <Avatar key={p.id} name={p.username} size="sm" />
                  ))}
                </div>
                <div className="text-center">
                  {teamA.map((p) => (
                    <p key={p.id} className="text-xs text-muted">
                      {p.username}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 px-4">
                <span
                  className={`text-4xl font-bold ${
                    scoreA > scoreB ? "text-win" : "text-neutral-400"
                  }`}
                >
                  {scoreA}
                </span>
                <span className="text-neutral-600 text-xl">×</span>
                <span
                  className={`text-4xl font-bold ${
                    scoreB > scoreA ? "text-win" : "text-neutral-400"
                  }`}
                >
                  {scoreB}
                </span>
              </div>

              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="flex -space-x-2">
                  {teamB.map((p) => (
                    <Avatar key={p.id} name={p.username} size="sm" />
                  ))}
                </div>
                <div className="text-center">
                  {teamB.map((p) => (
                    <p key={p.id} className="text-xs text-muted">
                      {p.username}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {error && <p className="text-center text-xs text-loss">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={() => setStep("score")}>
              Voltar
            </Button>
            <Button
              variant="accent"
              size="lg"
              onClick={handleConfirm}
              disabled={submitting}
            >
              <Check className="h-5 w-5" />
              {submitting ? "Salvando..." : "Salvar Partida"}
            </Button>
          </div>
        </div>
      )}

      {/* STEP: Confirmação — INDIVIDUAL */}
      {step === "confirm" && mode === "individual" && (
        <div className="space-y-6">
          <Card>
            <p className="text-xs text-muted mb-1 font-medium text-center">
              {selectedGame?.name}
            </p>
            <p className="text-xs text-muted mb-4 font-medium text-center">
              Resultado Final
            </p>
            <div className="space-y-2">
              {individualPlayers.map((p) => (
                <div
                  key={p.user.id}
                  className={`flex items-center gap-3 rounded-lg p-2.5 ${
                    p.position === 1 ? "bg-yellow-500/10" : ""
                  }`}
                >
                  <span
                    className={`text-sm font-bold w-6 text-center ${
                      p.position === 1
                        ? "text-yellow-400"
                        : p.position === 2
                        ? "text-neutral-300"
                        : p.position === 3
                        ? "text-amber-600"
                        : "text-neutral-500"
                    }`}
                  >
                    {p.position}º
                  </span>
                  <Avatar name={p.user.username} size="sm" />
                  <span className="text-sm text-foreground font-medium flex-1">
                    {p.user.username}
                  </span>
                  <span className="text-sm font-bold text-foreground">{p.score} pts</span>
                  {p.position === 1 && (
                    <Trophy className="h-4 w-4 text-yellow-400" />
                  )}
                </div>
              ))}
            </div>
          </Card>

          {error && <p className="text-center text-xs text-loss">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={() => setStep("score")}>
              Voltar
            </Button>
            <Button
              variant="accent"
              size="lg"
              onClick={handleConfirm}
              disabled={submitting}
            >
              <Check className="h-5 w-5" />
              {submitting ? "Salvando..." : "Salvar Partida"}
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
