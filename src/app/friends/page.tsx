"use client";

import { useEffect, useState, useCallback } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  UserPlus,
  Check,
  X,
  Users,
  Clock,
  Search,
  UserMinus,
} from "lucide-react";
import Link from "next/link";
import { useAuthGuard } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";
import {
  getFriends,
  getPendingReceived,
  getPendingSent,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
  ApiError,
} from "@/lib/api";
import type { FriendResponse, FriendshipResponse, UserResponse } from "@/types";

type Tab = "friends" | "pending" | "add";

export default function FriendsPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const { refreshPendingCount } = useAuth();
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [pendingReceived, setPendingReceived] = useState<FriendshipResponse[]>([]);
  const [pendingSent, setPendingSent] = useState<FriendshipResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Add friend search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [f, pr, ps] = await Promise.all([
        getFriends(),
        getPendingReceived(),
        getPendingSent(),
      ]);
      setFriends(f);
      setPendingReceived(pr);
      setPendingSent(ps);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    loadData();
  }, [user, authLoading, loadData]);

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchUsers(q.trim(), 10);
      // Exclude current user and existing friends
      const friendIds = friends.map((f) => f.user_id);
      const sentIds = pendingSent.map((p) => p.addressee_id);
      const receivedIds = pendingReceived.map((p) => p.requester_id);
      const excludeIds = new Set([user!.id, ...friendIds, ...sentIds, ...receivedIds]);
      setSearchResults(results.filter((u) => !excludeIds.has(u.id)));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleSendRequest(userId: string) {
    setActionLoading(userId);
    setFeedback("");
    try {
      await sendFriendRequest(userId);
      setFeedback("Solicitação enviada!");
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setFeedback(err.message);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAccept(friendshipId: string) {
    setActionLoading(friendshipId);
    try {
      await acceptFriendRequest(friendshipId);
      await loadData();
      await refreshPendingCount();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(friendshipId: string) {
    setActionLoading(friendshipId);
    try {
      await rejectFriendRequest(friendshipId);
      await loadData();
      await refreshPendingCount();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemove(friendshipId: string) {
    setActionLoading(friendshipId);
    try {
      await removeFriend(friendshipId);
      await loadData();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  }

  const pendingCount = pendingReceived.length;

  if (authLoading || loading) {
    return (
      <PageContainer>
        <PageHeader title="Amigos" subtitle="Carregando..." />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted">Carregando...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Amigos"
        subtitle={`${friends.length} amigo${friends.length !== 1 ? "s" : ""}`}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("friends")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
            tab === "friends"
              ? "bg-primary-600 text-white"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
        >
          <Users className="h-4 w-4" />
          Amigos
        </button>
        <button
          onClick={() => setTab("pending")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer relative ${
            tab === "pending"
              ? "bg-primary-600 text-white"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
        >
          <Clock className="h-4 w-4" />
          Pendentes
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("add")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
            tab === "add"
              ? "bg-primary-600 text-white"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      {/* TAB: Friends List */}
      {tab === "friends" && (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <EmptyState
              icon={Users}
              label="Nenhum amigo ainda"
              sublabel="Adicione amigos para jogar junto!"
            >
              <Button
                variant="primary"
                size="lg"
                className="mt-4"
                onClick={() => setTab("add")}
              >
                <UserPlus className="h-4 w-4" />
                Adicionar amigo
              </Button>
            </EmptyState>
          ) : (
            friends.map((friend) => (
              <Card key={friend.user_id} className="p-3!">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/friends/${friend.user_id}`}
                    className="flex flex-1 items-center gap-3 min-w-0"
                  >
                    <Avatar name={friend.username} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {friend.username}
                      </p>
                      {friend.full_name && (
                        <p className="text-xs text-muted truncate">{friend.full_name}</p>
                      )}
                      <p className="text-xs text-neutral-600 mt-0.5">
                        Amigos desde{" "}
                        {new Date(friend.since).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemove(friend.friendship_id)}
                    disabled={actionLoading === friend.friendship_id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-loss/10 text-loss/60 hover:bg-loss/20 hover:text-loss transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    title="Remover amigo"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB: Pending Requests */}
      {tab === "pending" && (
        <div className="space-y-4">
          {/* Received */}
          <div>
            <p className="text-xs text-muted font-medium mb-2">
              Solicitações recebidas ({pendingReceived.length})
            </p>
            {pendingReceived.length === 0 ? (
              <Card className="p-3!">
                <p className="text-xs text-neutral-500 text-center">
                  Nenhuma solicitação pendente
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {pendingReceived.map((req) => (
                  <Card key={req.id} className="p-3!">
                    <div className="flex items-center gap-3">
                      <Avatar name={req.requester_username || "?"} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {req.requester_username || "Usuário"}
                        </p>
                        <p className="text-xs text-muted">
                          Quer ser seu amigo
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(req.id)}
                          disabled={actionLoading === req.id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-win/20 text-win hover:bg-win/30 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoading === req.id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-loss/20 text-loss hover:bg-loss/30 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sent */}
          <div>
            <p className="text-xs text-muted font-medium mb-2">
              Solicitações enviadas ({pendingSent.length})
            </p>
            {pendingSent.length === 0 ? (
              <Card className="p-3!">
                <p className="text-xs text-neutral-500 text-center">
                  Nenhuma solicitação enviada
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {pendingSent.map((req) => (
                  <Card key={req.id} className="p-3!">
                    <div className="flex items-center gap-3">
                      <Avatar name={req.addressee_username || "?"} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {req.addressee_username || "Usuário"}
                        </p>
                        <p className="text-xs text-muted">Aguardando resposta</p>
                      </div>
                      <Badge variant="default">Pendente</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Add Friend */}
      {tab === "add" && (
        <div className="space-y-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar por nome de usuário..."
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-neutral-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              autoComplete="off"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-primary-500" />
              </div>
            )}
          </div>

          {feedback && (
            <p className="text-xs text-center text-primary-400">{feedback}</p>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
            <div className="text-center py-8">
              <p className="text-sm text-neutral-400">Nenhum usuário encontrado</p>
            </div>
          )}

          <div className="space-y-2">
            {searchResults.map((u) => (
              <Card key={u.id} className="p-3!">
                <div className="flex items-center gap-3">
                  <Avatar name={u.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {u.username}
                    </p>
                    {u.full_name && (
                      <p className="text-xs text-muted truncate">{u.full_name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleSendRequest(u.id)}
                    disabled={actionLoading === u.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-500 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {actionLoading === u.id ? "..." : "Adicionar"}
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {searchQuery.length < 2 && (
            <div className="text-center py-8">
              <UserPlus className="h-10 w-10 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">
                Digite pelo menos 2 caracteres para buscar
              </p>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
