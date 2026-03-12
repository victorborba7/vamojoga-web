import { Card } from "@/components/ui/card";
import { Sword, Trophy, Percent } from "lucide-react";
import type { UserStats } from "@/types";

interface StatsGridProps {
  stats: UserStats | null;
  loading?: boolean;
}

export function StatsGrid({ stats, loading }: StatsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-card border border-border p-4 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <Card className="flex flex-col items-center justify-center text-center p-3">
        <Sword className="h-5 w-5 text-primary-400 mb-1" />
        <p className="text-xl font-bold text-foreground">{stats?.total_matches ?? 0}</p>
        <p className="text-[10px] text-muted">Partidas</p>
      </Card>
      <Card className="flex flex-col items-center justify-center text-center p-3">
        <Trophy className="h-5 w-5 text-yellow-400 mb-1" />
        <p className="text-xl font-bold text-foreground">{stats?.total_wins ?? 0}</p>
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
  );
}
