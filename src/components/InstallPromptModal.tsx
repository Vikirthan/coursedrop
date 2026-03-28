"use client";

import { useEffect, useState } from "react";
import { FiDownload, FiX } from "react-icons/fi";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "coursedrop_install_prompt_dismissed_at";
const DISMISS_FOR_MS = 1000 * 60 * 60 * 24 * 3; // 3 days

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function wasRecentlyDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) {
    return false;
  }

  const ts = Number(raw);
  if (!Number.isFinite(ts)) {
    return false;
  }

  return Date.now() - ts < DISMISS_FOR_MS;
}

export default function InstallPromptModal() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandaloneMode());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);

      if (!wasRecentlyDismissed()) {
        setVisible(true);
      }
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setVisible(false);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (isInstalled || !promptEvent || !visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Install CourseDrop App</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              For faster access, install CourseDrop on your device and open it like a normal app.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
              setVisible(false);
            }}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close install prompt"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
          Click the Install App button to make this platform more accessible and easier to use daily.
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              await promptEvent.prompt();
              const choice = await promptEvent.userChoice;

              if (choice.outcome !== "accepted") {
                window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
              }

              setVisible(false);
              setPromptEvent(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
          >
            <FiDownload size={16} />
            Install Now
          </button>
          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
              setVisible(false);
            }}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
