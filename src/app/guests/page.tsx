"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Pencil, Save, Trash2, UserPlus, X } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { ApiError, createGuest, deleteGuest, listGuests, updateGuest } from "@/lib/api";
import type { GuestResponse } from "@/types";

export default function GuestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [guests, setGuests] = useState<GuestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingEmail, setEditingEmail] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    (async () => {
      try {
        const data = await listGuests();
        setGuests(data);
      } catch {
        setError("Nao foi possivel carregar convidados");
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user, router]);

  async function handleCreateGuest(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!newName.trim()) {
      setError("Informe o nome do convidado");
      return;
    }

    setSaving(true);
    try {
      const created = await createGuest({
        name: newName.trim(),
        email: newEmail.trim() || undefined,
      });
      setGuests((prev) => [created, ...prev]);
      setNewName("");
      setNewEmail("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erro ao criar convidado");
      }
    } finally {
      setSaving(false);
    }
  }

  function startEdit(guest: GuestResponse) {
    setEditingId(guest.id);
    setEditingName(guest.name);
    setEditingEmail(guest.email || "");
  }

  async function saveEdit() {
    if (!editingId) return;
    setError("");

    if (!editingName.trim()) {
      setError("Informe o nome do convidado");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateGuest(editingId, {
        name: editingName.trim(),
        email: editingEmail.trim() ? editingEmail.trim() : null,
      });
      setGuests((prev) => prev.map((g) => (g.id === editingId ? updated : g)));
      setEditingId(null);
      setEditingName("");
      setEditingEmail("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erro ao atualizar convidado");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(guestId: string) {
    setError("");
    setSaving(true);
    try {
      await deleteGuest(guestId);
      setGuests((prev) => prev.filter((g) => g.id !== guestId));
      if (editingId === guestId) {
        setEditingId(null);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erro ao remover convidado");
      }
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <PageContainer>
        <PageHeader title="Convidados" subtitle="Carregando..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Convidados" subtitle="Gerencie participantes sem conta" />

      <Card className="mb-4">
        <form onSubmit={handleCreateGuest} className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1 font-medium">Nome</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Carlos"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1 font-medium">E-mail (opcional)</label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="convidado@email.com"
            />
          </div>
          <Button type="submit" disabled={saving}>
            <UserPlus className="h-4 w-4" />
            {saving ? "Salvando..." : "Adicionar convidado"}
          </Button>
        </form>
      </Card>

      {error && <p className="text-xs text-loss mb-3">{error}</p>}

      <div className="space-y-3">
        {guests.length === 0 && (
          <Card>
            <p className="text-sm text-muted">Nenhum convidado cadastrado ainda.</p>
          </Card>
        )}

        {guests.map((guest) => {
          const isEditing = editingId === guest.id;
          return (
            <Card key={guest.id}>
              {!isEditing ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{guest.name}</p>
                    <p className="text-xs text-muted mt-0.5 flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      {guest.email || "Sem e-mail"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(guest)}
                      className="rounded-md border border-border p-2 text-muted hover:text-foreground cursor-pointer"
                      aria-label="Editar convidado"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(guest.id)}
                      className="rounded-md border border-border p-2 text-loss hover:text-red-400 cursor-pointer"
                      aria-label="Remover convidado"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    placeholder="Nome"
                  />
                  <Input
                    type="email"
                    value={editingEmail}
                    onChange={(e) => setEditingEmail(e.target.value)}
                    placeholder="E-mail (opcional)"
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={saving}>
                      <Save className="h-3.5 w-3.5" />
                      Salvar
                    </Button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-md border border-border p-2 text-muted hover:text-foreground cursor-pointer"
                      aria-label="Cancelar edição"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
