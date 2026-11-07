"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, WifiOff, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIOS(ios);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (isIOS && !deferredPrompt) {
      setShowIOSPrompt(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  }, [deferredPrompt, isIOS]);

  return {
    isInstallable: isInstallable || (isIOS && !isInstalled),
    isInstalled,
    isIOS,
    showIOSPrompt,
    setShowIOSPrompt,
    promptInstall,
  };
}

export function PWAInstallButton() {
  const { isInstallable, isInstalled, showIOSPrompt, setShowIOSPrompt, promptInstall } = usePWAInstall();

  if (isInstalled || !isInstallable) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={promptInstall}
        className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300"
      >
        <Download className="h-3.5 w-3.5" />
        Install App
      </Button>

      {showIOSPrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-50 rounded-xl bg-slate-900 p-4 text-white shadow-xl border border-slate-700 max-w-md mx-auto">
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs space-y-1">
              <p className="font-semibold text-sm">Install ScholarAI on iOS</p>
              <p className="text-slate-300 flex items-center gap-1">
                Tap <Share className="h-3.5 w-3.5 inline" /> Share in Safari and choose{" "}
                <span className="font-semibold text-white">&ldquo;Add to Home Screen&rdquo;</span>.
              </p>
            </div>
            <button onClick={() => setShowIOSPrompt(false)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOffline(!window.navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-1.5 text-xs font-medium flex items-center justify-center gap-2">
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>
        Offline Mode Active — Viewing cached scholarships, saved applications, and deterministic eligibility rules.
      </span>
    </div>
  );
}
