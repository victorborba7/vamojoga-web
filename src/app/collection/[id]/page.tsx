"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getCollection, updateCollection, deleteCollection,
  inviteMember, removeMember,
  addGameToCollection, removeGameFromCollection,
  getAvailableGames,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { CollectionDetailResponse, CollectionJogoResponse, MembroResponse, UserResponse } from "@/types";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { PlayerAutocomplete } from "@/components/match/player-autocomplete";
import { useInfiniteScroll } from "@/lib/hooks";
import { LayoutList, LayoutGrid, Gamepad2 } from "lucide-react";

type Tab = "games" | "members";
type ViewMode = "list" | "grid";

const PAGE_SIZE = 25;

function getStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "list";
  return (localStorage.getItem("vamojoga_view_mode") as ViewMode) ?? "list";
}

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [collection, setCollection] = useState<CollectionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("games");

  // adicionar jogo
  const [addingGame, setAddingGame] = useState(false);
  const [availableGames, setAvailableGames] = useState<CollectionJogoResponse[]>([]);
  const [gameSearch, setGameSearch] = useState("");
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // view mode + pagination for games list
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { visibleCount } = useInfiniteScroll(sentinelRef, collection?.games.length ?? 0, PAGE_SIZE);

  function toggleView(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem("vamojoga_view_mode", mode);
  }

  // convidar membro
  const [inviting, setInviting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  // editar nome
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([getCollection(id), getAvailableGames(id)])
      .then(([data, games]) => {
        setCollection(data);
        setAvailableGames(games);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const isOwner = collection?.owner_id === user?.id;

  async function handleAddGame() {
    if (!selectedGameId || !collection) return;
    setAddingGame(true);
    try {
      const jogo = await addGameToCollection(collection.id, selectedGameId);
      setCollection((a) => a ? { ...a, games: [...a.games, jogo], game_count: a.game_count + 1 } : a);
      setAvailableGames((prev) => prev.filter((g) => g.game_id !== selectedGameId));
      setSelectedGameId(null);
      setGameSearch("");
    } finally {
      setAddingGame(false);
    }
  }

  async function handleRemoveGame(gameId: string) {
    if (!collection) return;
    const jogo = collection.games.find((g) => g.game_id === gameId);
    if (!confirm(`Remover "${jogo?.name ?? "jogo"}" do collection?`)) return;
    await removeGameFromCollection(collection.id, gameId);
    setCollection((a) => a ? { ...a, games: a.games.filter((g) => g.game_id !== gameId), game_count: a.game_count - 1 } : a);
  }

  async function handleInvite() {
    if (!selectedUser || !collection) return;
    setInviting(true);
    try {
      const membro = await inviteMember(collection.id, selectedUser.id);
      setCollection((a) => a ? { ...a, members: [...a.members, membro], member_count: a.member_count + 1 } : a);
      setSelectedUser(null);
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!collection) return;
    const membro = collection.members.find((m) => m.user_id === userId);
    if (!confirm(`Remover "${membro?.username ?? "membro"}" do collection?`)) return;
    await removeMember(collection.id, userId);
    setCollection((a) => a ? { ...a, members: a.members.filter((m) => m.user_id !== userId), member_count: a.member_count - 1 } : a);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!collection) return;
    const updated = await updateCollection(collection.id, { name: editName, description: editDesc || undefined });
    setCollection((a) => a ? { ...a, name: updated.name, description: updated.description } : a);
    setEditing(false);
  }

  async function handleDelete() {
    if (!collection || !confirm(`Excluir "${collection.name}"? Esta ação não pode ser desfeita.`)) return;
    await deleteCollection(collection.id);
    router.push("/collection");
  }

  if (loading) return <PageContainer><div className="p-4 text-muted text-sm">Carregando...</div></PageContainer>;
  if (!collection) return <PageContainer><div className="p-4 text-muted text-sm">Collection não encontrado.</div></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title={collection.name} backHref="/collection" />

      <div className="p-4 space-y-4">
        {/* Header card */}
        <Card className="p-4 space-y-1">
          {editing ? (
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <textarea
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground resize-none focus:outline-none"
                rows={2}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Descrição (opcional)"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1">Salvar</Button>
                <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </form>
          ) : (
            <>
              {collection.description && <p className="text-sm text-muted">{collection.description}</p>}
              <p className="text-xs text-muted">
                {collection.game_count} {collection.game_count === 1 ? "jogo" : "jogos"} · {collection.member_count} {collection.member_count === 1 ? "membro" : "membros"}
              </p>
              {isOwner && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditName(collection.name); setEditDesc(collection.description ?? ""); setEditing(true); }}>
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-400 border-red-400/30" onClick={handleDelete}>
                    Excluir
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          {(["games", "members"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                tab === t ? "bg-primary text-white" : "bg-white/5 text-muted"
              }`}
            >
              {t === "games" ? `Jogos (${collection.game_count})` : `Membros (${collection.member_count})`}
            </button>
          ))}
        </div>

        {/* Jogos tab */}
        {tab === "games" && (
          <div className="space-y-3">
            {/* Adicionar jogo */}
            <Card className="p-3 space-y-2">
              <p className="text-xs text-muted font-medium uppercase tracking-wide">Adicionar jogo</p>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none"
                placeholder="Filtrar jogos dos membros..."
                value={gameSearch}
                onChange={(e) => { setGameSearch(e.target.value); setSelectedGameId(null); }}
              />
              {gameSearch.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10">
                  {availableGames
                    .filter((g) => g.name.toLowerCase().includes(gameSearch.toLowerCase()))
                    .slice(0, 8)
                    .map((g) => (
                      <button
                        key={g.game_id}
                        type="button"
                        onClick={() => { setSelectedGameId(g.game_id); setGameSearch(g.name); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${
                          selectedGameId === g.game_id ? "bg-white/10 text-primary-400" : "text-foreground"
                        }`}
                      >
                        {g.name}{g.year ? ` (${g.year})` : ""}
                        <span className="text-xs text-muted ml-2">— {g.added_by_username}</span>
                      </button>
                    ))}
                  {availableGames.filter((g) => g.name.toLowerCase().includes(gameSearch.toLowerCase())).length === 0 && (
                    <p className="px-3 py-2 text-sm text-muted">Nenhum jogo encontrado.</p>
                  )}
                </div>
              )}
              <Button
                size="sm"
                className="w-full"
                disabled={!selectedGameId || addingGame}
                onClick={handleAddGame}
              >
                {addingGame ? "Adicionando..." : "Adicionar"}
              </Button>
            </Card>

            {collection.games.length === 0 ? (
              <p className="text-center text-muted text-sm py-6">Nenhum jogo ainda.</p>
            ) : (
              <>
                {/* Count + view toggle */}
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs text-muted">{collection.games.length} {collection.games.length === 1 ? "jogo" : "jogos"}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleView("list")}
                      className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-white/10 text-foreground" : "text-muted hover:text-foreground"}`}
                    >
                      <LayoutList className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleView("grid")}
                      className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white/10 text-foreground" : "text-muted hover:text-foreground"}`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {viewMode === "list" ? (
                  <div className="space-y-2">
                    {collection.games.slice(0, visibleCount).map((jogo) => (
                      <GameRow
                        key={jogo.game_id}
                        jogo={jogo}
                        canRemove={jogo.added_by === user?.id || isOwner}
                        onRemove={() => handleRemoveGame(jogo.game_id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {collection.games.slice(0, visibleCount).map((jogo) => (
                      <GameGridCard
                        key={jogo.game_id}
                        jogo={jogo}
                        canRemove={jogo.added_by === user?.id || isOwner}
                        onRemove={() => handleRemoveGame(jogo.game_id)}
                      />
                    ))}
                  </div>
                )}

                {visibleCount < collection.games.length && (
                  <div ref={sentinelRef} className="flex justify-center py-3">
                    <Spinner size="md" />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Membros tab */}
        {tab === "members" && (
          <div className="space-y-3">
            {/* Convidar (só dono) */}
            {isOwner && (
              <Card className="p-3 space-y-2">
                <p className="text-xs text-muted font-medium uppercase tracking-wide">Convidar membro</p>
                <PlayerAutocomplete
                  onSelect={setSelectedUser}
                  excludeIds={collection.members.map((m) => m.user_id)}
                  placeholder="Buscar usuário..."
                />
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!selectedUser || inviting}
                  onClick={handleInvite}
                >
                  {inviting ? "Convidando..." : "Convidar"}
                </Button>
              </Card>
            )}

            {collection.members.map((m) => (
              <MemberRow
                key={m.user_id}
                membro={m}
                isMe={m.user_id === user?.id}
                isOwner={isOwner}
                onRemove={() => handleRemoveMember(m.user_id)}
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function GameRow({
  jogo,
  canRemove,
  onRemove,
}: {
  jogo: CollectionJogoResponse;
  canRemove: boolean;
  onRemove: () => void;
}) {
  return (
    <Card className="p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{jogo.name}</p>
        <p className="text-xs text-muted">
          {jogo.year && `${jogo.year} · `}
          {jogo.bayes_rating && `★ ${jogo.bayes_rating.toFixed(1)} · `}
          adicionado por {jogo.added_by_username ?? "?"}
        </p>
      </div>
      {canRemove && (
        <button onClick={onRemove} className="text-muted hover:text-red-400 text-lg px-1">
          ×
        </button>
      )}
    </Card>
  );
}

function GameGridCard({
  jogo,
  canRemove,
  onRemove,
}: {
  jogo: CollectionJogoResponse;
  canRemove: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col">
      {jogo.image_url ? (
        <img src={jogo.image_url} alt={jogo.name} className="w-full aspect-square rounded-xl object-cover" />
      ) : (
        <div className="w-full aspect-square rounded-xl bg-white/10 flex items-center justify-center">
          <Gamepad2 className="h-8 w-8 text-muted" />
        </div>
      )}
      <p className="text-xs font-semibold text-foreground truncate mt-2">{jogo.name}</p>
      <p className="text-[10px] text-muted">
        {jogo.year ? `${jogo.year} · ` : ""}
        {jogo.bayes_rating ? `★ ${jogo.bayes_rating.toFixed(1)}` : ""}
      </p>
      <p className="text-[10px] text-muted truncate">{jogo.added_by_username ?? "?"}</p>
      {canRemove && (
        <button
          onClick={onRemove}
          className="mt-2 flex items-center justify-center w-full py-1.5 rounded-lg text-xs text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Remover
        </button>
      )}
    </div>
  );
}

function MemberRow({
  membro,
  isMe,
  isOwner,
  onRemove,
}: {
  membro: MembroResponse;
  isMe: boolean;
  isOwner: boolean;
  onRemove: () => void;
}) {
  const canRemove = (isOwner && membro.role !== "owner") || (isMe && membro.role !== "owner");
  return (
    <Card className="p-3 flex items-center gap-3">
      <Avatar name={membro.full_name ?? membro.username} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {membro.full_name ?? membro.username}
          {isMe && <span className="text-xs text-muted ml-1">(você)</span>}
        </p>
        <p className="text-xs text-muted capitalize">{membro.role === "owner" ? "dono" : "membro"}</p>
      </div>
      {canRemove && (
        <button onClick={onRemove} className="text-xs text-muted hover:text-red-400">
          {isMe ? "Sair" : "Remover"}
        </button>
      )}
    </Card>
  );
}
