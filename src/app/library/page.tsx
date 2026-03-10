"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Heart,
  Plus,
  Trash2,
  Search,
  X,
  Globe,
  Lock,
  Users,
  Gamepad2,
  LayoutList,
  LayoutGrid,
  Filter,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  getMyLibrary,
  addToLibrary,
  removeFromLibrary,
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
  updateWishlistVisibility,
  searchGames,
  getUserMatches,
  ApiError,
} from "@/lib/api";
import type { LibraryEntryResponse, WishlistEntryResponse, GameResponse } from "@/types";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "@/lib/hooks";

type Tab = "library" | "wishlist";
type ViewMode = "list" | "grid";
type SortOrder = "recent" | "alpha" | "most_played";

const PAGE_SIZE = 25;

function getStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "list";
  return (localStorage.getItem("vamojoga_view_mode") as ViewMode) ?? "list";
}
function setStoredViewMode(mode: ViewMode) {
  localStorage.setItem("vamojoga_view_mode", mode);
}

// ---------- GameSearchInput ----------

interface GameSearchInputProps {
  onAdd: (game: GameResponse) => Promise<void>;
  excludeIds: Set<string>;
  placeholder: string;
}

function GameSearchInput({ onAdd, excludeIds, placeholder }: GameSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameResponse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [excludeExpansions, setExcludeExpansions] = useState(false);
  const excludeExpansionsRef = useRef(excludeExpansions);
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 1) { setResults([]); setIsOpen(false); return; }
    setLoading(true);
    try {
      const games = await searchGames(q.trim(), 20, excludeExpansionsRef.current);
      setResults(games.filter((g) => !excludeIds.has(g.id)));
      setIsOpen(true);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [excludeIds]);

  useEffect(() => {
    excludeExpansionsRef.current = excludeExpansions;
    if (query.trim().length >= 1) doSearch(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excludeExpansions]);

  const triggerSearch = useDebouncedCallback(doSearch, 400);

  function handleChange(v: string) {
    setQuery(v);
    triggerSearch(v);
  }

  async function handlePick(game: GameResponse) {
    setAdding(game.id);
    try {
      await onAdd(game);
      setQuery("");
      setResults([]);
      setIsOpen(false);
    } finally { setAdding(null); }
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-xl bg-card border border-white/10 px-3 py-2">
        <Search className="h-4 w-4 text-muted shrink-0" />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
        />
        {loading && (
          <div className="h-4 w-4 rounded-full border-2 border-primary-400 border-t-transparent animate-spin shrink-0" />
        )}
        {query && !loading && (
          <button onClick={() => { setQuery(""); setResults([]); setIsOpen(false); }}>
            <X className="h-4 w-4 text-muted" />
          </button>
        )}
        <button
          onClick={() => setExcludeExpansions((v) => !v)}
          title={excludeExpansions ? "Mostrando apenas jogos base" : "Mostrando expansões também"}
          className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${
            excludeExpansions
              ? "border-primary-400/60 text-primary-400 bg-primary-500/10"
              : "border-white/10 text-muted hover:text-foreground"
          }`}
        >
          <Filter className="h-2.5 w-2.5" />
          sem exp.
        </button>
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 rounded-xl bg-card border border-white/10 shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          {results.map((game) => (
            <li key={game.id}>
              <button
                onClick={() => handlePick(game)}
                disabled={adding === game.id}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                {game.image_url ? (
                  <img src={game.image_url} alt="" className="h-8 w-8 rounded-md object-cover shrink-0" />
                ) : (
                  <div className="h-8 w-8 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                    <Gamepad2 className="h-4 w-4 text-muted" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{game.name}</p>
                  {game.year && <p className="text-xs text-muted">{game.year}</p>}
                </div>
                {adding === game.id ? (
                  <div className="h-4 w-4 rounded-full border-2 border-primary-400 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <Plus className="h-4 w-4 text-primary-400 shrink-0" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && results.length === 0 && !loading && query.trim().length >= 1 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl bg-card border border-white/10 shadow-xl px-4 py-3 text-sm text-muted">
          Nenhum jogo encontrado
        </div>
      )}
    </div>
  );
}

// ---------- LibraryTab ----------

interface PlayedGame {
  game_id: string;
  game_name: string;
  image_url: string | null;
  match_count: number;
}

function LibraryTab() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LibraryEntryResponse[]>([]);
  const [playedNotOwned, setPlayedNotOwned] = useState<PlayedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [addingHistory, setAddingHistory] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filterQuery, setFilterQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [entries.length, filterQuery, sortOrder]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisibleCount((v) => v + PAGE_SIZE); },
      { threshold: 0 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [visibleCount, entries.length]);

  function toggleView(mode: ViewMode) {
    setViewMode(mode);
    setStoredViewMode(mode);
  }

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [lib, matches] = await Promise.all([
        getMyLibrary(),
        getUserMatches(user.id, 0, 200),
      ]);
      setEntries(lib);

      // Build set of owned game IDs
      const ownedSet = new Set(lib.map((e) => e.game.id));

      // Aggregate matches by game, exclude owned
      const gameMap = new Map<string, PlayedGame>();
      for (const m of matches) {
        if (ownedSet.has(m.game_id)) continue;
        if (!m.game_name) continue;
        const existing = gameMap.get(m.game_id);
        if (existing) {
          existing.match_count += 1;
        } else {
          gameMap.set(m.game_id, {
            game_id: m.game_id,
            game_name: m.game_name ?? "",
            image_url: m.game_image_url ?? null,
            match_count: 1,
          });
        }
      }
      setPlayedNotOwned(
        [...gameMap.values()].sort((a, b) => b.match_count - a.match_count)
      );
    } catch { setError("Erro ao carregar coleção"); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const ownedIds = new Set(entries.map((e) => e.game.id));

  async function handleAdd(game: GameResponse) {
    try {
      const entry = await addToLibrary(game.id);
      setEntries((prev) => [entry, ...prev]);
      setPlayedNotOwned((prev) => prev.filter((g) => g.game_id !== game.id));
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  async function handleAddFromHistory(played: PlayedGame) {
    setAddingHistory(played.game_id);
    try {
      const entry = await addToLibrary(played.game_id);
      setEntries((prev) => [entry, ...prev]);
      setPlayedNotOwned((prev) => prev.filter((g) => g.game_id !== played.game_id));
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally { setAddingHistory(null); }
  }

  async function handleRemove(gameId: string) {
    setRemoving(gameId);
    try {
      await removeFromLibrary(gameId);
      setEntries((prev) => prev.filter((e) => e.game.id !== gameId));
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally { setRemoving(null); }
  }

  const sortedEntries = [...entries].sort((a, b) => {
    if (sortOrder === "alpha") return a.game.name.localeCompare(b.game.name);
    if (sortOrder === "most_played") return b.match_count - a.match_count;
    return 0;
  });
  const displayEntries = filterQuery.trim()
    ? sortedEntries.filter((e) => e.game.name.toLowerCase().includes(filterQuery.toLowerCase()))
    : sortedEntries;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GameSearchInput
        onAdd={handleAdd}
        excludeIds={ownedIds}
        placeholder="Buscar jogo para adicionar…"
      />

      {error && (
        <p className="text-xs text-red-400 px-1">{error}</p>
      )}

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <BookOpen className="h-12 w-12 text-muted" />
          <p className="text-sm text-muted">Sua coleção está vazia</p>
          <p className="text-xs text-muted">Busque jogos acima para adicionar</p>
        </div>
      ) : (
        <>
          {/* Filtro local */}
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted shrink-0" />
            <input
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filtrar na coleção..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
            />
            {filterQuery && (
              <button onClick={() => setFilterQuery("")}>
                <X className="h-3.5 w-3.5 text-muted" />
              </button>
            )}
          </div>

          {/* Ordenação + view toggle */}
          <div className="flex items-center justify-between px-1">
            <div className="flex gap-1">
              {(["recent", "alpha", "most_played"] as SortOrder[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortOrder(s)}
                  className={`px-2 py-0.5 rounded-md text-xs transition-colors ${
                    sortOrder === s ? "bg-white/10 text-foreground font-medium" : "text-muted hover:text-foreground"
                  }`}
                >
                  {s === "recent" ? "Recente" : s === "alpha" ? "A-Z" : "+ jogado"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted">
                {filterQuery ? `${displayEntries.length} de ${entries.length}` : `${entries.length} ${entries.length === 1 ? "jogo" : "jogos"}`}
              </p>
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
          </div>

          {displayEntries.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">Nenhum jogo encontrado para &ldquo;{filterQuery}&rdquo;.</p>
          ) : viewMode === "list" ? (
            <div className="space-y-2">
              {displayEntries.slice(0, visibleCount).map((entry) => (
                <Card key={entry.id} className="flex items-center gap-3">
                  <Link href={`/games/${entry.game.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    {entry.game.image_url ? (
                      <img src={entry.game.image_url} alt={entry.game.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Gamepad2 className="h-6 w-6 text-muted" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{entry.game.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {entry.game.year && <span className="text-xs text-muted">{entry.game.year}</span>}
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                          {entry.match_count === 0 ? "Nunca jogado" : `${entry.match_count} ${entry.match_count === 1 ? "partida" : "partidas"}`}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                  <button onClick={() => handleRemove(entry.game.id)} disabled={removing === entry.game.id} className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {displayEntries.slice(0, visibleCount).map((entry) => (
                <div key={entry.id} className="flex flex-col">
                  <Link href={`/games/${entry.game.id}`} className="block">
                    {entry.game.image_url ? (
                      <img src={entry.game.image_url} alt={entry.game.name} className="w-full aspect-square rounded-xl object-cover" />
                    ) : (
                      <div className="w-full aspect-square rounded-xl bg-white/10 flex items-center justify-center">
                        <Gamepad2 className="h-8 w-8 text-muted" />
                      </div>
                    )}
                    <p className="text-xs font-semibold text-foreground truncate mt-2">{entry.game.name}</p>
                    {entry.game.year && <p className="text-[10px] text-muted">{entry.game.year}</p>}
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 mt-1 w-fit">
                      {entry.match_count === 0 ? "Nunca jogado" : `${entry.match_count}x jogado`}
                    </Badge>
                  </Link>
                  <button onClick={() => handleRemove(entry.game.id)} disabled={removing === entry.game.id} className="mt-2 flex items-center justify-center gap-1 w-full py-1.5 rounded-lg text-xs text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                    <Trash2 className="h-3 w-3" />
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}

          {visibleCount < displayEntries.length && (
            <div ref={sentinelRef} className="flex justify-center py-3">
              <div className="h-5 w-5 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
            </div>
          )}
        </>
      )}

      {/* Played but not owned — suggestion shelf */}
      {playedNotOwned.length > 0 && (
        <div className="rounded-2xl border border-primary-500/20 bg-primary-500/5 p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Adicionar à coleção?
            </p>
            <p className="text-xs text-muted mt-0.5">
              Você registrou partidas desses jogos mas eles não estão na sua biblioteca.
            </p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scroll-smooth">
            {playedNotOwned.map((played) => (
              <div
                key={played.game_id}
                className="flex-none w-32 snap-start flex flex-col items-center gap-2"
              >
                <Link href={`/games/${played.game_id}`} className="flex flex-col items-center gap-2 w-full">
                  {played.image_url ? (
                    <img src={played.image_url} alt={played.game_name} className="w-full aspect-square rounded-xl object-cover" />
                  ) : (
                    <div className="w-full aspect-square rounded-xl bg-white/10 flex items-center justify-center">
                      <Gamepad2 className="h-8 w-8 text-muted" />
                    </div>
                  )}
                  <p className="text-xs font-medium text-foreground text-center line-clamp-2 leading-tight w-full">
                    {played.game_name}
                  </p>
                  <p className="text-[10px] text-muted">
                    {played.match_count}× jogado
                  </p>
                </Link>
                <button
                  onClick={() => handleAddFromHistory(played)}
                  disabled={addingHistory === played.game_id}
                  className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary-500/20 text-primary-400 text-xs font-medium hover:bg-primary-500/30 transition-colors disabled:opacity-40"
                >
                  {addingHistory === played.game_id ? (
                    <div className="h-3 w-3 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      Adicionar
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- WishlistTab ----------

function WishlistTab() {
  const [entries, setEntries] = useState<WishlistEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [entries.length]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisibleCount((v) => v + PAGE_SIZE); },
      { threshold: 0 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [visibleCount, entries.length]);

  function toggleView(mode: ViewMode) {
    setViewMode(mode);
    setStoredViewMode(mode);
  }

  const load = useCallback(async () => {
    try {
      setEntries(await getMyWishlist());
    } catch { setError("Erro ao carregar wishlist"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const wishedIds = new Set(entries.map((e) => e.game.id));

  async function handleAdd(game: GameResponse) {
    try {
      const entry = await addToWishlist(game.id, true);
      setEntries((prev) => [entry, ...prev]);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  async function handleRemove(gameId: string) {
    setRemoving(gameId);
    try {
      await removeFromWishlist(gameId);
      setEntries((prev) => prev.filter((e) => e.game.id !== gameId));
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally { setRemoving(null); }
  }

  async function handleToggleVisibility(gameId: string, current: boolean) {
    setToggling(gameId);
    try {
      const updated = await updateWishlistVisibility(gameId, !current);
      setEntries((prev) => prev.map((e) => e.game.id === gameId ? updated : e));
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally { setToggling(null); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GameSearchInput
        onAdd={handleAdd}
        excludeIds={wishedIds}
        placeholder="Buscar jogo para adicionar na wishlist…"
      />

      {error && (
        <p className="text-xs text-red-400 px-1">{error}</p>
      )}

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Heart className="h-12 w-12 text-muted" />
          <p className="text-sm text-muted">Sua wishlist está vazia</p>
          <p className="text-xs text-muted">Busque jogos acima para adicionar</p>
        </div>
      ) : (
        <>
          {/* Count + view toggle */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted">{entries.length} {entries.length === 1 ? "jogo" : "jogos"}</p>
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
              {entries.slice(0, visibleCount).map((entry) => (
                <Card key={entry.id} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Link href={`/games/${entry.game.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      {entry.game.image_url ? (
                        <img src={entry.game.image_url} alt={entry.game.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                          <Gamepad2 className="h-6 w-6 text-muted" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{entry.game.name}</p>
                        {entry.game.year && <span className="text-xs text-muted">{entry.game.year}</span>}
                      </div>
                    </Link>
                    <button
                      onClick={() => handleToggleVisibility(entry.game.id, entry.is_public)}
                      disabled={toggling === entry.game.id}
                      title={entry.is_public ? "Pública — clique para tornar privada" : "Privada — clique para tornar pública"}
                      className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-white/10 transition-colors disabled:opacity-40"
                    >
                      {toggling === entry.game.id ? (
                        <div className="h-4 w-4 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
                      ) : entry.is_public ? (
                        <Globe className="h-4 w-4 text-green-400" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted" />
                      )}
                    </button>
                    <button onClick={() => handleRemove(entry.game.id)} disabled={removing === entry.game.id} className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {entry.friends_who_own.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
                      <Users className="h-3.5 w-3.5 text-primary-400 shrink-0" />
                      <p className="text-xs text-muted">
                        <span className="text-primary-400 font-medium">{entry.friends_who_own.join(", ")}</span>{" "}
                        {entry.friends_who_own.length === 1 ? "possui" : "possuem"} esse jogo
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {entries.slice(0, visibleCount).map((entry) => (
                <div key={entry.id} className="flex flex-col">
                  <Link href={`/games/${entry.game.id}`} className="block">
                    {entry.game.image_url ? (
                      <img src={entry.game.image_url} alt={entry.game.name} className="w-full aspect-square rounded-xl object-cover" />
                    ) : (
                      <div className="w-full aspect-square rounded-xl bg-white/10 flex items-center justify-center">
                        <Gamepad2 className="h-8 w-8 text-muted" />
                      </div>
                    )}
                    <p className="text-xs font-semibold text-foreground truncate mt-2">{entry.game.name}</p>
                    {entry.game.year && <p className="text-[10px] text-muted">{entry.game.year}</p>}
                    {entry.friends_who_own.length > 0 && (
                      <p className="text-[10px] text-primary-400 truncate mt-0.5">
                        <Users className="inline h-2.5 w-2.5 mr-0.5" />
                        {entry.friends_who_own[0]}{entry.friends_who_own.length > 1 ? ` +${entry.friends_who_own.length - 1}` : ""}
                      </p>
                    )}
                  </Link>
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => handleToggleVisibility(entry.game.id, entry.is_public)}
                      disabled={toggling === entry.game.id}
                      title={entry.is_public ? "Pública" : "Privada"}
                      className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs hover:bg-white/10 transition-colors disabled:opacity-40"
                    >
                      {entry.is_public ? <Globe className="h-3.5 w-3.5 text-green-400" /> : <Lock className="h-3.5 w-3.5 text-muted" />}
                    </button>
                    <button onClick={() => handleRemove(entry.game.id)} disabled={removing === entry.game.id} className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {visibleCount < entries.length && (
            <div ref={sentinelRef} className="flex justify-center py-3">
              <div className="h-5 w-5 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------- Page ----------

export default function CollectionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("library");

  // Read ?tab=wishlist from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "wishlist") setTab("wishlist");
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Coleção" />

      {/* Tab switcher */}
      <div className="flex rounded-xl bg-card border border-white/10 p-1 mb-4">
        <button
          onClick={() => setTab("library")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all",
            tab === "library"
              ? "bg-primary-500/20 text-primary-400"
              : "text-muted hover:text-foreground"
          )}
        >
          <BookOpen className="h-4 w-4" />
          Biblioteca
        </button>
        <button
          onClick={() => setTab("wishlist")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all",
            tab === "wishlist"
              ? "bg-accent-500/20 text-accent-400"
              : "text-muted hover:text-foreground"
          )}
        >
          <Heart className="h-4 w-4" />
          Wishlist
        </button>
      </div>

      {/* Collections compartilhados */}
      <Link
        href="/collection"
        className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3 mb-4 active:opacity-70"
      >
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary-400" />
          <div>
            <p className="text-sm font-medium text-foreground">Collections compartilhados</p>
            <p className="text-xs text-muted">Jogos em comum com outras pessoas</p>
          </div>
        </div>
        <span className="text-muted text-lg">›</span>
      </Link>

      {tab === "library" ? <LibraryTab /> : <WishlistTab />}
    </PageContainer>
  );
}
