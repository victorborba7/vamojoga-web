"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { Zap } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erro ao fazer login");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-lg shadow-primary-600/30">
          <Zap className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Entrar</h1>
        <p className="text-sm text-muted mb-6">Acesse sua conta VamoJoga</p>

        <Card className="w-full max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-muted mb-1 font-medium">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-neutral-900 px-4 py-2.5 text-sm text-foreground placeholder:text-neutral-600 focus:border-primary-500 focus:outline-none"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1 font-medium">
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-neutral-900 px-4 py-2.5 text-sm text-foreground placeholder:text-neutral-600 focus:border-primary-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs text-loss text-center">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-sm text-muted">
          Não tem conta?{" "}
          <Link
            href="/register"
            className="text-primary-400 hover:text-primary-300 font-medium"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
