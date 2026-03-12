"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { forgotPassword, ApiError } from "@/lib/api";
import { Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erro ao enviar e-mail. Tente novamente.");
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
          alt="VamoJoga"
          width={180}
          height={72}
          className="mx-auto mb-6"
          priority
        />

        <h1 className="text-2xl font-bold text-foreground mb-1">
          Recuperar senha
        </h1>
        <p className="text-sm text-muted mb-6">
          Informe seu e-mail para receber o link de redefinição
        </p>

        <Card className="w-full max-w-sm">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600/20">
                <Mail className="h-6 w-6 text-primary-400" />
              </div>
              <p className="text-sm text-center text-muted">
                Se um conta com esse e-mail existir, você receberá um link para
                redefinir sua senha. Verifique sua caixa de entrada e spam.
              </p>
              <Link
                href="/login"
                className="text-sm text-primary-400 hover:text-primary-300 font-medium"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1 font-medium">
                  E-mail
                </label>
                <Input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>

              {error && (
                <p className="text-xs text-loss text-center">{error}</p>
              )}

              <Button type="submit" variant="primary" size="lg" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link"}
              </Button>
            </form>
          )}
        </Card>

        <p className="mt-4 text-sm text-muted">
          Lembrou a senha?{" "}
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
