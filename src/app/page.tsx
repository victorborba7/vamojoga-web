"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MatchCard } from "@/components/match/match-card";
import { Zap, Sword, Trophy, Users, ChevronRight, History, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getUserMatches, getUserStats, getGlobalRanking, resendVerification } from "@/lib/api";
import type { MatchResponse, UserStats, RankingEntry } from "@/types";
import { PushPermissionBanner } from "@/components/notifications/push-permission-banner";
import { IosInstallBanner } from "@/components/notifications/ios-install-banner";

function EmailVerificationBanner() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleResend() {
    setSending(true);
    try {
      await resendVerification();
      setSent(true);
    } catch {
      // silently ignore
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-start gap-3">
      <Mail className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-400">Confirme seu e-mail</p>
        <p className="text-xs text-muted mt-0.5">
          Verifique sua caixa de entrada para ativar todos os recursos.
        </p>
        {sent ? (
          <p className="text-xs text-gain mt-2">E-mail reenviado!</p>
        ) : (
          <button
            onClick={handleResend}
            disabled={sending}
            className="text-xs text-primary-400 hover:text-primary-300 mt-2 font-medium cursor-pointer"
          >
            {sending ? "Enviando..." : "Reenviar e-mail de verificação"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentMatches, setRecentMatches] = useState<MatchResponse[]>([]);
  const [topRanking, setTopRanking] = useState<RankingEntry[]>([]);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      getUserStats(user.id),
      getUserMatches(user.id),
      getGlobalRanking(3),
    ])
      .then(([s, m, r]) => {
        setStats(s);
        setRecentMatches(m.slice(0, 3));
        setTopRanking(r);
      })
      .catch(() => {});
  }, [user]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <Image
            src="/full_logo.png"
            alt="VamoJogá"
            width={200}
            height={80}
            className="mx-auto mb-2"
            priority
          />
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
      {/* Email verification banner */}
      {user && !user.email_verified && (
        <EmailVerificationBanner />
      )}

      {/* iOS install guide */}
      <IosInstallBanner />

      {/* Push notification permission banner */}
      <PushPermissionBanner />

      {/* Greeting */}
      <div className="mb-6">
        <p className="text-sm text-muted">
          Olá, <span className="text-primary-400 font-medium">{user.username}</span>!
        </p>
        <h1 className="text-2xl font-bold text-foreground">Início</h1>
      </div>

      {/* CTA Principal */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/matches/new" className="block">
          <Button variant="accent" size="lg" className="w-full">
            <Zap className="h-5 w-5" />
            Registrar Partida
          </Button>
        </Link>
        <Link href="/guests" className="block">
          <Button variant="outline" size="lg" className="w-full">
            <Users className="h-5 w-5" />
            Convidados
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="flex flex-col items-center text-center p-3">
            <Sword className="h-4 w-4 text-primary-400 mb-1" />
            <p className="text-xl font-bold text-foreground">{stats.total_matches}</p>
            <p className="text-[10px] text-muted">Partidas</p>
          </Card>
          <Card className="flex flex-col items-center text-center p-3">
            <Trophy className="h-4 w-4 text-yellow-400 mb-1" />
            <p className="text-xl font-bold text-foreground">{stats.total_wins}</p>
            <p className="text-[10px] text-muted">Vitórias</p>
          </Card>
          <Card className="flex flex-col items-center text-center p-3">
            <Users className="h-4 w-4 text-accent-400 mb-1" />
            <p className="text-xl font-bold text-foreground">{stats.matches_by_game.length}</p>
            <p className="text-[10px] text-muted">Jogos</p>
          </Card>
        </div>
      )}

      {/* Recent matches */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Partidas recentes
          </p>
          <Link
            href="/matches"
            className="flex items-center gap-0.5 text-xs text-primary-400 hover:underline"
          >
            Ver todas <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {recentMatches.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-8 text-center">
            <History className="h-8 w-8 text-muted" />
            <p className="text-sm text-muted">Nenhuma partida ainda</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </div>

      {/* Top ranking preview */}
      {topRanking.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Top ranking
            </p>
            <Link
              href="/leaderboard"
              className="flex items-center gap-0.5 text-xs text-primary-400 hover:underline"
            >
              Ver ranking <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <Card className="divide-y divide-white/5">
            {topRanking.map((entry, i) => (
              <div key={entry.user_id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-sm font-bold text-muted w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {entry.username}
                  </p>
                </div>
                <p className="text-xs text-muted">
                  {entry.total_wins}V / {entry.total_matches}P
                </p>
              </div>
            ))}
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
