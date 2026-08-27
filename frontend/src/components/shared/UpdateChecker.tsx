import { useEffect, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { Button } from "@/components/ui/button";
import { Download, X, AlertCircle } from "lucide-react";

type Status = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

/**
 * Silently checks for an app update once on mount, then shows a small
 * card in the bottom-right corner if one's available. Does nothing when
 * run outside the actual Tauri desktop app (e.g. opening the backend's
 * URL directly in a browser during development) - the updater plugin
 * only exists inside the real app.
 */
export default function UpdateChecker() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Tauri v2 exposes its runtime through __TAURI_INTERNALS__. Keep the
      // legacy check as a fallback for older desktop builds.
      const isTauri = "__TAURI_INTERNALS__" in window || "isTauri" in window;
      if (!isTauri) return; // not running inside the desktop app
      try {
        setStatus("checking");
        const result = await check();
        if (cancelled) return;
        if (result) {
          setUpdate(result);
          setStatus("available");
        } else {
          setStatus("idle");
        }
      } catch (err) {
        // Fail silently - a broken update check shouldn't interrupt
        // someone trying to use the POS. Log it for debugging only.
        console.error("Update check failed:", err);
        setStatus("idle");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleInstall = async () => {
    if (!update) return;
    setStatus("downloading");
    setError(null);
    setProgress(0);
    try {
      let downloaded = 0;
      let contentLength = 0;
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength ?? 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setProgress(Math.min(100, Math.round((downloaded / contentLength) * 100)));
            }
            break;
          case "Finished":
            setProgress(100);
            break;
        }
      });
      setStatus("ready");
      // Brief pause so "Restarting..." is actually visible before relaunch.
      setTimeout(() => {
        relaunch();
      }, 1000);
    } catch (err) {
      console.error("Update install failed:", err);
      setError("Couldn't install the update. It'll be offered again next time you open the app.");
      setStatus("error");
    }
  };

  if (dismissed || status === "idle" || status === "checking") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-border bg-card p-4 shadow-lg">
      {status === "available" && update && (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Download className="h-4.5 w-4.5 text-primary" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground"
              aria-label="Dismiss"
              onClick={() => setDismissed(true)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            Update available — v{update.version}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Restarts the app to install. Any unsaved sale should be completed first.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setDismissed(true)}>
              Later
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleInstall}>
              Update now
            </Button>
          </div>
        </>
      )}

      {status === "downloading" && (
        <>
          <p className="text-sm font-semibold text-foreground">Downloading update…</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{progress}%</p>
        </>
      )}

      {status === "ready" && (
        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          Installed — restarting…
        </p>
      )}

      {status === "error" && (
        <>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold">Update failed</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <div className="mt-3 flex justify-end">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setDismissed(true)}>
              Dismiss
            </Button>
          </div>
        </>
      )}
    </div>
  );
}