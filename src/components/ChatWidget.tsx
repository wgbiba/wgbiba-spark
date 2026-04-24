import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Floating optimization assistant — bottom-left of every page.
 *
 * Modes:
 *  - "ai":    streams answers from Groq's free OpenAI-compatible API
 *             (https://api.groq.com). User pastes their own free key; key
 *             lives ONLY in localStorage. We use streaming + AbortController
 *             so Stop is reliable.
 *  - "local": no network call. We score the bundled reference snippets with
 *             a simple BM25-ish keyword match and surface the top hits.
 *             Useful offline or when the user doesn't want to add a key.
 *
 * Other features wired here:
 *  - Inline citations [§X.Y] are rendered as links to /reference#sec-X-Y.
 *  - Export current chat as Markdown or JSON.
 *  - Settings screen with masked key, reveal toggle, explicit consent
 *    checkbox before storing in localStorage, and revoke guidance.
 */

const STORAGE_KEY_TOKEN = "kb:chat:groq-token";
const STORAGE_KEY_HISTORY = "kb:chat:history";
const STORAGE_KEY_OPEN = "kb:chat:open";
const STORAGE_KEY_MODE = "kb:chat:mode";

const REFERENCE_BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const REFERENCE_DATA_URL = `${REFERENCE_BASE}/data/reference.md`;
/** Internal route that displays the bundled reference; citations link here. */
const REFERENCE_ROUTE = `${REFERENCE_BASE}/reference`;

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

type Role = "user" | "assistant";
type ChatMsg = {
  role: Role;
  content: string;
  /** Set when the assistant message was cut short by the Stop button. */
  stopped?: boolean;
  /** "local" replies are tagged so the user can tell them apart. */
  source?: "ai" | "local";
};

/** A reference section parsed from /data/reference.md. */
type Section = {
  /** e.g. "4.3" or "Preface". */
  head: string;
  /** Slug used in route anchors and citation lookup. */
  slug: string;
  body: string;
};

type Mode = "ai" | "local";

const SYSTEM_INTRO = `You are the WGBIBA Optimization Assistant, an expert tutor for engineering optimization.

You help users:
- Answer optimization questions (LP, IP, MILP, convex, combinatorial, heuristics, metaheuristics)
- Suggest methods and ideas to solve engineering design problems
- Explain concepts, examples, and formulas clearly, with worked steps

Style:
- Be precise, concise and didactic. Prefer short paragraphs and bullet lists.
- Use plain markdown for formulas (e.g. \`min f(x) s.t. Ax = b, x ≥ 0\`).
- If a question is outside optimization/engineering, politely redirect.

CITATIONS — IMPORTANT:
- When a fact in your answer is supported by the reference extract below,
  append an inline citation in the form [§X.Y] (or [§X] for chapter-level)
  immediately after the supporting clause. Use the exact section numbers
  shown in the extract — do not invent numbers.
- If a claim is not supported by the extract, do NOT cite a section.

The user is browsing a knowledge base of optimization assignments and a
reference book. The compact extract below is your primary source.`;

/* ------------------------------------------------------------------------ */
/* Reference parsing + local search                                         */
/* ------------------------------------------------------------------------ */

function slugForHead(head: string): string {
  // "4.3 Optimality Criteria" → "sec-4-3"
  const numMatch = head.match(/^(\d+(?:\.\d+){0,3})/);
  if (numMatch) return `sec-${numMatch[1].replace(/\./g, "-")}`;
  return `sec-${head.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function parseReference(md: string): Section[] {
  const out: Section[] = [];
  const blocks = md.split(/\n(?=## )/);
  for (const block of blocks) {
    const m = block.match(/^##\s+(.+)\n([\s\S]*)$/);
    if (!m) continue;
    const head = m[1].trim();
    const body = m[2].trim();
    if (!body) continue;
    out.push({ head, slug: slugForHead(head), body });
  }
  return out;
}

const STOPWORDS = new Set([
  "the","a","an","and","or","of","in","on","to","for","is","are","be","as",
  "with","that","this","these","those","by","from","at","it","its","we","you",
  "i","me","my","our","your","can","do","does","what","how","when","why","which",
  "if","then","else","not","no","yes","but","so","also","than","into","over",
  "under","up","down","out","about","more","less","most","least","such",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9α-ωΑ-Ω]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** Very small BM25-flavoured scorer over the section bodies. */
function searchSections(query: string, sections: Section[], k = 3): Section[] {
  const qTokens = Array.from(new Set(tokenize(query)));
  if (qTokens.length === 0) return [];

  // term frequency per section
  const N = sections.length;
  const df = new Map<string, number>();
  const tfPerSec: Map<string, number>[] = sections.map((s) => {
    const tf = new Map<string, number>();
    for (const w of tokenize(`${s.head} ${s.body}`)) {
      tf.set(w, (tf.get(w) ?? 0) + 1);
    }
    for (const w of new Set(tf.keys())) df.set(w, (df.get(w) ?? 0) + 1);
    return tf;
  });

  const k1 = 1.5;
  const b = 0.75;
  const avgLen =
    tfPerSec.reduce((a, m) => a + Array.from(m.values()).reduce((x, y) => x + y, 0), 0) / N;

  const scores = sections.map((s, i) => {
    const tf = tfPerSec[i];
    const len = Array.from(tf.values()).reduce((x, y) => x + y, 0);
    let score = 0;
    for (const q of qTokens) {
      const f = tf.get(q) ?? 0;
      if (f === 0) continue;
      const dfq = df.get(q) ?? 0;
      const idf = Math.log(1 + (N - dfq + 0.5) / (dfq + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + b * (len / Math.max(avgLen, 1)))));
    }
    // Bonus when the section heading matches a query token.
    const headTokens = new Set(tokenize(s.head));
    for (const q of qTokens) if (headTokens.has(q)) score += 1.5;
    return { s, score };
  });

  return scores
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.s);
}

function buildLocalReply(query: string, hits: Section[]): string {
  if (hits.length === 0) {
    return (
      `I couldn't find anything matching **"${query}"** in the bundled reference.\n\n` +
      `Try a different keyword (e.g. "duality", "branch and bound", "KKT") or ` +
      `enable AI mode in settings ⚙ to ask freely.`
    );
  }
  const parts: string[] = [
    `Here are the closest matches in the reference text *(local mode, no AI call)*:\n`,
  ];
  for (const s of hits) {
    const snippet = s.body.length > 480 ? `${s.body.slice(0, 480)}…` : s.body;
    parts.push(`### §${s.head} [§${s.head.split(" ")[0]}]\n${snippet}`);
  }
  parts.push(
    `\n— Want a synthesised answer? Switch to **AI mode** in ⚙ and add a free Groq key.`,
  );
  return parts.join("\n\n");
}

