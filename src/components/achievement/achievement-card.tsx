import { Trophy } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import type { AchievementResponse, UserAchievementResponse } from "@/types";

interface AchievementCardProps {
  achievement: AchievementResponse;
  unlocked?: boolean;
  unlockedAt?: string;
}

export function AchievementCard({ achievement, unlocked, unlockedAt }: AchievementCardProps) {
  return (
    <Card
      className={`flex items-center gap-3 ${unlocked ? "" : "opacity-50 grayscale"}`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
          unlocked
            ? "bg-amber-500/15"
            : "bg-neutral-700/50"
        }`}
      >
        {achievement.icon_url ? (
          <Image
            src={achievement.icon_url}
            alt={achievement.name}
            width={24}
            height={24}
            className="h-6 w-6 rounded"
          />
        ) : (
          <Trophy
            className={`h-5 w-5 ${unlocked ? "text-amber-400" : "text-muted"}`}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {achievement.name}
        </p>
        {achievement.description && (
          <p className="text-xs text-muted truncate">{achievement.description}</p>
        )}
        {unlocked && unlockedAt && (
          <p className="text-xs text-muted mt-0.5">
            Desbloqueada em{" "}
            {new Date(unlockedAt).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <span
          className={`text-xs font-bold ${
            unlocked ? "text-amber-400" : "text-muted"
          }`}
        >
          {achievement.points} pts
        </span>
      </div>
    </Card>
  );
}

interface UserAchievementCardProps {
  userAchievement: UserAchievementResponse;
}

export function UserAchievementCard({ userAchievement }: UserAchievementCardProps) {
  return (
    <Card className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 shrink-0">
        {userAchievement.achievement_icon_url ? (
          <Image
            src={userAchievement.achievement_icon_url}
            alt={userAchievement.achievement_name}
            width={24}
            height={24}
            className="h-6 w-6 rounded"
          />
        ) : (
          <Trophy className="h-5 w-5 text-amber-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {userAchievement.achievement_name}
        </p>
        {userAchievement.achievement_description && (
          <p className="text-xs text-muted truncate">
            {userAchievement.achievement_description}
          </p>
        )}
        <p className="text-xs text-muted mt-0.5">
          {new Date(userAchievement.unlocked_at).toLocaleDateString("pt-BR")}
        </p>
      </div>
      <span className="text-xs font-bold text-amber-400 shrink-0">
        {userAchievement.achievement_points} pts
      </span>
    </Card>
  );
}
