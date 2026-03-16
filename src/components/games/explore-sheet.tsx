"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, ChevronRight, Gamepad2, Star, Sparkles } from "lucide-react";
import { getGameRecommendations } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import type { GameResponse } from "@/types";

interface ExploreSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ExploreSheet({ open, onClose }: ExploreSheetProps) {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;
    let cancelled = false;
    getGameRecommendations(10)
      .then((data) => { if (!cancelled) { setGames(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setGames([]); setLoading(false); } });
    return () => { cancelled = true; };
  }, [open]);

  // Trap body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-card pb-10 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="mx-auto mt-3 mb-4 h-1 w-10 rounded-full bg-white/20 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-400" />
            <p className="text-base font-bold text-foreground">Explorar jogos</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted px-5 mb-4 shrink-0">
          Recomendações baseadas nas mecânicas dos jogos da sua biblioteca
        </p>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : games.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center px-6">
            <Gamepad2 className="h-10 w-10 text-muted" />
            <p className="text-sm font-semibold text-muted">Sem recomendações ainda</p>
            <p className="text-xs text-muted">Adicione jogos à sua biblioteca para receber sugestões personalizadas.</p>
          </div>
        ) : (
          /* Horizontal carousel */
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {games.map((game, i) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                onClick={onClose}
                className="flex flex-col shrink-0 w-36"
                style={{ scrollSnapAlign: "start" }}
              >
                {/* Cover */}
                {game.image_url ? (
                  <Image
                    src={game.image_url}
                    alt={game.name_pt ?? game.name}
                    width={144}
                    height={144}
                    className="w-36 h-36 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-36 h-36 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Gamepad2 className="h-10 w-10 text-muted" />
                  </div>
                )}

                {/* Rank badge */}
                <div className="flex items-center justify-between mt-2 px-0.5">
                  <span className="text-[10px] text-muted font-medium">#{i + 1}</span>
                  {game.bayes_rating && (
                    <span className="flex items-center gap-0.5 text-[10px] text-yellow-400">
                      <Star className="h-2.5 w-2.5 fill-yellow-400" />
                      {game.bayes_rating.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Name */}
                <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight mt-0.5 px-0.5">
                  {game.name_pt ?? game.name}
                </p>

                {/* Mechanic chips */}
                {game.mechanics.length > 0 && (
                  <p className="text-[10px] text-muted truncate mt-0.5 px-0.5">
                    {game.mechanics.slice(0, 2).join(" · ")}
                  </p>
                )}

                {/* CTA */}
                <div className="flex items-center gap-0.5 mt-1.5 text-[10px] text-primary-400 font-medium px-0.5">
                  Ver detalhes <ChevronRight className="h-2.5 w-2.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
