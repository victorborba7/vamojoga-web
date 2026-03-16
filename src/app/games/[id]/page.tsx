"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchCard } from "@/components/match/match-card";
import {
  BookOpen,
  Heart,
  Trophy,
  Users,
  Clock,
  Star,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Sword,
  Flame,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  getGame,
  getUserMatches,
  getUserStats,
  getMyLibrary,
  addToLibrary,
  removeFromLibrary,
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
  getFriends,
  getUserLibrary,
  ApiError,
} from "@/lib/api";
import type { FriendResponse, GameResponse, MatchResponse, UserStats } from "@/types";
import { PriceChart } from "@/components/game/price-chart";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-white/5 px-3 py-2.5 w-full">
      <Icon className="h-4 w-4 text-muted" />
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted leading-tight text-center">{label}</p>
    </div>
  );
}

export default function GameDetailPage({ params }: Props) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [game, setGame] = useState<GameResponse | null>(null);
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [inLibrary, setInLibrary] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [friendsWhoOwn, setFriendsWhoOwn] = useState<FriendResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showDescModal, setShowDescModal] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [g, allMatches, userStats, lib, wish, friends] = await Promise.all([
        getGame(id),
        getUserMatches(user.id),
        getUserStats(user.id),
        getMyLibrary(),
        getMyWishlist(),
        getFriends(),
      ]);
      setGame(g);
      setMatches(allMatches.filter((m) => m.game_id === id));
      setStats(userStats);
      setInLibrary(lib.some((e) => e.game.id === id));
      setInWishlist(wish.some((e) => e.game.id === id));

      // Check which friends own this game (parallel requests)
      const ownerChecks = await Promise.all(
        friends.map(async (f) => {
          try {
            const friendLib = await getUserLibrary(f.user_id);
            return friendLib.some((e) => e.game.id === id) ? f : null;
          } catch {
            return null;
          }
        })
      );
      setFriendsWhoOwn(ownerChecks.filter((f): f is FriendResponse => f !== null));
    } catch {
      setError("Não foi possível carregar o jogo.");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    load();
  }, [user, authLoading, router, load]);

  async function toggleLibrary() {
    if (!game) return;
    setLibraryLoading(true);
    setError("");
    try {
      if (inLibrary) {
        await removeFromLibrary(game.id);
        setInLibrary(false);
      } else {
        await addToLibrary(game.id);
        setInLibrary(true);
        // Remove from wishlist if it was there
        if (inWishlist) {
          await removeFromWishlist(game.id);
          setInWishlist(false);
        }
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLibraryLoading(false);
    }
  }

  async function toggleWishlist() {
    if (!game) return;
    setWishlistLoading(true);
    setError("");
    try {
      if (inWishlist) {
        await removeFromWishlist(game.id);
        setInWishlist(false);
      } else {
        await addToWishlist(game.id, true);
        setInWishlist(true);
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setWishlistLoading(false);
    }
  }

  const gameStats = stats?.matches_by_game.find((g) => g.game_id === id);

  if (authLoading || loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (error && !game) {
    return (
      <PageContainer>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted mb-4 hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
        <p className="text-center text-muted py-20">{error}</p>
      </PageContainer>
    );
  }

  if (!game) return null;

  return (
    <PageContainer>
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted mb-4 hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Voltar
      </button>

      {/* Hero */}
      <div className="flex gap-4 mb-6">
        {game.image_url ? (
          <img
            src={game.image_url}
            alt={game.name_pt ?? game.name}
            className="h-28 w-28 rounded-2xl object-cover shrink-0 shadow-lg"
          />
        ) : (
          <div className="h-28 w-28 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <Gamepad2 className="h-12 w-12 text-muted" />
          </div>
        )}
        <div className="flex-1 min-w-0 pt-1">
          <h1 className="text-xl font-bold text-foreground leading-tight">{game.name_pt ?? game.name}</h1>
          {game.subtitle && (
            <p className="text-xs text-muted mt-0.5 truncate">{game.subtitle}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {game.year && (
              <Badge variant="default">{game.year}</Badge>
            )}
            {game.game_type && (
              <Badge variant="default" className="capitalize">{game.game_type}</Badge>
            )}
            {game.rank && (
              <Badge variant="gold">#{game.rank} BGG</Badge>
            )}
          </div>
          {game.bayes_rating && (
            <div className="flex items-center gap-1 mt-2">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-semibold text-foreground">{game.bayes_rating.toFixed(1)}</span>
              <span className="text-xs text-muted">/ 10 BGG</span>
            </div>
          )}
          {(game.description_pt ?? game.description) && (
            <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">
              {game.description_pt ?? game.description}{" "}
              <button
                onClick={() => setShowDescModal(true)}
                className="text-primary-400 font-medium hover:underline inline"
              >
                Ler mais
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={toggleLibrary}
          disabled={libraryLoading}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all border",
            inLibrary
              ? "bg-primary-500/20 text-primary-400 border-primary-500/30 hover:bg-primary-500/10"
              : "bg-white/5 text-muted border-white/10 hover:bg-white/10 hover:text-foreground"
          )}
        >
          {libraryLoading ? (
            <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : (
            <BookOpen className="h-4 w-4" />
          )}
          {inLibrary ? "Na coleção" : "Adicionar"}
        </button>

        <button
          onClick={toggleWishlist}
          disabled={wishlistLoading || inLibrary}
          title={inLibrary ? "Já está na sua coleção" : undefined}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all border",
            inWishlist
              ? "bg-accent-500/20 text-accent-400 border-accent-500/30 hover:bg-accent-500/10"
              : "bg-white/5 text-muted border-white/10 hover:bg-white/10 hover:text-foreground",
            (wishlistLoading || inLibrary) && "opacity-40 cursor-not-allowed"
          )}
        >
          {wishlistLoading ? (
            <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : (
            <Heart className="h-4 w-4" />
          )}
          {inWishlist ? "Na wishlist" : "Wishlist"}
        </button>
      </div>

      {error && <p className="text-xs text-red-400 mb-4 px-1">{error}</p>}

      {/* BGG info pills — linha 1: 2 colunas | linha 2: 3 colunas */}
      <div className="space-y-2 mb-6">
        <div className="grid grid-cols-2 gap-2">
          <StatPill icon={Users} label="Jogadores" value={`${game.min_players}–${game.max_players}`} />
          {game.best_players
            ? <StatPill icon={Users} label="Melhor com" value={game.best_players} />
            : <div />}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {game.min_play_time && game.max_play_time
            ? <StatPill
                icon={Clock}
                label="Tempo"
                value={game.min_play_time === game.max_play_time
                  ? `${game.min_play_time}min`
                  : `${game.min_play_time}–${game.max_play_time}min`}
              />
            : <div />}
          {game.min_age
            ? <StatPill icon={Flame} label="Idade" value={`${game.min_age}+`} />
            : <div />}
          {game.weight
            ? <StatPill icon={BarChart2} label="Complexidade" value={game.weight.toFixed(1)} />
            : <div />}
        </div>
      </div>

      {/* Description modal */}
      {showDescModal && (game.description_pt ?? game.description) && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDescModal(false)}
        >
          <div
            className="w-full max-w-md max-h-[70vh] rounded-t-3xl bg-card px-6 pt-4 pb-10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />
            <p className="text-base font-bold text-foreground mb-4">Sobre o jogo</p>
            <div className="overflow-y-auto">
              <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{game.description_pt ?? game.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Friends who own this game */}
      {friendsWhoOwn.length > 0 && (
        <>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 px-1">
              Amigos que possuem
            </p>
            <button
              onClick={() => setShowFriendsModal(true)}
              className="flex items-center gap-3 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 hover:bg-white/10 transition-colors"
            >
              {/* Avatar stack */}
              <div className="flex -space-x-2 shrink-0">
                {friendsWhoOwn.slice(0, 4).map((f) => (
                  <div
                    key={f.user_id}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/20 border-2 border-card shrink-0"
                  >
                    <span className="text-[10px] font-bold text-primary-400">
                      {(f.full_name || f.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                ))}
                {friendsWhoOwn.length > 4 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 border-2 border-card shrink-0">
                    <span className="text-[9px] font-bold text-muted">+{friendsWhoOwn.length - 4}</span>
                  </div>
                )}
              </div>
              <p className="flex-1 text-left text-sm text-foreground">
                {friendsWhoOwn.length === 1
                  ? `${friendsWhoOwn[0].username} possui esse jogo`
                  : `${friendsWhoOwn.length} amigos possuem esse jogo`}
              </p>
              <ChevronRight className="h-4 w-4 text-muted shrink-0" />
            </button>
          </div>

          {/* Bottom sheet modal */}
          {showFriendsModal && (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setShowFriendsModal(false)}
            >
              <div
                className="w-full max-w-md rounded-t-3xl bg-card px-6 pt-4 pb-10"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Handle bar */}
                <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />
                <p className="text-base font-bold text-foreground mb-4">Amigos que possuem</p>
                <div className="space-y-4">
                  {friendsWhoOwn.map((f) => (
                    <div key={f.user_id} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500/20 shrink-0">
                        <span className="text-sm font-bold text-primary-400">
                          {(f.full_name || f.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{f.username}</p>
                        {f.full_name && (
                          <p className="text-xs text-muted">{f.full_name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Your stats for this game */}
      {gameStats && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 px-1">
            Suas estatísticas
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Card className="flex flex-col items-center justify-center text-center p-3">
              <Sword className="h-5 w-5 text-primary-400 mb-1" />
              <p className="text-xl font-bold text-foreground">{gameStats.total_matches}</p>
              <p className="text-[10px] text-muted">Partidas</p>
            </Card>
            <Card className="flex flex-col items-center justify-center text-center p-3">
              <Trophy className="h-5 w-5 text-yellow-400 mb-1" />
              <p className="text-xl font-bold text-foreground">{gameStats.total_wins}</p>
              <p className="text-[10px] text-muted">Vitórias</p>
            </Card>
            <Card className="flex flex-col items-center justify-center text-center p-3">
              <Star className="h-5 w-5 text-accent-400 mb-1" />
              <p className="text-xl font-bold text-foreground">
                {Math.round(gameStats.win_rate)}%
              </p>
              <p className="text-[10px] text-muted">Win rate</p>
            </Card>
          </div>
        </div>
      )}

      {/* Price history */}
      <PriceChart gameId={id} />

      {/* Match history */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 px-1">
          Histórico de partidas
        </p>
        {matches.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-10 text-center">
            <Gamepad2 className="h-10 w-10 text-muted" />
            <p className="text-sm text-muted">Nenhuma partida registrada nesse jogo</p>
            <Link
              href="/matches/new"
              className="text-xs text-primary-400 hover:underline"
            >
              Registrar primeira partida
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
