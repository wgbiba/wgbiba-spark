import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Lightweight token-based syntax highlighter — no external dependency.
 * Supports a small set of languages used in the KB (python, mermaid, plain).
 * Also provides an editable mode where the snippet can be modified locally.
 */

type Lang = "python" | "plain" | string;

const PY_KEYWORDS = new Set([
  "def","return","if","elif","else","for","while","in","not","and","or","import","from",
  "as","class","with","try","except","finally","raise","pass","break","continue","lambda",
  "True","False","None","yield","global","nonlocal","is","print",
]);

function highlightPython(code: string): string {
  // escape HTML
  let s = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // strings
  s = s.replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"\n]*"|'[^'\n]*')/g, (m) => `<span class="t-str">${m}</span>`);
  // comments
  s = s.replace(/(#.*)$/gm, '<span class="t-com">$1</span>');
  // numbers
  s = s.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="t-num">$1</span>');
  // keywords
  s = s.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g, (m, w) =>
    PY_KEYWORDS.has(w) ? `<span class="t-kw">${w}</span>` : m,
  );
  // builtins (small set)
  s = s.replace(
    /\b(len|range|sum|max|min|sorted|map|filter|enumerate|zip|list|dict|set|tuple|int|float|str|bool|abs|round|print)\b(?=\()/g,
    '<span class="t-fn">$1</span>',
  );
  return s;
}

function highlight(code: string, lang: Lang): string {
  switch (lang) {
    case "python":
      return highlightPython(code);
    default: {
      return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }
}

import { PythonSandbox } from "./PythonSandbox";

export function CodeBlock({
  source,
  language = "plain",
  title,
  editable = true,
}: {
  source: string;
  language?: Lang;
  title?: string;
  editable?: boolean;
}) {
  const [code, setCode] = useState(source);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const html = useMemo(() => highlight(code, language), [code, language]);

  useEffect(() => {
    if (editing && taRef.current) {
      taRef.current.focus();
      taRef.current.style.height = `${taRef.current.scrollHeight}px`;
    }
  }, [editing]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const reset = () => setCode(source);

  // For Python the PythonSandbox owns the editor (and persists drafts), so we
  // render a read-only highlighted preview here and skip the in-place editor.
  const isPython = language === "python";

  return (
    <div className="kb-code">
      <div className="kb-code-head">
        <span className="kb-code-lang">{language}</span>
        {title && <span className="kb-code-title">{title}</span>}
        <div className="kb-code-actions">
          {editable && !isPython && (
            <button className="kb-code-btn" onClick={() => setEditing((v) => !v)}>
              {editing ? "Preview" : "Edit"}
            </button>
          )}
          {editable && !isPython && code !== source && (
            <button className="kb-code-btn" onClick={reset}>
              Reset
            </button>
          )}
          <button className="kb-code-btn" onClick={onCopy}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      {editing && !isPython ? (
        <textarea
          ref={taRef}
          className="kb-code-edit"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          rows={Math.max(6, code.split("\n").length)}
        />
      ) : (
        <pre className="kb-code-pre">
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      )}
      {isPython && <PythonSandbox source={source} />}
    </div>
  );
}
