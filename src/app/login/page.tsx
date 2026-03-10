"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { Zap } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [savedIdentifier, setSavedIdentifier] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("saved_identifier");
    const n = localStorage.getItem("saved_name");
    if (id) {
      setSavedIdentifier(id);
      setSavedName(n);
      setIdentifier(id);
      setReturning(true);
    }
  }, []);

  function handleNotMe() {
    localStorage.removeItem("saved_identifier");
    localStorage.removeItem("saved_name");
    setSavedIdentifier(null);
    setSavedName(null);
    setIdentifier("");
    setPassword("");
    setReturning(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ identifier: returning ? savedIdentifier! : identifier, password });
      router.push("/collection");
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

        {returning && savedName ? (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Bem-vindo de volta!
            </h1>
            <p className="text-sm text-muted mb-6">Confirme sua senha para entrar</p>

            <Card className="w-full max-w-sm">
              {/* Returning user identity */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
                <Avatar name={savedName} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{savedName}</p>
                  <p className="text-xs text-muted truncate">{savedIdentifier}</p>
                </div>
                <button
                  onClick={handleNotMe}
                  className="text-xs text-primary-400 hover:text-primary-300 shrink-0 cursor-pointer"
                >
                  Não sou eu
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-muted mb-1 font-medium">
                    Senha
                  </label>
                  <Input
                    type="password"
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="text-xs text-loss text-center">{error}</p>
                )}

                <Button type="submit" variant="primary" size="lg" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </Card>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-1">Entrar</h1>
            <p className="text-sm text-muted mb-6">Acesse sua conta VamoJoga</p>

            <Card className="w-full max-w-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-muted mb-1 font-medium">
                    E-mail ou nome de usuário
                  </label>
                  <Input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="seu@email.com ou @usuario"
                    autoCapitalize="none"
                    autoCorrect="off"
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

                <Button type="submit" variant="primary" size="lg" disabled={loading}>
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
          </>
        )}
      </div>
    </PageContainer>
  );
}
