import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

/**
 * Restores a deep-link path captured by `public/404.html` (the GitHub Pages
 * SPA fallback). On boot, if `sessionStorage["spa-redirect"]` is present,
 * we navigate the router to that path and clear the marker.
 *
 * Mounted once at the root.
 */
export function SpaRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem("spa-redirect");
      if (!raw) return;
      sessionStorage.removeItem("spa-redirect");

      const parsed = JSON.parse(raw) as {
        path?: string;
        search?: string;
        hash?: string;
      };
      const target =
        (parsed.path || "/") + (parsed.search || "") + (parsed.hash || "");

      // Avoid redirect loops if we're already there.
      const here =
        window.location.pathname + window.location.search + window.location.hash;
      if (target && target !== "/" && here !== target) {
        router.navigate({ to: target, replace: true });
      }
    } catch {
      // ignore — best-effort restore
    }
  }, [router]);

  return null;
}
