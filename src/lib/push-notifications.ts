const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_URL = `${API_BASE}/api/v1`;

export type PushSubscribeResult =
  | { ok: true }
  | { ok: false; message: string };

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

async function getVapidPublicKey(): Promise<string> {
  const res = await fetch(`${API_URL}/notifications/vapid-public-key`);
  if (!res.ok) {
    throw new Error(`Falha ao obter chave VAPID (${res.status}).`);
  }
  const data = await res.json();
  if (!data.public_key) {
    throw new Error("Chave VAPID não configurada no servidor.");
  }
  return data.public_key as string;
}

function mapPushError(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError") {
      return "Permissão de notificação bloqueada pelo navegador.";
    }
    if (err.name === "AbortError") {
      return "Falha temporária ao registrar push. Tente novamente.";
    }
    if (err.name === "InvalidStateError") {
      return "Service Worker ainda não ficou pronto. Recarregue a página e tente novamente.";
    }
    return `Erro do navegador (${err.name}).`;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return "Falha desconhecida ao ativar notificações.";
}

export async function subscribeToPush(token: string): Promise<PushSubscribeResult> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, message: "Este navegador não suporta notificações push." };
  }

  try {
    const vapidKey = await getVapidPublicKey();
    const registration = await navigator.serviceWorker.ready;

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      // Already subscribed — re-register with backend to be safe
      await sendSubscriptionToServer(existing, token);
      return { ok: true };
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    await sendSubscriptionToServer(subscription, token);
    return { ok: true };
  } catch (err) {
    console.warn("Push subscription failed:", err);
    return { ok: false, message: mapPushError(err) };
  }
}

async function sendSubscriptionToServer(
  subscription: PushSubscription,
  token: string
): Promise<void> {
  if (!token) {
    throw new Error("Sessão expirada. Faça login novamente para ativar notificações.");
  }

  const keys = subscription.toJSON().keys ?? {};
  const res = await fetch(`${API_URL}/notifications/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh ?? "",
      auth: keys.auth ?? "",
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { detail?: string };
      detail = body.detail ? ` ${body.detail}` : "";
    } catch {
      // ignore invalid/non-json body
    }
    throw new Error(`Falha ao salvar inscrição no servidor (${res.status}).${detail}`);
  }
}

export async function unsubscribePush(token: string): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    await fetch(`${API_URL}/notifications/subscribe`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint }),
    });
  } catch (err) {
    console.warn("Push unsubscribe failed:", err);
  }
}

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}
