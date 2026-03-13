"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
} from "@/lib/push-notifications";

const DISMISSED_KEY = "push_permission_dismissed";

export function PushPermissionBanner() {
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    if (getNotificationPermission() !== "default") return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    setVisible(true);
  }, []);

  async function handleEnable() {
    setRequesting(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = localStorage.getItem("token") ?? "";
        await subscribeToPush(token);
      }
    } catch {
      // silently ignore
    } finally {
      setVisible(false);
      setRequesting(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="mb-4 rounded-xl border border-primary-500/30 bg-primary-500/5 px-4 py-3 flex items-start gap-3">
      <Bell className="h-5 w-5 text-primary-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-primary-400">Ativar notificações</p>
        <p className="text-xs text-muted mt-0.5">
          Receba alertas de conquistas, amigos e partidas registradas.
        </p>
        <button
          onClick={handleEnable}
          disabled={requesting}
          className="text-xs text-primary-400 hover:text-primary-300 mt-2 font-medium cursor-pointer"
        >
          {requesting ? "Ativando..." : "Ativar notificações"}
        </button>
      </div>
      <button
        onClick={handleDismiss}
        className="text-muted hover:text-foreground p-0.5 cursor-pointer"
        aria-label="Dispensar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
