import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Single source of truth for the app's base path. Reads
 * `import.meta.env.BASE_URL` (set via Vite's `base` config) and normalises
 * it so it never has a trailing slash. At the site root this returns "".
 */
export function basePath(): string {
  const raw = import.meta.env.BASE_URL || "/";
  return raw.replace(/\/+$/, "");
}

/**
 * Resolve a public-asset path (e.g. `/data/tasks.json`) against the app's
 * base URL so fetches work both at `/` and under a GitHub Pages repo subpath
 * like `/wgbiba/`.
 */
export function assetUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${basePath()}${p}`;
}

/**
 * Resolve an internal route href (e.g. `/dashboard`) under the configured
 * base path. Use this when you must build a raw `<a href>` instead of using
 * the router's `<Link>`. The TanStack `<Link>` already prefixes the basepath
 * automatically — prefer it whenever possible.
 */
export function internalHref(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${basePath()}${p}`;
}

export type FetchStatus = "idle" | "loading" | "ok" | "error";

export type DatasetState<T> = {
  status: FetchStatus;
  data: T[];
  error: string | null;
  url: string;
  attemptedAt: number | null;
  durationMs: number | null;
  httpStatus: number | null;
  refetch: () => void;
};

/* ----------------- SessionStorage cache for last outcomes ---------------- */

const SS_KEY = "wgbiba.fetch-outcomes.v1";

export type FetchOutcome = {
  status: FetchStatus;
  url: string;
  httpStatus: number | null;
  durationMs: number | null;
  attemptedAt: number | null;
  itemCount: number | null;
  error: string | null;
};

type OutcomeMap = Record<string, FetchOutcome>;

function readOutcomes(): OutcomeMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as OutcomeMap) : {};
  } catch {
    return {};
  }
}

function writeOutcome(path: string, outcome: FetchOutcome): void {
  if (typeof window === "undefined") return;
  try {
    const all = readOutcomes();
    all[path] = outcome;
    sessionStorage.setItem(SS_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

/** Read all cached fetch outcomes (e.g. for the /debug page). */
export function getCachedOutcomes(): OutcomeMap {
  return readOutcomes();
}

/** Clear all cached outcomes. */
export function clearCachedOutcomes(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SS_KEY);
  } catch {
    // ignore
  }
}

/**
 * Fetch a JSON array from the public folder with full diagnostics:
 * URL, HTTP status, duration, exact error message, and a `refetch()` action.
 *
 * The last outcome is persisted to `sessionStorage` so widgets can show the
 * previous result instantly after navigation, before the new fetch settles.
 */
export function useDataset<T>(path: string): DatasetState<T> {
  const url = assetUrl(path);

  // Hydrate from sessionStorage so the widget shows the last known state
  // immediately on mount (before the new fetch completes).
  const cached = readOutcomes()[path];
  const cachedMatchesUrl = cached && cached.url === url;

  const [data, setData] = useState<T[]>([]);
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [error, setError] = useState<string | null>(
    cachedMatchesUrl ? cached.error : null,
  );
  const [attemptedAt, setAttemptedAt] = useState<number | null>(
    cachedMatchesUrl ? cached.attemptedAt : null,
  );
  const [durationMs, setDurationMs] = useState<number | null>(
    cachedMatchesUrl ? cached.durationMs : null,
  );
  const [httpStatus, setHttpStatus] = useState<number | null>(
    cachedMatchesUrl ? cached.httpStatus : null,
  );
  const reqId = useRef(0);

  const persist = useCallback(
    (outcome: Omit<FetchOutcome, "url">) => {
      writeOutcome(path, { ...outcome, url });
    },
    [path, url],
  );

  const run = useCallback(async () => {
    const id = ++reqId.current;
    setStatus("loading");
    setError(null);
    setHttpStatus(null);
    setDurationMs(null);
    const startedAt = Date.now();
    setAttemptedAt(startedAt);

    try {
      const r = await fetch(url, { cache: "no-store" });
      const elapsed = Date.now() - startedAt;
      if (id !== reqId.current) return; // stale
      setHttpStatus(r.status);
      setDurationMs(elapsed);

      if (!r.ok) {
        const body = await r.text().catch(() => "");
        const snippet = body.slice(0, 140).replace(/\s+/g, " ").trim();
        throw new Error(
          `HTTP ${r.status} ${r.statusText} from ${url}` +
            (snippet ? ` — ${snippet}` : ""),
        );
      }

      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("json")) {
        const body = await r.text().catch(() => "");
        const looksLikeHtml = /^\s*<(?:!doctype|html)/i.test(body);
        throw new Error(
          looksLikeHtml
            ? `Expected JSON but received HTML (likely a 404 fallback page) from ${url}.`
            : `Expected JSON content-type but got "${ct}" from ${url}.`,
        );
      }

      const parsed = (await r.json()) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error(`${url} did not return a JSON array.`);
      }

      if (id !== reqId.current) return;
      setData(parsed as T[]);
      setStatus("ok");
      persist({
        status: "ok",
        httpStatus: r.status,
        durationMs: elapsed,
        attemptedAt: startedAt,
        itemCount: (parsed as unknown[]).length,
        error: null,
      });
    } catch (e) {
      if (id !== reqId.current) return;
      const message =
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : "Unknown fetch error.";
      setError(message);
      setStatus("error");
      persist({
        status: "error",
        httpStatus: null,
        durationMs: Date.now() - startedAt,
        attemptedAt: startedAt,
        itemCount: null,
        error: message,
      });
      // eslint-disable-next-line no-console
      console.warn("[useDataset] failed", url, e);
    }
  }, [url, persist]);

  useEffect(() => {
    void run();
  }, [run]);

  return {
    status,
    data,
    error,
    url,
    attemptedAt,
    durationMs,
    httpStatus,
    refetch: run,
  };
}