/* ------------------------------------------------------------------------ */
/* Markdown rendering with [§X.Y] citation links                            */
/* ------------------------------------------------------------------------ */

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Replace [§X.Y] / [§X] / [§Word] with anchor links into the reference page. */
function linkifyCitations(html: string, sections: Section[]): string {
  if (sections.length === 0) return html;
  const bySlug = new Map(sections.map((s) => [s.slug, s]));
  return html.replace(/\[§([^\]]+)\]/g, (_full, raw: string) => {
    const trimmed = raw.trim();
    const slug = slugForHead(trimmed);
    const known = bySlug.get(slug);
    const href = `${REFERENCE_ROUTE}#${slug}`;
    const title = known ? `Reference: ${escapeHtml(known.head)}` : "Reference section";
    return `<a class="kb-chat-cite" href="${href}" target="_blank" rel="noopener noreferrer" title="${title}">§${escapeHtml(trimmed)}</a>`;
  });
}

function renderMarkdown(src: string, sections: Section[]): string {
  const fences: string[] = [];
  src = src.replace(/```([a-z0-9]*)\n([\s\S]*?)```/gi, (_m, _lang, body) => {
    fences.push(`<pre class="kb-chat-pre"><code>${escapeHtml(body)}</code></pre>`);
    return `\u0000FENCE${fences.length - 1}\u0000`;
  });

  let html = escapeHtml(src);

  html = html.replace(/^####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^###\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^##\s+(.+)$/gm, "<h3>$1</h3>");

  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");

  html = html.replace(/(?:^|\n)((?:[-*] [^\n]+(?:\n|$))+)/g, (_m, block: string) => {
    const items = block
      .trim()
      .split(/\n/)
      .map((l) => l.replace(/^[-*]\s+/, ""))
      .map((l) => `<li>${l}</li>`)
      .join("");
    return `\n<ul>${items}</ul>`;
  });

  html = html
    .split(/\n{2,}/)
    .map((para) => {
      if (/^\s*<(ul|h\d|pre)/.test(para)) return para;
      if (!para.trim()) return "";
      return `<p>${para.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  html = html.replace(/\u0000FENCE(\d+)\u0000/g, (_m, i) => fences[Number(i)] ?? "");
  html = linkifyCitations(html, sections);
  return html;
}

/* ------------------------------------------------------------------------ */
/* SSE streaming with AbortController                                       */
/* ------------------------------------------------------------------------ */

async function streamGroq({
  token,
  messages,
  signal,
  onDelta,
}: {
  token: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  signal: AbortSignal;
  onDelta: (text: string) => void;
}): Promise<void> {
  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.3,
      messages,
      stream: true,
    }),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (res.status === 401) throw new Error("Invalid API key. Open settings to update it.");
    if (res.status === 429)
      throw new Error("Rate limit reached on the free tier — wait a minute and retry.");
    throw new Error(`AI provider error (${res.status}): ${detail.slice(0, 200)}`);
  }
  if (!res.body) throw new Error("Streaming not supported by this connection.");

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });

    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line || line.startsWith(":")) continue;
      if (!line.startsWith("data: ")) continue;
      const body = line.slice(6).trim();
      if (body === "[DONE]") return;
      try {
        const parsed = JSON.parse(body) as {
          choices?: { delta?: { content?: string } }[];
        };
        const piece = parsed.choices?.[0]?.delta?.content;
        if (piece) onDelta(piece);
      } catch {
        // partial JSON across chunks — re-buffer and keep reading
        buf = `${line}\n${buf}`;
        break;
      }
    }
  }
}

/* ------------------------------------------------------------------------ */
/* The widget                                                                */
/* ------------------------------------------------------------------------ */

export function ChatWidget() {
  // -- persisted UI state ------------------------------------------------
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(STORAGE_KEY_OPEN) === "1";
    } catch {
      return false;
    }
  });
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "ai";
    try {
      const v = window.localStorage.getItem(STORAGE_KEY_MODE);
      return v === "local" ? "local" : "ai";
    } catch {
      return "ai";
    }
  });
  const [token, setToken] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem(STORAGE_KEY_TOKEN) ?? "";
    } catch {
      return "";
    }
  });

  // -- chat state --------------------------------------------------------
  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_HISTORY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : null;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (m): m is ChatMsg =>
            !!m &&
            typeof m === "object" &&
            (m as ChatMsg).role !== undefined &&
            typeof (m as ChatMsg).content === "string",
        );
      }
    } catch {
      /* ignore */
    }
    return [];
  });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -- settings panel ----------------------------------------------------
  const [showSettings, setShowSettings] = useState(false);
  const [tokenDraft, setTokenDraft] = useState(token);
  const [revealKey, setRevealKey] = useState(false);
  const [acceptedStorage, setAcceptedStorage] = useState<boolean>(() => Boolean(token));

  // -- reference cache ---------------------------------------------------
  const [sections, setSections] = useState<Section[]>([]);
  const referenceTextRef = useRef<string>("");
  const referenceLoadedRef = useRef(false);

  // -- streaming control -------------------------------------------------
  const abortRef = useRef<AbortController | null>(null);
  const stoppedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Persist UI state */
  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY_OPEN, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [open]);

  /* Default greeting on open when there are no prior messages */
  useEffect(() => {
    if (!open) return;
    setMessages((prev) =>
      prev.length === 0
        ? [
            {
              role: "assistant",
              content: "Hi! What are you working on?",
              source: "local",
            },
          ]
        : prev,
    );
  }, [open]);
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_MODE, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);
  useEffect(() => {
    try {
      const trimmed = messages.slice(-40);
      window.localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(trimmed));
    } catch {
      /* ignore */
    }
  }, [messages]);

  /* Auto-scroll when content grows */
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, busy]);

  /* Lazy-load + parse reference */
  const ensureReference = useCallback(async (): Promise<{ raw: string; parsed: Section[] }> => {
    if (referenceLoadedRef.current) {
      return { raw: referenceTextRef.current, parsed: sections };
    }
    const res = await fetch(REFERENCE_DATA_URL);
    if (!res.ok) throw new Error(`Failed to load reference text (${res.status})`);
    const raw = await res.text();
    const parsed = parseReference(raw);
    referenceTextRef.current = raw;
    referenceLoadedRef.current = true;
    setSections(parsed);
    return { raw, parsed };
  }, [sections]);

  // Pre-load reference once the panel opens so citation links work right away.
  useEffect(() => {
    if (open && !referenceLoadedRef.current) {
      void ensureReference().catch(() => {
        /* surfaced on first send if needed */
      });
    }
  }, [open, ensureReference]);

  /* --------------------------- send --------------------------------- */
  const send = useCallback(async () => {
    const userText = draft.trim();
    if (!userText || busy) return;

    if (mode === "ai" && !token) {
      setShowSettings(true);
      setError("Add a free Groq API key first, or switch to local-only mode.");
      return;
    }

    setError(null);
    stoppedRef.current = false;
    const nextMessages: ChatMsg[] = [...messages, { role: "user", content: userText }];
    setMessages(nextMessages);
    setDraft("");
    setBusy(true);

    try {
      const { raw, parsed } = await ensureReference();

      if (mode === "local") {
        const hits = searchSections(userText, parsed, 3);
        const reply = buildLocalReply(userText, hits);
        setMessages((prev) => [...prev, { role: "assistant", content: reply, source: "local" }]);
        setBusy(false);
        return;
      }

      // AI streaming mode
      const ac = new AbortController();
      abortRef.current = ac;

      // Push an empty assistant placeholder we'll mutate as deltas arrive.
      setMessages((prev) => [...prev, { role: "assistant", content: "", source: "ai" }]);

      const systemPrompt = `${SYSTEM_INTRO}\n\n--- BEGIN REFERENCE EXTRACT ---\n${raw}\n--- END REFERENCE EXTRACT ---`;

      let acc = "";
      await streamGroq({
        token,
        messages: [
          { role: "system", content: systemPrompt },
          ...nextMessages.map((m) => ({ role: m.role, content: m.content })),
        ],
        signal: ac.signal,
        onDelta: (chunk) => {
          if (stoppedRef.current) return;
          acc += chunk;
          setMessages((prev) => {
            const out = prev.slice();
            const last = out[out.length - 1];
            if (last && last.role === "assistant") {
              out[out.length - 1] = { ...last, content: acc };
            }
            return out;
          });
        },
      });
    } catch (e) {
      const err = e as Error;
      if (stoppedRef.current || err.name === "AbortError") {
        // Mark the in-flight assistant message as stopped.
        setMessages((prev) => {
          const out = prev.slice();
          const last = out[out.length - 1];
          if (last && last.role === "assistant") {
            const tail = last.content
              ? `${last.content}\n\n_— Assistant stopped —_`
              : "_— Assistant stopped (no output yet) —_";
            out[out.length - 1] = { ...last, content: tail, stopped: true };
          }
          return out;
        });
      } else {
        setError(err.message);
        // Drop the empty placeholder if the request never produced output.
        setMessages((prev) => {
          const out = prev.slice();
          const last = out[out.length - 1];
          if (last && last.role === "assistant" && !last.content) out.pop();
          return out;
        });
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [draft, busy, token, mode, messages, ensureReference]);

  /** Hard stop: aborts the fetch immediately and freezes whatever was streamed. */
  const stop = useCallback(() => {
    stoppedRef.current = true;
    abortRef.current?.abort();
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  /* --------------------------- export ------------------------------- */
  const downloadFile = (name: string, mime: string, body: string) => {
    const blob = new Blob([body], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = useCallback(() => {
    const date = new Date().toISOString().slice(0, 10);
    const md = messages
      .map((m) => {
        const who = m.role === "user" ? "**You**" : "**Assistant**";
        const tag = m.source === "local" ? " _(local mode)_" : "";
        const stop = m.stopped ? " _(stopped)_" : "";
        return `### ${who}${tag}${stop}\n\n${m.content}`;
      })
      .join("\n\n---\n\n");
    const header = `# Optimization Assistant — chat export\n\n_Exported ${date}_\n\n`;
    downloadFile(`chat-${date}.md`, "text/markdown", header + md);
  }, [messages]);

  const exportJson = useCallback(() => {
    const date = new Date().toISOString().slice(0, 10);
    const payload = {
      kind: "wgbiba-chat-export",
      version: 1,
      exportedAt: new Date().toISOString(),
      mode,
      messages,
    };
    downloadFile(`chat-${date}.json`, "application/json", JSON.stringify(payload, null, 2));
  }, [messages, mode]);

  /* --------------------------- settings ----------------------------- */
  const saveToken = useCallback(() => {
    const t = tokenDraft.trim();
    if (t && !acceptedStorage) {
      setError("Please confirm the localStorage warning before saving the key.");
      return;
    }
    setToken(t);
    try {
      if (t) window.localStorage.setItem(STORAGE_KEY_TOKEN, t);
      else window.localStorage.removeItem(STORAGE_KEY_TOKEN);
    } catch {
      /* ignore */
    }
    setShowSettings(false);
    setError(null);
  }, [tokenDraft, acceptedStorage]);

  const forgetToken = useCallback(() => {
    setTokenDraft("");
    setToken("");
    setAcceptedStorage(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY_TOKEN);
    } catch {
      /* ignore */
    }
  }, []);

  /* --------------------------- view --------------------------------- */
  const placeholder = useMemo(() => {
    const ideas = [
      "Explain LP duality with an example…",
      "How does Branch & Bound prune the tree?",
      "Suggest a heuristic for the TSP with 100 cities.",
      "What's the KKT condition for inequality constraints?",
      "Compare Simulated Annealing and Tabu Search.",
    ];
    return ideas[Math.floor(Math.random() * ideas.length)];
  }, [open]);

  const maskedKeyPreview = token
    ? `${token.slice(0, 4)}…${token.slice(-4)} (${token.length} chars)`
    : "no key stored";

  return (
    <>
      {!open && (
        <button
          type="button"
          className="kb-chat-fab"
          onClick={() => setOpen(true)}
          aria-label="Open optimization assistant"
        >
          <span aria-hidden>Ask</span>
          <span className="kb-chat-fab-label">Open optimization assistant</span>
        </button>
      )}

      {open && (
        <section
          className="kb-chat-panel"
          role="dialog"
          aria-label="Optimization assistant"
          aria-modal="false"
        >
          <header className="kb-chat-head">
            <div>
              <strong>Optimization Assistant</strong>
              <p className="kb-chat-sub">
                {mode === "ai" ? "AI mode · grounded in reference" : "Local mode · reference only"}
              </p>
            </div>
            <div className="kb-chat-head-actions">
              <button
                type="button"
                className="kb-chat-icon"
                onClick={() => {
                  setTokenDraft(token);
                  setRevealKey(false);
                  setAcceptedStorage(Boolean(token));
                  setShowSettings((v) => !v);
                }}
                aria-label="Settings"
                title="Settings"
              >
                ⚙
              </button>
              <button
                type="button"
                className="kb-chat-icon"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                title="Close"
              >
                ✕
              </button>
            </div>
          </header>

          {showSettings && (
            <div className="kb-chat-settings">
              <h4>Mode</h4>
              <div className="kb-chat-mode-toggle" role="radiogroup" aria-label="Chat mode">
                <label>
                  <input
                    type="radio"
                    name="kb-chat-mode"
                    checked={mode === "ai"}
                    onChange={() => setMode("ai")}
                  />
                  <span>AI mode <small>(Groq, free key required)</small></span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="kb-chat-mode"
                    checked={mode === "local"}
                    onChange={() => setMode("local")}
                  />
                  <span>Local-only <small>(no API call, reference search)</small></span>
                </label>
              </div>

              {mode === "ai" && (
                <>
                  <h4 style={{ marginTop: 14 }}>Groq API key</h4>
                  <p>
                    Get a free key at{" "}
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      console.groq.com/keys
                    </a>
                    . Currently saved: <code>{maskedKeyPreview}</code>.
                  </p>
                  <div className="kb-chat-key-row">
                    <input
                      type={revealKey ? "text" : "password"}
                      value={tokenDraft}
                      onChange={(e) => setTokenDraft(e.target.value)}
                      placeholder="gsk_…"
                      autoComplete="off"
                      spellCheck={false}
                      className="kb-chat-input"
                      aria-label="Groq API key"
                    />
                    <button
                      type="button"
                      className="kb-chat-btn ghost"
                      onClick={() => setRevealKey((v) => !v)}
                      aria-pressed={revealKey}
                    >
                      {revealKey ? "Hide" : "Show"}
                    </button>
                  </div>

                  <div className="kb-chat-warn-box">
                    <strong>⚠ Before saving:</strong> this key is stored in your browser's{" "}
                    <code>localStorage</code> in plain text. Anyone with access to this device or
                    a malicious browser extension could read it.{" "}
                    <strong>Use a key dedicated to this site</strong> and revoke it any time at{" "}
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      console.groq.com/keys
                    </a>{" "}
                    if you suspect a leak.
                    <label className="kb-chat-consent">
                      <input
                        type="checkbox"
                        checked={acceptedStorage}
                        onChange={(e) => setAcceptedStorage(e.target.checked)}
                      />
                      I understand and want to store this key in localStorage.
                    </label>
                  </div>

                  <div className="kb-chat-settings-actions">
                    <button
                      type="button"
                      className="kb-chat-btn primary"
                      onClick={saveToken}
                      disabled={tokenDraft.trim().length > 0 && !acceptedStorage}
                    >
                      Save key
                    </button>
                    {token && (
                      <button type="button" className="kb-chat-btn ghost" onClick={forgetToken}>
                        Forget key
                      </button>
                    )}
                    <button
                      type="button"
                      className="kb-chat-btn ghost"
                      onClick={() => setShowSettings(false)}
                    >
                      Close
                    </button>
                  </div>
                </>
              )}

              {mode === "local" && (
                <p style={{ marginTop: 10 }}>
                  Local mode searches the bundled reference text and returns the best-matching
                  section snippets. No network call is made and no API key is required.
                </p>
              )}
            </div>
          )}

          <div className="kb-chat-body" ref={scrollRef}>
            {messages.length === 0 && !showSettings && (
              <div className="kb-chat-welcome">
                <p>
                  Hi! I can answer optimization questions, suggest methods for engineering
                  problems, and explain concepts, examples and formulas.
                </p>
                {mode === "ai" && !token && (
                  <p className="kb-chat-warn">
                    AI mode needs a free Groq key. Open{" "}
                    <button
                      type="button"
                      className="kb-chat-link"
                      onClick={() => setShowSettings(true)}
                    >
                      settings ⚙
                    </button>{" "}
                    or switch to local mode.
                  </p>
                )}
                <ul className="kb-chat-suggest">
                  {[
                    "Explain LP duality in 5 sentences.",
                    "When should I use Lagrangian relaxation?",
                    "Walk me through KKT conditions on a small example.",
                    "Suggest a metaheuristic for a 0/1 knapsack with 500 items.",
                  ].map((q) => (
                    <li key={q}>
                      <button
                        type="button"
                        className="kb-chat-chip"
                        onClick={() => setDraft(q)}
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {messages.map((m, i) => (
              <article
                key={i}
                className={`kb-chat-msg ${m.role === "user" ? "u" : "a"} ${
                  m.stopped ? "stopped" : ""
                }`}
                aria-label={m.role === "user" ? "You" : "Assistant"}
              >
                <div className="kb-chat-role">
                  {m.role === "user" ? "You" : "Assistant"}
                  {m.source === "local" && <span className="kb-chat-tag">local</span>}
                  {m.stopped && <span className="kb-chat-tag stopped">stopped</span>}
                </div>
                <div
                  className="kb-chat-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content || "…", sections) }}
                />
              </article>
            ))}

            {busy && (
              <article className="kb-chat-msg a">
                <div className="kb-chat-role">Assistant</div>
                <div className="kb-chat-content">
                  <span className="kb-chat-typing">
                    <i></i><i></i><i></i>
                  </span>
                </div>
              </article>
            )}

            {error && (
              <p className="kb-chat-error" role="alert">
                {error}
              </p>
            )}
          </div>

          <form
            className="kb-chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              className="kb-chat-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={2}
              placeholder={placeholder}
              aria-label="Type your question"
              disabled={busy}
            />
            <div className="kb-chat-form-actions">
              {busy ? (
                <button type="button" className="kb-chat-btn primary" onClick={stop}>
                  ■ Stop
                </button>
              ) : (
                <button
                  type="submit"
                  className="kb-chat-btn primary"
                  disabled={!draft.trim()}
                >
                  Send →
                </button>
              )}
              {messages.length > 0 && !busy && (
                <>
                  <button
                    type="button"
                    className="kb-chat-btn ghost"
                    onClick={exportMarkdown}
                    title="Export chat as Markdown"
                  >
                    ⇩ .md
                  </button>
                  <button
                    type="button"
                    className="kb-chat-btn ghost"
                    onClick={exportJson}
                    title="Export chat as JSON"
                  >
                    ⇩ .json
                  </button>
                  <button
                    type="button"
                    className="kb-chat-btn ghost"
                    onClick={clear}
                    title="Clear conversation"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </form>
        </section>
      )}
    </>
  );
}
