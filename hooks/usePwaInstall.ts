"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type BeforeInstallPromptEvent,
  canShowInstallUi,
  isIosDevice,
  isIosSafari,
  isStandaloneMode,
} from "@/lib/pwa/install";

export function usePwaInstall() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [iosSafari, setIosSafari] = useState(false);
  const [hasNativePrompt, setHasNativePrompt] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (!canShowInstallUi() || isStandaloneMode()) {
      return;
    }

    const ios = isIosDevice();
    setIsIos(ios);
    setIosSafari(isIosSafari());

    if (ios) {
      setVisible(true);
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as BeforeInstallPromptEvent;
      setHasNativePrompt(true);
      setVisible(true);
    };

    const onInstalled = () => {
      deferredPrompt.current = null;
      setHasNativePrompt(false);
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const installAndroid = useCallback(async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) return false;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredPrompt.current = null;

    if (outcome === "accepted") {
      setHasNativePrompt(false);
      setVisible(false);
      return true;
    }
    return false;
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  const showButton =
    mounted && visible && !isStandaloneMode();

  return {
    visible: showButton,
    isIos,
    iosSafari,
    hasNativePrompt,
    installAndroid,
    hide,
  };
}
