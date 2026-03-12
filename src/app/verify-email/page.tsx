"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { verifyEmail, ApiError } from "@/lib/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Token de verificação não encontrado.");
      return;
    }

    (async () => {
      try {
        await verifyEmail(token);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        if (err instanceof ApiError) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg("Erro ao verificar e-mail. Tente novamente.");
        }
      }
    })();
  }, [token]);

  return (
    <Card className="w-full max-w-sm">
      {status === "loading" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <Loader2 className="h-8 w-8 text-primary-400 animate-spin" />
          <p className="text-sm text-muted">Verificando seu e-mail...</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gain/20">
            <CheckCircle className="h-6 w-6 text-gain" />
          </div>
          <p className="text-sm font-semibold text-foreground">E-mail verificado!</p>
          <p className="text-xs text-muted text-center">
            Sua conta foi confirmada com sucesso. Agora você tem acesso completo ao VamoJoga.
          </p>
          <Link
            href="/"
            className="text-sm text-primary-400 hover:text-primary-300 font-medium"
          >
            Ir para o início
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-loss/20">
            <XCircle className="h-6 w-6 text-loss" />
          </div>
          <p className="text-sm font-semibold text-foreground">Falha na verificação</p>
          <p className="text-xs text-muted text-center">{errorMsg}</p>
          <Link
            href="/"
            className="text-sm text-primary-400 hover:text-primary-300 font-medium"
          >
            Voltar ao início
          </Link>
        </div>
      )}
    </Card>
  );
}

export default function VerifyEmailPage() {
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
          Verificação de E-mail
        </h1>
        <p className="text-sm text-muted mb-6">
          Confirmando sua conta
        </p>

        <Suspense fallback={null}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </PageContainer>
  );
}
