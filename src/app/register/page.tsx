"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { ApiError, validateGuestInvite } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteGuestName, setInviteGuestName] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get("invite");
    const invitedEmail = searchParams.get("email");

    if (invitedEmail) {
      setEmail(invitedEmail);
    }

    if (!token) {
      setInviteToken(null);
      setInviteGuestName(null);
      return;
    }

    setInviteToken(token);
    setInviteLoading(true);
    setError("");

    (async () => {
      try {
        const invite = await validateGuestInvite(token);
        setInviteGuestName(invite.guest_name);
        if (!invitedEmail) {
          setEmail(invite.email);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Convite invalido ou expirado");
        }
        setInviteToken(null);
        setInviteGuestName(null);
      } finally {
        setInviteLoading(false);
      }
    })();
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (username.trim().length < 3) {
      setError("Nome de usuário precisa ter pelo menos 3 caracteres");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Informe um e-mail válido");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      await register({
        username,
        email,
        password,
        full_name: fullName || undefined,
        invite_token: inviteToken || undefined,
      });
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erro ao criar conta");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Image
          src="/full_logo.png"
          alt="VamoJogá"
          width={180}
          height={72}
          className="mx-auto mb-6"
          priority
        />
        <h1 className="text-2xl font-bold text-foreground mb-1">Criar Conta</h1>
        <p className="text-sm text-muted mb-6">Junte-se ao VamoJogá</p>

        <Card className="w-full max-w-sm">
          {inviteLoading && (
            <p className="text-xs text-muted mb-3 text-center">Validando convite...</p>
          )}
          {!inviteLoading && inviteGuestName && (
            <p className="text-xs text-primary-400 mb-3 text-center">
              Voce foi convidado como <strong>{inviteGuestName}</strong>.
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-muted mb-1 font-medium">
                Nome de usuário
              </label>
              <Input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="jogador123"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1 font-medium">
                Nome completo
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="João Silva"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1 font-medium">
                E-mail
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                readOnly={Boolean(inviteToken)}
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1 font-medium">
                Senha
              </label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs text-loss text-center">{error}</p>
            )}

            <Button
              type="submit"
              variant="accent"
              size="lg"
              disabled={loading}
            >
              {loading ? "Criando..." : "Criar Conta"}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-sm text-muted">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="text-primary-400 hover:text-primary-300 font-medium"
          >
            Entrar
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
