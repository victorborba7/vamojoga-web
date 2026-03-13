const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_URL = `${API_BASE}/api/v1`;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
  return arr.buffer as ArrayBuffer;
}

async function getVapidPublicKey(): Promise<string> {
  const res = await fetch(`${API_URL}/notifications/vapid-public-key`);
  const data = await res.json();
  return data.public_key as string;
}

export async function subscribeToPush(token: string): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  try {
    const vapidKey = await getVapidPublicKey();
    const registration = await navigator.serviceWorker.ready;

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      // Already subscribed — re-register with backend to be safe
      await sendSubscriptionToServer(existing, token);
      return true;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    await sendSubscriptionToServer(subscription, token);
    return true;
  } catch (err) {
    console.warn("Push subscription failed:", err);
    return false;
  }
}

async function sendSubscriptionToServer(
  subscription: PushSubscription,
  token: string
): Promise<void> {
  const keys = subscription.toJSON().keys ?? {};
  await fetch(`${API_URL}/notifications/subscribe`, {
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
