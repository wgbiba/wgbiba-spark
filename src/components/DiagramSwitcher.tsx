import { useId, useMemo, useRef, useState } from "react";
import { MermaidDiagram } from "./MermaidDiagram";
import type { DiagramVariant } from "@/lib/knowledge";

/**
 * Toggle between several diagram variants for the same concept.
 * Each variant is either a Mermaid diagram OR a plain-text explanation.
 *
 * Accessibility:
 *  - Tabs follow the WAI-ARIA Tabs pattern (role=tablist/tab/tabpanel).
 *  - Arrow keys / Home / End move focus and selection between variants.
 *  - Each variant exposes a text alternative (always visible for text variants,
 *    available via "Show text alternative" for Mermaid variants and announced
 *    to assistive tech via aria-describedby on the diagram panel).
 */
export function DiagramSwitcher({
  title,
  variants,
}: {
  title?: string;
  variants: DiagramVariant[];
}) {
  const [idx, setIdx] = useState(0);
  const [showAlt, setShowAlt] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const groupId = useId();

  const safeIdx = variants.length === 0 ? 0 : Math.min(idx, variants.length - 1);
  const current = variants[safeIdx];

  // Build a text alternative for the active variant. Prefer an explicit
  // `text` field; otherwise derive a description from the Mermaid source.
  const textAlternative = useMemo(() => {
    if (!current) return "";
    if (current.text && current.text.trim()) return current.text.trim();
    if (current.mermaid) return mermaidToText(current.mermaid);
    return "";
  }, [current]);

  if (variants.length === 0 || !current) return null;

  const select = (next: number) => {
    const n = (next + variants.length) % variants.length;
    setIdx(n);
    // Move focus to the newly selected tab (keeps activation co-located with focus).
    requestAnimationFrame(() => tabRefs.current[n]?.focus());
  };

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        select(i + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        select(i - 1);
        break;
      case "Home":
        e.preventDefault();
        select(0);
        break;
      case "End":
        e.preventDefault();
        select(variants.length - 1);
        break;
    }
  };

  const panelId = `${groupId}-panel-${idx}`;
  const altId = `${groupId}-alt-${idx}`;
  const isMermaid = !!current.mermaid;

  return (
    <div className="kb-diagram-switch">
      <div
        className="kb-diagram-switch-bar"
        role="tablist"
        aria-label={title ? `${title} — diagram variants` : "Diagram variants"}
      >
        {variants.map((v, i) => {
          const tabId = `${groupId}-tab-${i}`;
          const selected = i === idx;
          return (
            <button
              key={v.label}
              id={tabId}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              className={`kb-diagram-switch-tab ${selected ? "active" : ""}`}
              onClick={() => setIdx(i)}
              onKeyDown={(e) => onKey(e, i)}
            >
              {v.label}
              {!v.mermaid && (
                <span className="kb-sr-only"> (text alternative)</span>
              )}
            </button>
          );
        })}

        {isMermaid && textAlternative && (
          <button
            type="button"
            className="kb-diagram-alt-toggle"
            aria-expanded={showAlt}
            aria-controls={altId}
            onClick={() => setShowAlt((v) => !v)}
          >
            {showAlt ? "Hide text alternative" : "Show text alternative"}
          </button>
        )}
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={`${groupId}-tab-${idx}`}
        aria-describedby={textAlternative ? altId : undefined}
        tabIndex={0}
      >
        {isMermaid ? (
          <MermaidDiagram code={current.mermaid!} title={title} />
        ) : (
          <figure className="kb-diagram">
            {title && <figcaption className="kb-diagram-caption">{title}</figcaption>}
            <pre className="kb-diagram-text">{current.text}</pre>
          </figure>
        )}

        {/* Always render the text alternative for screen readers; visually
            shown only when the user requests it (for Mermaid) or when the
            variant is text-only (already shown above). */}
        {isMermaid && textAlternative && (
          <div
            id={altId}
            className={`kb-diagram-alt ${showAlt ? "visible" : "kb-sr-only"}`}
            aria-live="polite"
          >
            <strong>Text description:</strong>
            <pre className="kb-diagram-alt-text">{textAlternative}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Best-effort conversion of a Mermaid graph/flowchart source into a
 * human-readable description. Captures node labels and edges so screen-reader
 * users get a meaningful summary even when no explicit `text` is provided.
 */
function mermaidToText(src: string): string {
  const lines = src
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram)/i.test(l) && !l.startsWith("%%"));

  const labels: Record<string, string> = {};
  const edges: string[] = [];

  // Node label patterns: A[Label], A(Label), A{Label}, A>Label]
  const nodeLabel = /([A-Za-z0-9_]+)\s*[\[\(\{>]"?([^"\]\)\}]+?)"?[\]\)\}]/g;
  // Edge patterns: A --> B, A -->|label| B, A --- B
  const edgeRe = /([A-Za-z0-9_]+)\s*-{1,2}[->.x]*\s*(?:\|([^|]+)\|)?\s*([A-Za-z0-9_]+)/;

  for (const line of lines) {
    let m: RegExpExecArray | null;
    nodeLabel.lastIndex = 0;
    while ((m = nodeLabel.exec(line))) {
      labels[m[1]] = m[2];
    }
    const e = edgeRe.exec(line);
    if (e) {
      const [, a, lbl, b] = e;
      const left = labels[a] || a;
      const right = labels[b] || b;
      edges.push(lbl ? `${left} → ${right} (${lbl.trim()})` : `${left} → ${right}`);
    }
  }

  if (edges.length === 0) {
    const nodeList = Object.values(labels);
    return nodeList.length ? `Nodes: ${nodeList.join(", ")}` : src;
  }
  return edges.join("\n");
}
