"use client";

import { useEffect, useState, startTransition } from "react";
import { Share, X } from "lucide-react";

const DISMISSED_KEY = "ios_install_dismissed";

export function IosInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    if (sessionStorage.getItem(DISMISSED_KEY)) return;
    startTransition(() => setVisible(true));
  }, []);

  function handleDismiss() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-500/5 px-4 py-3 flex items-start gap-3">
      <Share className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-400">Instalar no iPhone</p>
        <p className="text-xs text-muted mt-0.5">
          Toque em{" "}
          <span className="font-semibold text-foreground">
            <Share className="inline h-3 w-3 mx-0.5 -mt-0.5" />
            Compartilhar
          </span>{" "}
          no Safari e depois em{" "}
          <span className="font-semibold text-foreground">
            &quot;Adicionar à Tela de Início&quot;
          </span>{" "}
          para instalar o app e receber notificações.
        </p>
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
