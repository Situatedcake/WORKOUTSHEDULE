import { useEffect, useMemo, useState } from "react";

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIosSafari() {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isWebkit = /webkit/.test(userAgent);
  const isCriOS = /crios/.test(userAgent);
  const isFxiOS = /fxios/.test(userAgent);

  return isIos && isWebkit && !isCriOS && !isFxiOS;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneMode());

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredPrompt(event);
    }

    function handleAppInstalled() {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }

    function handleDisplayModeChange() {
      setIsInstalled(isStandaloneMode());
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleDisplayModeChange);
    } else {
      mediaQuery.addListener(handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleDisplayModeChange);
      } else {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  const installSupport = useMemo(
    () => ({
      isInstalled,
      canPrompt: Boolean(deferredPrompt),
      isIosSafari: isIosSafari(),
    }),
    [deferredPrompt, isInstalled],
  );

  async function promptInstall() {
    if (!deferredPrompt) {
      return { outcome: "unavailable" };
    }

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      setDeferredPrompt(null);
    }

    return choiceResult;
  }

  return {
    ...installSupport,
    promptInstall,
  };
}
