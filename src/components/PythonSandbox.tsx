import { useCallback, useEffect, useRef, useState } from "react";

/**
 * In-browser Python sandbox powered by Pyodide (CPython compiled to WASM).
 *
 * Features:
 *  - Lazy-loads the ~10 MB runtime from the official CDN only on first Run.
 *  - Captures stdout/stderr live.
 *  - Confirmation prompt before executing (avoids accidental long runs).
 *  - Persists the *edited* snippet in localStorage keyed by snippet identity,
 *    so navigating away and back restores the in-progress code.
 *  - Reliable Stop:
 *      * In cross-origin-isolated contexts we use a SharedArrayBuffer
 *        interrupt buffer so Pyodide raises a real KeyboardInterrupt.
 *      * Otherwise we fall back to a hard-cancel: tear down the interpreter
 *        instance entirely so the next run starts clean. The UI immediately
 *        reports "Execution stopped".
 */

declare global {
  interface Window {
    loadPyodide?: (opts?: { indexURL?: string }) => Promise<PyodideAPI>;
    __pyodidePromise?: Promise<PyodideAPI>;
  }
}

type PyodideAPI = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
  loadPackagesFromImports?: (code: string) => Promise<void>;
  setInterruptBuffer?: (buf: Uint8Array) => void;
};

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

const supportsSAB =
  typeof SharedArrayBuffer !== "undefined" &&
  typeof globalThis.crossOriginIsolated === "boolean" &&
  globalThis.crossOriginIsolated;

async function loadPyodideOnce(
  onProgress: (msg: string) => void,
  interruptBuf: Uint8Array | null,
): Promise<PyodideAPI> {
  if (window.__pyodidePromise) {
    const py = await window.__pyodidePromise;
    if (interruptBuf && py.setInterruptBuffer) py.setInterruptBuffer(interruptBuf);
    return py;
  }
  window.__pyodidePromise = (async () => {
    onProgress("Downloading Pyodide runtime…");
    await injectScript(`${PYODIDE_BASE}pyodide.js`);
    if (!window.loadPyodide) throw new Error("Pyodide failed to register");
    onProgress("Initializing Python interpreter…");
    const py = await window.loadPyodide({ indexURL: PYODIDE_BASE });
    if (interruptBuf && py.setInterruptBuffer) py.setInterruptBuffer(interruptBuf);
    return py;
  })();
  return window.__pyodidePromise;
}

