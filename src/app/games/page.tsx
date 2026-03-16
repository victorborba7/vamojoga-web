"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ExploreSheet } from "@/components/games/explore-sheet";
import {
  BookOpen,
  ClipboardList,
  Heart,
  Search,
  ChevronRight,
  Gamepad2,
  Layers,
  X,
} from "lucide-react";
import { useAuthGuard } from "@/lib/hooks";
import { gamesSubmenu } from "@/lib/navigation";
import {
  getMyLibrary,
  getMyWishlist,
  searchGames,
} from "@/lib/api";
import type { GameResponse, LibraryEntryResponse, WishlistEntryResponse } from "@/types";

export default function GamesHubPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [libraryItems, setLibraryItems] = useState<LibraryEntryResponse[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExplore, setShowExplore] = useState(false);

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    Promise.all([getMyLibrary(), getMyWishlist()])
      .then(([lib, wish]) => {
        setLibraryItems(lib);
        setWishlistItems(wish);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const games = await searchGames(query, 10, true);
        setResults(games);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [query]);

  if (authLoading || !user) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Jogos" subtitle="Sua coleção e busca de jogos" />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {gamesSubmenu.map((item) => {
          const Icon = item.icon;
          const isExplore = item.label === "Explorar jogos";
          if (isExplore) {
            return (
              <button
                key="explore"
                onClick={() => setShowExplore(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-foreground hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-foreground hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <ExploreSheet open={showExplore} onClose={() => setShowExplore(false)} />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          placeholder="Buscar jogos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted focus:border-primary-500 focus:outline-none"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search results */}
      {query.length >= 2 && (
        <div className="mb-6">
          {searching ? (
            <div className="flex justify-center py-8">
              <Spinner size="sm" />
            </div>
          ) : results.length === 0 ? (
            <Card className="flex flex-col items-center py-6 text-center">
              <Search className="h-6 w-6 text-muted mb-2" />
              <p className="text-sm text-muted">Nenhum jogo encontrado</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {results.map((game) => (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <Card className="flex items-center gap-3 hover:bg-card-hover transition-colors cursor-pointer">
                    {game.image_url ? (
                      <Image
                        src={game.image_url}
                        alt={game.name_pt ?? game.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Gamepad2 className="h-5 w-5 text-muted" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {game.name_pt ?? game.name}
                      </p>
                      {game.year && (
                        <p className="text-xs text-muted">{game.year}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted shrink-0" />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick links (hidden when searching) */}
      {query.length < 2 && (
        <>
          {/* Library & Wishlist cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Link href="/library">
              <Card className="flex flex-col items-center gap-2 py-5 hover:bg-card-hover transition-colors cursor-pointer">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/15">
                  <BookOpen className="h-5 w-5 text-primary-400" />
                </div>
                <p className="text-sm font-semibold text-foreground">Biblioteca</p>
                <p className="text-xs text-muted">
                  {loading ? "…" : `${libraryItems.length} ${libraryItems.length === 1 ? "jogo" : "jogos"}`}
                </p>
              </Card>
            </Link>
            <Link href="/library?tab=wishlist">
              <Card className="flex flex-col items-center gap-2 py-5 hover:bg-card-hover transition-colors cursor-pointer">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500/15">
                  <Heart className="h-5 w-5 text-accent-400" />
                </div>
                <p className="text-sm font-semibold text-foreground">Wishlist</p>
                <p className="text-xs text-muted">
                  {loading ? "…" : `${wishlistItems.length} ${wishlistItems.length === 1 ? "jogo" : "jogos"}`}
                </p>
              </Card>
            </Link>
          </div>

          {/* Scoring Templates */}
          <Link href="/scoring-templates">
            <Card className="flex items-center gap-3 mb-3 hover:bg-card-hover transition-colors cursor-pointer">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 shrink-0">
                <ClipboardList className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Templates de Pontuação</p>
                <p className="text-xs text-muted">Crie e use templates para registrar partidas</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted shrink-0" />
            </Card>
          </Link>

          {/* Collections */}
          <Link href="/collections">
            <Card className="flex items-center gap-3 mb-6 hover:bg-card-hover transition-colors cursor-pointer">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 shrink-0">
                <Layers className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Coleções Compartilhadas</p>
                <p className="text-xs text-muted">Gerencie coleções com amigos</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted shrink-0" />
            </Card>
          </Link>

          {/* Recent library games preview */}
          {!loading && libraryItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Últimos adicionados
                </p>
                <Link
                  href="/library"
                  className="flex items-center gap-0.5 text-xs text-primary-400 hover:underline"
                >
                  Ver todos <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {libraryItems.slice(0, 4).map((entry) => (
                  <Link key={entry.game.id} href={`/games/${entry.game.id}`}>
                    <div className="flex flex-col items-center gap-1.5 group">
                      {entry.game.image_url ? (
                        <Image
                          src={entry.game.image_url}
                          alt={entry.game.name_pt ?? entry.game.name}
                          width={80}
                          height={80}
                          className="h-20 w-20 rounded-xl object-cover group-hover:ring-2 ring-primary-500/40 transition-all"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-white/10 flex items-center justify-center group-hover:ring-2 ring-primary-500/40 transition-all">
                          <Gamepad2 className="h-6 w-6 text-muted" />
                        </div>
                      )}
                      <p className="text-[10px] text-muted text-center line-clamp-2 leading-tight">
                        {entry.game.name_pt ?? entry.game.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
