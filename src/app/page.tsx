"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Zap, Users, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { listUsers, getGlobalRanking } from "@/lib/api";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [playerCount, setPlayerCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    listUsers()
      .then((users) => setPlayerCount(users.length))
      .catch(() => {});

    getGlobalRanking(1)
      .then((ranking) => {
        if (ranking.length > 0) {
          setMatchCount(ranking[0].total_matches);
        }
      })
      .catch(() => {});
  }, [user]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted">Carregando...</p>
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-lg shadow-primary-600/30">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            VamoJoga
          </h1>
          <p className="mt-2 text-sm text-muted mb-8">
            Registre partidas e veja quem manda no ranking
          </p>
          <div className="flex gap-3 w-full max-w-xs">
            <Link href="/login" className="flex-1">
              <Button variant="primary" size="lg" className="w-full">
                Entrar
              </Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button variant="outline" size="lg" className="w-full">
                Criar Conta
              </Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-lg shadow-primary-600/30">
          <Zap className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          VamoJoga
        </h1>
        <p className="mt-2 text-sm text-muted">
          Olá, <span className="text-primary-400 font-medium">{user.username}</span>!
        </p>
      </div>

      {/* CTA Principal */}
      <Link href="/matches/new" className="block mb-6">
        <Button variant="accent" size="lg" className="w-full">
          <Zap className="h-5 w-5" />
          Registrar Partida
        </Button>
      </Link>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="h-5 w-5 text-primary-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{playerCount}</p>
          <p className="text-xs text-muted">Jogadores</p>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="h-5 w-5 text-gold" />
          </div>
          <p className="text-2xl font-bold text-foreground">{matchCount}</p>
          <p className="text-xs text-muted">Partidas</p>
        </Card>
      </div>

      {/* Links Rápidos */}
      <div className="space-y-3">
        <Link href="/matches" className="block">
          <Card className="flex items-center justify-between hover:bg-card-hover cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600/15">
                <Zap className="h-5 w-5 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Histórico de Partidas
                </p>
                <p className="text-xs text-muted">Veja as últimas partidas</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-500" />
          </Card>
        </Link>

        <Link href="/leaderboard" className="block">
          <Card className="flex items-center justify-between hover:bg-card-hover cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15">
                <Trophy className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Ranking Global
                </p>
                <p className="text-xs text-muted">Quem é o melhor?</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-500" />
          </Card>
        </Link>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="mt-8 flex items-center justify-center gap-2 w-full text-sm text-neutral-500 hover:text-loss transition-colors cursor-pointer"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </PageContainer>
  );
}
