"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { AchievementCard } from "@/components/achievement/achievement-card";
import { Trophy } from "lucide-react";
import { useAuthGuard } from "@/lib/hooks";
import {
  getGlobalAchievements,
  getMyAchievements,
} from "@/lib/api";
import type {
  AchievementResponse,
  UserAchievementResponse,
} from "@/types";

export default function AchievementsPage() {
  const { user, loading: authLoading } = useAuthGuard();

  const [tab, setTab] = useState<"mine" | "global">("mine");
  const [myAchievements, setMyAchievements] = useState<UserAchievementResponse[]>([]);
  const [globalAchievements, setGlobalAchievements] = useState<AchievementResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    Promise.all([getMyAchievements(), getGlobalAchievements()])
      .then(([mine, global]) => {
        setMyAchievements(mine);
        setGlobalAchievements(global);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || !user) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner />
        </div>
      </PageContainer>
    );
  }

  const unlockedIds = new Set(myAchievements.map((a) => a.achievement_id));
  const totalPoints = myAchievements.reduce(
    (sum, a) => sum + a.achievement_points,
    0
  );

  return (
    <PageContainer>
      <PageHeader
        title="Conquistas"
        subtitle={`${myAchievements.length} desbloqueadas · ${totalPoints} pts`}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={tab === "mine" ? "primary" : "outline"}
          size="sm"
          onClick={() => setTab("mine")}
        >
          Minhas ({myAchievements.length})
        </Button>
        <Button
          variant={tab === "global" ? "primary" : "outline"}
          size="sm"
          onClick={() => setTab("global")}
        >
          Todas ({globalAchievements.length})
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {/* My achievements */}
      {!loading && tab === "mine" && (
        <>
          {myAchievements.length === 0 ? (
            <EmptyState
              icon={Trophy}
              label="Nenhuma conquista"
              sublabel="Jogue partidas para desbloquear conquistas!"
            />
          ) : (
            <div className="space-y-3">
              {myAchievements.map((ua) => {
                const achievement: AchievementResponse = {
                  id: ua.achievement_id,
                  name: ua.achievement_name,
                  description: ua.achievement_description,
                  icon_url: ua.achievement_icon_url,
                  type: ua.achievement_type as "global" | "game",
                  game_id: null,
                  criteria_key: "",
                  criteria_value: 0,
                  points: ua.achievement_points,
                  is_active: true,
                  created_at: ua.unlocked_at,
                };
                return (
                  <AchievementCard
                    key={ua.id}
                    achievement={achievement}
                    unlocked
                    unlockedAt={ua.unlocked_at}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* All global achievements */}
      {!loading && tab === "global" && (
        <>
          {globalAchievements.length === 0 ? (
            <EmptyState
              icon={Trophy}
              label="Nenhuma conquista cadastrada"
              sublabel="Conquistas globais aparecerão aqui"
            />
          ) : (
            <div className="space-y-3">
              {globalAchievements.map((a) => (
                <AchievementCard
                  key={a.id}
                  achievement={a}
                  unlocked={unlockedIds.has(a.id)}
                  unlockedAt={
                    myAchievements.find((ua) => ua.achievement_id === a.id)
                      ?.unlocked_at
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
