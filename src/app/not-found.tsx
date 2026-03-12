import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <p className="text-8xl font-extrabold text-primary-600/20 mb-4 select-none">404</p>
        <h1 className="text-2xl font-bold text-foreground mb-2">Página não encontrada</h1>
        <p className="text-sm text-muted mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link href="/">
          <Button>Voltar ao início</Button>
        </Link>
      </div>
    </PageContainer>
  );
}
