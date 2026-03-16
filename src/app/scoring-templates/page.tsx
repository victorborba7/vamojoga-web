"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus,
  Trash2,
  GripVertical,
  Hash,
  BarChart3,
  ToggleLeft,
  FileText,
  Users,
  User,
  Pencil,
  X,
  Check,
  Handshake,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  createScoringTemplate,
  getScoringTemplatesByGame,
  getScoringTemplate,
  deleteScoringTemplate,
  updateScoringTemplate,
  ApiError,
} from "@/lib/api";
import { GameAutocomplete } from "@/components/match/game-autocomplete";
import type {
  GameResponse,
  ScoringFieldType,
  ScoringTemplateFieldCreate,
  ScoringTemplateListResponse,
  ScoringTemplateResponse,
} from "@/types";

interface FieldDraft {
  key: number;
  name: string;
  field_type: ScoringFieldType;
  is_required: boolean;
  is_tiebreaker: boolean;
}

let fieldKeyCounter = 0;

function newEmptyField(): FieldDraft {
  return {
    key: ++fieldKeyCounter,
    name: "",
    field_type: "numeric",
    is_required: true,
    is_tiebreaker: false,
  };
}

const FIELD_TYPE_OPTIONS: { value: ScoringFieldType; label: string; icon: typeof Hash }[] = [
  { value: "numeric", label: "Numérico", icon: Hash },
  { value: "ranking", label: "Ranking", icon: BarChart3 },
  { value: "boolean", label: "Sim/Não", icon: ToggleLeft },
];

