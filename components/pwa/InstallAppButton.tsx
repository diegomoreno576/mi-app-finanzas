"use client";

import { useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AndroidInstallGuide } from "@/components/pwa/AndroidInstallGuide";
import { IosInstallGuide } from "@/components/pwa/IosInstallGuide";
import { cn } from "@/lib/utils";

interface InstallAppButtonProps {
  variant?: "primary" | "sidebar" | "ghost";
  className?: string;
}

export function InstallAppButton({
  variant = "primary",
  className,
}: InstallAppButtonProps) {
  const { visible, isIos, iosSafari, hasNativePrompt, installAndroid } =
    usePwaInstall();
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideMode, setGuideMode] = useState<"ios" | "android">("ios");

  if (!visible) return null;

  async function handleClick() {
    if (isIos) {
      setGuideMode("ios");
      setGuideOpen(true);
      return;
    }

    if (hasNativePrompt) {
      await installAndroid();
      return;
    }

    setGuideMode("android");
    setGuideOpen(true);
  }

  const styles = {
    primary:
      "w-full border border-violet-500/40 bg-violet-600/15 text-violet-300 hover:bg-violet-600/25 hover:text-violet-200",
    sidebar:
      "w-full justify-start gap-3 border border-slate-600/80 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white",
    ghost:
      "text-violet-400 hover:bg-slate-800 hover:text-violet-300",
  };

  return (
    <>
      <Button
        type="button"
        variant={variant === "primary" ? "secondary" : "ghost"}
        size={variant === "sidebar" ? "md" : "md"}
        className={cn(styles[variant], className)}
        onClick={handleClick}
      >
        {variant === "sidebar" ? (
          <Smartphone className="h-5 w-5 shrink-0" />
        ) : (
          <Download className="h-4 w-4 shrink-0" />
        )}
        Instalar app
      </Button>

      <Modal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Instalar Mi Finanzas"
      >
        {guideMode === "ios" ? (
          <IosInstallGuide safariOnly={isIos && !iosSafari} />
        ) : (
          <AndroidInstallGuide />
        )}
        <div className="mt-6">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setGuideOpen(false)}
          >
            Entendido
          </Button>
        </div>
      </Modal>
    </>
  );
}
