"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resetPassword, ApiError } from "@/lib/api";
import { CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!token) {
      setError("Token de redefinição inválido.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erro ao redefinir senha. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      {success ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gain/20">
            <CheckCircle className="h-6 w-6 text-gain" />
          </div>
          <p className="text-sm text-center text-muted">
            Senha redefinida com sucesso! Você será redirecionado para o login em
            instantes...
          </p>
          <Link
            href="/login"
            className="text-sm text-primary-400 hover:text-primary-300 font-medium"
          >
            Ir para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1 font-medium">
              Nova senha
            </label>
            <Input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1 font-medium">
              Confirmar nova senha
            </label>
            <Input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-xs text-loss text-center">{error}</p>
          )}

          <Button type="submit" variant="primary" size="lg" disabled={loading}>
            {loading ? "Redefinindo..." : "Redefinir senha"}
          </Button>
        </form>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
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

        <h1 className="text-2xl font-bold text-foreground mb-1">
          Redefinir senha
        </h1>
        <p className="text-sm text-muted mb-6">
          Escolha uma nova senha para sua conta
        </p>

        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>

        <p className="mt-4 text-sm text-muted">
          <Link
            href="/login"
            className="text-primary-400 hover:text-primary-300 font-medium"
          >
            Voltar ao login
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
