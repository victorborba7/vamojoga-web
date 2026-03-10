import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ChevronRight, Star } from "lucide-react";
import type { GameStats } from "@/types";

interface TopGamesListProps {
  games: GameStats[];
  title?: string;
  /** Show a star icon next to each entry */
  showIcon?: boolean;
}

export function TopGamesList({
  games,
  title = "Jogos mais jogados",
  showIcon = false,
}: TopGamesListProps) {
  if (games.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 px-1">
        {title}
      </p>
      <div className="space-y-2">
        {games.map((g) => (
          <Link key={g.game_id} href={`/games/${g.game_id}`}>
            <Card className="flex items-center gap-3 hover:bg-card-hover transition-colors cursor-pointer">
              {showIcon && (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 shrink-0">
                  <Star className="h-4 w-4 text-primary-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{g.game_name}</p>
                <p className="text-xs text-muted">
                  {g.total_matches} {g.total_matches === 1 ? "partida" : "partidas"} · {Math.round(g.win_rate)}% vitórias
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted shrink-0" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
