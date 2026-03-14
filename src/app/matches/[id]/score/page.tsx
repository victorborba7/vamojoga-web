"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft } from "lucide-react";
import { useAuthGuard } from "@/lib/hooks";
import { getMatch, getScoringTemplate, submitOwnScores } from "@/lib/api";
import type {
  MatchResponse,
  ScoringTemplateResponse,
  TemplateScoreEntry,
} from "@/types";

export default function SubmitScorePage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuthGuard();
  const router = useRouter();

  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [template, setTemplate] = useState<ScoringTemplateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [scores, setScores] = useState<Record<string, TemplateScoreEntry>>({});

  useEffect(() => {
    if (authLoading || !user || !id) return;

    (async () => {
      try {
        const m = await getMatch(id);
        setMatch(m);

        if (m.scoring_template_id) {
          const t = await getScoringTemplate(m.scoring_template_id);
          setTemplate(t);
        }
      } catch {
        setError("Partida não encontrada");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, authLoading]);

  function updateScore(fieldId: string, entry: Partial<TemplateScoreEntry>) {
    setScores((prev) => ({
      ...prev,
      [fieldId]: {
        ...(prev[fieldId] || {}),
        ...entry,
        template_field_id: fieldId,
      },
    }));
  }

  async function handleSubmit() {
    if (!match || !id) return;
    setSubmitting(true);
    setError("");

    try {
      await submitOwnScores(id, {
        template_scores: Object.values(scores),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar pontuação");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <PageContainer>
        <PageHeader title="Registrar Pontuação" subtitle="Carregando..." />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted">Carregando...</p>
        </div>
      </PageContainer>
    );
  }

  if (error && !match) {
    return (
      <PageContainer>
        <PageHeader title="Pontuação" subtitle="Erro" />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-neutral-400">{error}</p>
          <Button variant="outline" size="lg" className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!match || match.status !== "pending_scores") {
    return (
      <PageContainer>
        <PageHeader title="Pontuação" subtitle="Indisponível" />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-neutral-400">
            Esta partida não está aceitando pontuações
          </p>
          <Button variant="outline" size="lg" className="mt-4" onClick={() => router.push(`/matches/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
            Ver Partida
          </Button>
        </div>
      </PageContainer>
    );
  }

  const myPlayer = match.players.find((p) => p.user_id === user?.id);
  if (!myPlayer) {
    return (
      <PageContainer>
        <PageHeader title="Pontuação" subtitle="Sem permissão" />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-neutral-400">
            Você não participa desta partida
          </p>
          <Button variant="outline" size="lg" className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (success || myPlayer.scores_submitted) {
    return (
      <PageContainer>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push(`/matches/${id}`)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Pontuação Registrada</h1>
            <p className="text-xs text-muted">{match.game_name}</p>
          </div>
        </div>

        <Card className="text-center py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-foreground mb-1">Pontuação enviada!</p>
          <p className="text-sm text-muted">
            Aguardando os outros jogadores registrarem suas pontuações.
          </p>
        </Card>

        <Button
          variant="primary"
          size="lg"
          className="w-full mt-6"
          onClick={() => router.push(`/matches/${id}`)}
        >
          Ver Partida
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => router.push(`/matches/${id}`)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Registrar Pontuação</h1>
          <p className="text-xs text-muted">{match.game_name}</p>
        </div>
      </div>

      {template && (
        <div className="rounded-lg border border-primary-600/30 bg-primary-600/5 px-3 py-2 mb-4">
          <p className="text-xs text-primary-400 font-medium">
            Template: {template.name}
          </p>
        </div>
      )}

      <Card className="mb-4">
        <p className="text-sm font-semibold text-foreground mb-3">
          Seus campos de pontuação
        </p>
        <div className="space-y-3">
          {template?.fields.map((f) => (
            <div key={f.id}>
              <label className="text-xs text-muted mb-1 block">
                {f.name}
                {!f.is_required && " (opcional)"}
                {f.is_tiebreaker && (
                  <span className="text-amber-400 ml-1">(desempate)</span>
                )}
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
                  value={scores[f.id]?.numeric_value ?? ""}
                  onChange={(e) =>
                    updateScore(f.id, {
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
                  value={scores[f.id]?.ranking_value ?? ""}
                  onChange={(e) =>
                    updateScore(f.id, {
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
                    checked={scores[f.id]?.boolean_value ?? false}
                    onChange={(e) =>
                      updateScore(f.id, {
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

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      <Button
        variant="accent"
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        disabled={submitting}
      >
        <Check className="h-5 w-5" />
        {submitting ? "Enviando..." : "Enviar Pontuação"}
      </Button>
    </PageContainer>
  );
}