/** Short, stable hash of the *original* snippet so each block has its own draft. */
function hashSource(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

const SANDBOX_DRAFT_PREFIX = "kb:py-draft:";
const SANDBOX_CONFIRM_KEY = "kb:py-skip-confirm";

export function PythonSandbox({ source }: { source: string }) {
  const draftKey = `${SANDBOX_DRAFT_PREFIX}${hashSource(source)}`;

  // Editable code, persisted across navigations.
  const [code, setCode] = useState<string>(() => {
    if (typeof window === "undefined") return source;
    try {
      return window.localStorage.getItem(draftKey) ?? source;
    } catch {
      return source;
    }
  });

  const [output, setOutput] = useState<string>("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "running" | "done" | "error" | "stopped"
  >("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const pyRef = useRef<PyodideAPI | null>(null);
  const interruptRef = useRef<Uint8Array | null>(null);
  // Token incremented on every run; lets us discard output from a cancelled run.
  const runTokenRef = useRef(0);
  const cancelledRef = useRef(false);

  // Allocate the interrupt buffer once. SAB-backed when isolated, plain otherwise.
  useEffect(() => {
    if (interruptRef.current) return;
    if (supportsSAB) {
      const sab = new SharedArrayBuffer(1); // 0 = run, 2 = SIGINT
      interruptRef.current = new Uint8Array(sab);
    } else {
      interruptRef.current = new Uint8Array(1);
    }
  }, []);

  // Persist edits (debounced via microtask — the snippet is small).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (code === source) {
        window.localStorage.removeItem(draftKey);
      } else {
        window.localStorage.setItem(draftKey, code);
      }
    } catch {
      /* storage full / private mode — ignore */
    }
  }, [code, source, draftKey]);

  const hasDraft = code !== source;

  const doRun = useCallback(async () => {
    const myToken = ++runTokenRef.current;
    cancelledRef.current = false;
    setOutput("");
    setStatusMsg("");
    if (interruptRef.current) interruptRef.current[0] = 0;

    try {
      if (!pyRef.current) {
        setStatus("loading");
        pyRef.current = await loadPyodideOnce(
          (m) => setStatusMsg(m),
          interruptRef.current,
        );
      }
      if (myToken !== runTokenRef.current || cancelledRef.current) return;

      const py = pyRef.current;
      const buffer: string[] = [];
      py.setStdout({ batched: (s) => buffer.push(s) });
      py.setStderr({ batched: (s) => buffer.push(s) });

      setStatus("running");
      setStatusMsg("Running…");

      if (py.loadPackagesFromImports) {
        try {
          await py.loadPackagesFromImports(code);
        } catch {
          /* missing optional packages are fine */
        }
      }
      if (myToken !== runTokenRef.current || cancelledRef.current) return;

      const result = await py.runPythonAsync(code);
      if (myToken !== runTokenRef.current || cancelledRef.current) return;

      const out = buffer.join("");
      const tail =
        result === undefined || result === null ? "" : `\n=> ${String(result)}`;
      setOutput(out + tail || "(no output)");
      setStatus("done");
      setStatusMsg("");
    } catch (e) {
      if (myToken !== runTokenRef.current) return;
      const msg = String((e as Error).message || e);
      if (cancelledRef.current || /KeyboardInterrupt/i.test(msg)) {
        setOutput("⏹ Execution stopped.");
        setStatus("stopped");
      } else {
        setOutput(msg);
        setStatus("error");
      }
      setStatusMsg("");
    }
  }, [code]);

  const run = useCallback(() => {
    let skip = false;
    try {
      skip = window.localStorage.getItem(SANDBOX_CONFIRM_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (!skip) {
      const lines = code.split("\n").length;
      const ok = window.confirm(
        `Run this Python snippet (${lines} line${lines === 1 ? "" : "s"}) in your browser?\n\n` +
          "First run downloads ~10 MB. Long-running code will block this page until you press Stop.\n\n" +
          "Click OK to run. (Tip: this prompt won't appear again this session.)",
      );
      if (!ok) return;
      try {
        window.localStorage.setItem(SANDBOX_CONFIRM_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    void doRun();
  }, [code, doRun]);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    // Bump the token so any in-flight resolve/reject is ignored.
    runTokenRef.current += 1;

    if (interruptRef.current && supportsSAB) {
      // 2 = SIGINT — Pyodide checks this between bytecode instructions.
      interruptRef.current[0] = 2;
      setStatus("stopped");
      setStatusMsg("");
      setOutput("⏹ Execution stopped.");
    } else {
      // Hard cancel: drop the interpreter instance so the next Run rebuilds
      // a clean one. The in-flight job continues in the background but its
      // result is discarded by the run-token check above.
      pyRef.current = null;
      window.__pyodidePromise = undefined;
      setStatus("stopped");
      setStatusMsg("");
      setOutput("⏹ Execution stopped.");
    }
  }, []);

  const copyRunnable = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }, [code]);

  const resetDraft = useCallback(() => {
    setCode(source);
    setOutput("");
    setStatus("idle");
    setStatusMsg("");
  }, [source]);

  const isBusy = status === "loading" || status === "running";
  const lineCount = Math.max(4, code.split("\n").length);

  return (
    <div className="kb-sandbox">
      <textarea
        className="kb-sandbox-edit"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        rows={Math.min(lineCount, 20)}
        aria-label="Editable Python snippet"
      />
      <div className="kb-sandbox-bar">
        <button
          type="button"
          className="kb-sandbox-run"
          onClick={run}
          disabled={isBusy}
        >
          {status === "loading"
            ? "Loading Python…"
            : status === "running"
            ? "Running…"
            : "▶ Run"}
        </button>
        <button
          type="button"
          className="kb-sandbox-stop"
          onClick={stop}
          disabled={!isBusy}
          title={
            supportsSAB
              ? "Send KeyboardInterrupt to the running snippet"
              : "Cancel the current run and reset the interpreter"
          }
        >
          ■ Stop
        </button>
        <button
          type="button"
          className="kb-sandbox-copy"
          onClick={copyRunnable}
          title="Copy the exact code that will be executed"
        >
          {copied ? "Copied" : "⧉ Copy runnable code"}
        </button>
        {hasDraft && (
          <button
            type="button"
            className="kb-sandbox-clear"
            onClick={resetDraft}
            title="Discard your edits and restore the original snippet"
          >
            Reset draft
          </button>
        )}
        {hasDraft && <span className="kb-sandbox-hint">Draft saved · auto-restored on return</span>}
        {statusMsg && <span className="kb-sandbox-status">{statusMsg}</span>}
        {status === "loading" && (
          <span className="kb-sandbox-hint">
            First run downloads ~10 MB; later runs are instant.
          </span>
        )}
        {output && (
          <button
            type="button"
            className="kb-sandbox-clear"
            onClick={() => {
              setOutput("");
              setStatus("idle");
            }}
          >
            Clear output
          </button>
        )}
      </div>
      {output && (
        <pre
          className={`kb-sandbox-out ${
            status === "error" ? "error" : status === "stopped" ? "stopped" : ""
          }`}
        >
          {output}
        </pre>
      )}
    </div>
  );
}
