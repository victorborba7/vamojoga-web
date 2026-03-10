"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import {
  BookOpen,
  Heart,
  Trophy,
  Sword,
  Percent,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Package,
  Star,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  getUser,
  getUserStats,
  getUserLibrary,
  getUserWishlist,
  getMyLibrary,
  getMyWishlist,
  addToLibrary,
  addToWishlist,
  removeFromWishlist,
} from "@/lib/api";
import type {
  UserResponse,
  UserStats,
  LibraryEntryResponse,
  WishlistEntryResponse,
} from "@/types";

type Tab = "library" | "wishlist";

export default function FriendDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: friendId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [friend, setFriend] = useState<UserResponse | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [library, setLibrary] = useState<LibraryEntryResponse[]>([]);
  const [wishlist, setWishlist] = useState<WishlistEntryResponse[]>([]);
  const [myLibraryIds, setMyLibraryIds] = useState<Set<string>>(new Set());
  const [myWishlistIds, setMyWishlistIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("library");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    Promise.all([
      getUser(friendId),
      getUserStats(friendId),
      getUserLibrary(friendId),
      getUserWishlist(friendId),
      getMyLibrary(),
      getMyWishlist(),
    ])
      .then(([f, s, lib, wish, myLib, myWish]) => {
        setFriend(f);
        setStats(s);
        setLibrary(lib);
        setWishlist(wish);
        setMyLibraryIds(new Set(myLib.map((e) => e.game.id)));
        setMyWishlistIds(new Set(myWish.map((e) => e.game.id)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [friendId, user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (!friend) {
    return (
      <PageContainer>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-4 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Amigos
        </button>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted">Usuário não encontrado</p>
        </div>
      </PageContainer>
    );
  }

  const joinDate = new Date(friend.created_at).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const topGames = stats
    ? [...stats.matches_by_game]
        .sort((a, b) => b.total_matches - a.total_matches)
        .slice(0, 5)
    : [];

  return (
    <PageContainer>
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-4 cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        Amigos
      </button>

      {/* Identity */}
      <Card className="flex items-center gap-4 mb-4">
        <Avatar name={friend.full_name || friend.username} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate">
            {friend.full_name || friend.username}
          </p>
          {friend.full_name && (
            <p className="text-sm text-muted truncate">@{friend.username}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <CalendarDays className="h-3.5 w-3.5 text-muted" />
            <p className="text-xs text-muted">Membro desde {joinDate}</p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="flex flex-col items-center justify-center text-center p-3">
          <Sword className="h-5 w-5 text-primary-400 mb-1" />
          <p className="text-xl font-bold text-foreground">
            {stats?.total_matches ?? 0}
          </p>
          <p className="text-[10px] text-muted">Partidas</p>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center p-3">
          <Trophy className="h-5 w-5 text-yellow-400 mb-1" />
          <p className="text-xl font-bold text-foreground">
            {stats?.total_wins ?? 0}
          </p>
          <p className="text-[10px] text-muted">Vitórias</p>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center p-3">
          <Percent className="h-5 w-5 text-accent-400 mb-1" />
          <p className="text-xl font-bold text-foreground">
            {stats ? Math.round(stats.win_rate) : 0}%
          </p>
          <p className="text-[10px] text-muted">Win rate</p>
        </Card>
      </div>

      {/* Top games */}
      {topGames.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 px-1">
            Jogos mais jogados
          </p>
          <div className="space-y-2">
            {topGames.map((g) => (
              <Link key={g.game_id} href={`/games/${g.game_id}`}>
                <Card className="flex items-center gap-3 hover:bg-card-hover transition-colors cursor-pointer">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 shrink-0">
                    <Star className="h-4 w-4 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {g.game_name}
                    </p>
                    <p className="text-xs text-muted">
                      {g.total_matches}{" "}
                      {g.total_matches === 1 ? "partida" : "partidas"} ·{" "}
                      {Math.round(g.win_rate * 100)}% vitórias
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted shrink-0" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Collection tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("library")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
            tab === "library"
              ? "bg-primary-600 text-white"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Biblioteca
          <span className="ml-1 text-xs opacity-70">({library.length})</span>
        </button>
        <button
          onClick={() => setTab("wishlist")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
            tab === "wishlist"
              ? "bg-accent-600 text-white"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
        >
          <Heart className="h-4 w-4" />
          Wishlist
          <span className="ml-1 text-xs opacity-70">({wishlist.length})</span>
        </button>
      </div>

      {/* Library tab */}
      {tab === "library" && (
        <div className="space-y-2">
          {library.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-10 w-10 text-neutral-600 mb-3" />
              <p className="text-sm text-neutral-400">
                Biblioteca vazia por enquanto
              </p>
            </div>
          ) : (
            library.map((entry) => {
              const gid = entry.game.id;
              const owned = myLibraryIds.has(gid);
              const wished = myWishlistIds.has(gid);
              return (
                <Card key={entry.id} className="flex items-center gap-3 p-3!">
                  <Link href={`/games/${gid}`} className="flex items-center gap-3 flex-1 min-w-0">
                    {entry.game.image_url ? (
                      <img
                        src={entry.game.image_url}
                        alt={entry.game.name}
                        className="h-12 w-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500/10 shrink-0">
                        <Package className="h-5 w-5 text-primary-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {entry.game.name}
                      </p>
                      <p className="text-xs text-muted">
                        {entry.match_count}{" "}
                        {entry.match_count === 1 ? "partida" : "partidas"} registrada
                        {entry.match_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      title={owned ? "Já na sua biblioteca" : "Adicionar à biblioteca"}
                      disabled={owned || actionLoading === `lib-${gid}`}
                      onClick={async () => {
                        setActionLoading(`lib-${gid}`);
                        try {
                          await addToLibrary(gid);
                          setMyLibraryIds((s) => new Set(s).add(gid));
                          if (wished) {
                            await removeFromWishlist(gid);
                            setMyWishlistIds((s) => { const n = new Set(s); n.delete(gid); return n; });
                          }
                        } catch {}
                        setActionLoading(null);
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        owned
                          ? "text-primary-400 bg-primary-500/20"
                          : "text-muted hover:text-primary-400 hover:bg-primary-500/10"
                      }`}
                    >
                      <BookOpen className="h-4 w-4" />
                    </button>
                    <button
                      title={owned ? "Já na biblioteca" : wished ? "Já na wishlist" : "Adicionar à wishlist"}
                      disabled={owned || wished || actionLoading === `wish-${gid}`}
                      onClick={async () => {
                        setActionLoading(`wish-${gid}`);
                        try {
                          await addToWishlist(gid, true);
                          setMyWishlistIds((s) => new Set(s).add(gid));
                        } catch {}
                        setActionLoading(null);
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        wished
                          ? "text-accent-400 bg-accent-500/20"
                          : owned
                            ? "opacity-30 cursor-not-allowed text-muted"
                            : "text-muted hover:text-accent-400 hover:bg-accent-500/10"
                      }`}
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Wishlist tab */}
      {tab === "wishlist" && (
        <div className="space-y-2">
          {wishlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Heart className="h-10 w-10 text-neutral-600 mb-3" />
              <p className="text-sm text-neutral-400">
                Wishlist pública vazia
              </p>
            </div>
          ) : (
            wishlist.map((entry) => {
              const gid = entry.game.id;
              const owned = myLibraryIds.has(gid);
              const wished = myWishlistIds.has(gid);
              return (
                <Card key={entry.id} className="flex items-center gap-3 p-3!">
                  <Link href={`/games/${gid}`} className="flex items-center gap-3 flex-1 min-w-0">
                    {entry.game.image_url ? (
                      <img
                        src={entry.game.image_url}
                        alt={entry.game.name}
                        className="h-12 w-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-500/10 shrink-0">
                        <Heart className="h-5 w-5 text-accent-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {entry.game.name}
                      </p>
                      {entry.friends_who_own.length > 0 && (
                        <p className="text-xs text-accent-400 truncate">
                          {entry.friends_who_own.length === 1
                            ? `${entry.friends_who_own[0]} possui`
                            : `${entry.friends_who_own[0]} e mais ${entry.friends_who_own.length - 1} possuem`}
                        </p>
                      )}
                      {entry.friends_who_own.length === 0 && (
                        <p className="text-xs text-muted">Na wishlist</p>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      title={owned ? "Já na sua biblioteca" : "Adicionar à biblioteca"}
                      disabled={owned || actionLoading === `lib-${gid}`}
                      onClick={async () => {
                        setActionLoading(`lib-${gid}`);
                        try {
                          await addToLibrary(gid);
                          setMyLibraryIds((s) => new Set(s).add(gid));
                          if (wished) {
                            await removeFromWishlist(gid);
                            setMyWishlistIds((s) => { const n = new Set(s); n.delete(gid); return n; });
                          }
                        } catch {}
                        setActionLoading(null);
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        owned
                          ? "text-primary-400 bg-primary-500/20"
                          : "text-muted hover:text-primary-400 hover:bg-primary-500/10"
                      }`}
                    >
                      <BookOpen className="h-4 w-4" />
                    </button>
                    <button
                      title={owned ? "Já na biblioteca" : wished ? "Já na wishlist" : "Adicionar à wishlist"}
                      disabled={owned || wished || actionLoading === `wish-${gid}`}
                      onClick={async () => {
                        setActionLoading(`wish-${gid}`);
                        try {
                          await addToWishlist(gid, true);
                          setMyWishlistIds((s) => new Set(s).add(gid));
                        } catch {}
                        setActionLoading(null);
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        wished
                          ? "text-accent-400 bg-accent-500/20"
                          : owned
                            ? "opacity-30 cursor-not-allowed text-muted"
                            : "text-muted hover:text-accent-400 hover:bg-accent-500/10"
                      }`}
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </PageContainer>
  );
}
