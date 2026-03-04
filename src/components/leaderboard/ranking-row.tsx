import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { RankingEntry } from "@/types";
import { Trophy } from "lucide-react";

interface RankingRowProps {
  entry: RankingEntry;
  position: number;
}

function getMedalVariant(position: number): "gold" | "silver" | "bronze" | "default" {
  switch (position) {
    case 1:
      return "gold";
    case 2:
      return "silver";
    case 3:
      return "bronze";
    default:
      return "default";
  }
}

function getMedalColor(position: number): string {
  switch (position) {
    case 1:
      return "text-gold";
    case 2:
      return "text-silver";
    case 3:
      return "text-bronze";
    default:
      return "text-neutral-500";
  }
}

export function RankingRow({ entry, position }: RankingRowProps) {
  const isTopThree = position <= 3;
  const losses = entry.total_matches - entry.total_wins;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-card border border-border p-3 hover:bg-card-hover transition-colors">
      {/* Posição */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
        {isTopThree ? (
          <Trophy className={`h-5 w-5 ${getMedalColor(position)}`} />
        ) : (
          <span className="text-sm font-bold text-neutral-500">
            {position}
          </span>
        )}
      </div>

      {/* Avatar + Nome */}
      <Avatar name={entry.username} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {entry.username}
        </p>
        <p className="text-xs text-muted">
          {entry.total_matches} partidas
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2">
        <Badge variant="win">{entry.total_wins}V</Badge>
        <Badge variant="loss">{losses}D</Badge>
        <span className="text-sm font-bold text-primary-400 min-w-[40px] text-right">
          {Math.round(entry.win_rate)}%
        </span>
      </div>
    </div>
  );
}