export default function ScoringTemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Tab: "browse" | "create"
  const [tab, setTab] = useState<"browse" | "create">("browse");

  // -- Browse state --
  const [browseGame, setBrowseGame] = useState<GameResponse | null>(null);
  const [templates, setTemplates] = useState<ScoringTemplateListResponse[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ScoringTemplateResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // -- Edit state --
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editMatchMode, setEditMatchMode] = useState<"individual" | "team" | "cooperative">("individual");
  const [editFields, setEditFields] = useState<FieldDraft[]>([]);
  const [saving, setSaving] = useState(false);

  // -- Create state --
  const [createGame, setCreateGame] = useState<GameResponse | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateMatchMode, setTemplateMatchMode] = useState<"individual" | "team" | "cooperative">("individual");
  const [fields, setFields] = useState<FieldDraft[]>([newEmptyField()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // Load templates when game selected in browse tab
  useEffect(() => {
    if (!browseGame) {
      setTemplates([]);
      setSelectedTemplate(null);
      return;
    }
    (async () => {
      setLoadingTemplates(true);
      try {
        const data = await getScoringTemplatesByGame(browseGame.id);
        setTemplates(data);
      } catch {
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    })();
  }, [browseGame]);

  async function handleViewTemplate(id: string) {
    setLoadingDetail(true);
    try {
      const t = await getScoringTemplate(id);
      setSelectedTemplate(t);
    } catch {
      setSelectedTemplate(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    const tmpl = templates.find((t) => t.id === id);
    const name = tmpl?.name ?? selectedTemplate?.name ?? "este template";
    if (!confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteScoringTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (selectedTemplate?.id === id) setSelectedTemplate(null);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  function startEditing() {
    if (!selectedTemplate) return;
    setEditName(selectedTemplate.name);
    setEditDesc(selectedTemplate.description || "");
    setEditMatchMode(selectedTemplate.match_mode === "team" ? "team" : selectedTemplate.match_mode === "cooperative" ? "cooperative" : "individual");
    setEditFields(
      selectedTemplate.fields.map((f) => ({
        key: ++fieldKeyCounter,
        name: f.name,
        field_type: f.field_type as ScoringFieldType,
        is_required: f.is_required,
        is_tiebreaker: f.is_tiebreaker,
      }))
    );
    setEditing(true);
    setError("");
  }

  function cancelEditing() {
    setEditing(false);
    setError("");
  }

  function addEditField() {
    setEditFields((prev) => [...prev, newEmptyField()]);
  }

  function removeEditField(key: number) {
    setEditFields((prev) => prev.filter((f) => f.key !== key));
  }

  function updateEditField(key: number, updates: Partial<FieldDraft>) {
    setEditFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, ...updates } : f))
    );
  }

  async function handleSaveEdit() {
    if (!selectedTemplate) return;
    if (!editName.trim()) {
      setError("Nome é obrigatório");
      return;
    }
    if (editFields.length === 0) {
      setError("Adicione pelo menos um campo");
      return;
    }
    for (const f of editFields) {
      if (!f.name.trim()) {
        setError("Todos os campos precisam ter um nome");
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      const templateFields: ScoringTemplateFieldCreate[] = editFields.map((f, i) => ({
        name: f.name.trim(),
        field_type: f.field_type,
        min_value: null,
        max_value: null,
        display_order: i,
        is_required: f.is_required,
        is_tiebreaker: f.is_tiebreaker,
      }));
      const updated = await updateScoringTemplate(selectedTemplate.id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        match_mode: editMatchMode,
        fields: templateFields,
      });
      setSelectedTemplate(updated);
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === updated.id
            ? { ...t, name: updated.name, description: updated.description, match_mode: updated.match_mode }
            : t
        )
      );
      setEditing(false);
      setSuccess("Template atualizado!");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  // -- Create logic --
  function addField() {
    setFields((prev) => [...prev, newEmptyField()]);
  }

  function removeField(key: number) {
    setFields((prev) => prev.filter((f) => f.key !== key));
  }

  function updateField(key: number, updates: Partial<FieldDraft>) {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, ...updates } : f))
    );
  }

  async function handleCreate() {
    if (!createGame) return;
    if (!templateName.trim()) {
      setError("Dê um nome ao template");
      return;
    }
    if (fields.length === 0) {
      setError("Adicione pelo menos um campo");
      return;
    }
    for (const f of fields) {
      if (!f.name.trim()) {
        setError("Todos os campos precisam ter um nome");
        return;
      }
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    const templateFields: ScoringTemplateFieldCreate[] = fields.map((f, i) => ({
      name: f.name.trim(),
      field_type: f.field_type,
      min_value: null,
      max_value: null,
      display_order: i,
      is_required: f.is_required,
      is_tiebreaker: f.is_tiebreaker,
    }));

    try {
      await createScoringTemplate({
        game_id: createGame.id,
        name: templateName.trim(),
        description: templateDesc.trim() || undefined,
        match_mode: templateMatchMode,
        fields: templateFields,
      });
      setSuccess("Template criado com sucesso!");
      setTemplateName("");
      setTemplateDesc("");
      setTemplateMatchMode("individual");
      setFields([newEmptyField()]);
      setCreateGame(null);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Erro ao criar template");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Templates de Pontuação"
        subtitle="Crie e explore templates de pontuação para seus jogos"
        onBack={() => router.back()}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={tab === "browse" ? "primary" : "outline"}
          size="sm"
          onClick={() => setTab("browse")}
        >
          Explorar
        </Button>
        <Button
          variant={tab === "create" ? "primary" : "outline"}
          size="sm"
          onClick={() => {
            setTab("create");
            setError("");
            setSuccess("");
          }}
        >
          Criar Template
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}

      {/* =================== BROWSE TAB =================== */}
      {tab === "browse" && (
        <div className="space-y-4">
          <GameAutocomplete
            onSelect={(g) => {
              setBrowseGame(g);
              setSelectedTemplate(null);
            }}
            selectedGame={browseGame}
            onClear={() => {
              setBrowseGame(null);
              setSelectedTemplate(null);
            }}
          />

          {browseGame && loadingTemplates && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}

          {browseGame && !loadingTemplates && templates.length === 0 && (
            <EmptyState
              icon={FileText}
              label="Nenhum template"
              sublabel={`Nenhum template encontrado para ${browseGame.name_pt ?? browseGame.name}`}
            />
          )}

          {browseGame && !loadingTemplates && templates.length > 0 && !selectedTemplate && (
            <div className="space-y-3">
              {templates.map((t) => (
                <Card
                  key={t.id}
                  className="cursor-pointer hover:border-primary-600"
                  onClick={() => handleViewTemplate(t.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{t.name}</h3>
                      {t.description && (
                        <p className="text-sm text-muted mt-1">{t.description}</p>
                      )}
                      <p className="text-xs text-muted mt-1">
                        {t.match_mode === "team" ? "Times" : t.match_mode === "cooperative" ? "Cooperativo" : "Individual"} · {t.field_count} campo{t.field_count !== 1 ? "s" : ""} · por{" "}
                        {t.created_by_username ?? "Desconhecido"}
                      </p>
                    </div>
                    {user && t.created_by === user.id && (
                      <div className="flex items-center gap-1">
                        <button
                          className="text-primary-400 hover:text-primary-300 p-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            getScoringTemplate(t.id).then((loaded) => {
                              setSelectedTemplate(loaded);
                              setEditName(loaded.name);
                              setEditDesc(loaded.description || "");
                              setEditMatchMode(loaded.match_mode === "team" ? "team" : loaded.match_mode === "cooperative" ? "cooperative" : "individual");
                              setEditFields(
                                loaded.fields.map((f) => ({
                                  key: ++fieldKeyCounter,
                                  name: f.name,
                                  field_type: f.field_type as ScoringFieldType,
                                  is_required: f.is_required,
                                  is_tiebreaker: f.is_tiebreaker,
                                }))
                              );
                              setEditing(true);
                            });
                          }}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="text-red-400 hover:text-red-300 p-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(t.id);
                          }}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Template detail */}
          {selectedTemplate && (
            <div className="space-y-3">
              <button
                className="text-sm text-muted hover:text-foreground"
                onClick={() => { setSelectedTemplate(null); setEditing(false); }}
              >
                ← Voltar à lista
              </button>
              <Card>
                {editing ? (
                  /* Edit mode */
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Nome</label>
                      <input
                        className="w-full rounded-lg border border-border bg-neutral-800 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary-600 focus:outline-none"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Descrição</label>
                      <input
                        className="w-full rounded-lg border border-border bg-neutral-800 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary-600 focus:outline-none"
                        placeholder="Descrição (opcional)"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Modo de Jogo</label>
                      <div className="flex gap-2">
                        <button
                          className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                            editMatchMode === "individual"
                              ? "border-primary-600 bg-primary-600/10 text-primary-400"
                              : "border-border text-muted hover:text-foreground"
                          }`}
                          onClick={() => setEditMatchMode("individual")}
                        >
                          <User size={16} />
                          Individual
                        </button>
                        <button
                          className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                            editMatchMode === "team"
                              ? "border-primary-600 bg-primary-600/10 text-primary-400"
                              : "border-border text-muted hover:text-foreground"
                          }`}
                          onClick={() => setEditMatchMode("team")}
                        >
                          <Users size={16} />
                          Times
                        </button>
                        <button
                          className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                            editMatchMode === "cooperative"
                              ? "border-emerald-600 bg-emerald-600/10 text-emerald-400"
                              : "border-border text-muted hover:text-foreground"
                          }`}
                          onClick={() => setEditMatchMode("cooperative")}
                        >
                          <Handshake size={16} />
                          Cooperativo
                        </button>
                      </div>
                    </div>
                    {/* Fields editor */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-foreground">
                          Campos de Pontuação
                        </label>
                        <Button variant="ghost" size="sm" onClick={addEditField}>
                          <Plus size={16} /> Adicionar
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {editFields.map((f, idx) => (
                          <Card key={f.key} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <GripVertical size={16} className="text-muted" />
                              <span className="text-xs text-muted">Campo {idx + 1}</span>
                              <div className="flex-1" />
                              {editFields.length > 1 && (
                                <button
                                  className="text-red-400 hover:text-red-300 p-1"
                                  onClick={() => removeEditField(f.key)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                            <input
                              className="w-full rounded-lg border border-border bg-neutral-800 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary-600 focus:outline-none"
                              placeholder="Nome do campo (ex: Pontos de Vitória)"
                              value={f.name}
                              onChange={(e) => updateEditField(f.key, { name: e.target.value })}
                            />
                            <div className="flex gap-2">
                              {FIELD_TYPE_OPTIONS.map((opt) => {
                                const Icon = opt.icon;
                                return (
                                  <button
                                    key={opt.value}
                                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                                      f.field_type === opt.value
                                        ? "border-primary-600 bg-primary-600/10 text-primary-400"
                                        : "border-border text-muted hover:text-foreground"
                                    }`}
                                    onClick={() => updateEditField(f.key, { field_type: opt.value })}
                                  >
                                    <Icon size={14} />
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="accent-primary-600"
                                  checked={f.is_required}
                                  onChange={(e) =>
                                    updateEditField(f.key, { is_required: e.target.checked })
                                  }
                                />
                                <span className="text-xs text-muted">Obrigatório</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="accent-amber-500"
                                  checked={f.is_tiebreaker}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditFields((prev) =>
                                        prev.map((fd) => ({
                                          ...fd,
                                          is_tiebreaker: fd.key === f.key,
                                        }))
                                      );
                                    } else {
                                      updateEditField(f.key, { is_tiebreaker: false });
                                    }
                                  }}
                                />
                                <span className="text-xs text-amber-400">Critério de desempate</span>
                              </label>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" onClick={handleSaveEdit} disabled={saving || !editName.trim()}>
                        {saving ? <Spinner size="sm" /> : <><Check size={14} /> Salvar</>}
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelEditing}>
                        <X size={14} /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <>
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-lg font-bold text-foreground">
                        {selectedTemplate.name}
                      </h3>
                      {user && selectedTemplate.created_by === user.id && (
                        <button
                          className="text-primary-400 hover:text-primary-300 p-1"
                          onClick={startEditing}
                          title="Editar template"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                    </div>
                    {selectedTemplate.description && (
                      <p className="text-sm text-muted mb-3">
                        {selectedTemplate.description}
                      </p>
                    )}
                    <p className="text-xs text-muted mb-4">
                      Jogo: {selectedTemplate.game_name} · {selectedTemplate.match_mode === "team" ? "Times" : selectedTemplate.match_mode === "cooperative" ? "Cooperativo" : "Individual"} · Criado por{" "}
                      {selectedTemplate.created_by_username ?? "Desconhecido"}
                    </p>
                    <div className="space-y-2">
                      {selectedTemplate.fields.map((f) => {
                        const typeInfo = FIELD_TYPE_OPTIONS.find(
                          (o) => o.value === f.field_type
                        );
                        const Icon = typeInfo?.icon ?? Hash;
                        return (
                          <div
                            key={f.id}
                            className="flex items-center gap-3 rounded-lg bg-neutral-800/50 px-3 py-2"
                          >
                            <Icon size={16} className="text-muted" />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-foreground">
                                {f.name}
                              </span>
                              <span className="text-xs text-muted ml-2">
                                {typeInfo?.label}
                                {!f.is_required && " · Opcional"}
                                {f.is_tiebreaker && " · Desempate"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </Card>
              {loadingDetail && (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =================== CREATE TAB =================== */}
      {tab === "create" && (
        <div className="space-y-5">
          {/* Game picker */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Jogo
            </label>
            <GameAutocomplete
              onSelect={setCreateGame}
              selectedGame={createGame}
              onClear={() => setCreateGame(null)}
            />
          </div>

          {/* Match mode */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Modo de Jogo
            </label>
            <div className="flex gap-2">
              <button
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  templateMatchMode === "individual"
                    ? "border-primary-600 bg-primary-600/10 text-primary-400"
                    : "border-border text-muted hover:text-foreground"
                }`}
                onClick={() => setTemplateMatchMode("individual")}
              >
                <User size={16} />
                Individual
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  templateMatchMode === "team"
                    ? "border-primary-600 bg-primary-600/10 text-primary-400"
                    : "border-border text-muted hover:text-foreground"
                }`}
                onClick={() => setTemplateMatchMode("team")}
              >
                <Users size={16} />
                Times
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  templateMatchMode === "cooperative"
                    ? "border-emerald-600 bg-emerald-600/10 text-emerald-400"
                    : "border-border text-muted hover:text-foreground"
                }`}
                onClick={() => setTemplateMatchMode("cooperative")}
              >
                <Handshake size={16} />
                Cooperativo
              </button>
            </div>
          </div>

          {/* Template info */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Nome do Template
            </label>
            <input
              className="w-full rounded-xl border border-border bg-neutral-800 px-4 py-2.5 text-foreground placeholder:text-muted focus:border-primary-600 focus:outline-none"
              placeholder='ex: "Pontuação padrão Catan"'
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Descrição (opcional)
            </label>
            <input
              className="w-full rounded-xl border border-border bg-neutral-800 px-4 py-2.5 text-foreground placeholder:text-muted focus:border-primary-600 focus:outline-none"
              placeholder="Breve descrição do template"
              value={templateDesc}
              onChange={(e) => setTemplateDesc(e.target.value)}
            />
          </div>

          {/* Fields */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">
                Campos de Pontuação
              </label>
              <Button variant="ghost" size="sm" onClick={addField}>
                <Plus size={16} /> Adicionar
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((f, idx) => (
                <Card key={f.key} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-muted" />
                    <span className="text-xs text-muted">Campo {idx + 1}</span>
                    <div className="flex-1" />
                    {fields.length > 1 && (
                      <button
                        className="text-red-400 hover:text-red-300 p-1"
                        onClick={() => removeField(f.key)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Field name */}
                  <input
                    className="w-full rounded-lg border border-border bg-neutral-800 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary-600 focus:outline-none"
                    placeholder="Nome do campo (ex: Pontos de Vitória)"
                    value={f.name}
                    onChange={(e) => updateField(f.key, { name: e.target.value })}
                  />

                  {/* Field type */}
                  <div className="flex gap-2">
                    {FIELD_TYPE_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                            f.field_type === opt.value
                              ? "border-primary-600 bg-primary-600/10 text-primary-400"
                              : "border-border text-muted hover:text-foreground"
                          }`}
                          onClick={() => updateField(f.key, { field_type: opt.value })}
                        >
                          <Icon size={14} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Required toggle */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-primary-600"
                        checked={f.is_required}
                        onChange={(e) =>
                          updateField(f.key, { is_required: e.target.checked })
                        }
                      />
                      <span className="text-xs text-muted">Obrigatório</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-amber-500"
                        checked={f.is_tiebreaker}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFields((prev) =>
                              prev.map((fd) => ({
                                ...fd,
                                is_tiebreaker: fd.key === f.key,
                              }))
                            );
                          } else {
                            updateField(f.key, { is_tiebreaker: false });
                          }
                        }}
                      />
                      <span className="text-xs text-amber-400">Critério de desempate</span>
                    </label>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleCreate}
            disabled={submitting || !createGame || !templateName.trim()}
          >
            {submitting ? <Spinner size="sm" /> : "Criar Template"}
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
