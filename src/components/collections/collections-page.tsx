"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMyCollections, createCollection } from "@/lib/api";
import { useAuthGuard } from "@/lib/hooks";
import type { CollectionResponse } from "@/types";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { routes } from "@/lib/navigation";

export default function CollectionsPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    getMyCollections()
      .then(setCollections)
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setCreating(true);
    try {
      const novo = await createCollection(formName.trim(), formDesc.trim() || undefined);
      router.push(routes.collectionDetails(novo.id));
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader title="Colecoes" />

      <div className="p-4 space-y-4">
        {!showForm && (
          <Button className="w-full" onClick={() => setShowForm(true)}>
            + Nova colecao
          </Button>
        )}

        {showForm && (
          <Card className="p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Nova colecao</p>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none"
                placeholder="Nome da colecao (ex: Casa dos Silva)"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
              <textarea
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none resize-none"
                placeholder="Descricao (opcional)"
                rows={2}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={creating || !formName.trim()}>
                  {creating ? "Criando..." : "Criar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowForm(false);
                    setFormName("");
                    setFormDesc("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? (
          <p className="text-center text-muted text-sm py-8">Carregando...</p>
        ) : collections.length === 0 ? (
          <p className="text-center text-muted text-sm py-8">
            Voce ainda nao tem colecoes compartilhadas.
          </p>
        ) : (
          <div className="space-y-3">
            {collections.map((a) => (
              <Link key={a.id} href={routes.collectionDetails(a.id)}>
                <Card className="p-4 flex items-center justify-between active:opacity-70">
                  <div>
                    <p className="font-semibold text-foreground">{a.name}</p>
                    {a.description && (
                      <p className="text-xs text-muted mt-0.5 line-clamp-1">{a.description}</p>
                    )}
                    <p className="text-xs text-muted mt-1">
                      {a.game_count} {a.game_count === 1 ? "jogo" : "jogos"} · {a.member_count} {a.member_count === 1 ? "membro" : "membros"}
                    </p>
                  </div>
                  <span className="text-muted text-lg">›</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
