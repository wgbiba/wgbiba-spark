import { useEffect, useState } from "react";
import type { DatasetState } from "@/lib/data";

type Feed = { label: string; state: DatasetState<unknown> };

function StatusDot({ status }: { status: DatasetState<unknown>["status"] }) {
  const cls =
    status === "ok"
      ? "ok"
      : status === "loading"
        ? "loading"
        : status === "error"
          ? "err"
          : "idle";
  return <span className={`status-dot ${cls}`} aria-hidden="true" />;
}

/**
 * Floating diagnostic panel showing fetch results for each registered feed.
 * Always-on (collapsible) so visitors and maintainers can see at a glance
 * whether the static JSON files were served correctly.
 */
export function DataStatusWidget({ feeds }: { feeds: Feed[] }) {
  const [open, setOpen] = useState(true);
  // Avoid SSR/client hydration mismatch: feed state (counts, durations,
  // HTTP status) only exists on the client. Render a stable shell on the
  // server and fill in dynamic content after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const anyError = mounted && feeds.some((f) => f.state.status === "error");
  const anyLoading = mounted && feeds.some((f) => f.state.status === "loading");
  const overall: DatasetState<unknown>["status"] = !mounted
    ? "idle"
    : anyError
      ? "error"
      : anyLoading
        ? "loading"
        : "ok";

  return (
    <aside
      className={`data-status${open ? " open" : " closed"}`}
      aria-label="Data loading status"
    >
      <button
        type="button"
        className="data-status__toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="data-status-panel"
      >
        <StatusDot status={overall} />
        <span className="data-status__title">
          {open ? "Data status" : "Status"}
        </span>
        <span className="data-status__caret" aria-hidden="true">
          {open ? "—" : "+"}
        </span>
      </button>

      {open && (
        <div id="data-status-panel" className="data-status__body">
          {!mounted ? (
            <div className="data-status__bar">
              <span className="data-status__count">Initializing…</span>
            </div>
          ) : (
            <>
              <div className="data-status__bar">
                <span className="data-status__count">
                  {feeds.filter((f) => f.state.status === "ok").length}/{feeds.length} OK
                </span>
                <button
                  type="button"
                  className="data-status__retry-all"
                  onClick={() => feeds.forEach((f) => f.state.refetch())}
                  disabled={anyLoading}
                  aria-label="Retry all feeds"
                >
                  ↻ Retry all
                </button>
              </div>
              {feeds.map((f) => (
                <div key={f.label} className="data-status__row">
                  <div className="data-status__head">
                    <StatusDot status={f.state.status} />
                    <code className="data-status__label">{f.label}</code>
                    <button
                      type="button"
                      className="data-status__retry"
                      onClick={f.state.refetch}
                      disabled={f.state.status === "loading"}
                      aria-label={`Retry ${f.label}`}
                    >
                      ↻
                    </button>
                  </div>
                  <div className="data-status__meta">
                    <span title="URL fetched">{f.state.url}</span>
                    <span>
                      {f.state.httpStatus !== null && (
                        <>HTTP {f.state.httpStatus} · </>
                      )}
                      {f.state.durationMs !== null && (
                        <>{f.state.durationMs} ms · </>
                      )}
                      {f.state.status === "ok" && (
                        <>{f.state.data.length} items</>
                      )}
                      {f.state.status === "loading" && <>loading…</>}
                      {f.state.status === "error" && <>failed</>}
                    </span>
                  </div>
                  {f.state.status === "error" && f.state.error && (
                    <pre className="data-status__error" role="alert">
                      {f.state.error}
                    </pre>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </aside>
  );
}
