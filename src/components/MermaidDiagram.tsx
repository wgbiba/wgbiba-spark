import { useEffect, useRef, useState } from "react";

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      m.default.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          primaryColor: "#13315c",
          primaryTextColor: "#ffffff",
          primaryBorderColor: "#0b2545",
          lineColor: "#1d4ed8",
          secondaryColor: "#e3e8ef",
          tertiaryColor: "#f6f8fb",
          fontFamily: "'Inter', system-ui, sans-serif",
        },
        securityLevel: "loose",
      });
      return m.default;
    });
  }
  return mermaidPromise;
}

export function MermaidDiagram({ code, title }: { code: string; title?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const id = useRef(`m-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    let alive = true;
    loadMermaid()
      .then((m) => m.render(id.current, code))
      .then(({ svg }) => {
        if (alive && ref.current) ref.current.innerHTML = svg;
      })
      .catch((e) => alive && setError(String(e?.message || e)));
    return () => {
      alive = false;
    };
  }, [code]);

  return (
    <figure className="kb-diagram">
      {title && <figcaption className="kb-diagram-caption">{title}</figcaption>}
      {error ? (
        <div className="kb-diagram-error">
          Diagram failed to render: <code>{error}</code>
        </div>
      ) : (
        <div ref={ref} className="kb-diagram-svg" aria-label={title || "Diagram"} />
      )}
    </figure>
  );
}
