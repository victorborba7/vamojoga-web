"use client";

import { useEffect, useState } from "react";
import { Mail, Pencil, Save, Trash2, UserPlus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, createGuest, deleteGuest, listGuests, updateGuest } from "@/lib/api";
import type { GuestResponse } from "@/types";

interface GuestManagerModalProps {
  open: boolean;
  onClose: () => void;
  onGuestsChanged: () => void;
}

export function GuestManagerModal({ open, onClose, onGuestsChanged }: GuestManagerModalProps) {
  const [guests, setGuests] = useState<GuestResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingEmail, setEditingEmail] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    listGuests()
      .then(setGuests)
      .catch(() => setError("Não foi possível carregar convidados"))
      .finally(() => setLoading(false));
  }, [open]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) { setError("Informe o nome do convidado"); return; }
    setSaving(true);
    setError("");
    try {
      const created = await createGuest({ name: newName.trim(), email: newEmail.trim() || undefined });
      setGuests((prev) => [created, ...prev]);
      setNewName("");
      setNewEmail("");
      onGuestsChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar convidado");
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
    if (!editingId || !editingName.trim()) { setError("Informe o nome do convidado"); return; }
    setSaving(true);
    setError("");
    try {
      const updated = await updateGuest(editingId, {
        name: editingName.trim(),
        email: editingEmail.trim() || null,
      });
      setGuests((prev) => prev.map((g) => (g.id === editingId ? updated : g)));
      setEditingId(null);
      onGuestsChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao atualizar convidado");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(guestId: string) {
    setSaving(true);
    setError("");
    try {
      await deleteGuest(guestId);
      setGuests((prev) => prev.filter((g) => g.id !== guestId));
      if (editingId === guestId) setEditingId(null);
      onGuestsChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao remover convidado");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-neutral-900 rounded-t-2xl max-h-[85dvh] flex flex-col shadow-2xl border-t border-white/10">
        {/* Handle + header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10 shrink-0">
          <div>
            <p className="text-sm font-bold text-foreground">Gerenciar Convidados</p>
            <p className="text-xs text-muted mt-0.5">Participantes sem conta no app</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">
          {/* Create form */}
          <Card>
            <p className="text-xs text-muted font-medium mb-3">Novo convidado</p>
            <form onSubmit={handleCreate} className="space-y-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome (ex: Carlos)"
              />
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="E-mail (opcional)"
              />
              <Button type="submit" size="sm" disabled={saving || !newName.trim()}>
                <UserPlus className="h-3.5 w-3.5" />
                {saving ? "Salvando..." : "Adicionar"}
              </Button>
            </form>
          </Card>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {/* Guest list */}
          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          ) : guests.length === 0 ? (
            <p className="text-xs text-muted text-center py-4">Nenhum convidado cadastrado ainda.</p>
          ) : (
            <div className="space-y-2">
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
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(guest.id)}
                            className="rounded-md border border-border p-2 text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
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
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
